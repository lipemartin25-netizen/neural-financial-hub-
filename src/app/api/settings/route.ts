import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ========== POST — Alterar senha ==========
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { action, payload } = await request.json() as {
            action: string
            payload: Record<string, string>
        }

        switch (action) {
            case 'change_password': {
                const { newPassword } = payload
                if (!newPassword || newPassword.length < 8) {
                    return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 })
                }

                const { error } = await supabase.auth.updateUser({
                    password: newPassword,
                })

                if (error) throw error
                return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' })
            }

            case 'delete_account': {
                // Soft delete — desativa perfil
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: '[CONTA EXCLUÍDA]',
                        phone: null,
                        avatar_url: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id)

                if (error) throw error

                // Sign out
                await supabase.auth.signOut()
                return NextResponse.json({ success: true, message: 'Conta desativada' })
            }

            case 'sign_out_all': {
                await supabase.auth.signOut({ scope: 'global' })
                return NextResponse.json({ success: true, message: 'Todas as sessões encerradas' })
            }

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
