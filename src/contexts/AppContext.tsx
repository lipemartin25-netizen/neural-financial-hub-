'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Locale } from '@/lib/i18n'
import { t as translate, tBadge } from '@/lib/i18n'

type Theme = 'dark' | 'light'

type AppContextType = {
    locale: Locale
    setLocale: (l: Locale) => void
    theme: Theme
    setTheme: (t: Theme) => void
    t: (key: string) => string
    tBadge: (field: Record<string, string>) => string
}

const AppContext = createContext<AppContextType>({
    locale: 'pt-BR',
    setLocale: () => { },
    theme: 'dark',
    setTheme: () => { },
    t: (key) => key,
    tBadge: (field) => field['pt-BR'] ?? '',
})

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('pt-BR')
    const [theme, setThemeState] = useState<Theme>('dark')
    const [mounted, setMounted] = useState(false)

    // Carregar do localStorage ao montar
    useEffect(() => {
        const storedLocale = localStorage.getItem('neuralfinance-locale') as Locale | null
        const storedTheme = localStorage.getItem('neuralfinance-theme') as Theme | null
        if (storedLocale) setLocaleState(storedLocale)
        if (storedTheme) setThemeState(storedTheme)
        setMounted(true)
    }, [])

    // Aplicar tema no HTML
    useEffect(() => {
        if (!mounted) return
        const html = document.documentElement
        if (theme === 'light') {
            html.classList.remove('dark')
            html.classList.add('light')
            html.style.backgroundColor = '#f5f3ee'
            html.style.colorScheme = 'light'
            document.body.style.backgroundColor = '#f5f3ee'
            document.body.style.color = '#1a1a1a'
        } else {
            html.classList.remove('light')
            html.classList.add('dark')
            html.style.backgroundColor = '#0b0d10'
            html.style.colorScheme = 'dark'
            document.body.style.backgroundColor = '#0b0d10'
            document.body.style.color = '#ebe6da'
        }
    }, [theme, mounted])

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l)
        localStorage.setItem('neuralfinance-locale', l)
        // Salvar no perfil (fire and forget)
        fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: l }),
        }).catch(() => { })
    }, [])

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t)
        localStorage.setItem('neuralfinance-theme', t)
        fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: t }),
        }).catch(() => { })
    }, [])

    const tFunc = useCallback((key: string) => translate(key, locale), [locale])
    const tBadgeFunc = useCallback((field: Record<string, string>) => tBadge(field, locale), [locale])

    return (
        <AppContext.Provider value={{ locale, setLocale, theme, setTheme, t: tFunc, tBadge: tBadgeFunc }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    return useContext(AppContext)
}
