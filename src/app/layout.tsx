import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
    title: {
        default: 'NeuraFin Hub — Finanças com IA Neural',
        template: '%s | NeuraFin Hub',
    },
    description:
        'O super app financeiro com IA neural. Controle transações, orçamentos, metas, boletos, investimentos e muito mais.',
    keywords: ['finanças', 'IA', 'controle financeiro', 'orçamento', 'metas', 'investimento'],
    authors: [{ name: 'NeuraFin Hub' }],
    robots: { index: true, follow: true },
}

export const viewport: Viewport = {
    themeColor: '#0a0f1c',
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#f1f5f9',
                        },
                    }}
                />
            </body>
        </html>
    )
}
