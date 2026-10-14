'use client'
import { useEffect, useState } from 'react'
import Onboarding from './Onboarding'
export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [checked, setChecked] = useState(false)
    useEffect(() => {
        fetch('/api/profile')
            .then(r => r.json())
            .then(json => {
                if (json.data && !json.data.onboarding_completed) {
                    setShowOnboarding(true)
                }
            })
            .catch(() => { })
            .finally(() => setChecked(true))
    }, [])
    if (!checked) return <>{children}</>
    if (showOnboarding) {
        return <Onboarding onComplete={() => setShowOnboarding(false)} />
    }
    return <>{children}</>
}
