import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'https://neurafin-hub.vercel.app'}/api/auth/google/callback`

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Nenhum código retornado do Google', request.url))
  }

  try {
    // 1. Troca o código gerado pelo Google pelo ID Token (JWT Blindado) num túnel seguro Server-to-Server
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      })
    })

    const tokens = await tokenRes.json()

    if (!tokens.id_token) {
      return NextResponse.redirect(new URL(`/login?error=Falha na Vercel ao obter Token: ${tokens.error_description || 'Desconhecida'}`, request.url))
    }

    // 2. Transfere a sessão limpa para o Supabase no lado do Servidor com injeção segura (Set-Cookie HTTP-only)
    const cookieStore = cookies()
    const redirectUrl = new URL('/dashboard', request.url)
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            } catch (e) {
                console.error("Erro ignorado ao assinar cookie", e)
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.id_token,
    })

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }

    // Navega imperativamente o usuário ao Dashboard com o pacote de Cookies blindados de Loop
    return response
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/login?error=Erro Crítico de Rota`, request.url))
  }
}
