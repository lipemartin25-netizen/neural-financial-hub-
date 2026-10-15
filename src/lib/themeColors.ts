// src/lib/themeColors.ts
import { C } from '@/lib/theme'

type ThemeColors = typeof C & {
    gold: string; emerald: string; red: string; yellow: string; blue: string
    violet: string; cyan: string; orange: string; pink: string; muted: string
}

const darkColors: ThemeColors = {
    ...C,
    emerald: '#34d399',
    red: '#f87171',
    yellow: '#fbbf24',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    orange: '#fb923c',
    pink: '#f472b6',
    muted: 'rgba(255,255,255,0.08)',
}

const lightColors: ThemeColors = {
    ...C,
    bg: '#f8f9fa',
    card: '#ffffff',
    cardGrad: 'linear-gradient(165deg, #ffffff, #f8f9fa)',
    cardHlGrad: 'linear-gradient(165deg, #fffdf7, #faf8f3)',
    text: '#1f2937',
    textMuted: '#6b7280',
    textMuted2: '#9ca3af',
    secondary: 'rgba(0,0,0,0.04)',
    border: 'rgba(0,0,0,0.08)',
    borderGold: 'rgba(201,168,88,0.12)',
    gold: '#b8943d',
    goldGrad: 'linear-gradient(135deg, #c9a858, #9a7d3a)',
    goldTextGrad: 'linear-gradient(135deg, #b8943d, #8a6e2f, #c9a858)',
    emerald: '#059669',
    red: '#dc2626',
    yellow: '#d97706',
    blue: '#2563eb',
    violet: '#7c3aed',
    cyan: '#0891b2',
    orange: '#ea580c',
    pink: '#db2777',
    muted: 'rgba(0,0,0,0.06)',
}

export function getThemeColors(theme?: string): ThemeColors {
    return theme === 'light' ? lightColors : darkColors
}
