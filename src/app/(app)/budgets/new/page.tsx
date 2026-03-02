import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetForm from '@/components/budgets/BudgetForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewBudgetPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, type, color, icon')
        .eq('type', 'expense')
        .or(`user_id.eq.${user.id},user_id.is.null`)

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/budgets" className="p-2 rounded-xl glass-card hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Novo Orçamento Mensal</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Defina limites de gastos para categorias específicas e receba alertas</p>
                </div>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-primary">
                <BudgetForm categories={categories ?? []} />
            </div>
        </div>
    )
}
