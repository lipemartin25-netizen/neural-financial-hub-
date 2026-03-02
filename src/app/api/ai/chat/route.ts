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

        // Fetch financial context for system prompt
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const [accountsRes, txRes, profileRes] = await Promise.all([
            supabase.from('accounts').select('name, balance, type').eq('user_id', user.id).eq('is_active', true),
            supabase.from('transactions').select('amount, type, description, categories(name)').eq('user_id', user.id).gte('date', firstDay),
            supabase.from('profiles').select('full_name, currency, monthly_income').eq('id', user.id).single(),
        ])

        const accounts = accountsRes.data ?? []
        const transactions = txRes.data ?? []
        const profile = profileRes.data

        const totalBalance = accounts.filter(a => a.type !== 'credit_card').reduce((s, a) => s + a.balance, 0)
        const monthIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const monthExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

        const systemInstruction = `Você é a NeuraFin IA, assistente financeiro pessoal inteligente de ${profile?.full_name ?? 'o usuário'}. 
Você tem acesso ao contexto financeiro em tempo real para fornecer análises personalizadas.

CONTEXTO FINANCEIRO ATUAL (${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}):
- Patrimônio total: R$ ${totalBalance.toFixed(2)}
- Receitas do mês: R$ ${monthIncome.toFixed(2)}
- Despesas do mês: R$ ${monthExpense.toFixed(2)}
- Economia do mês: R$ ${(monthIncome - monthExpense).toFixed(2)}
- Contas: ${accounts.map(a => `${a.name} (R$ ${a.balance.toFixed(2)})`).join(', ')}
${profile?.monthly_income ? `- Renda mensal declarada: R$ ${profile.monthly_income.toFixed(2)}` : ''}

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro, tom amigável e profissional
- Seja preciso com os números, use R$ e vírgula para decimais
- Dê conselhos práticos e acionáveis
- Se o usuário perguntar sobre algo fora de finanças pessoais, redirecione gentilmente
- Use emojis moderadamente para deixar a conversa mais agradável
- Máximo 200 palavras por resposta, a menos que uma análise detalhada seja solicitada`

        // Stream response using ReadableStream + Gemini
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamChat(messages, systemInstruction)) {
                        controller.enqueue(encoder.encode(chunk))
                    }
                    controller.close()
                } catch (err) {
                    controller.error(err)
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
