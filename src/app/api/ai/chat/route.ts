import { createClient } from '@/lib/supabase/server'
import { streamChat } from '@/lib/ai/gemini'

export const runtime = 'edge'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { messages } = await request.json() as {
            messages: Array<{ role: 'user' | 'model'; text: string }>
        }

        if (!messages || messages.length === 0) {
            return new Response('Messages required', { status: 400 })
        }

        // ========== Buscar TODO o contexto financeiro em paralelo ==========
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const lastMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        const lastMonthLast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

        const [
            profileRes,
            accountsRes,
            txThisMonthRes,
            txLastMonthRes,
            goalsRes,
            investmentsRes,
            budgetsRes,
            boletosRes,
            cardsRes,
        ] = await Promise.all([
            supabase
                .from('profiles')
                .select('full_name, currency, monthly_income, financial_goal, neural_score, plan')
                .eq('id', user.id)
                .single(),
            supabase
                .from('accounts')
                .select('name, balance, type, credit_limit')
                .eq('user_id', user.id)
                .eq('is_active', true),
            supabase
                .from('transactions')
                .select('amount, type, description, category_id')
                .eq('user_id', user.id)
                .gte('date', firstDay),
            supabase
                .from('transactions')
                .select('amount, type, category_id')
                .eq('user_id', user.id)
                .gte('date', lastMonthFirst)
                .lte('date', lastMonthLast),
            supabase
                .from('goals')
                .select('name, target_amount, current_amount, target_date, status')
                .eq('user_id', user.id)
                .limit(10),
            supabase
                .from('investments')
                .select('ticker, name, type, invested_amount, current_value')
                .eq('user_id', user.id)
                .eq('is_active', true),
            supabase
                .from('budgets')
                .select('category_id, amount, categories(name)')
                .eq('user_id', user.id),
            supabase
                .from('boletos')
                .select('description, amount, due_date, status')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .order('due_date', { ascending: true })
                .limit(5),
            supabase
                .from('accounts')
                .select('name, credit_limit, closing_day, due_day')
                .eq('user_id', user.id)
                .eq('type', 'credit_card')
                .eq('is_active', true),
        ])

        const profile = profileRes.data
        const accounts = accountsRes.data ?? []
        const txThisMonth = txThisMonthRes.data ?? []
        const txLastMonth = txLastMonthRes.data ?? []
        const goals = goalsRes.data ?? []
        const investments = investmentsRes.data ?? []
        const budgets = budgetsRes.data ?? []
        const boletos = boletosRes.data ?? []
        const cards = cardsRes.data ?? []

        // ========== Processar dados ==========
        const totalBalance = accounts
            .filter(a => a.type !== 'credit_card')
            .reduce((s, a) => s + Number(a.balance), 0)

        const monthIncome = txThisMonth
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount), 0)

        const monthExpense = txThisMonth
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount), 0)

        const lastMonthExpense = txLastMonth
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount), 0)

        const lastMonthIncome = txLastMonth
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount), 0)

        // Gastos por categoria (mês atual)
        const spentByCategory: Record<string, number> = {}
        for (const t of txThisMonth) {
            if (t.type === 'expense' && t.category_id) {
                spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + Number(t.amount)
            }
        }

        // Top 5 gastos
        const topExpenses = Object.entries(spentByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, amt]) => `${cat}: R$ ${amt.toFixed(2)}`)
            .join(', ')

        // Investimentos
        const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount ?? 0), 0)
        const totalInvCurrent = investments.reduce((s, i) => s + Number(i.current_value ?? 0), 0)
        const invReturn = totalInvested > 0 ? ((totalInvCurrent - totalInvested) / totalInvested) * 100 : 0

        const investmentsSummary = investments.length > 0
            ? investments.map(i => {
                const ret = Number(i.invested_amount) > 0
                    ? (((Number(i.current_value) - Number(i.invested_amount)) / Number(i.invested_amount)) * 100).toFixed(1)
                    : '0'
                return `${i.ticker}${i.name ? ` (${i.name})` : ''} [${i.type}]: Investido R$ ${Number(i.invested_amount).toFixed(2)}, Atual R$ ${Number(i.current_value).toFixed(2)} (${ret}%)`
            }).join('\n  ')
            : 'Nenhum investimento cadastrado'

        // Metas
        const goalsSummary = goals.length > 0
            ? goals.map(g => {
                const pct = Number(g.target_amount) > 0
                    ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
                    : 0
                const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount))
                return `${g.name}: ${pct}% (faltam R$ ${remaining.toFixed(2)})${g.target_date ? ` — prazo: ${g.target_date}` : ''} [${g.status}]`
            }).join('\n  ')
            : 'Nenhuma meta definida'

        // Orçamentos
        const budgetsSummary = budgets.length > 0
            ? budgets.map(b => {
                const catName = (b.categories as { name?: string } | null)?.name ?? b.category_id
                const spent = spentByCategory[b.category_id] ?? 0
                const limit = Number(b.amount)
                const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0
                const status = pct > 100 ? '🔴 ESTOURADO' : pct > 80 ? '🟡 ATENÇÃO' : '🟢 OK'
                return `${catName}: R$ ${spent.toFixed(2)} / R$ ${limit.toFixed(2)} (${pct}%) ${status}`
            }).join('\n  ')
            : 'Nenhum orçamento definido'

        // Boletos pendentes
        const boletosSummary = boletos.length > 0
            ? boletos.map(b => {
                const daysLeft = Math.ceil((new Date(b.due_date + 'T12:00:00').getTime() - now.getTime()) / 86400000)
                return `${b.description ?? 'Sem nome'}: R$ ${Number(b.amount).toFixed(2)} — vence em ${daysLeft} dias (${b.due_date})`
            }).join('\n  ')
            : 'Nenhum boleto pendente'

        // Cartões
        const cardsSummary = cards.length > 0
            ? cards.map(c => `${c.name}: Limite R$ ${Number(c.credit_limit ?? 0).toFixed(2)}, fecha dia ${c.closing_day}, vence dia ${c.due_day}`).join('\n  ')
            : 'Nenhum cartão cadastrado'

        // Contas
        const accountsSummary = accounts
            .map(a => `${a.name} (${a.type}): R$ ${Number(a.balance).toFixed(2)}${a.type === 'credit_card' ? ` | Limite: R$ ${Number(a.credit_limit ?? 0).toFixed(2)}` : ''}`)
            .join('\n  ')

        // Variação mês anterior
        const expenseVariation = lastMonthExpense > 0
            ? ((monthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1)
            : 'N/A'

        const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

        // ========== System Instruction COMPLETA ==========
        const systemInstruction = `Você é a **NeuraFin IA**, assistente financeiro pessoal inteligente e premium do app NeuraFin Hub.
Seu nome é NeuraFin IA (NÃO Nexus). Você é sofisticada, empática e altamente analítica.

👤 PERFIL DO USUÁRIO:
- Nome: ${profile?.full_name ?? 'Usuário'}
- Plano: ${profile?.plan ?? 'free'}
- Neural Score: ${profile?.neural_score ?? 0}/100
- Renda mensal declarada: ${profile?.monthly_income ? `R$ ${Number(profile.monthly_income).toFixed(2)}` : 'Não informada'}
- Objetivo financeiro: ${profile?.financial_goal ?? 'Não definido'}

💰 PATRIMÔNIO E CONTAS (${monthName}):
- Patrimônio total (sem cartões): R$ ${totalBalance.toFixed(2)}
- Contas:
  ${accountsSummary || 'Nenhuma conta'}

📊 FLUXO DO MÊS ATUAL (${monthName}):
- Receitas: R$ ${monthIncome.toFixed(2)}
- Despesas: R$ ${monthExpense.toFixed(2)}
- Economia: R$ ${(monthIncome - monthExpense).toFixed(2)}
- Taxa de poupança: ${monthIncome > 0 ? ((1 - monthExpense / monthIncome) * 100).toFixed(1) : '0'}%
- Variação despesas vs mês anterior: ${expenseVariation}%
- Mês anterior — Receitas: R$ ${lastMonthIncome.toFixed(2)} | Despesas: R$ ${lastMonthExpense.toFixed(2)}

📂 TOP 5 CATEGORIAS DE GASTO:
  ${topExpenses || 'Sem dados suficientes'}

📈 INVESTIMENTOS:
- Total investido: R$ ${totalInvested.toFixed(2)}
- Valor atual: R$ ${totalInvCurrent.toFixed(2)}
- Rentabilidade: ${invReturn.toFixed(2)}%
- Detalhamento:
  ${investmentsSummary}

🎯 METAS:
  ${goalsSummary}

💳 CARTÕES DE CRÉDITO:
  ${cardsSummary}

📋 ORÇAMENTOS:
  ${budgetsSummary}

📄 BOLETOS PENDENTES:
  ${boletosSummary}

═══════════════════════════════════════
INSTRUÇÕES DE COMPORTAMENTO:

1. Responda SEMPRE em português brasileiro, tom amigável, profissional e sofisticado
2. Use os dados reais acima para todas as análises — NUNCA invente números
3. Formate valores como R$ X.XXX,XX (formato brasileiro)
4. Dê conselhos PRÁTICOS e ACIONÁVEIS baseados nos dados reais
5. Se o usuário perguntar algo fora de finanças pessoais, redirecione gentilmente
6. Use emojis moderadamente para tornar a conversa agradável
7. Máximo ~200 palavras por resposta, a menos que peçam análise detalhada
8. Quando mencionar métricas, sempre compare com referências (ex: taxa de poupança ideal é 20-30%)
9. Se dados estão faltando (ex: sem investimentos), sugira ao usuário cadastrar
10. Seja proativa: se detectar problemas (orçamento estourado, pouca diversificação), alerte
11. Nunca exponha dados técnicos como IDs, tokens ou estrutura interna
12. Se o usuário perguntar quem te criou, diga que foi a equipe NeuraFin
13. Use Markdown para formatação (negrito, listas, etc.) quando apropriado
═══════════════════════════════════════`

        // ========== Stream response ==========
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamChat(messages, systemInstruction)) {
                        controller.enqueue(encoder.encode(chunk))
                    }
                    controller.close()
                } catch (err) {
                    // Envia mensagem de erro como texto
                    const errorMsg = '\n\n⚠️ Desculpe, tive um problema ao processar sua solicitação. Tente novamente.'
                    controller.enqueue(encoder.encode(errorMsg))
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Content-Type-Options': 'nosniff',
            },
        })
    } catch {
        return new Response('Internal Server Error', { status: 500 })
    }
}
