import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoalForm from '@/components/goals/GoalForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewGoalPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/goals" className="p-2 rounded-xl glass-card hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Novo Sonho ou Meta</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Defina objetivo para reserva financeira, viagens, compras ou aportes</p>
                </div>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-primary">
                <GoalForm />
            </div>
        </div>
    )
}
