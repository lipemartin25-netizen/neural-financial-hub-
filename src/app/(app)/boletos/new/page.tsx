import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoletoForm from '@/components/boletos/BoletoForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewBoletoPage() {
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
                <Link href="/boletos" className="p-2 rounded-xl glass-card hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Novo Boleto ou Fatura</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Adicione contas a pagar para acompanhar o vencimento</p>
                </div>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-primary">
                <BoletoForm categories={categories ?? []} />
            </div>
        </div>
    )
}
