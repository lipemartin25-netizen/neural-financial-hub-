// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-placeholder'
    return createClient(supabaseUrl, serviceRoleKey)
}
