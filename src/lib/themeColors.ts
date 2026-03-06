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
    bg: '#D3D3D3', // LightGrey
    card: '#B0C4DE', // LightSteelBlue
    cardGrad: 'linear-gradient(165deg, #B0C4DE, #B9CDDF)',
    cardHlGrad: 'linear-gradient(165deg, #B9CDDF, #C3D6E5)',
    text: '#1f2937',
    textMuted: '#4b5563',
    textMuted2: '#6b7280',
    secondary: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.12)',
    borderGold: 'rgba(138,110,47,0.2)',
    gold: '#8a6e2f',
    goldGrad: 'linear-gradient(135deg, #b8943d, #8a6e2f)',
    goldTextGrad: 'linear-gradient(135deg, #8a6e2f, #6d5624, #b8943d)',
    emerald: '#065f46',
    red: '#991b1b',
    yellow: '#92400e',
    blue: '#1e40af',
    violet: '#5b21b6',
    cyan: '#155e75',
    orange: '#9a3412',
    pink: '#9d174d',
    muted: 'rgba(0,0,0,0.08)',
}

export function getThemeColors(theme?: string): ThemeColors {
    return theme === 'light' ? lightColors : darkColors
}
