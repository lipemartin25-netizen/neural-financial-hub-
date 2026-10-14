import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processWhatsAppMessage } from '@/lib/ai/whatsapp'

/**
 * Endereço do Webhook para o WhatsApp Business API
 * No modo teste, você pode simular chamadas POST aqui
 */
export async function POST(request: NextRequest) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    try {
        const body = await request.json()

        // Estrutura básica pode variar conforme o provedor (Vonage, Twilio, Evolution API, etc)
        // Vamos extrair o número de quem enviou e o texto da mensagem
        const from = body.from || body.sender || body.message?.from
        const text = body.text || body.message?.text || body.body
        const userPhone = from ? String(from) : null

        if (!text || !userPhone) {
            return NextResponse.json({ error: 'Mensagem ou remetente inválidos' }, { status: 400 })
        }

        console.log(`[WhatsApp Webhook] Recebido de ${userPhone}: ${text}`)

        // 1. Identificar o usuário pelo telefone no banco de dados
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('phone', userPhone.replace(/\D/g, '')) // Remove formatação do telefone
            .maybeSingle()

        if (!profile) {
            // Em produção, aqui enviaríamos uma mensagem pedindo o cadastro ou link da conta
            console.warn(`[WhatsApp Webhook] Telefone ${userPhone} não vinculado a nenhum perfil.`)
            return NextResponse.json({
                response: "Olá! Notei que seu telefone não está vinculado a nenhuma conta no NeuraFin Hub. Acesse o app e vincule seu número nas configurações."
            })
        }

        // 2. Processar a mensagem com a IA
        const action = await processWhatsAppMessage(text, profile.full_name || 'usuário')

        // 3. Executar a ação no banco de dados
        if (action.type === 'add_expense' || action.type === 'add_income') {
            const { amount, description, category } = action.data || {}

            // Buscar conta principal do usuário se não especificada (fallback)
            const { data: account } = await supabaseAdmin
                .from('accounts')
                .select('id')
                .eq('user_id', profile.id)
                .limit(1)
                .maybeSingle()

            if (account && amount) {
                // Buscar categoria compatível
                const { data: dbCat } = await supabaseAdmin
                    .from('categories')
                    .select('id')
                    .ilike('name', `%${category || ''}%`)
                    .limit(1)
                    .maybeSingle()

                await supabaseAdmin.from('transactions').insert({
                    user_id: profile.id,
                    account_id: account.id,
                    amount: Math.abs(amount),
                    type: action.type === 'add_income' ? 'income' : 'expense',
                    description: description || 'WhatsApp Transaction',
                    category_id: dbCat?.id || null,
                    date: new Date().toISOString().split('T')[0],
                    notes: `Adicionado via WhatsApp AI`
                })
            }
        } else if (action.type === 'query_balance') {
            const { data: accounts } = await supabaseAdmin
                .from('accounts')
                .select('name, balance')
                .eq('user_id', profile.id)

            if (accounts && accounts.length > 0) {
                const balanceStr = accounts.map(a => `${a.name}: R$ ${a.balance.toFixed(2)}`).join('\n')
                action.response = `Seu saldo atual:\n${balanceStr}`
            }
        }

        // 4. Aqui seria a integração para ENVIAR a mensagem de volta
        // await sendWhatsAppResponse(userPhone, action.response)

        return NextResponse.json({
            success: true,
            intent: action.type,
            ai_response: action.response
        })

    } catch (error: any) {
        console.error('[WhatsApp Webhook Error]:', error)
        return NextResponse.json({ error: 'Erro interno no processamento' }, { status: 500 })
    }
}
