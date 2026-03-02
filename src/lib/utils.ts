import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(
    value: number,
    currency = 'BRL',
    locale = 'pt-BR'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(value)
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatRelativeDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isToday(d)) return 'Hoje'
    if (isYesterday(d)) return 'Ontem'
    return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatShortDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'dd MMM', { locale: ptBR })
}

export function formatMonthYear(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'MMMM yyyy', { locale: ptBR })
}

export function formatPercent(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
}

export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength - 3) + '...'
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isServer(): boolean {
    return typeof window === 'undefined'
}
