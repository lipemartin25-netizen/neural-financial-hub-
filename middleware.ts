import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/offline'])
const PUBLIC_PREFIXES = ['/auth/callback', '/api/stripe/webhook', '/api/pluggy/webhook', '/api/health', '/_next/', '/icons/', '/screenshots/']
const PUBLIC_FILES = new Set(['/sw.js', '/manifest.json', '/favicon.ico'])

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Assets estáticos e rotas públicas — skip
    if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next()
    if (PUBLIC_FILES.has(pathname)) return NextResponse.next()
    if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()

    // Ignorar assets estáticos com extensão que não sejam da API
    if (pathname.includes('.') && !pathname.startsWith('/api/')) return NextResponse.next()

    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request: { headers: request.headers } })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // API routes → 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // Pages → redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
