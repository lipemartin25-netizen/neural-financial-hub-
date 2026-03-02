import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Profile } from '@/types/database'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar profile={profile as Profile | null} />
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 min-h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
