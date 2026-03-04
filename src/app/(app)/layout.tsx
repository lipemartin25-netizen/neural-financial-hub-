'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import OnboardingWizard from '@/components/OnboardingWizard'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        // Verificar se é primeira vez
        const done = localStorage.getItem('neurafin_onboarding_done')
        if (!done) {
            // Verificar se tem contas cadastradas
            fetch('/api/accounts')
                .then(r => r.json())
                .then(json => {
                    const accounts = json.data ?? []
                    if (accounts.length === 0) {
                        setShowOnboarding(true)
                    } else {
                        localStorage.setItem('neurafin_onboarding_done', '1')
                    }
                })
                .catch(() => { })
                .finally(() => setChecked(true))
        } else {
            setChecked(true)
        }

        // Auto-gerar transações recorrentes pendentes
        fetch('/api/transactions/recurring/generate', { method: 'POST' }).catch(() => { })
    }, [])

    const handleComplete = () => {
        localStorage.setItem('neurafin_onboarding_done', '1')
        setShowOnboarding(false)
    }

    return (
        <AppLayout>
            {children}
            {showOnboarding && <OnboardingWizard onComplete={handleComplete} />}
        </AppLayout>
    )
}
