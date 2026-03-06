// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ========== RATE LIMIT INLINE (Edge-compatible) ==========
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(
    ip: string,
    maxRequests: number,
    windowMs: number
): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const record = rateLimitMap.get(ip)

    // Limpar entradas expiradas periodicamente (~1% das requests)
    if (Math.random() < 0.01) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (val.reset < now) rateLimitMap.delete(key)
        }
    }

    if (!record || record.reset < now) {
        rateLimitMap.set(ip, { count: 1, reset: now + windowMs })
        return { allowed: true, remaining: maxRequests - 1 }
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0 }
    }

    record.count++
    return { allowed: true, remaining: maxRequests - record.count }
}

// ========== SECURITY HEADERS ==========
const securityHeaders: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    'X-XSS-Protection': '1; mode=block',
}

function applySecurityHeaders(response: NextResponse): NextResponse {
    for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value)
    }
    return response
}

// ========== MIDDLEWARE PRINCIPAL ==========
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown'

    // ── Assets estáticos: passar direto ──
    const isStaticAsset = pathname.startsWith('/_next')
        || pathname.startsWith('/favicon')
        || pathname.startsWith('/icons')
        || pathname.startsWith('/sw.js')
        || pathname.startsWith('/manifest')
        || pathname.includes('.')
    if (isStaticAsset) return NextResponse.next()

    // ── Rate Limit em rotas de Auth (anti brute-force) ──
    if (pathname === '/login' || pathname === '/register') {
        const { allowed } = checkRateLimit(`auth:${ip}`, 30, 60_000) // 30 req/min
        if (!allowed) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            const response = NextResponse.redirect(url)
            response.headers.set('Retry-After', '60')
            return response
        }
    }

    // ── Rate Limit em API routes ──
    if (pathname.startsWith('/api/')) {
        // Rotas sensíveis: limite mais agressivo
        const sensitiveRoutes = [
            '/api/ai/chat',
            '/api/pluggy/',
            '/api/push/send',
            '/api/stripe/',
            '/api/transactions/import',
        ]
        const isSensitive = sensitiveRoutes.some(r => pathname.startsWith(r))
        const maxReq = isSensitive ? 15 : 60 // 15/min para sensíveis, 60/min para gerais

        const { allowed, remaining } = checkRateLimit(`api:${ip}:${pathname}`, maxReq, 60_000)

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Tente novamente em alguns minutos.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Remaining': '0',
                        ...securityHeaders,
                    },
                }
            )
        }

        // Webhooks: não precisam de auth do Supabase (têm validação própria)
        if (pathname === '/api/pluggy/webhook' || pathname === '/api/stripe/webhook') {
            const response = NextResponse.next()
            response.headers.set('X-RateLimit-Remaining', remaining.toString())
            return applySecurityHeaders(response)
        }
    }

    // ── Supabase Auth Session ──
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Rotas públicas
    const publicRoutes = ['/', '/login', '/register', '/reset-password', '/offline', '/privacy', '/terms']
    const isPublicRoute = publicRoutes.includes(pathname)
        || pathname.startsWith('/api/auth')
        || pathname.startsWith('/auth/')
    const isApiRoute = pathname.startsWith('/api/')

    // Não autenticado tentando acessar rota protegida
    if (!user && !isPublicRoute && !isApiRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return applySecurityHeaders(NextResponse.redirect(url))
    }

    // Autenticado tentando acessar login/register → dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return applySecurityHeaders(NextResponse.redirect(url))
    }

    // ── Aplicar security headers em TODAS as respostas ──
    return applySecurityHeaders(supabaseResponse)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
    ],
}
