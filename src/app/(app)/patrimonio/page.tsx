'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, X, Loader2, Trash2, Edit3, TrendingUp, TrendingDown,
    Building2, Car, Coins, Bitcoin, Landmark, Package, ChevronDown,
    Home, CreditCard, GraduationCap, HandCoins, PiggyBank,
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { toast } from 'sonner'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import GoldText from '@/components/GoldText'
import type { Asset, Liability } from '@/types/database'
import { useApp } from '@/contexts/AppContext'
import { getThemeColors } from '@/lib/themeColors'

/* ── Icon Maps ── */
const ASSET_TYPES: Record<string, { label: string; icon: typeof Building2; color: string }> = {
    property: { label: 'Imóvel', icon: Home, color: '#8B5CF6' },
    vehicle: { label: 'Veículo', icon: Car, color: '#3B82F6' },
    investment: { label: 'Investimento', icon: TrendingUp, color: '#10B981' },
    crypto: { label: 'Criptomoeda', icon: Bitcoin, color: '#F59E0B' },
    stock: { label: 'Ações', icon: Coins, color: '#06B6D4' },
    fixed_income: { label: 'Renda Fixa', icon: Landmark, color: '#EC4899' },
    other: { label: 'Outro', icon: Package, color: '#6B7280' },
}

const LIABILITY_TYPES: Record<string, { label: string; icon: typeof CreditCard; color: string }> = {
    mortgage: { label: 'Financiamento Imóvel', icon: Home, color: '#8B5CF6' },
    car_loan: { label: 'Financiamento Veículo', icon: Car, color: '#3B82F6' },
    credit_card: { label: 'Cartão de Crédito', icon: CreditCard, color: '#EF4444' },
    personal_loan: { label: 'Empréstimo Pessoal', icon: HandCoins, color: '#F59E0B' },
    student_loan: { label: 'Financiamento Estudantil', icon: GraduationCap, color: '#06B6D4' },
    other: { label: 'Outro', icon: Package, color: '#6B7280' },
}

type ModalMode = null | 'add_asset' | 'edit_asset' | 'add_liability' | 'edit_liability'

function BalancoContent() {
    const { theme } = useApp()
    const TC = getThemeColors(theme)
    const {
        assets, liabilities, loading,
        fetchAssets, fetchLiabilities,
        addAsset, updateAsset, deleteAsset,
        addLiability, updateLiability, deleteLiability,
    } = useFinanceStore()

    const [tab, setTab] = useState<'overview' | 'assets' | 'liabilities'>('overview')
    const [modal, setModal] = useState<ModalMode>(null)
    const [saving, setSaving] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    // Asset form
    const [aName, setAName] = useState('')
    const [aType, setAType] = useState<Asset['type']>('property')
    const [aValue, setAValue] = useState('')
    const [aDate, setADate] = useState('')
    const [aNotes, setANotes] = useState('')

    // Liability form
    const [lName, setLName] = useState('')
    const [lType, setLType] = useState<Liability['type']>('personal_loan')
    const [lTotal, setLTotal] = useState('')
    const [lRemaining, setLRemaining] = useState('')
    const [lMonthly, setLMonthly] = useState('')
    const [lRate, setLRate] = useState('')
    const [lDue, setLDue] = useState('')
    const [lNotes, setLNotes] = useState('')

    useEffect(() => {
        fetchAssets()
        fetchLiabilities()
    }, [fetchAssets, fetchLiabilities])

    // ── Computed ──
    const totalAssets = useMemo(() => assets.reduce((s, a) => s + Number(a.estimated_value), 0), [assets])
    const totalLiabilities = useMemo(() => liabilities.reduce((s, l) => s + Number(l.remaining_amount), 0), [liabilities])
    const netWorth = totalAssets - totalLiabilities
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0

    const assetsByType = useMemo(() => {
        const map: Record<string, { items: Asset[]; total: number }> = {}
        assets.forEach(a => {
            if (!map[a.type]) map[a.type] = { items: [], total: 0 }
            map[a.type].items.push(a)
            map[a.type].total += Number(a.estimated_value)
        })
        return map
    }, [assets])

    // ── Form helpers ──
    const resetAssetForm = () => { setAName(''); setAType('property'); setAValue(''); setADate(''); setANotes(''); setEditId(null) }
    const resetLiabilityForm = () => { setLName(''); setLType('personal_loan'); setLTotal(''); setLRemaining(''); setLMonthly(''); setLRate(''); setLDue(''); setLNotes(''); setEditId(null) }

    const openEditAsset = (a: Asset) => {
        setEditId(a.id); setAName(a.name); setAType(a.type)
        setAValue(String(a.estimated_value)); setADate(a.acquisition_date ?? '')
        setANotes(a.notes ?? ''); setModal('edit_asset')
    }

    const openEditLiability = (l: Liability) => {
        setEditId(l.id); setLName(l.name); setLType(l.type)
        setLTotal(String(l.total_amount)); setLRemaining(String(l.remaining_amount))
        setLMonthly(l.monthly_payment ? String(l.monthly_payment) : '')
        setLRate(l.interest_rate ? String(l.interest_rate) : '')
        setLDue(l.due_date ?? ''); setLNotes(l.notes ?? ''); setModal('edit_liability')
    }

    // ── Save handlers ──
    const handleSaveAsset = async () => {
        if (!aName || !aValue) { toast.error('Preencha nome e valor'); return }
        setSaving(true)
        const payload = {
            name: aName, type: aType, estimated_value: parseFloat(aValue),
            acquisition_date: aDate || null, notes: aNotes || null,
        }
        const { error } = modal === 'edit_asset' && editId
            ? await updateAsset(editId, payload) : await addAsset(payload)
        setSaving(false)
        if (error) toast.error(error)
        else { setModal(null); resetAssetForm(); toast.success(modal === 'edit_asset' ? 'Atualizado!' : 'Ativo adicionado!') }
    }

    const handleSaveLiability = async () => {
        if (!lName || !lRemaining) { toast.error('Preencha nome e valor restante'); return }
        setSaving(true)
        const payload = {
            name: lName, type: lType,
            total_amount: parseFloat(lTotal) || parseFloat(lRemaining),
            remaining_amount: parseFloat(lRemaining),
            monthly_payment: lMonthly ? parseFloat(lMonthly) : null,
            interest_rate: lRate ? parseFloat(lRate) : null,
            due_date: lDue || null, notes: lNotes || null,
        }
        const { error } = modal === 'edit_liability' && editId
            ? await updateLiability(editId, payload) : await addLiability(payload)
        setSaving(false)
        if (error) toast.error(error)
        else { setModal(null); resetLiabilityForm(); toast.success(modal === 'edit_liability' ? 'Atualizado!' : 'Passivo adicionado!') }
    }

    const handleDeleteAsset = async (id: string) => {
        if (!confirm('Excluir este ativo?')) return
        const { error } = await deleteAsset(id)
        if (error) toast.error(error); else toast.success('Removido!')
    }

    const handleDeleteLiability = async (id: string) => {
        if (!confirm('Excluir este passivo?')) return
        const { error } = await deleteLiability(id)
        if (error) toast.error(error); else toast.success('Removido!')
    }

    // ── Styles ──
    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }
    const compactInput: React.CSSProperties = { ...inputStyle, padding: '10px 14px', fontSize: 13 }
    const selectStyle: React.CSSProperties = { ...compactInput, appearance: 'none' as const, cursor: 'pointer' }
    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400,
        border: 'none', cursor: 'pointer',
        background: active ? 'rgba(201,168,88,0.1)' : 'none',
        color: active ? TC.gold : TC.textMuted,
    })

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text }}>Balanço Patrimonial</h1>
                    <p style={{ color: TC.textMuted, fontSize: 13 }}>Gerencie seus ativos e passivos</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { resetAssetForm(); setModal('add_asset') }} style={compactBtn}>
                        <Plus size={14} /> Ativo
                    </button>
                    <button onClick={() => { resetLiabilityForm(); setModal('add_liability') }} style={compactBtnOut}>
                        <Plus size={14} /> Passivo
                    </button>
                </div>
            </div>

            {/* Hero Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ ...cardHlStyle, padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 4 }}>Patrimônio Líquido</p>
                    <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
                        <GoldText>{fmt(netWorth)}</GoldText>
                    </p>
                </motion.div>
                <div style={{ ...compactCard, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 2 }}>Total Ativos</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: TC.emerald, lineHeight: 1.2 }}>{fmt(totalAssets)}</p>
                    <p style={{ fontSize: 10, color: TC.textMuted }}>{assets.length} itens</p>
                </div>
                <div style={{ ...compactCard, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 2 }}>Total Passivos</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: TC.red, lineHeight: 1.2 }}>{fmt(totalLiabilities)}</p>
                    <p style={{ fontSize: 10, color: TC.textMuted }}>{liabilities.length} itens</p>
                </div>
                <div style={{ ...compactCard, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 2 }}>Endividamento</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: debtRatio <= 30 ? TC.emerald : debtRatio <= 60 ? TC.yellow : TC.red, lineHeight: 1.2 }}>
                        {debtRatio.toFixed(1)}%
                    </p>
                    <p style={{ fontSize: 10, color: TC.textMuted }}>{debtRatio <= 30 ? 'Saudável' : debtRatio <= 60 ? 'Atenção' : 'Crítico'}</p>
                </div>
            </div>

            {/* Composition Bar */}
            {totalAssets > 0 && (
                <div style={{ ...compactCard, padding: '14px 16px', marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 8 }}>Composição de Ativos</p>
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                        {Object.entries(assetsByType).map(([type, data]) => (
                            <div key={type} style={{
                                width: `${(data.total / totalAssets) * 100}%`, height: '100%',
                                backgroundColor: ASSET_TYPES[type]?.color ?? '#6B7280',
                            }} title={`${ASSET_TYPES[type]?.label}: ${((data.total / totalAssets) * 100).toFixed(1)}%`} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {Object.entries(assetsByType).map(([type, data]) => (
                            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: ASSET_TYPES[type]?.color ?? '#6B7280' }} />
                                <span style={{ fontSize: 10, color: TC.textMuted }}>{ASSET_TYPES[type]?.label ?? type}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: TC.text }}>{((data.total / totalAssets) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, borderRadius: 10, backgroundColor: TC.secondary }}>
                <button onClick={() => setTab('overview')} style={tabStyle(tab === 'overview')}>Visão Geral</button>
                <button onClick={() => setTab('assets')} style={tabStyle(tab === 'assets')}>Ativos ({assets.length})</button>
                <button onClick={() => setTab('liabilities')} style={tabStyle(tab === 'liabilities')}>Passivos ({liabilities.length})</button>
            </div>

            {/* TAB: Overview */}
            {tab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                    {/* Ativos resumo */}
                    <div style={{ ...compactCard, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.emerald, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <TrendingUp size={16} /> Ativos
                            </h3>
                            <span style={{ fontSize: 16, fontWeight: 700, color: TC.emerald }}>{fmt(totalAssets)}</span>
                        </div>
                        {assets.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: 20, color: TC.textMuted, fontSize: 13 }}>Nenhum ativo cadastrado</p>
                        ) : (
                            assets.slice(0, 5).map(a => {
                                const cfg = ASSET_TYPES[a.type] ?? ASSET_TYPES.other
                                const Icon = cfg.icon
                                return (
                                    <div key={a.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                                        backgroundColor: TC.secondary,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Icon size={14} style={{ color: cfg.color }} />
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 500, color: TC.text }}>{a.name}</p>
                                                <p style={{ fontSize: 10, color: TC.textMuted }}>{cfg.label}</p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: TC.text }}>{fmt(Number(a.estimated_value))}</span>
                                    </div>
                                )
                            })
                        )}
                        {assets.length > 5 && (
                            <button onClick={() => setTab('assets')} style={{ ...compactBtnOut, width: '100%', marginTop: 8, fontSize: 11 }}>
                                Ver todos ({assets.length})
                            </button>
                        )}
                    </div>

                    {/* Passivos resumo */}
                    <div style={{ ...compactCard, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.red, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <TrendingDown size={16} /> Passivos
                            </h3>
                            <span style={{ fontSize: 16, fontWeight: 700, color: TC.red }}>{fmt(totalLiabilities)}</span>
                        </div>
                        {liabilities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <p style={{ fontSize: 28, marginBottom: 4 }}>🎉</p>
                                <p style={{ color: TC.emerald, fontSize: 13, fontWeight: 600 }}>Sem dívidas!</p>
                            </div>
                        ) : (
                            liabilities.slice(0, 5).map(l => {
                                const cfg = LIABILITY_TYPES[l.type] ?? LIABILITY_TYPES.other
                                const Icon = cfg.icon
                                const pctPaid = Number(l.total_amount) > 0
                                    ? ((Number(l.total_amount) - Number(l.remaining_amount)) / Number(l.total_amount)) * 100 : 0
                                return (
                                    <div key={l.id} style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 4, backgroundColor: TC.secondary }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Icon size={14} style={{ color: cfg.color }} />
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: TC.text }}>{l.name}</p>
                                                    <p style={{ fontSize: 10, color: TC.textMuted }}>
                                                        {cfg.label}{l.monthly_payment ? ` · ${fmt(Number(l.monthly_payment))}/mês` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: TC.red }}>{fmt(Number(l.remaining_amount))}</span>
                                        </div>
                                        <div style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(248,113,113,0.1)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pctPaid}%`, borderRadius: 2, backgroundColor: TC.emerald }} />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        {liabilities.length > 5 && (
                            <button onClick={() => setTab('liabilities')} style={{ ...compactBtnOut, width: '100%', marginTop: 8, fontSize: 11 }}>
                                Ver todos ({liabilities.length})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: Assets */}
            {tab === 'assets' && (
                <div>
                    {assets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                            <p style={{ fontSize: 40, marginBottom: 12 }}>🏠</p>
                            <p style={{ color: TC.textMuted, fontSize: 14, marginBottom: 16 }}>Nenhum ativo cadastrado</p>
                            <button onClick={() => { resetAssetForm(); setModal('add_asset') }} style={compactBtn}><Plus size={14} /> Adicionar ativo</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                            {assets.map(a => {
                                const cfg = ASSET_TYPES[a.type] ?? ASSET_TYPES.other
                                const Icon = cfg.icon
                                return (
                                    <motion.div key={a.id} layout style={{
                                        ...compactCard, padding: '14px 16px', borderLeft: `3px solid ${cfg.color}`,
                                        cursor: 'pointer', position: 'relative',
                                    }} onClick={() => openEditAsset(a)}>
                                        <button onClick={e => { e.stopPropagation(); handleDeleteAsset(a.id) }}
                                            style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: TC.textMuted, cursor: 'pointer', padding: 4, opacity: 0.4 }}>
                                            <Trash2 size={12} />
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${cfg.color}15` }}>
                                                <Icon size={16} style={{ color: cfg.color }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>{a.name}</p>
                                                <p style={{ fontSize: 11, color: TC.textMuted }}>{cfg.label}</p>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 20, fontWeight: 700, color: TC.emerald }}>{fmt(Number(a.estimated_value))}</p>
                                        {a.acquisition_date && (
                                            <p style={{ fontSize: 10, color: TC.textMuted, marginTop: 4 }}>
                                                Adquirido em {new Date(a.acquisition_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                            </p>
                                        )}
                                        {a.notes && <p style={{ fontSize: 10, color: TC.textMuted, marginTop: 2 }}>{a.notes}</p>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Liabilities */}
            {tab === 'liabilities' && (
                <div>
                    {liabilities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                            <p style={{ fontSize: 40, marginBottom: 12 }}>🎉</p>
                            <p style={{ color: TC.emerald, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Sem dívidas!</p>
                            <p style={{ color: TC.textMuted, fontSize: 13, marginBottom: 16 }}>Parabéns, você não tem passivos cadastrados.</p>
                            <button onClick={() => { resetLiabilityForm(); setModal('add_liability') }} style={compactBtnOut}><Plus size={14} /> Adicionar passivo</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {liabilities.map(l => {
                                const cfg = LIABILITY_TYPES[l.type] ?? LIABILITY_TYPES.other
                                const Icon = cfg.icon
                                const pctPaid = Number(l.total_amount) > 0
                                    ? ((Number(l.total_amount) - Number(l.remaining_amount)) / Number(l.total_amount)) * 100 : 0
                                return (
                                    <motion.div key={l.id} layout style={{
                                        ...compactCard, padding: '14px 16px', borderLeft: `3px solid ${cfg.color}`,
                                        cursor: 'pointer', position: 'relative',
                                    }} onClick={() => openEditLiability(l)}>
                                        <button onClick={e => { e.stopPropagation(); handleDeleteLiability(l.id) }}
                                            style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: TC.textMuted, cursor: 'pointer', padding: 4, opacity: 0.4 }}>
                                            <Trash2 size={12} />
                                        </button>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingRight: 24 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Icon size={16} style={{ color: cfg.color }} />
                                                <div>
                                                    <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>{l.name}</p>
                                                    <p style={{ fontSize: 11, color: TC.textMuted }}>
                                                        {cfg.label}
                                                        {l.interest_rate ? ` · ${Number(l.interest_rate)}% a.m.` : ''}
                                                        {l.monthly_payment ? ` · ${fmt(Number(l.monthly_payment))}/mês` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: 16, fontWeight: 700, color: TC.red }}>{fmt(Number(l.remaining_amount))}</p>
                                                <p style={{ fontSize: 10, color: TC.textMuted }}>de {fmt(Number(l.total_amount))}</p>
                                            </div>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 3, backgroundColor: TC.secondary, overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pctPaid}%` }}
                                                transition={{ duration: 0.6 }}
                                                style={{ height: '100%', borderRadius: 3, backgroundColor: TC.emerald }} />
                                        </div>
                                        <p style={{ fontSize: 10, color: TC.textMuted, marginTop: 4 }}>{pctPaid.toFixed(0)}% quitado</p>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ MODALS ═══════ */}
            <AnimatePresence>
                {modal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setModal(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 420, padding: 20, maxHeight: '90vh', overflowY: 'auto' }} role="dialog">
                            {/* ── ASSET MODAL ── */}
                            {(modal === 'add_asset' || modal === 'edit_asset') && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <h2 style={{ fontSize: 16, fontWeight: 700, color: TC.text }}>
                                            {modal === 'edit_asset' ? 'Editar' : 'Novo'} Ativo
                                        </h2>
                                        <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: TC.textMuted, cursor: 'pointer' }}><X size={18} /></button>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Tipo</label>
                                        <div style={{ position: 'relative' }}>
                                            <select value={aType} onChange={e => setAType(e.target.value as Asset['type'])} style={selectStyle}>
                                                {Object.entries(ASSET_TYPES).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: TC.textMuted }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Nome *</label>
                                        <input value={aName} onChange={e => setAName(e.target.value)} placeholder="Ex: Apartamento SP" style={compactInput} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Valor Estimado (R$) *</label>
                                            <input type="number" step="0.01" min="0" value={aValue} onChange={e => setAValue(e.target.value)} style={compactInput} placeholder="0,00" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Data Aquisição</label>
                                            <input type="date" value={aDate} onChange={e => setADate(e.target.value)} style={compactInput} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Notas</label>
                                        <input value={aNotes} onChange={e => setANotes(e.target.value)} placeholder="Observações..." style={compactInput} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setModal(null)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                        <button onClick={handleSaveAsset} disabled={saving} style={{ ...compactBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                                        </button>
                                    </div>
                                </>
                            )}
                            {/* ── LIABILITY MODAL ── */}
                            {(modal === 'add_liability' || modal === 'edit_liability') && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <h2 style={{ fontSize: 16, fontWeight: 700, color: TC.text }}>
                                            {modal === 'edit_liability' ? 'Editar' : 'Novo'} Passivo
                                        </h2>
                                        <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: TC.textMuted, cursor: 'pointer' }}><X size={18} /></button>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Tipo</label>
                                        <div style={{ position: 'relative' }}>
                                            <select value={lType} onChange={e => setLType(e.target.value as Liability['type'])} style={selectStyle}>
                                                {Object.entries(LIABILITY_TYPES).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: TC.textMuted }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Nome *</label>
                                        <input value={lName} onChange={e => setLName(e.target.value)} placeholder="Ex: Financiamento Carro" style={compactInput} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Valor Total</label>
                                            <input type="number" step="0.01" min="0" value={lTotal} onChange={e => setLTotal(e.target.value)} style={compactInput} placeholder="0,00" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Saldo Devedor *</label>
                                            <input type="number" step="0.01" min="0" value={lRemaining} onChange={e => setLRemaining(e.target.value)} style={compactInput} placeholder="0,00" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Parcela Mensal</label>
                                            <input type="number" step="0.01" min="0" value={lMonthly} onChange={e => setLMonthly(e.target.value)} style={compactInput} placeholder="0,00" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Juros (% a.m.)</label>
                                            <input type="number" step="0.01" min="0" value={lRate} onChange={e => setLRate(e.target.value)} style={compactInput} placeholder="0,00" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Vencimento</label>
                                            <input type="date" value={lDue} onChange={e => setLDue(e.target.value)} style={compactInput} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 11, color: TC.textMuted, display: 'block', marginBottom: 4 }}>Notas</label>
                                            <input value={lNotes} onChange={e => setLNotes(e.target.value)} placeholder="..." style={compactInput} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setModal(null)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                        <button onClick={handleSaveLiability} disabled={saving} style={{ ...compactBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function BalancoPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro no Balanço Patrimonial">
            <BalancoContent />
        </ErrorBoundary>
    )
}
