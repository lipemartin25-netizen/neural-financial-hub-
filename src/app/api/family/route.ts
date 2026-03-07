import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — dados da família do usuário
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Buscar família do user
        const { data: membership } = await supabase
            .from('family_members')
            .select('family_id, role, nickname')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!membership) {
            return NextResponse.json({ data: null })
        }

        // Buscar família
        const { data: family } = await supabase
            .from('families')
            .select('*')
            .eq('id', membership.family_id)
            .single()

        // Buscar membros
        const { data: members } = await supabase
            .from('family_members')
            .select('id, user_id, role, nickname, joined_at')
            .eq('family_id', membership.family_id)
            .order('joined_at', { ascending: true })

        // Buscar profiles dos membros
        const memberIds = (members ?? []).map(m => m.user_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', memberIds)

        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
        const enrichedMembers = (members ?? []).map(m => ({
            ...m,
            profile: profileMap[m.user_id] ?? null,
        }))

        // Buscar metas familiares
        const { data: goals } = await supabase
            .from('family_goals')
            .select('*')
            .eq('family_id', membership.family_id)
            .order('created_at', { ascending: false })

        // Buscar transações compartilhadas recentes
        const { data: sharedTxs } = await supabase
            .from('family_transactions')
            .select(`
        id, shared_at, split_type, shared_by,
        transactions:transaction_id (id, description, amount, type, date, category_id)
      `)
            .eq('family_id', membership.family_id)
            .order('shared_at', { ascending: false })
            .limit(20)

        return NextResponse.json({
            data: {
                family,
                myRole: membership.role,
                myMemberId: (members ?? []).find(m => m.user_id === user.id)?.id,
                members: enrichedMembers,
                goals: goals ?? [],
                sharedTransactions: sharedTxs ?? [],
            },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}

// POST — criar família OU entrar com código
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { action } = body

        // Verificar se já está em uma família
        const { data: existing } = await supabase
            .from('family_members')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (existing && action !== 'leave') {
            return NextResponse.json({ error: 'Você já faz parte de uma família' }, { status: 400 })
        }

        switch (action) {
            case 'create': {
                const { name } = body
                if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

                const { data: family, error: famErr } = await supabase
                    .from('families')
                    .insert({ name, owner_id: user.id })
                    .select()
                    .single()

                if (famErr) return NextResponse.json({ error: famErr.message }, { status: 500 })

                // Adicionar owner como membro
                await supabase.from('family_members').insert({
                    family_id: family.id,
                    user_id: user.id,
                    role: 'owner',
                })

                return NextResponse.json({ data: family })
            }

            case 'join': {
                const { invite_code } = body
                if (!invite_code) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

                const { data: family } = await supabase
                    .from('families')
                    .select('id, name')
                    .eq('invite_code', invite_code.trim().toLowerCase())
                    .single()

                if (!family) return NextResponse.json({ error: 'Código inválido' }, { status: 404 })

                // Verificar limite de membros (máx 8)
                const { count } = await supabase
                    .from('family_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('family_id', family.id)

                if ((count ?? 0) >= 8) {
                    return NextResponse.json({ error: 'Família atingiu o limite de 8 membros' }, { status: 400 })
                }

                const { error: joinErr } = await supabase.from('family_members').insert({
                    family_id: family.id,
                    user_id: user.id,
                    role: 'member',
                })

                if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 })

                // Notificar owner (se a tabela notifications existir)
                const { data: ownerData } = await supabase.from('families').select('owner_id').eq('id', family.id).single();
                if (ownerData) {
                    await supabase.from('notifications').insert({
                        user_id: ownerData.owner_id,
                        type: 'system',
                        title: '👨👩👧 Novo membro na família!',
                        message: `Um novo membro entrou em "${family.name}".`,
                        data: { family_id: family.id },
                    })
                }

                return NextResponse.json({ data: { family_id: family.id, family_name: family.name } })
            }

            case 'leave': {
                if (!existing) return NextResponse.json({ error: 'Você não está em nenhuma família' }, { status: 400 })

                // Buscar membership
                const { data: membership } = await supabase
                    .from('family_members')
                    .select('id, family_id, role')
                    .eq('user_id', user.id)
                    .single()

                if (!membership) return NextResponse.json({ error: 'Membership não encontrada' }, { status: 404 })

                if (membership.role === 'owner') {
                    // Owner saindo = deletar família inteira
                    await supabase.from('families').delete().eq('id', membership.family_id)
                } else {
                    await supabase.from('family_members').delete().eq('id', membership.id)
                }

                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}

// PATCH — atualizar família ou membro
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'update_family': {
                const { name } = body
                const { error } = await supabase
                    .from('families')
                    .update({ name, updated_at: new Date().toISOString() })
                    .eq('owner_id', user.id)

                if (error) return NextResponse.json({ error: error.message }, { status: 500 })
                return NextResponse.json({ success: true })
            }

            case 'update_member_role': {
                const { member_id, role } = body
                if (!['admin', 'member', 'viewer'].includes(role)) {
                    return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
                }

                // Verificar se sou owner/admin
                const { data: myMembership } = await supabase
                    .from('family_members')
                    .select('family_id, role')
                    .eq('user_id', user.id)
                    .single()

                if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
                    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
                }

                // PROTEÇÃO: Não pode alterar role do owner
                const { data: targetMember } = await supabase
                    .from('family_members')
                    .select('role, user_id')
                    .eq('id', member_id)
                    .eq('family_id', myMembership.family_id)
                    .single()

                if (!targetMember) {
                    return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
                }

                if (targetMember.role === 'owner') {
                    return NextResponse.json({ error: 'Não é possível alterar o role do owner' }, { status: 403 })
                }

                // Admin não pode promover outros a admin (só owner pode)
                if (myMembership.role === 'admin' && role === 'admin') {
                    return NextResponse.json({ error: 'Apenas o owner pode promover admins' }, { status: 403 })
                }

                await supabase.from('family_members')
                    .update({ role })
                    .eq('id', member_id)
                    .eq('family_id', myMembership.family_id)

                return NextResponse.json({ success: true })
            }

            case 'remove_member': {
                const { member_id } = body
                const { data: myMembership } = await supabase
                    .from('family_members')
                    .select('family_id, role')
                    .eq('user_id', user.id)
                    .single()

                if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
                    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
                }

                await supabase.from('family_members')
                    .delete()
                    .eq('id', member_id)
                    .eq('family_id', myMembership.family_id)
                    .neq('role', 'owner') // Não pode remover o owner

                return NextResponse.json({ success: true })
            }

            case 'share_transaction': {
                const { transaction_id, split_type } = body
                const { data: myMembership } = await supabase
                    .from('family_members')
                    .select('family_id')
                    .eq('user_id', user.id)
                    .single()

                if (!myMembership) return NextResponse.json({ error: 'Não está em uma família' }, { status: 400 })

                const { error } = await supabase.from('family_transactions').insert({
                    family_id: myMembership.family_id,
                    transaction_id,
                    shared_by: user.id,
                    split_type: split_type ?? 'none',
                })

                if (error) return NextResponse.json({ error: error.message }, { status: 500 })
                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
