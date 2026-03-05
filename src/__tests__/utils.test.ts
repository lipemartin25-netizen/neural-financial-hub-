import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { daysUntil, groupByDate, sumByType } from '@/lib/utils'

/* ── daysUntil ── */
describe('daysUntil', () => {
    beforeEach(() => {
        // Fixa "agora" em 2026-03-05 12:00:00 BRT
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T15:00:00.000Z')) // 12:00 GMT-3
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('retorna "Hoje" para a data atual', () => {
        expect(daysUntil('2026-03-05')).toBe('Hoje')
    })

    it('retorna dias positivos para datas futuras', () => {
        expect(daysUntil('2026-03-08')).toBe('3d')
    })

    it('retorna dias negativos para datas passadas', () => {
        expect(daysUntil('2026-03-02')).toBe('3d atrás')
    })

    it('retorna "1d" para amanhã', () => {
        expect(daysUntil('2026-03-06')).toBe('1d')
    })

    it('retorna "1d atrás" para ontem', () => {
        expect(daysUntil('2026-03-04')).toBe('1d atrás')
    })
})

/* ── groupByDate ── */
describe('groupByDate', () => {
    const items = [
        { date: '2026-03-05', name: 'A', amount: 100 },
        { date: '2026-03-05', name: 'B', amount: 200 },
        { date: '2026-03-03', name: 'C', amount: 50 },
        { date: '2026-03-07', name: 'D', amount: 300 },
    ]

    it('agrupa itens pela mesma data', () => {
        const { grouped } = groupByDate(items)
        expect(grouped['2026-03-05']).toHaveLength(2)
        expect(grouped['2026-03-03']).toHaveLength(1)
        expect(grouped['2026-03-07']).toHaveLength(1)
    })

    it('ordena datas em ordem decrescente', () => {
        const { sortedDates } = groupByDate(items)
        expect(sortedDates).toEqual(['2026-03-07', '2026-03-05', '2026-03-03'])
    })

    it('retorna vazio para array vazio', () => {
        const { grouped, sortedDates } = groupByDate([])
        expect(Object.keys(grouped)).toHaveLength(0)
        expect(sortedDates).toHaveLength(0)
    })

    it('mantém a ordem de inserção dentro do mesmo grupo', () => {
        const { grouped } = groupByDate(items)
        expect(grouped['2026-03-05'][0].name).toBe('A')
        expect(grouped['2026-03-05'][1].name).toBe('B')
    })
})

/* ── sumByType ── */
describe('sumByType', () => {
    const items = [
        { type: 'in', amount: 1000 },
        { type: 'in', amount: 500 },
        { type: 'out', amount: 300 },
        { type: 'out', amount: 200 },
        { type: 'in', amount: 250 },
    ]

    it('soma corretamente receitas (in)', () => {
        expect(sumByType(items, 'in')).toBe(1750)
    })

    it('soma corretamente despesas (out)', () => {
        expect(sumByType(items, 'out')).toBe(500)
    })

    it('retorna 0 para tipo inexistente', () => {
        expect(sumByType(items, 'transfer')).toBe(0)
    })

    it('retorna 0 para array vazio', () => {
        expect(sumByType([], 'in')).toBe(0)
    })

    it('lida com valores decimais', () => {
        const decimals = [
            { type: 'in', amount: 10.5 },
            { type: 'in', amount: 20.3 },
        ]
        expect(sumByType(decimals, 'in')).toBeCloseTo(30.8)
    })
})
