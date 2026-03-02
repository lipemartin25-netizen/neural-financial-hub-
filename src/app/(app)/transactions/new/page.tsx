import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionForm from '@/components/transactions/TransactionForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewTransactionPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [accountsRes, categoriesRes] = await Promise.all([
        supabase.from('accounts').select('id, name, color, type').eq('user_id', user.id).eq('is_active', true),
        supabase.from('categories').select('id, name, type, color, icon').or(`user_id.eq.${user.id},user_id.is.null`),
    ])

    const accounts = accountsRes.data ?? []
    const categories = categoriesRes.data ?? []

    if (accounts.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-4 pt-12 animate-fade-in">
                <h1 className="text-2xl font-bold text-foreground">Você precisa de uma conta</h1>
                <p className="text-muted-foreground">Antes de criar uma transação, adicione pelo menos uma conta bancária ou carteira.</p>
                <Link href="/accounts" className="btn-neural inline-block">
                    Adicionar Conta
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-xl glass-card hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nova Transação</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">A NeuraFin IA sugere a categoria ao digitar a descrição</p>
                </div>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-primary">
                <TransactionForm accounts={accounts} categories={categories} />
            </div>
        </div>
    )
}
