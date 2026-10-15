import { NextResponse } from 'next/server';

interface RateLimitConfig {
    interval: number; // em ms
    uniqueTokenPerInterval: number; // max users por intervalo
    maxRequests: number; // max requests por user
}

const tokenCache = new Map<string, { count: number; expiresAt: number }>();

// Limpa entradas expiradas periodicamente
setInterval(() => {
    const now = Date.now();
    Array.from(tokenCache.entries()).forEach(([key, value]) => {
        if (value.expiresAt < now) {
            tokenCache.delete(key);
        }
    });
}, 60_000); // limpa a cada 60s

export function rateLimit(config: RateLimitConfig) {
    const { interval, maxRequests } = config;

    return {
        check: (token: string): { success: boolean; remaining: number } => {
            const now = Date.now();
            const record = tokenCache.get(token);

            if (!record || record.expiresAt < now) {
                // Primeiro request ou expirou
                tokenCache.set(token, {
                    count: 1,
                    expiresAt: now + interval,
                });
                return { success: true, remaining: maxRequests - 1 };
            }

            if (record.count >= maxRequests) {
                return { success: false, remaining: 0 };
            }

            record.count++;
            return { success: true, remaining: maxRequests - record.count };
        },
    };
}

// Instâncias pré-configuradas
export const apiLimiter = rateLimit({
    interval: 60_000, // 1 minuto
    uniqueTokenPerInterval: 500,
    maxRequests: 30, // 30 req/min por IP
});

export const authLimiter = rateLimit({
    interval: 900_000, // 15 minutos
    uniqueTokenPerInterval: 500,
    maxRequests: 10, // 10 tentativas a cada 15min
});

export const webhookLimiter = rateLimit({
    interval: 60_000,
    uniqueTokenPerInterval: 100,
    maxRequests: 50, // webhooks podem ter burst
});

// Helper para usar nas API routes
export function withRateLimit(
    ip: string,
    limiter = apiLimiter
): NextResponse | null {
    const { success, remaining } = limiter.check(ip);

    if (!success) {
        return NextResponse.json(
            { error: 'Too many requests. Tente novamente em alguns minutos.' },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': '0',
                    'Retry-After': '60',
                },
            }
        );
    }

    return null; // null = passou no rate limit
}
