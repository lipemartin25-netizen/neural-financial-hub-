'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Plus, Download, X, Trash2, Loader2, ChevronDown
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { downloadCSV, formatDateBR, fmtPlain } from '@/lib/export'
import { toast } from 'sonner'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SkeletonSummary, SkeletonTransactionList } from '@/components/SkeletonCard'
import { groupByDate, sumByType } from '@/lib/utils'
import type { TransactionWithCategory } from '@/types/database'

/* ── Types ── */
type UiTx = {
    id: string; name: string; desc: string; amount: number; type: 'in' | 'out'
    category: string; categoryIcon: string; date: string; account: string
    raw: TransactionWithCategory
}

const mapToUi = (tx: TransactionWithCategory): UiTx => ({
    id: tx.id,
    name: tx.description,
    desc: tx.notes || '',
    amount: Number(tx.amount),
    type: tx.type === 'income' ? 'in' : 'out',
    category: tx.category?.name || 'Sem Categoria',
    categoryIcon: tx.category?.icon || '💰',
    date: tx.date,
    account: tx.account?.name || 'Desconhecida',
    raw: tx
})

function TransactionsContent() {
    const {
        transactions: rawTx, accounts, categories, loading,
        fetchTransactions, fetchAccounts, fetchCategories,
        addTransaction, updateTransaction, deleteTransaction
    } = useFinanceStore()

    useEffect(() => {
        fetchTransactions()
        fetchAccounts()
        fetchCategories()
    }, [fetchTransactions, fetchAccounts, fetchCategories])

    const transactions = useMemo(() => rawTx.map(mapToUi), [rawTx])
    const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all')
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingTx, setEditingTx] = useState<UiTx | null>(null)
    const [saving, setSaving] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

    /* ── Form ── */
    const [fDesc, setFDesc] = useState('')
    const [fAmount, setFAmount] = useState('')
    const [fType, setFType] = useState<'income' | 'expense'>('expense')
    const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0])
    const [fCategory, setFCategory] = useState('')
    const [fAccount, setFAccount] = useState('')

    /* ── Derived data (memoized) ── */
    const filtered = useMemo(() => {
        return transactions.filter(tx => {
            if (filterType !== 'all' && tx.type !== filterType) return false
            if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false
            return true
        }).sort((a, b) => new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime())
    }, [transactions, filterType, search])

    const { grouped, sortedDates } = useMemo(
        () => groupByDate(filtered),
        [filtered]
    )

    const totalIn = useMemo(() => sumByType(transactions, 'in'), [transactions])
    const totalOut = useMemo(() => sumByType(transactions, 'out'), [transactions])

    /* ── Handlers ── */
    const resetForm = () => {
        setFDesc(''); setFAmount(''); setFType('expense')
        setFDate(new Date().toISOString().split('T')[0])
        setFCategory(''); setFAccount(''); setEditingTx(null)
    }

    const openCreate = () => { resetForm(); setShowModal(true) }

    const openEdit = (tx: UiTx) => {
        setEditingTx(tx)
        setFDesc(tx.name)
        setFAmount(String(tx.amount))
        setFType(tx.raw.type as 'income' | 'expense')
        setFDate(tx.date)
        setFCategory(tx.raw.category_id || '')
        setFAccount(tx.raw.account_id || '')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!fDesc || !fAmount || !fAccount) {
            toast.error('Preencha os campos obrigatórios')
            return
        }
        setSaving(true)
        const payload = {
            description: fDesc,
            amount: parseFloat(fAmount),
            type: fType,
            date: fDate,
            account_id: fAccount,
            category_id: fCategory || null
        }
        const { error } = editingTx
            ? await updateTransaction(editingTx.id, payload)
            : await addTransaction(payload)
        setSaving(false)
        if (error) {
            toast.error(error)
        } else {
            setShowModal(false)
            resetForm()
            toast.success(editingTx ? 'Atualizado!' : 'Criado!')
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await deleteTransaction(id)
        setShowDeleteConfirm(null)
        if (error) toast.error(error)
        else toast.success('Excluído!')
    }

    const handleExportCSV = () => {
        const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor']
        const rows = filtered.map(tx => [tx.date, tx.name, tx.type, tx.category, fmtPlain(tx.amount)])
        downloadCSV('transacoes', headers, rows)
        setShowExportMenu(false)
    }

    /* ── Compact tokens ── */
    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }
    const compactInput: React.CSSProperties = { ...inputStyle, padding: '10px 14px', fontSize: 13 }
    const selectStyle: React.CSSProperties = { ...compactInput, appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'none', cursor: 'pointer' }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Transações</h1>
                    <p style={{ color: C.textMuted, fontSize: 13 }}>
                        {loading ? 'Carregando...' : `${filtered.length} movimentações encontradas`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} style={compactBtnOut} aria-label="Menu de exportação">
                            <Download size={14} /> Exportar
                        </button>
                        {showExportMenu && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 100, minWidth: 130, overflow: 'hidden' }}>
                                <button onClick={handleExportCSV} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: C.text, textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>
                                    CSV
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={openCreate} style={compactBtn} aria-label="Nova transação"><Plus size={14} /> Nova</button>
                </div>
            </div>

            {/* ── Summary (Skeleton ou Real) ── */}
            {loading ? (
                <SkeletonSummary />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div style={{ ...compactCard, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Receitas</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: C.emerald, lineHeight: 1.2 }}>{fmt(totalIn)}</p>
                    </div>
                    <div style={{ ...compactCard, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Despesas</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: C.red, lineHeight: 1.2 }}>{fmt(totalOut)}</p>
                    </div>
                    <div style={{ ...compactCard, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Saldo</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{fmt(totalIn - totalOut)}</p>
                    </div>
                </div>
            )}

            {/* ── Filters ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320, minWidth: 0 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar..."
                        aria-label="Pesquisar transações"
                        style={{ ...compactInput, paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['all', 'in', 'out'] as const).map(f => (
                        <button key={f} onClick={() => setFilterType(f)}
                            style={filterType === f ? { ...compactBtn, whiteSpace: 'nowrap' } : { ...compactBtnOut, whiteSpace: 'nowrap' }}
                            aria-label={`Filtrar: ${f === 'all' ? 'Todos' : f === 'in' ? 'Receitas' : 'Despesas'}`}
                            aria-pressed={filterType === f}
                        >
                            {f === 'all' ? 'Todos' : f === 'in' ? 'Receitas' : 'Despesas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List (Skeleton, Empty ou Real) ── */}
            {loading ? (
                <SkeletonTransactionList count={6} />
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px' }} aria-live="polite">
                    <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>Nenhuma transação encontrada</p>
                    <button onClick={openCreate} style={compactBtn}><Plus size={14} /> Criar primeira</button>
                </div>
            ) : (
                <div aria-live="polite">
                    {sortedDates.map(date => (
                        <div key={date} style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {formatDateBR(date)}
                            </p>
                            {grouped[date].map(tx => (
                                <div key={tx.id} style={{ ...compactCard, padding: '10px 12px', display: 'flex', alignItems: 'center', marginBottom: 6, gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                        {tx.categoryIcon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openEdit(tx)}>
                                        <p style={{ fontWeight: 600, color: C.text, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</p>
                                        <p style={{ fontSize: 11, color: C.textMuted }}>{tx.category} • {tx.account}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: tx.type === 'in' ? C.emerald : C.red }}>
                                            {tx.type === 'in' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                                        </p>
                                        <button
                                            onClick={() => setShowDeleteConfirm(tx.id)}
                                            aria-label={`Excluir transação ${tx.name}`}
                                            style={{ color: C.red, background: 'none', border: 'none', padding: 4, cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 340, padding: 20, textAlign: 'center' }}
                            role="alertdialog"
                            aria-labelledby="delete-title"
                            aria-describedby="delete-desc"
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Trash2 size={22} style={{ color: C.red }} />
                            </div>
                            <h3 id="delete-title" style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Excluir transação?</h3>
                            <p id="delete-desc" style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>Esta ação não pode ser desfeita.</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowDeleteConfirm(null)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                <button onClick={() => handleDelete(showDeleteConfirm)} style={{ ...compactBtn, flex: 1, background: C.red, border: 'none' }}>Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create/Edit Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 420, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}
                            role="dialog"
                            aria-labelledby="modal-title"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h2 id="modal-title" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                                    {editingTx ? 'Editar' : 'Nova'} Transação
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }} aria-label="Fechar modal">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Descrição */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Descrição *</label>
                                <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Ex: Salário, Mercado..." style={compactInput} />
                            </div>

                            {/* Valor + Data */}
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Valor *</label>
                                    <input type="number" step="0.01" min="0" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0,00" style={compactInput} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Data</label>
                                    <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={compactInput} />
                                </div>
                            </div>

                            {/* Tipo + Conta */}
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Tipo</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={fType} onChange={e => setFType(e.target.value as 'income' | 'expense')} style={selectStyle}>
                                            <option value="income">Receita</option>
                                            <option value="expense">Despesa</option>
                                        </select>
                                        <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Conta *</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={fAccount} onChange={e => setFAccount(e.target.value)} style={selectStyle}>
                                            <option value="">Selecione...</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                        <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted }} />
                                    </div>
                                </div>
                            </div>

                            {/* Categoria */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Categoria</label>
                                <div style={{ position: 'relative' }}>
                                    <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={selectStyle}>
                                        <option value="">Sem Categoria</option>
                                        {categories?.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowModal(false)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ ...compactBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ── Page export with ErrorBoundary ── */
export default function TransactionsPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro nas Transações" fallbackDescription="Não foi possível carregar suas transações. Tente novamente.">
            <TransactionsContent />
        </ErrorBoundary>
    )
}
