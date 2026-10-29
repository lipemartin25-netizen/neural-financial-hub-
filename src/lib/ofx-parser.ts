import crypto from 'crypto'

export type ParsedTransaction = {
    date: string
    description: string
    amount: number
    type: 'income' | 'expense'
    fitid?: string
    hash: string
}

/**
 * Sanitiza descrições para evitar ataques de Injeção de Fórmulas em CSV/Excel (=, +, -, @)
 */
export function sanitizeDescription(desc: string): string {
    const clean = desc.replace(/^["']|["']$/g, '').trim()
    if (/^[=+\-@]/.test(clean)) {
        return `'${clean}`
    }
    return clean
}

/**
 * Gera um hash determinístico único para evitar duplicatas
 */
export function calculateTransactionHash(
    accountId: string,
    date: string,
    amount: number,
    description: string,
    fitid?: string
): string {
    const payload = fitid && fitid.trim() !== ''
        ? `${accountId}:${fitid.trim()}`
        : `${accountId}:${date}:${amount.toFixed(2)}:${description.toLowerCase().trim()}`
    
    return crypto.createHash('sha256').update(payload).digest('hex')
}

/**
 * Parser leve e robusto para arquivos bancários OFX (SGML / XML 1.0 e 2.0)
 */
export function parseOFX(ofxContent: string, accountId: string): { transactions: ParsedTransaction[]; errors: string[] } {
    const transactions: ParsedTransaction[] = []
    const errors: string[] = []

    // Localizar blocos de transação <STMTTRN>...</STMTTRN> ou abertos <STMTTRN>
    const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi
    let match: RegExpExecArray | null

    while ((match = trnRegex.exec(ofxContent)) !== null) {
        const block = match[1]
        if (!block || block.trim().length === 0) continue

        const trntype = (block.match(/<TRNTYPE>([^<\r\n]+)/i)?.[1] ?? '').trim().toUpperCase()
        const dtposted = (block.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1] ?? '').trim()
        const trnamt = (block.match(/<TRNAMT>([^<\r\n]+)/i)?.[1] ?? '').trim()
        const fitid = (block.match(/<FITID>([^<\r\n]+)/i)?.[1] ?? '').trim()
        const memo = (block.match(/<MEMO>([^<\r\n]+)/i)?.[1] ?? '').trim()
        const name = (block.match(/<NAME>([^<\r\n]+)/i)?.[1] ?? '').trim()

        const rawDesc = memo || name || 'Transação OFX'
        const description = sanitizeDescription(rawDesc)

        // Parse de Data: Formato YYYYMMDDHHMMSS ou YYYYMMDD
        let date = ''
        if (dtposted.length >= 8) {
            const y = dtposted.substring(0, 4)
            const m = dtposted.substring(4, 6)
            const d = dtposted.substring(6, 8)
            date = `${y}-${m}-${d}`
        }

        // Parse de Valor
        const cleanAmt = trnamt.replace(',', '.')
        const rawNum = parseFloat(cleanAmt)

        if (!date || isNaN(rawNum)) {
            errors.push(`Transação OFX inválida ou incompleta: DT=${dtposted}, AMT=${trnamt}`)
            continue
        }

        const amount = Math.abs(rawNum)
        let type: 'income' | 'expense' = rawNum >= 0 ? 'income' : 'expense'

        if (trntype === 'CREDIT' || trntype === 'DEP') {
            type = 'income'
        } else if (trntype === 'DEBIT' || trntype === 'PAYMENT' || trntype === 'CHECK') {
            type = 'expense'
        }

        const hash = calculateTransactionHash(accountId, date, amount, description, fitid)

        transactions.push({
            date,
            description,
            amount,
            type,
            fitid,
            hash
        })
    }

    return { transactions, errors }
}
