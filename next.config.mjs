// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.pluggy.ai https://*.pluggy.ai https://js.stripe.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://cdn.pluggy.ai https://fonts.googleapis.com https://accounts.google.com",
  "img-src 'self' blob: data: https: *",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.pluggy.ai",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.pluggy.ai https://*.pluggy.ai https://api.stripe.com https://accounts.google.com",
  "frame-src 'self' https://cdn.pluggy.ai https://connect.pluggy.ai https://*.pluggy.ai https://js.stripe.com https://accounts.google.com",
  "child-src 'self' https://*.pluggy.ai blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    // ── Otimizações de produção ──
    poweredByHeader: false,
    compress: true,
    reactStrictMode: true,
    // PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET ficam apenas server-side
    // Nunca expor secrets no bundle do client via bloco `env`

    // ── Imagens otimizadas ──
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.pluggy.ai',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400, // 24h de cache para imagens otimizadas
    },

    // ── Headers de segurança e cache ──
    async headers() {
        return [
            // Security headers GLOBAIS (todas as rotas)
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: cspHeader,
                    },
                ],
            },
            // Service Worker
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
                    { key: 'Service-Worker-Allowed', value: '/' },
                ],
            },
            // Manifest PWA
            {
                source: '/manifest.json',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=86400' },
                ],
            },
            // Cache agressivo para assets estáticos
            {
                source: '/icons/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            // API routes: no cache + CORS restritivo
            {
                source: '/api/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
            // Páginas de Auth: não indexar
            {
                source: '/login',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
                ],
            },
            {
                source: '/register',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
                ],
            },
        ]
    },

    // ── Redirects (rota morta /patrimony → /patrimonio) ──
    async redirects() {
        return [
            {
                source: '/patrimony',
                destination: '/patrimonio',
                permanent: true, // 301
            },
        ]
    },
}

export default withBundleAnalyzer(nextConfig)
