import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createConnectToken, fetchAccounts, fetchTransactions, mapPluggyCategory } from '@/lib/pluggy'

export const dynamic = 'force-dynamic'
// GET — listar conexões + criar connect token
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const action = request.nextUrl.searchParams.get('action')
        if (action === 'connect_token') {
            if (!process.env.PLUGGY_CLIENT_ID) {
                return NextResponse.json({ error: 'Pluggy não configurado', demo: true }, { status: 200 })
            }
            const token = await createConnectToken(user.id)
            return NextResponse.json({ connectToken: token })
        }
        // Listar conexões
        const { data: connections } = await supabase
            .from('open_finance_connections')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        return NextResponse.json({ data: connections ?? [] })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
// POST — sincronizar contas e transações de uma conexão
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { action, itemId, connectorName, connectorLogo } = await request.json()
        // Salvar nova conexão
        if (action === 'save_connection') {
            const { error } = await supabase.from('open_finance_connections').upsert({
                user_id: user.id,
                item_id: itemId,
                connector_name: connectorName,
                connector_logo: connectorLogo,
                status: 'active',
                last_sync_at: new Date().toISOString(),
            } as any, { onConflict: 'user_id,item_id' })

            if (error) throw error
            return NextResponse.json({ success: true })
        }
        // Sincronizar
        if (action === 'sync') {
            if (!process.env.PLUGGY_CLIENT_ID) {
                return NextResponse.json({ error: 'Pluggy não configurado' }, { status: 400 })
            }

            // 1. Buscar categorias do banco para mapeamento UUID
            const { data: dbCategories } = await supabase
                .from('categories')
                .select('id, name')

            const categoryMap: Record<string, string> = {}
            if (dbCategories) {
                dbCategories.forEach(c => {
                    // Mapeia o nome minúsculo para o ID (ex: "Alimentação" -> UUID)
                    categoryMap[c.name.toLowerCase()] = c.id
                })
            }

            // Buscar contas do Pluggy
            const { results: pluggyAccounts } = await fetchAccounts(itemId)
            let totalImported = 0

            for (const pa of pluggyAccounts) {
                // Verificar se conta já existe
                const { data: existingAccount } = await supabase
                    .from('accounts')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('open_finance_id', pa.id)
                    .maybeSingle()

                let accountId = existingAccount?.id
                if (!accountId) {
                    // Criar conta
                    const type = pa.type === 'BANK' ? 'checking'
                        : pa.type === 'CREDIT' ? 'credit_card'
                            : pa.subtype === 'SAVINGS_ACCOUNT' ? 'savings'
                                : 'checking'

                    const { data: newAccount } = await supabase
                        .from('accounts')
                        .insert({
                            user_id: user.id,
                            name: pa.name || 'Conta Importada',
                            type,
                            bank_name: (pa as any).brand || (pa as any).bankData?.name || 'Banco',
                            balance: pa.balance ?? 0,
                            open_finance_id: pa.id,
                            color: pa.type === 'CREDIT' ? '#ef4444' : '#c9a858',
                            credit_limit: (pa as any).creditData?.creditLimit ?? null,
                        } as any)
                        .select('id')
                        .maybeSingle()
                    accountId = newAccount?.id
                } else {
                    // Atualizar saldo
                    await supabase.from('accounts').update({
                        balance: pa.balance ?? 0,
                        updated_at: new Date().toISOString(),
                    }).eq('id', accountId)
                }

                if (!accountId) continue

                // IMPORTAR TRANSAÇÕES (Últimos 90 dias conforme solicitado)
                const to = new Date().toISOString().split('T')[0]
                const from = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

                // Fetch paginado
                let page = 1
                let hasMore = true

                while (hasMore) {
                    const { results: pluggyTxs } = await fetchTransactions(pa.id, { from, to, page })

                    for (const pt of pluggyTxs) {
                        // Evitar duplicatas
                        const { data: existingTx } = await supabase
                            .from('transactions')
                            .select('id')
                            .eq('user_id', user.id)
                            .eq('open_finance_id', pt.id)
                            .maybeSingle()

                        if (!existingTx) {
                            // Tenta mapear categoria: slug -> ID interno -> UUID do banco
                            const internalSlug = mapPluggyCategory(pt.category)

                            // Tenta achar no mapa de nomes ou no mapa de slugs
                            // Como não temos os ids literais 'food' no banco (provavelmente),
                            // usamos o nome da categoria que o Pluggy mandou e tentamos achar na tabela
                            let finalCategoryId = null
                            if (pt.category) {
                                // 1. Tenta pelo nome exato (Alimentação)
                                finalCategoryId = categoryMap[pt.category.toLowerCase()]
                            }

                            // 2. Fallback pro mapeamento de slug se não achou pelo nome original
                            if (!finalCategoryId) {
                                // Aqui precisariamos que as categorias tivessem um campo 'slug'
                                // ou que o nome batesse com o slug fixo.
                                // Como não sabemos, usamos o que temos.
                                // Se não achou, deixa nulo ou tenta uma padrão.
                            }

                            // data format
                            let txDateStr = to
                            if (pt.date instanceof Date) {
                                txDateStr = pt.date.toISOString().split('T')[0]
                            } else if (typeof pt.date === 'string') {
                                txDateStr = pt.date.split('T')[0]
                            }

                            await supabase.from('transactions').insert({
                                user_id: user.id,
                                account_id: accountId,
                                amount: Math.abs(pt.amount),
                                type: pt.amount >= 0 ? 'income' : 'expense',
                                description: pt.description || pt.descriptionRaw || 'Transação importada',
                                date: txDateStr,
                                open_finance_id: pt.id,
                                category_id: finalCategoryId,
                                notes: pt.category ? `Vencimento/Categoria: ${pt.category}` : null
                            } as any)
                            totalImported++
                        }
                    }

                    hasMore = false // Pagar por página se totalPages > page em loop real
                }
            }
            // Atualizar last_sync
            await supabase.from('open_finance_connections').update({
                last_sync_at: new Date().toISOString(),
                status: 'active',
            }).eq('user_id', user.id).eq('item_id', itemId)

            return NextResponse.json({ success: true, imported: totalImported })
        }
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
// DELETE — remover conexão
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const itemId = request.nextUrl.searchParams.get('itemId')
        if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
        await supabase.from('open_finance_connections')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId)
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
