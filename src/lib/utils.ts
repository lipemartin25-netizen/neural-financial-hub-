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

/**
 * Funções puras extraídas dos componentes para facilitar testes unitários.
 */

/** Calcula dias até uma data. Retorna string formatada. */
export function daysUntil(date: string): string {
    const d = Math.ceil(
        (new Date(date + 'T12:00:00').getTime() - Date.now()) / 86400000
    )
    if (d === 0) return 'Hoje'
    if (d < 0) return `${Math.abs(d)}d atrás`
    return `${d}d`
}

/** Agrupa transações por data e retorna datas ordenadas desc. */
export function groupByDate<T extends { date: string }>(
    items: T[]
): { grouped: Record<string, T[]>; sortedDates: string[] } {
    const grouped: Record<string, T[]> = {}
    items.forEach(item => {
        if (!grouped[item.date]) grouped[item.date] = []
        grouped[item.date].push(item)
    })
    const sortedDates = Object.keys(grouped).sort(
        (a, b) =>
            new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()
    )
    return { grouped, sortedDates }
}

/** Soma amounts filtrados por tipo */
export function sumByType<T extends { type: string; amount: number }>(
    items: T[],
    type: string
): number {
    return items
        .filter(item => item.type === type)
        .reduce((sum, item) => sum + item.amount, 0)
}
