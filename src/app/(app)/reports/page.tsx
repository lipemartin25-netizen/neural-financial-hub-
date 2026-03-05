'use client'
import { motion } from 'framer-motion'
import {
    BarChart3, PieChart, TrendingUp, TrendingDown, Download,
    RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, FileText,
    FileSpreadsheet, Calendar, ChevronLeft, ChevronRight, Filter,
    Sparkles, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { useApp } from '@/contexts/AppContext'
import { getThemeColors } from '@/lib/themeColors'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import GoldText from '@/components/GoldText'
import { downloadCSV, downloadPDFReport, formatDateBR, fmtPlain } from '@/lib/export'

type MonthlyRow = { month: string; income: number; expenses: number }
type CategoryRow = { name: string; icon: string; total: number }
type ReportData = {
    monthly: MonthlyRow[]
    categories: CategoryRow[]
}

/* ── Helpers ── */
function monthLabel(ym: string): string {
    const [y, m] = ym.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

function fullMonthLabel(ym: string): string {
    const d = new Date(`${ym}-15T12:00:00`)
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function ReportsContent() {
    const { theme } = useApp()
    const TC = getThemeColors(theme)
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [hoveredBar, setHoveredBar] = useState<number | null>(null)
    const [showExportMenu, setShowExportMenu] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/reports')
            if (!res.ok) throw new Error()
            const json = await res.json()
            setData(json)
        } catch {
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Computed ──
    const currentMonth = useMemo(() => {
        if (!data?.monthly?.length) return null
        return data.monthly[data.monthly.length - 1]
    }, [data])

    const prevMonth = useMemo(() => {
        if (!data?.monthly || data.monthly.length < 2) return null
        return data.monthly[data.monthly.length - 2]
    }, [data])

    const savingsRate = useMemo(() => {
        if (!currentMonth || currentMonth.income === 0) return 0
        return ((currentMonth.income - currentMonth.expenses) / currentMonth.income) * 100
    }, [currentMonth])

    const prevSavingsRate = useMemo(() => {
        if (!prevMonth || prevMonth.income === 0) return 0
        return ((prevMonth.income - prevMonth.expenses) / prevMonth.income) * 100
    }, [prevMonth])

    const expenseChange = useMemo(() => {
        if (!currentMonth || !prevMonth || prevMonth.expenses === 0) return 0
        return ((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
    }, [currentMonth, prevMonth])

    const incomeChange = useMemo(() => {
        if (!currentMonth || !prevMonth || prevMonth.income === 0) return 0
        return ((currentMonth.income - prevMonth.income) / prevMonth.income) * 100
    }, [currentMonth, prevMonth])

    const totalCategories = useMemo(() => {
        if (!data?.categories) return 0
        return data.categories.reduce((s, c) => s + c.total, 0)
    }, [data])

    const maxMonthlyValue = useMemo(() => {
        if (!data?.monthly) return 1
        return Math.max(...data.monthly.map(m => Math.max(m.income, m.expenses)), 1)
    }, [data])

    // ── 12-month averages ──
    const avgIncome = useMemo(() => {
        if (!data?.monthly?.length) return 0
        return data.monthly.reduce((s, m) => s + m.income, 0) / data.monthly.length
    }, [data])

    const avgExpense = useMemo(() => {
        if (!data?.monthly?.length) return 0
        return data.monthly.reduce((s, m) => s + m.expenses, 0) / data.monthly.length
    }, [data])

    const avgSavings = avgIncome - avgExpense

    // ── Savings rate trend (últimos 6 meses) ──
    const savingsTrend = useMemo(() => {
        if (!data?.monthly) return []
        return data.monthly.slice(-6).map(m => ({
            month: monthLabel(m.month),
            rate: m.income > 0 ? ((m.income - m.expenses) / m.income) * 100 : 0,
            balance: m.income - m.expenses,
        }))
    }, [data])

    // ── Export Handlers ──
    const handleExportCSV = useCallback(() => {
        if (!data) return
        setShowExportMenu(false)
        // Fluxo mensal
        const headers = ['Mês', 'Receitas', 'Despesas', 'Saldo', 'Taxa Poupança']
        const rows = data.monthly.map(m => [
            fullMonthLabel(m.month),
            fmtPlain(m.income),
            fmtPlain(m.expenses),
            fmtPlain(m.income - m.expenses),
            `${m.income > 0 ? ((m.income - m.expenses) / m.income * 100).toFixed(1) : '0'}%`,
        ])
        downloadCSV('relatorio-financeiro', headers, rows)
    }, [data])

    const handleExportCategoriesCSV = useCallback(() => {
        if (!data) return
        setShowExportMenu(false)
        const headers = ['Categoria', 'Valor', '% do Total']
        const rows = data.categories.map(c => [
            c.name,
            fmtPlain(c.total),
            `${totalCategories > 0 ? ((c.total / totalCategories) * 100).toFixed(1) : '0'}%`,
        ])
        downloadCSV('gastos-por-categoria', headers, rows)
    }, [data, totalCategories])

    const handleExportPDF = useCallback(() => {
        if (!data) return
        setShowExportMenu(false)
        const sections = [
            {
                heading: 'Fluxo de Caixa Mensal',
                rows: [
                    ['Mês', 'Receitas (R$)', 'Despesas (R$)', 'Saldo (R$)', 'Poupança (%)'],
                    ...data.monthly.map(m => [
                        fullMonthLabel(m.month),
                        fmtPlain(m.income),
                        fmtPlain(m.expenses),
                        fmtPlain(m.income - m.expenses),
                        `${m.income > 0 ? ((m.income - m.expenses) / m.income * 100).toFixed(1) : '0'}%`,
                    ]),
                ],
            },
            {
                heading: 'Gastos por Categoria (Mês Atual)',
                rows: [
                    ['Categoria', 'Valor (R$)', '% do Total'],
                    ...data.categories.map(c => [
                        `${c.icon} ${c.name}`,
                        fmtPlain(c.total),
                        `${totalCategories > 0 ? ((c.total / totalCategories) * 100).toFixed(1) : '0'}%`,
                    ]),
                ],
            },
            {
                heading: 'Resumo',
                rows: [
                    ['Indicador', 'Valor'],
                    ['Receita Média Mensal', `R$ ${fmtPlain(avgIncome)}`],
                    ['Despesa Média Mensal', `R$ ${fmtPlain(avgExpense)}`],
                    ['Economia Média Mensal', `R$ ${fmtPlain(avgSavings)}`],
                    ['Taxa de Poupança Atual', `${savingsRate.toFixed(1)}%`],
                ],
            },
        ]
        downloadPDFReport('Relatório Financeiro — Neural Finance Hub', sections)
    }, [data, totalCategories, avgIncome, avgExpense, avgSavings, savingsRate])

    // ── Styles ──
    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }

    // ── Loading ──
    if (loading) {
        return (
            <div style={{ paddingBottom: NAV_SAFE_AREA }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text, marginBottom: 8 }}>Relatórios</h1>
                <p style={{ fontSize: 13, color: TC.textMuted, marginBottom: 24 }}>Analisando seus dados...</p>
                <div style={{ ...compactCard, padding: 80, display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={32} style={{ color: TC.gold, animation: 'spin 1s linear infinite' }} />
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{ paddingBottom: NAV_SAFE_AREA }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text }}>Relatórios</h1>
                <div style={{ ...compactCard, padding: 40, textAlign: 'center', marginTop: 24 }}>
                    <p style={{ color: TC.textMuted }}>Erro ao carregar relatórios.</p>
                    <button onClick={fetchData} style={{ ...compactBtnOut, marginTop: 16 }}>Tentar novamente</button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text }}>Relatórios Analíticos</h1>
                    <p style={{ color: TC.textMuted, fontSize: 13 }}>
                        {data.monthly.length} meses de histórico
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
                    <button onClick={fetchData} style={compactBtnOut} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowExportMenu(!showExportMenu)} style={compactBtn}>
                        <Download size={14} /> Exportar
                    </button>
                    {/* Export Dropdown */}
                    {showExportMenu && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50,
                                ...compactCard, padding: 8, minWidth: 220,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                            }}>
                            {[
                                { label: 'Fluxo Mensal (CSV)', icon: FileSpreadsheet, fn: handleExportCSV },
                                { label: 'Categorias (CSV)', icon: FileSpreadsheet, fn: handleExportCategoriesCSV },
                                { label: 'Relatório Completo (PDF)', icon: FileText, fn: handleExportPDF },
                            ].map(opt => (
                                <button key={opt.label} onClick={opt.fn}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                        padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                        backgroundColor: 'transparent', color: TC.text, fontSize: 12,
                                        textAlign: 'left', transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = TC.secondary}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <opt.icon size={14} style={{ color: TC.gold, flexShrink: 0 }} />
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Click outside to close export menu */}
            {showExportMenu && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowExportMenu(false)} />
            )}

            {/* ══════ KPI Cards ══════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 16 }}>
                {/* Receita do Mês */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ ...compactCard, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: TC.textMuted }}>Receita (mês)</span>
                        <ArrowUpRight size={14} style={{ color: TC.emerald }} />
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 700, color: TC.emerald }}>{fmt(currentMonth?.income ?? 0)}</p>
                    {incomeChange !== 0 && (
                        <p style={{ fontSize: 10, color: incomeChange >= 0 ? TC.emerald : TC.red, marginTop: 2 }}>
                            {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}% vs anterior
                        </p>
                    )}
                </motion.div>

                {/* Despesa do Mês */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    style={{ ...compactCard, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: TC.textMuted }}>Despesa (mês)</span>
                        <ArrowDownRight size={14} style={{ color: TC.red }} />
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 700, color: TC.red }}>{fmt(currentMonth?.expenses ?? 0)}</p>
                    {expenseChange !== 0 && (
                        <p style={{ fontSize: 10, color: expenseChange <= 0 ? TC.emerald : TC.red, marginTop: 2 }}>
                            {expenseChange <= 0 ? '↓' : '↑'} {Math.abs(expenseChange).toFixed(1)}% vs anterior
                        </p>
                    )}
                </motion.div>

                {/* Saldo */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ ...compactCard, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: TC.textMuted }}>Saldo do Mês</span>
                        {(currentMonth?.income ?? 0) - (currentMonth?.expenses ?? 0) >= 0
                            ? <CheckCircle2 size={14} style={{ color: TC.emerald }} />
                            : <AlertTriangle size={14} style={{ color: TC.red }} />
                        }
                    </div>
                    <p style={{
                        fontSize: 20, fontWeight: 700,
                        color: (currentMonth?.income ?? 0) - (currentMonth?.expenses ?? 0) >= 0 ? TC.emerald : TC.red,
                    }}>
                        {fmt((currentMonth?.income ?? 0) - (currentMonth?.expenses ?? 0))}
                    </p>
                </motion.div>

                {/* Taxa de Poupança */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    style={{ ...compactCard, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: TC.textMuted }}>Poupança</span>
                        <Sparkles size={14} style={{ color: TC.gold }} />
                    </div>
                    <p style={{
                        fontSize: 20, fontWeight: 700,
                        color: savingsRate >= 20 ? TC.emerald : savingsRate > 0 ? TC.gold : TC.red,
                    }}>
                        {savingsRate.toFixed(1)}%
                    </p>
                    <p style={{ fontSize: 10, color: TC.textMuted, marginTop: 2 }}>
                        {savingsRate >= 30 ? 'Excelente!' : savingsRate >= 20 ? 'Bom' : savingsRate > 0 ? 'Pode melhorar' : 'Negativo'}
                    </p>
                </motion.div>
            </div>

            {/* ══════ Médias Anuais ══════ */}
            <div style={{ ...compactCard, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: TC.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                    Médias dos Últimos 12 Meses
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: TC.textMuted }}>Receita Média</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: TC.emerald }}>{fmt(avgIncome)}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: TC.textMuted }}>Despesa Média</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: TC.red }}>{fmt(avgExpense)}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: TC.textMuted }}>Economia Média</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: avgSavings >= 0 ? TC.gold : TC.red }}>{fmt(avgSavings)}</p>
                    </div>
                </div>
            </div>

            {/* ══════ Fluxo de Caixa (Barras) ══════ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ ...compactCard, padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 size={16} style={{ color: TC.gold }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Fluxo de Caixa</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: TC.emerald }} />
                            <span style={{ fontSize: 10, color: TC.textMuted }}>Receitas</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: TC.red }} />
                            <span style={{ fontSize: 10, color: TC.textMuted }}>Despesas</span>
                        </div>
                    </div>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 24, position: 'relative' }}>
                    {data.monthly.map((m, i) => {
                        const incH = (m.income / maxMonthlyValue) * 100
                        const expH = (m.expenses / maxMonthlyValue) * 100
                        const isHovered = hoveredBar === i
                        const balance = m.income - m.expenses
                        return (
                            <div key={m.month} style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                height: '100%', position: 'relative', cursor: 'pointer',
                            }}
                                onMouseEnter={() => setHoveredBar(i)}
                                onMouseLeave={() => setHoveredBar(null)}>
                                {/* Tooltip */}
                                {isHovered && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            position: 'absolute', bottom: '100%', marginBottom: 8, zIndex: 20,
                                            padding: '8px 12px', borderRadius: 8,
                                            backgroundColor: theme === 'light' ? '#fff' : '#1a1d24',
                                            border: `1px solid ${TC.border}`,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            whiteSpace: 'nowrap', fontSize: 11,
                                        }}>
                                        <p style={{ fontWeight: 600, color: TC.text, marginBottom: 4 }}>{fullMonthLabel(m.month)}</p>
                                        <p style={{ color: TC.emerald }}>Receitas: {fmt(m.income)}</p>
                                        <p style={{ color: TC.red }}>Despesas: {fmt(m.expenses)}</p>
                                        <p style={{ color: balance >= 0 ? TC.gold : TC.red, fontWeight: 600, marginTop: 2, borderTop: `1px solid ${TC.border}`, paddingTop: 4 }}>
                                            Saldo: {fmt(balance)}
                                        </p>
                                    </motion.div>
                                )}
                                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${incH}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.03 }}
                                        style={{
                                            width: '38%', background: TC.emerald, borderRadius: '3px 3px 0 0',
                                            opacity: isHovered ? 1 : 0.7, transition: 'opacity 0.15s',
                                            minHeight: m.income > 0 ? 4 : 0,
                                        }}
                                    />
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${expH}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.03 + 0.05 }}
                                        style={{
                                            width: '38%', background: TC.red, borderRadius: '3px 3px 0 0',
                                            opacity: isHovered ? 1 : 0.7, transition: 'opacity 0.15s',
                                            minHeight: m.expenses > 0 ? 4 : 0,
                                        }}
                                    />
                                </div>
                                <span style={{
                                    fontSize: 9, color: isHovered ? TC.gold : TC.textMuted,
                                    fontWeight: isHovered ? 600 : 400, transition: 'all 0.15s',
                                }}>
                                    {monthLabel(m.month)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* ══════ Gastos por Categoria ══════ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ ...compactCard, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PieChart size={16} style={{ color: TC.gold }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Gastos por Categoria</p>
                        </div>
                        <span style={{ fontSize: 11, color: TC.textMuted }}>{fmt(totalCategories)}</span>
                    </div>

                    {data.categories.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: 20, color: TC.textMuted, fontSize: 13 }}>
                            Sem despesas categorizadas
                        </p>
                    ) : (
                        <>
                            {/* Visual bar */}
                            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                                {data.categories.slice(0, 8).map((cat, i) => {
                                    const pct = totalCategories > 0 ? (cat.total / totalCategories) * 100 : 0
                                    const colors = [TC.gold, TC.emerald, TC.red, TC.blue, TC.violet, TC.orange, TC.cyan, TC.pink]
                                    return (
                                        <motion.div key={cat.name}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                                            style={{ height: '100%', backgroundColor: colors[i % colors.length] }}
                                            title={`${cat.name}: ${pct.toFixed(1)}%`}
                                        />
                                    )
                                })}
                            </div>

                            {/* List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {data.categories.map((cat, i) => {
                                    const pct = totalCategories > 0 ? (cat.total / totalCategories) * 100 : 0
                                    const colors = [TC.gold, TC.emerald, TC.red, TC.blue, TC.violet, TC.orange, TC.cyan, TC.pink]
                                    const color = colors[i % colors.length]
                                    return (
                                        <div key={cat.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 14 }}>{cat.icon}</span>
                                                    <span style={{ fontSize: 12, color: TC.text }}>{cat.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: TC.text }}>{fmt(cat.total)}</span>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
                                                        backgroundColor: `${color}15`, color,
                                                    }}>
                                                        {pct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ height: 4, borderRadius: 2, background: TC.secondary, overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.5, delay: 0.3 + i * 0.04 }}
                                                    style={{ height: '100%', borderRadius: 2, background: color }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </motion.div>

                {/* ══════ Tendência de Poupança ══════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Savings Rate Trend */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        style={{ ...compactCard, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <TrendingUp size={16} style={{ color: TC.gold }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Tendência de Economia</p>
                        </div>
                        {savingsTrend.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: 20, color: TC.textMuted, fontSize: 13 }}>Dados insuficientes</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {savingsTrend.map((s, i) => {
                                    const isPositive = s.rate >= 0
                                    const barWidth = Math.min(Math.abs(s.rate), 100)
                                    return (
                                        <div key={s.month}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                <span style={{ fontSize: 11, color: TC.textMuted }}>{s.month}</span>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <span style={{ fontSize: 11, color: TC.textMuted }}>{fmt(s.balance)}</span>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 600,
                                                        color: isPositive ? TC.emerald : TC.red,
                                                    }}>
                                                        {s.rate.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: TC.secondary, overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${barWidth}%` }}
                                                    transition={{ duration: 0.5, delay: 0.4 + i * 0.05 }}
                                                    style={{
                                                        height: '100%', borderRadius: 3,
                                                        background: isPositive
                                                            ? (s.rate >= 20 ? TC.emerald : TC.gold)
                                                            : TC.red,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {/* Referência */}
                        <div style={{
                            marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: TC.secondary,
                            fontSize: 10, color: TC.textMuted, lineHeight: 1.5,
                        }}>
                            📊 <strong>Referência:</strong> Taxa de poupança ideal é entre 20% e 30%.
                            Abaixo de 10% indica risco. Acima de 30% é excelente.
                        </div>
                    </motion.div>

                    {/* Comparativo Mensal */}
                    {currentMonth && prevMonth && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            style={{ ...compactCard, padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Calendar size={16} style={{ color: TC.gold }} />
                                <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Mês Atual vs Anterior</p>
                            </div>
                            {[
                                {
                                    label: 'Receitas',
                                    current: currentMonth.income,
                                    prev: prevMonth.income,
                                    color: TC.emerald,
                                },
                                {
                                    label: 'Despesas',
                                    current: currentMonth.expenses,
                                    prev: prevMonth.expenses,
                                    color: TC.red,
                                    invertGood: true,
                                },
                                {
                                    label: 'Economia',
                                    current: currentMonth.income - currentMonth.expenses,
                                    prev: prevMonth.income - prevMonth.expenses,
                                    color: TC.gold,
                                },
                            ].map(row => {
                                const diff = row.current - row.prev
                                const pct = row.prev !== 0 ? (diff / Math.abs(row.prev)) * 100 : 0
                                const isGood = row.invertGood ? diff <= 0 : diff >= 0
                                return (
                                    <div key={row.label} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: 8, backgroundColor: TC.secondary, marginBottom: 6,
                                    }}>
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 500, color: TC.text }}>{row.label}</p>
                                            <p style={{ fontSize: 10, color: TC.textMuted }}>
                                                {fmt(row.prev)} → {fmt(row.current)}
                                            </p>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                                            borderRadius: 6,
                                            backgroundColor: isGood ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                                        }}>
                                            {isGood
                                                ? <ArrowUpRight size={12} style={{ color: TC.emerald }} />
                                                : <ArrowDownRight size={12} style={{ color: TC.red }} />
                                            }
                                            <span style={{
                                                fontSize: 11, fontWeight: 600,
                                                color: isGood ? TC.emerald : TC.red,
                                            }}>
                                                {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </motion.div>
                    )}
                </div>
            </div>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function ReportsPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro nos Relatórios">
            <ReportsContent />
        </ErrorBoundary>
    )
}
