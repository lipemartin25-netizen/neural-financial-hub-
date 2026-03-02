import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WealthDash from '@/components/wealth-lab/WealthDash'

export default async function WealthLabPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                    Wealth Lab 🧪
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Simuladores avançados e calculadoras de independência financeira (FIRE)</p>
            </div>

            <WealthDash />
        </div>
    )
}
