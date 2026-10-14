'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Building2, PiggyBank, TrendingUp, Wallet, CreditCard, Plus, Eye, EyeOff, X, Trash2, Edit3, Loader2, ChevronDown, RefreshCw } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import GoldText from '@/components/GoldText'
import { toast } from 'sonner'
import { useAccounts } from '@/hooks/useAccounts'
import type { Account } from '@/types/database'
import { PluggyConnectButton } from '@/components/pluggy/PluggyConnectButton'

const ICON_MAP: Record<string, any> = {
    checking: Building2,
    savings: PiggyBank,
    investment: TrendingUp,
    cash: Wallet,
    wallet: Wallet,
    credit_card: CreditCard,
    other: Wallet,
}

const TYPE_MAP: Record<string, string> = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    investment: 'Investimento',
    cash: 'Dinheiro',
    wallet: 'Carteira Digital',
    credit_card: 'Cartão de Crédito',
    other: 'Outros',
}

const COLOR_OPTIONS = [
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarelo' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#FF7A00', label: 'Laranja' },
    { value: '#06B6D4', label: 'Ciano' },
    { value: '#c9a858', label: 'Dourado' },
    { value: '#6B7280', label: 'Cinza' },
]

type UiAccount = {
    id: string
    name: string
    type: string
    institution: string
    balance: number
    color: string
    raw: Account
}

function mapToUi(acc: Account): UiAccount {
    return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        institution: acc.bank_name ?? '',
        balance: Number(acc.balance),
        color: acc.color ?? '#c9a858',
        raw: acc,
    }
}

export default function AccountsPage() {
    const { accounts: rawAccounts, loading, createAccount, updateAccount, deleteAccount, fetchAccounts } = useAccounts()

    const accounts = useMemo(() => rawAccounts.map(mapToUi), [rawAccounts])

    const [showValues, setShowValues] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingAcc, setEditingAcc] = useState<UiAccount | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form State
    const [accName, setAccName] = useState('')
    const [accBalance, setAccBalance] = useState('')
    const [accType, setAccType] = useState('checking')
    const [accBank, setAccBank] = useState('')
    const [accColor, setAccColor] = useState('#c9a858')

    const display = (v: number) => showValues ? fmt(v) : '•••••'
    const total = accounts.reduce((s, a) => s + a.balance, 0)

    const byType = useMemo(() => {
        const grouped: Record<string, UiAccount[]> = {}
        accounts.forEach(a => {
            if (!grouped[a.type]) grouped[a.type] = []
            grouped[a.type].push(a)
        })
        return grouped
    }, [accounts])

    const resetForm = useCallback(() => {
        setAccName('')
        setAccBalance('')
        setAccType('checking')
        setAccBank('')
        setAccColor('#c9a858')
        setEditingAcc(null)
    }, [])

    const openCreate = useCallback(() => {
        resetForm()
        setShowModal(true)
    }, [resetForm])

    const openEdit = useCallback((acc: UiAccount) => {
        setEditingAcc(acc)
        setAccName(acc.name)
        setAccBalance(String(acc.balance))
        setAccType(acc.type)
        setAccBank(acc.institution)
        setAccColor(acc.color)
        setShowModal(true)
    }, [])

    const handleSave = async () => {
        if (!accName) {
            toast.error('Preencha o nome da conta')
            return
        }

        setSaving(true)

        if (editingAcc) {
            // ========== EDITAR ==========
            const { error } = await updateAccount(editingAcc.id, {
                name: accName,
                type: accType,
                bank_name: accBank || null,
                balance: parseFloat(accBalance) || 0,
                color: accColor,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Conta atualizada!', {
                    style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
                })
            }
        } else {
            // ========== CRIAR ==========
            const { error } = await createAccount({
                name: accName,
                type: accType as Account['type'],
                bank_name: accBank || null,
                balance: parseFloat(accBalance) || 0,
                color: accColor,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Conta adicionada com sucesso!', {
                    style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
                })
            }
        }
    }

    const handleDelete = async (acc: UiAccount) => {
        setDeleting(acc.id)
        const { error } = await deleteAccount(acc.id)
        setDeleting(null)

        if (error) {
            toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
        } else {
            toast.success(`"${acc.name}" removida`, {
                style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
            })
        }
    }

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: 'none',
        cursor: 'pointer',
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Saldos & Bancos</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        {loading ? 'Carregando...' : `${accounts.length} contas conectadas`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <PluggyConnectButton onSuccess={() => fetchAccounts()} />
                    <button onClick={openCreate} style={btnGoldStyle}><Plus size={16} /> Nova Conta</button>
                </div>
            </div>

            {/* Total Patrimônio */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardHlStyle, padding: 32, textAlign: 'center', marginBottom: 32 }}>
                <p style={{ fontSize: 14, color: C.textMuted }}>Patrimônio Total</p>
                <p style={{ fontSize: 36, fontWeight: 700, marginTop: 4 }}>
                    <GoldText>{display(total)}</GoldText>
                </p>
                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
                    {loading ? 'Calculando...' : `${accounts.length} contas ativas`}
                </p>
            </motion.div>

            {/* Loading State */}
            {loading && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: C.gold, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 14, color: C.textMuted }}>Carregando contas...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && accounts.length === 0 && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Building2 size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 500, color: C.textMuted }}>Nenhuma conta cadastrada</p>
                    <p style={{ fontSize: 13, color: 'rgba(107,114,128,0.5)', marginTop: 8 }}>
                        Clique em &quot;Nova Conta&quot; para adicionar sua primeira conta bancária
                    </p>
                </div>
            )}

            {/* Accounts By Type */}
            {!loading && Object.entries(byType).map(([type, accs], gi) => {
                const Icon = ICON_MAP[type] || Wallet
                return (
                    <div key={type} style={{ marginBottom: 32 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 12 }}>
                            <Icon size={16} /> {TYPE_MAP[type] || 'Outros'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                            <AnimatePresence>
                                {accs.map((acc, i) => (
                                    <motion.div
                                        key={acc.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: gi * 0.1 + i * 0.05 }}
                                        style={{ ...cardStyle, padding: 20, cursor: 'pointer', position: 'relative' }}
                                        onClick={() => openEdit(acc)}
                                    >
                                        {/* Botão Excluir */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(acc) }}
                                            disabled={deleting === acc.id}
                                            style={{
                                                position: 'absolute', top: 12, right: 12,
                                                background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8,
                                                color: 'rgba(248,113,113,0.4)', transition: 'color 0.2s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.4)')}
                                            title="Remover conta"
                                        >
                                            {deleting === acc.id
                                                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                : <Trash2 size={14} />
                                            }
                                        </button>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${acc.color}15` }}>
                                                <Icon size={18} style={{ color: acc.color }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{acc.name}</p>
                                                {acc.institution && <p style={{ fontSize: 12, color: C.textMuted }}>{acc.institution}</p>}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 22, fontWeight: 700, color: acc.balance >= 0 ? C.text : C.red }}>
                                            {display(acc.balance)}
                                        </p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )
            })}

            {/* ========== MODAL (Create / Edit) ========== */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => { setShowModal(false); resetForm() }}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                                    {editingAcc ? 'Editar Conta' : 'Nova Conta'}
                                </h2>
                                <button aria-label="Ação" onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Nome */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Nome da Conta</label>
                                <input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ex: Nubank, Inter, Cofre..." style={inputStyle} />
                            </div>

                            {/* Banco / Instituição */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Banco / Instituição (opcional)</label>
                                <input value={accBank} onChange={e => setAccBank(e.target.value)} placeholder="Ex: Nubank, Itaú Unibanco..." style={inputStyle} />
                            </div>

                            {/* Saldo */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                    {editingAcc ? 'Saldo Atual' : 'Saldo Inicial'}
                                </label>
                                <input type="number" value={accBalance} onChange={e => setAccBalance(e.target.value)} placeholder="0,00" step="0.01" style={{ ...inputStyle, fontSize: 24, fontWeight: 700 }} />
                            </div>

                            {/* Tipo */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Tipo de Conta</label>
                                <div style={{ position: 'relative' }}>
                                    <select aria-label="Selecionar opção" value={accType} onChange={e => setAccType(e.target.value)} style={selectStyle}>
                                        <option value="checking">🏦 Conta Corrente</option>
                                        <option value="savings">🐷 Poupança</option>
                                        <option value="investment">📈 Investimento</option>
                                        <option value="cash">💵 Dinheiro Físico</option>
                                        <option value="wallet">👛 Carteira Digital</option>
                                        <option value="other">📦 Outros</option>
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Cor */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 8 }}>Cor</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {COLOR_OPTIONS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => setAccColor(c.value)}
                                            title={c.label}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                backgroundColor: c.value,
                                                border: accColor === c.value ? '3px solid #fff' : '3px solid transparent',
                                                cursor: 'pointer',
                                                boxShadow: accColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                                                transition: 'all 0.2s',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Botões */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ ...btnGoldStyle, flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                                    {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {saving ? 'Salvando...' : editingAcc ? 'Atualizar' : 'Salvar Conta'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
