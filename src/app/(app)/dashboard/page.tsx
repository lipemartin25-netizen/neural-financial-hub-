'use client'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Eye, EyeOff, Sparkles, Bell, Loader2, Shield, PieChart,
  ChevronRight, Calendar, Target, FileText
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import GoldText from '@/components/GoldText'
import { useDashboard } from '@/hooks/useDashboard'
import { CATEGORIES } from '@/lib/constants'
import DashboardCharts from '@/components/DashboardCharts'
import OnboardingGuard from '@/components/OnboardingGuard'
import { PluggyConnectButton } from '@/components/pluggy/PluggyConnectButton'
import { useApp } from '@/contexts/AppContext'
import { getThemeColors } from '@/lib/themeColors'

// Lookup rápido de categorias
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function DashboardContent() {
  const [showValues, setShowValues] = useState(true)
  const router = useRouter()
  const { theme } = useApp()
  const TC = getThemeColors(theme)
  const { data: dashboardData, loading: dashLoading } = useDashboard()

  // ── Novos estados para módulos avançados ──
  const [emergencyData, setEmergencyData] = useState<any>(null)
  const [patrimonyData, setPatrimonyData] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [extraLoading, setExtraLoading] = useState(true)

  const fetchExtraData = useCallback(async () => {
    setExtraLoading(true)
    try {
      const [resEm, resPat, resRep] = await Promise.all([
        fetch('/api/emergency-fund'),
        fetch('/api/patrimony'),
        fetch('/api/reports'),
      ])
      const [em, pat, rep] = await Promise.all([resEm.json(), resPat.json(), resRep.json()])
      setEmergencyData(em.data)
      setPatrimonyData(pat.data)
      setReportData(rep)
    } catch (err) {
      console.error('Error fetching extra dashboard data', err)
    } finally {
      setExtraLoading(false)
    }
  }, [])

  useEffect(() => { fetchExtraData() }, [fetchExtraData])

  const display = (v: number) => showValues ? fmt(v) : '•••••'

  // Summary cards consolidando dados
  const summary = useMemo(() => {
    if (!dashboardData) return []
    return [
      { label: 'Saldo Total', value: dashboardData.totalBalance, icon: Wallet, color: TC.gold, positive: true, href: '/accounts' },
      { label: 'Receitas (mês)', value: dashboardData.monthIncome, icon: ArrowUpRight, color: TC.emerald, positive: true, href: '/transactions' },
      { label: 'Despesas (mês)', value: dashboardData.monthExpense, icon: ArrowDownRight, color: TC.red, positive: false, href: '/transactions' },
      { label: 'Patrimônio Líquido', value: patrimonyData?.netWorth ?? dashboardData.totalBalance + dashboardData.totalInvCurrent, icon: PieChart, color: TC.blue, positive: true, href: '/patrimony' },
    ]
  }, [dashboardData, patrimonyData, TC])

  // Combina alertas convencionais com novos alertas inteligentes
  const allAlerts = useMemo(() => {
    const alerts = [...(dashboardData?.alerts || [])]
    if (emergencyData && emergencyData.status === 'critical') {
      alerts.unshift({ text: 'Reserva de Emergência Crítica!', type: 'danger', href: '/emergency-fund' })
    }
    if (patrimonyData && patrimonyData.debtRatio > 50) {
      alerts.push({ text: 'Endividamento Elevado', type: 'warning', href: '/patrimony' })
    }
    return alerts
  }, [dashboardData, emergencyData, patrimonyData])

  // ── Widget Styles ──
  const widgetCard: React.CSSProperties = { ...cardStyle, padding: 20, cursor: 'pointer' }

  return (
    <div style={{ paddingBottom: NAV_SAFE_AREA }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: TC.text }}>Bem-vindo de volta 👋</h1>
          <p style={{ fontSize: 14, color: TC.textMuted, marginTop: 4 }}>
            {dashLoading ? 'Carregando seus dados...' : 'Aqui está o resumo inteligente das suas finanças'}
          </p>
        </motion.div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            {showValues ? 'Ocultar' : 'Mostrar'}
          </button>
          <button onClick={() => router.push('/transactions')} style={btnGoldStyle}>
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Smart Alerts */}
      {allAlerts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {allAlerts.map((a, i) => (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} onClick={() => router.push(a.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
                background: 'none',
                border: `1px solid ${a.type === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                backgroundColor: a.type === 'danger' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
                color: a.type === 'danger' ? TC.red : TC.yellow,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Bell size={12} /> {a.text}
            </motion.button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {dashLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} style={{ ...cardStyle, padding: 20, height: 90 }}>
              <div style={{ height: 12, width: '60%', borderRadius: 6, backgroundColor: TC.secondary, marginBottom: 12 }} />
              <div style={{ height: 24, width: '40%', borderRadius: 6, backgroundColor: TC.secondary }} />
            </div>
          ))
        ) : summary.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={() => router.push(s.href)}
            style={{ ...cardStyle, padding: 20, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = TC.gold)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,88,0.06)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: TC.textMuted }}>{s.label}</span>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.positive ? TC.emerald : TC.red }}>
              {s.label === 'Despesas (mês)' && s.value > 0 ? '-' : ''}
              {display(s.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: 24 }}>
        <DashboardCharts />
      </div>

      {/* Main Grid: Modules & Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[1.8fr_1.2fr]">

        {/* Left Column: Recent & Modules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Advanced Widgets Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {/* Emergency Fund Widget */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => router.push('/emergency-fund')}
              style={widgetCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} style={{ color: TC.gold }} />
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Reserva de Emergência</h3>
                </div>
                <ChevronRight size={14} style={{ color: TC.textMuted }} />
              </div>
              {extraLoading ? <Loader2 size={24} className="animate-spin" style={{ color: TC.gold, margin: '20px auto' }} /> : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ position: 'relative', width: 60, height: 60 }}>
                    <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="30" cy="30" r="26" fill="none" stroke={TC.secondary} strokeWidth="6" />
                      <circle cx="30" cy="30" r="26" fill="none" stroke={TC.gold} strokeWidth="6"
                        strokeDasharray={163} strokeDashoffset={163 - (163 * (emergencyData?.progress || 0)) / 100}
                        strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', items: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TC.gold, textAlign: 'center', alignSelf: 'center' }}>
                        {Math.round(emergencyData?.progress || 0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: TC.text }}>{display(emergencyData?.currentReserve || 0)}</p>
                    <p style={{ fontSize: 11, color: TC.textMuted }}>
                      Cobre <strong style={{ color: TC.text }}>{emergencyData?.monthsCovered || 0} meses</strong> de gastos
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Net Worth Widget */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={() => router.push('/patrimony')}
              style={widgetCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart size={16} style={{ color: TC.gold }} />
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Patrimônio Líquido</h3>
                </div>
                <div style={{ display: 'flex', items: 'center', gap: 4 }}>
                  {patrimonyData && patrimonyData.changePct !== 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: patrimonyData.changePct >= 0 ? TC.emerald : TC.red }}>
                      {patrimonyData.changePct >= 0 ? '+' : ''}{patrimonyData.changePct}%
                    </span>
                  )}
                  <ChevronRight size={14} style={{ color: TC.textMuted }} />
                </div>
              </div>
              {extraLoading ? <Loader2 size={24} className="animate-spin" style={{ color: TC.gold, margin: '20px auto' }} /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 24, fontWeight: 800 }}><GoldText>{display(patrimonyData?.netWorth || 0)}</GoldText></p>
                  <div style={{ display: 'flex', height: 4, borderRadius: 2, background: TC.secondary, overflow: 'hidden' }}>
                    <div style={{ width: `${((patrimonyData?.totalAssets || 0) / ((patrimonyData?.totalAssets || 0) + (patrimonyData?.totalLiabilities || 1))) * 100}%`, background: TC.emerald }} />
                    <div style={{ width: `${((patrimonyData?.totalLiabilities || 0) / ((patrimonyData?.totalAssets || 0) + (patrimonyData?.totalLiabilities || 1))) * 100}%`, background: TC.red }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: TC.textMuted }}>
                    <span>Ativos: {display(patrimonyData?.totalAssets || 0)}</span>
                    <span>Passivos: {display(patrimonyData?.totalLiabilities || 0)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent Transactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: TC.text }}>Últimas Transações</h3>
              <button onClick={() => router.push('/transactions')} style={btnOutlineStyle}>Ver todas</button>
            </div>
            {dashLoading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Loader2 size={24} style={{ color: TC.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : dashboardData?.recentTx.map((tx, i) => {
              const cat = tx.category_id ? CAT_MAP[tx.category_id] : null
              const isIncome = tx.type === 'income'
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0',
                  borderBottom: i < dashboardData.recentTx.length - 1 ? `1px solid ${TC.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isIncome ? 'rgba(16,185,129,0.08)' : TC.secondary, fontSize: 18,
                    }}>{cat?.icon ?? (isIncome ? '💰' : '📦')}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: TC.text }}>{tx.description || cat?.name}</p>
                      <p style={{ fontSize: 12, color: TC.textMuted }}>{cat?.name} · {formatRelativeDate(tx.date)}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: isIncome ? TC.emerald : TC.text }}>
                    {isIncome ? '+' : '-'}{display(tx.amount)}
                  </p>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Right Column: AI & Trends */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* AI Insight Premium */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ ...cardHlStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={18} style={{ color: TC.gold }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: TC.gold }}>Nexus AI Insights</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dashLoading || extraLoading ? (
                <p style={{ fontSize: 13, color: TC.textMuted }}>Analisando sua saúde financeira...</p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: TC.text, opacity: 0.9, lineHeight: 1.6 }}>
                    {dashboardData!.monthExpense > dashboardData!.monthIncome
                      ? `⚠️ Suas despesas superaram as receitas este mês. Foco em reduzir gastos variáveis.`
                      : `✅ Ótimo! Você poupou ${fmt(dashboardData!.monthIncome - dashboardData!.monthExpense)} até agora.`}
                    {emergencyData?.status === 'critical' ? ' Priorize sua Reserva de Emergência imediatamente.' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(201,168,88,0.05)', border: `1px solid rgba(201,168,88,0.1)` }}>
                      <p style={{ fontSize: 10, color: TC.textMuted, marginBottom: 2 }}>Taxa de Poupança</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: TC.gold }}>
                        {dashboardData!.monthIncome > 0 ? (((dashboardData!.monthIncome - dashboardData!.monthExpense) / dashboardData!.monthIncome) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(59,130,246,0.05)', border: `1px solid rgba(59,130,246,0.1)` }}>
                      <p style={{ fontSize: 10, color: TC.textMuted, marginBottom: 2 }}>Score Patrimonial</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: TC.blue }}>{patrimonyData?.debtRatio ? (100 - patrimonyData.debtRatio).toFixed(1) : 85.0}</p>
                    </div>
                  </div>
                  <button onClick={() => router.push('/ai')} style={{ ...btnGoldStyle, width: '100%', padding: '10px' }}>
                    Falar com Nexus
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Quick Trend: Savings Rate */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={() => router.push('/reports')}
            style={widgetCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} style={{ color: TC.emerald }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Tendência de Economia</h3>
              </div>
              <ChevronRight size={14} style={{ color: TC.textMuted }} />
            </div>
            {extraLoading ? <Loader2 size={16} className="animate-spin" style={{ color: TC.gold }} /> : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                {reportData?.monthly?.slice(-6).map((m: any, i: number) => {
                  const rate = m.income > 0 ? Math.max(0, (m.income - m.expenses) / m.income) * 100 : 0
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%', height: `${Math.max(4, (rate / 100) * 60)}px`,
                        background: rate >= 20 ? TC.emerald : TC.gold, borderRadius: '4px 4px 0 0', opacity: 0.8,
                      }} />
                    </div>
                  )
                })}
              </div>
            )}
            <p style={{ fontSize: 10, color: TC.textMuted, marginTop: 8, textAlign: 'center' }}>Últimos 6 meses</p>
          </motion.div>

          {/* Quick Access */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: TC.text }}>Ações Rápidas</h3>
              <PluggyConnectButton label="Sincronizar" icon={false} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { label: 'Boletos', icon: <FileText size={18} />, href: '/boletos' },
                { label: 'Metas', icon: <Target size={18} />, href: '/goals' },
                { label: 'Investir', icon: <TrendingUp size={18} />, href: '/investments' },
                { label: 'Reports', icon: <BarChart size={18} />, href: '/reports' },
              ].map(a => (
                <button key={a.label} onClick={() => router.push(a.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 10,
                    backgroundColor: TC.secondary, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    color: TC.text, fontSize: 12, textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(201,168,88,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = TC.secondary}>
                  <span style={{ color: TC.gold }}>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const BarChart = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>

export default function DashboardPage() {
  return (
    <OnboardingGuard>
      <DashboardContent />
    </OnboardingGuard>
  )
}

const NAV_SAFE_AREA = 40
