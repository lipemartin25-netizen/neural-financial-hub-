'use client'

import { useState } from 'react'
import { Wallet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { C, btnGoldStyle } from '@/lib/theme'
import dynamic from 'next/dynamic'

// Import dinâmico do widget para evitar erro de 'window is not defined' no SSR
const PluggyConnect = dynamic(
    () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
    { ssr: false }
)

interface PluggyConnectButtonProps {
    onSuccess?: () => void
    label?: string
    icon?: boolean
}

export function PluggyConnectButton({
    onSuccess,
    label = 'Conectar Banco',
    icon = true
}: PluggyConnectButtonProps) {
    const [connectToken, setConnectToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOpen = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/open-finance?action=connect_token')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar token')
            if (data.demo) {
                toast.info('Modo Demo: Configure as chaves no .env')
                return
            }
            setConnectToken(data.connectToken)
            setIsOpen(true)
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message || 'Erro ao iniciar conexão')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuccess = async (data: { item: { id: string, connector: { name: string, imageUrl: string } } }) => {
        setIsOpen(false)
        setIsLoading(true)

        toast.info('🎉 Conexão estabelecida!', {
            description: 'Sincronizando suas contas e transações dos últimos 90 dias...',
            style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
        })

        try {
            // 1. Salvar conexão
            await fetch('/api/open-finance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_connection',
                    itemId: data.item.id,
                    connectorName: data.item.connector.name,
                    connectorLogo: data.item.connector.imageUrl
                }),
            })

            // 2. Disparar Sincronização Robusta (90 dias + categorização)
            const syncRes = await fetch('/api/open-finance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync', itemId: data.item.id }),
            })
            const syncData = await syncRes.json()

            if (!syncRes.ok) throw new Error(syncData.error)

            toast.success('✅ Sincronização concluída!', {
                description: `${syncData.imported} transações importadas e categorizadas.`,
                style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
            })

            onSuccess?.()
        } catch (err: any) {
            setError(err.message)
            toast.warning('Aviso: Conexão salva, mas a sincronização inicial falhou.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleError = (error: any) => {
        console.error('[Pluggy Connect] Error:', error)
        setError('Erro ao conectar com o banco. Tente novamente.')
        setIsOpen(false)
        toast.error('Conexão cancelada ou falha ao iniciar o widget.')
    }

    return (
        <>
            <button
                onClick={handleOpen}
                disabled={isLoading}
                style={{
                    ...btnGoldStyle,
                    opacity: isLoading ? 0.7 : 1,
                    minWidth: 160
                }}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    icon && <Wallet className="w-4 h-4" />
                )}
                {isLoading ? 'Sincronizando...' : label}
            </button>

            {error && (
                <p style={{ marginTop: 8, fontSize: 12, color: C.red }}>{error}</p>
            )}

            {isOpen && connectToken && (
                <PluggyConnect
                    connectToken={connectToken}
                    includeSandbox={true}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    onClose={() => setIsOpen(false)}
                />
            )}

            <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
        </>
    )
}
