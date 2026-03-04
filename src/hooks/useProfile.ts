'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Profile } from '@/types/database'

export type ProfileData = Profile & {
    email: string
    auth_provider: string
    last_sign_in: string | null
}

export function useProfile() {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/profile')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setProfile(json.data ?? null)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar perfil'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchProfile()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil'
            return { error: message }
        }
    }, [fetchProfile])

    const settingsAction = useCallback(async (action: string, payload: Record<string, string> = {}) => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            return { error: null, message: json.message }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro na operação'
            return { error: message, message: null }
        }
    }, [])

    return { profile, loading, error, fetchProfile, updateProfile, settingsAction }
}
