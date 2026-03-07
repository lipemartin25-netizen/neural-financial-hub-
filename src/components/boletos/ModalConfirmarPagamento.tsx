
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { C, cardHlStyle, btnGoldStyle, btnOutlineStyle, inputStyle, fmt } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/types/database'

interface Props {
    open: boolean
    boletoId: string
    boletoDescricao: string
    boletoValor: number
    contaIdPreSelecionada?: string
    onConfirm: (accountId: string) => Promise<void>
    onCancel: () => void
}

export default function ModalConfirmarPagamento({
    open,
    boletoId,
    boletoDescricao,
    boletoValor,
    contaIdPreSelecionada,
    onConfirm,
    onCancel
}: Props) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [selectedAccount, setSelectedAccount] = useState('')
    const [loading, setLoading] = useState(true)
    const [confirming, setConfirming] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            loadAccounts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    async function loadAccounts() {
        setLoading(true)
        const { data } = await supabase.from('accounts').select('*').order('name')
        if (data) {
            setAccounts(data)
            setSelectedAccount(contaIdPreSelecionada || data[0]?.id || '')
        }
        setLoading(false)
    }

    const handleConfirm = async () => {
        if (!selectedAccount) return
        setConfirming(true)
        await onConfirm(selectedAccount)
        setConfirming(false)
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)', padding: 16
                    }}
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        style={{ ...cardHlStyle, width: '100%', maxWidth: 400, padding: 24, position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={onCancel} style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,168,88,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold }}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Confirmar Pagamento</h2>
                                <p style={{ fontSize: 14, color: C.textMuted }}>Selecione a conta para o débito</p>
                            </div>
                        </div>

                        <div style={{ backgroundColor: C.secondary, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                            <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Boleto</p>
                            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{boletoDescricao}</p>
                            <p style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>{fmt(boletoValor)}</p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 8 }}>Debitar da conta:</label>
                            {loading ? (
                                <div style={{ padding: 12, textAlign: 'center' }}><Loader2 className="animate-spin" size={20} style={{ color: C.gold, margin: '0 auto' }} /></div>
                            ) : (
                                <select
                                    value={selectedAccount}
                                    onChange={e => setSelectedAccount(e.target.value)}
                                    style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                                >
                                    {accounts.length === 0 && <option value="">Nenhuma conta cadastrada</option>}
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} (Saldo: {fmt(acc.balance)})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: 10, marginBottom: 24 }}>
                            <AlertCircle size={16} style={{ color: C.red, flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: C.textMuted }}>O valor será subtraído imediatamente do saldo da conta selecionada.</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={onCancel} style={{ ...btnOutlineStyle, flex: 1, height: 44 }}>Cancelar</button>
                            <button
                                onClick={handleConfirm}
                                disabled={confirming || !selectedAccount}
                                style={{ ...btnGoldStyle, flex: 1, height: 44 }}
                            >
                                {confirming ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Pagamento'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
        </AnimatePresence>
    )
}
