import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseOFX, sanitizeDescription, calculateTransactionHash } from '@/lib/ofx-parser'

type ParsedRow = {
    date: string
    description: string
    amount: number
    type: 'income' | 'expense'
    hash: string
}

function parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (ch === delimiter && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += ch
        }
    }
    result.push(current.trim())
    return result
}

function detectDelimiter(firstLine: string): string {
    const semicolons = (firstLine.match(/;/g) ?? []).length
    const commas = (firstLine.match(/,/g) ?? []).length
    const tabs = (firstLine.match(/\t/g) ?? []).length
    if (tabs >= semicolons && tabs >= commas) return '\t'
    if (semicolons >= commas) return ';'
    return ','
}

function parseAmount(raw: string): number {
    let cleaned = raw.replace(/[R$\s]/g, '').trim()

    if (/\d+\.\d{3}/.test(cleaned) && cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
        cleaned = cleaned.replace(',', '.')
    }

    return Math.abs(parseFloat(cleaned) || 0)
}

function parseDate(raw: string): string | null {
    const trimmed = raw.trim()

    const brMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
    if (brMatch) {
        const [, d, m, y] = brMatch
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

    const usMatch = trimmed.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/)
    if (usMatch) {
        const [, m, d, y] = usMatch
        if (parseInt(m) > 12) return `${y}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    return null
}

function detectColumns(headers: string[]): { dateIdx: number; descIdx: number; amountIdx: number; typeIdx: number } {
    const lower = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))

    const dateIdx = lower.findIndex(h => /data|date|dt|vencimento/.test(h))
    const descIdx = lower.findIndex(h => /descri|desc|historico|memo|payee|detail|lancamento/.test(h))
    const amountIdx = lower.findIndex(h => /valor|amount|value|quantia|montante/.test(h))
    const typeIdx = lower.findIndex(h => /tipo|type|natureza|sentido|credito|debito/.test(h))

    return {
        dateIdx: dateIdx >= 0 ? dateIdx : 0,
        descIdx: descIdx >= 0 ? descIdx : 1,
        amountIdx: amountIdx >= 0 ? amountIdx : lower.length - 1,
        typeIdx,
    }
}

function detectType(amount: number, rawAmount: string, typeCol: string | undefined): 'income' | 'expense' {
    if (typeCol) {
        const t = typeCol.toLowerCase().trim()
        if (/credito|credit|receita|income|entrada|cr/.test(t)) return 'income'
        if (/debito|debit|despesa|expense|saida|db/.test(t)) return 'expense'
    }

    const cleaned = rawAmount.replace(/[R$\s"]/g, '').trim()
    if (cleaned.startsWith('-')) return 'expense'
    if (cleaned.startsWith('+')) return 'income'

    return 'expense'
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await request.formData()
        const file = formData.get('file') as File
        const accountId = formData.get('account_id') as string

        if (!file || !accountId) {
            return NextResponse.json({ error: 'Arquivo e conta são obrigatórios' }, { status: 400 })
        }

        const { data: account } = await supabase
            .from('accounts')
            .select('id')
            .eq('id', accountId)
            .eq('user_id', user.id)
            .single()

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
        }

        const fileName = (file.name || '').toLowerCase()
        const text = await file.text()
        const isOFX = fileName.endsWith('.ofx') || text.includes('<OFX>')

        let parsed: ParsedRow[] = []
        let errors: string[] = []

        if (isOFX) {
            const ofxResult = parseOFX(text, accountId)
            errors = ofxResult.errors
            parsed = ofxResult.transactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                hash: t.hash,
            }))
        } else {
            const lines = text.split(/\r?\n/).filter(l => l.trim())
            if (lines.length < 2) {
                return NextResponse.json({ error: 'Arquivo vazio ou sem dados' }, { status: 400 })
            }

            const delimiter = detectDelimiter(lines[0])
            const headers = parseCSVLine(lines[0], delimiter)
            const cols = detectColumns(headers)

            for (let i = 1; i < lines.length; i++) {
                const cells = parseCSVLine(lines[i], delimiter)
                if (cells.length < 2) continue

                const rawDate = cells[cols.dateIdx] ?? ''
                const rawDesc = cells[cols.descIdx] ?? ''
                const rawAmount = cells[cols.amountIdx] ?? ''
                const rawType = cols.typeIdx >= 0 ? cells[cols.typeIdx] : undefined

                const date = parseDate(rawDate)
                const amount = parseAmount(rawAmount)
                const description = sanitizeDescription(rawDesc)

                if (!date) { errors.push(`Linha ${i + 1}: data inválida "${rawDate}"`); continue }
                if (amount <= 0) { errors.push(`Linha ${i + 1}: valor inválido "${rawAmount}"`); continue }
                if (!description) { errors.push(`Linha ${i + 1}: descrição vazia`); continue }

                const type = detectType(amount, rawAmount, rawType)
                const hash = calculateTransactionHash(accountId, date, amount, description)

                parsed.push({ date, description, amount, type, hash })
            }
        }

        if (parsed.length === 0) {
            return NextResponse.json({ error: 'Nenhuma transação válida encontrada', details: errors }, { status: 400 })
        }

        // Buscar transações recentes desta conta para detecção de duplicatas
        const dates = parsed.map(p => p.date)
        const minDate = dates.reduce((a, b) => a < b ? a : b)
        const maxDate = dates.reduce((a, b) => a > b ? a : b)

        const { data: existingTxs } = await supabase
            .from('transactions')
            .select('date, amount, description')
            .eq('account_id', accountId)
            .gte('date', minDate)
            .lte('date', maxDate)

        const existingHashes = new Set<string>()
        if (existingTxs) {
            for (const tx of existingTxs) {
                existingHashes.add(calculateTransactionHash(accountId, tx.date, Number(tx.amount), tx.description))
            }
        }

        const toInsert: any[] = []
        let skippedDuplicates = 0

        for (const item of parsed) {
            if (existingHashes.has(item.hash)) {
                skippedDuplicates++
                continue
            }
            existingHashes.add(item.hash) // Evitar duplicata interna no próprio arquivo

            toInsert.push({
                user_id: user.id,
                account_id: accountId,
                amount: item.amount,
                type: item.type,
                description: item.description,
                date: item.date,
                notes: isOFX ? 'Importado via OFX' : 'Importado via CSV',
            })
        }

        if (toInsert.length > 0) {
            const { error: insertError } = await supabase.from('transactions').insert(toInsert)
            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }
        }

        return NextResponse.json({
            data: {
                format: isOFX ? 'OFX' : 'CSV',
                total_found: parsed.length,
                imported: toInsert.length,
                skipped_duplicates: skippedDuplicates,
                errors: errors.length,
                errorDetails: errors.slice(0, 10),
                sample: parsed.slice(0, 5),
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
