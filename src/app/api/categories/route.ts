import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.is.null,user_id.eq.${user?.id}`)
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
