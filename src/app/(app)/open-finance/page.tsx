'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Building2, RefreshCw, Trash2, Plus, Loader2, Link2, ExternalLink, Shield, Wifi } from 'lucide-react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'
import { useApp } from '@/contexts/AppContext'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Import dinâmico do widget para evitar erro de 'window is not defined' no SSR
const PluggyConnect = dynamic(
    () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
    { ssr: false }
)

type Connection = {
    id: string
    item_id: string
    connector_name: string | null
    connector_logo: string | null
    status: string
    last_sync_at: string | null
}

export default function OpenFinancePage() {
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState<string | null>(null)
    const [connecting, setConnecting] = useState(false)
    const [connectToken, setConnectToken] = useState<string | null>(null)
    const [isWidgetOpen, setIsWidgetOpen] = useState(false)

    const { t } = useApp()

    const fetchConnections = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/open-finance')
            const json = await res.json()
            setConnections(json.data ?? [])
        } catch { } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchConnections() }, [fetchConnections])

    const handleConnect = async () => {
        setConnecting(true)
        try {
            const res = await fetch('/api/open-finance?action=connect_token')
            const json = await res.json()

            if (json.demo) {
                toast.info('Open Finance está em modo demo. Configure as chaves no .env')
                setConnecting(false)
                return
            }

            if (json.connectToken) {
                setConnectToken(json.connectToken)
                setIsWidgetOpen(true)
            }
        } catch {
            toast.error('Erro ao gerar token de conexão')
        } finally { setConnecting(false) }
    }

    const handleWidgetSuccess = async (data: { item: { id: string, connector: { name: string, imageUrl: string } } }) => {
        setIsWidgetOpen(false)
        setConnecting(true)

        try {
            // Salvar conexão no banco
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

            toast.success('Banco conectado! Iniciando sincronização...')

            // Disparar sincronização inicial
            await handleSync(data.item.id)
            fetchConnections()
        } catch {
            toast.error('Erro ao salvar conexão')
        } finally {
            setConnecting(false)
        }
    }

    const handleSync = async (itemId: string) => {
        setSyncing(itemId)
        try {
            const res = await fetch('/api/open-finance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync', itemId }),
            })
            const json = await res.json()
            if (json.success) {
                toast.success(`Sincronizado! ${json.imported} transações importadas.`, {
                    description: 'Histórico de 90 dias e categorização automática aplicados.'
                })
                fetchConnections()
            } else {
                toast.error(json.error || 'Erro na sincronização')
            }
        } catch { toast.error('Erro') }
        finally { setSyncing(null) }
    }

    const handleDelete = async (itemId: string) => {
        if (!confirm('Remover esta conexão bancária? Contas vinculadas serão mantidas, mas não serão mais atualizadas.')) return
        try {
            await fetch(`/api/open-finance?itemId=${itemId}`, { method: 'DELETE' })
            toast.success('Conexão removida')
            fetchConnections()
        } catch { toast.error('Erro ao remover') }
    }

    return (
        <div>
            {isWidgetOpen && connectToken && (
                <PluggyConnect
                    connectToken={connectToken}
                    includeSandbox={true}
                    onSuccess={handleWidgetSuccess}
                    onError={(err) => {
                        console.error(err)
                        toast.error('Erro no widget de conexão')
                        setIsWidgetOpen(false)
                    }}
                    onClose={() => setIsWidgetOpen(false)}
                />
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                        <Wifi size={22} style={{ display: 'inline', marginRight: 8, color: C.gold }} />
                        Open Finance
                    </h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        Conecte seus bancos automaticamente via Open Finance Brasil
                    </p>
                </div>
                <button onClick={handleConnect} disabled={connecting} style={{ ...btnGoldStyle, opacity: connecting ? 0.7 : 1 }}>
                    {connecting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                    {connections.length > 0 ? 'Conectar Novo Banco' : 'Conectar Banco'}
                </button>
            </motion.div>
            {/* Info Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ ...cardHlStyle, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Shield size={20} style={{ color: C.emerald }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Como funciona</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                        { step: '1', title: 'Conecte', desc: 'Escolha seu banco e autorize o acesso (via Pluggy)' },
                        { step: '2', title: 'Sincronize', desc: 'Seus saldos e transações são importados automaticamente' },
                        { step: '3', title: 'Gerencie', desc: 'Categorize e acompanhe tudo em um só lugar' },
                    ].map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: C.goldGrad, color: C.bg, fontSize: 13, fontWeight: 700, flexShrink: 0,
                            }}>{s.step}</div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.title}</p>
                                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
            {/* Connections List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} style={{ color: C.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
            ) : connections.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                    <Building2 size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>Nenhum banco conectado</h3>
                    <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
                        Conecte seus bancos para importar transações automaticamente
                    </p>
                    <button onClick={handleConnect} style={btnGoldStyle}>
                        <Link2 size={14} /> Conectar Primeiro Banco
                    </button>
                </motion.div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {connections.map((conn, i) => (
                        <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{ ...cardStyle, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {conn.connector_logo ? (
                                    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, overflow: 'hidden' }}>
                                        <Image src={conn.connector_logo} alt="" fill style={{ objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, backgroundColor: C.secondary,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Building2 size={18} style={{ color: C.textMuted }} />
                                    </div>
                                )}
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{conn.connector_name || 'Banco'}</p>
                                    <p style={{ fontSize: 11, color: C.textMuted }}>
                                        {conn.last_sync_at
                                            ? `Última sync: ${new Date(conn.last_sync_at).toLocaleDateString('pt-BR')}`
                                            : 'Nunca sincronizado'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleSync(conn.item_id)} disabled={syncing === conn.item_id}
                                    style={{ ...btnOutlineStyle, padding: '6px 12px', fontSize: 12 }}>
                                    {syncing === conn.item_id
                                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <RefreshCw size={12} />}
                                    Sync
                                </button>
                                <button onClick={() => handleDelete(conn.item_id)}
                                    style={{ background: 'none', border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.red }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
