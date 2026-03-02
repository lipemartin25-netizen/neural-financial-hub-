import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Se já estiver logado, vai direto pro dashboard
    if (user) {
        redirect('/dashboard')
    }

    // Se não estiver, vai pro login (no futuro, pode ser uma landing page de marketing)
    redirect('/login')
}
