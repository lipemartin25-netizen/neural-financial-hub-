import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
    it('deve permitir requests dentro do limite', () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100, maxRequests: 5 })
        const result = limiter.check('test-user-1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(4)
    })

    it('deve bloquear após exceder o limite', () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100, maxRequests: 3 })
        limiter.check('test-user-block')
        limiter.check('test-user-block')
        limiter.check('test-user-block')
        const result = limiter.check('test-user-block')
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
    })

    it('deve rastrear tokens diferentes independentemente', () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100, maxRequests: 2 })
        limiter.check('user-a')
        limiter.check('user-a')
        const resultA = limiter.check('user-a')
        const resultB = limiter.check('user-b')
        expect(resultA.success).toBe(false)
        expect(resultB.success).toBe(true)
    })

    it('deve decrementar remaining corretamente', () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100, maxRequests: 5 })
        const r1 = limiter.check('user-dec')
        const r2 = limiter.check('user-dec')
        expect(r1.remaining).toBe(4)
        expect(r2.remaining).toBe(3)
    })
})
