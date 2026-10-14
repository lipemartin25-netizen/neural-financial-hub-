import NeonBackground from '@/components/NeonBackground'

// Forçar renderização dinâmica — auth pages dependem de env vars (Supabase)
export const dynamic = 'force-dynamic'

// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <NeonBackground />
            {children}
        </>
    )
}
