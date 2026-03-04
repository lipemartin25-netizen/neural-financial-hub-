'use client'

import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Eye, EyeOff, Sparkles, Bell, Loader2,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import GoldText from '@/components/GoldText'
import { useDashboard } from '@/hooks/useDashboard'
import { CATEGORIES } from '@/lib/constants'

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

export default function DashboardPage() {
  const [showValues, setShowValues] = useState(true)
  const router = useRouter()
  const { data, loading } = useDashboard()

  const display = (v: number) => showValues ? fmt(v) : '•••••'

  // Summary cards com dados reais
  const summary = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Saldo Total', value: data.totalBalance, icon: Wallet, color: C.gold, positive: true, href: '/accounts' },
      { label: 'Receitas (mês)', value: data.monthIncome, icon: ArrowUpRight, color: C.emerald, positive: true, href: '/transactions' },
      { label: 'Despesas (mês)', value: data.monthExpense, icon: ArrowDownRight, color: C.red, positive: false, href: '/transactions' },
      { label: 'Investimentos', value: data.totalInvCurrent, icon: TrendingUp, color: C.blue, positive: true, href: '/investments' },
    ]
  }, [data])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Bem-vindo de volta 👋</h1>
          <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
            {loading ? 'Carregando seus dados...' : 'Aqui está o resumo das suas finanças'}
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

      {/* Alerts — reais */}
      {data && data.alerts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {data.alerts.map((a, i) => (
            <button key={i} onClick={() => router.push(a.href)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
              background: 'none',
              border: `1px solid ${a.type === 'danger' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`,
              backgroundColor: a.type === 'danger' ? 'rgba(248,113,113,0.04)' : 'rgba(251,191,36,0.04)',
              cursor: 'pointer', fontSize: 12,
              color: a.type === 'danger' ? C.red : C.yellow,
            }}>
              <Bell size={12} /> {a.text}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ ...cardStyle, padding: 20, height: 90 }}>
              <div style={{ height: 12, width: '60%', borderRadius: 6, backgroundColor: C.secondary, marginBottom: 12 }} />
              <div style={{ height: 24, width: '40%', borderRadius: 6, backgroundColor: C.secondary }} />
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {summary.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => router.push(s.href)}
                style={{ ...cardStyle, padding: 20, cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,88,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,88,0.06)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>{s.label}</span>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
                <p style={{
                  fontSize: 22, fontWeight: 700,
                  color: s.label === 'Saldo Total' ? C.gold : s.positive ? C.emerald : C.red,
                }}>
                  {s.label === 'Despesas (mês)' && s.value > 0 ? '-' : ''}
                  {display(s.value)}
                </p>
              </motion.div>
            )
          })}
        </div>
      )
      }

      {/* Main grid: left + right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}
        className="lg:grid-cols-[2fr_1fr]">

        {/* ========== Recent Transactions ========== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Últimas Transações</h3>
            <button onClick={() => router.push('/transactions')} style={{
              background: 'none', border: 'none', fontSize: 12, color: C.gold, cursor: 'pointer', fontWeight: 500,
            }}>Ver todas →</button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Loader2 size={24} style={{ color: C.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          )}

          {!loading && data && data.recentTx.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <p style={{ fontSize: 14, color: C.textMuted }}>Nenhuma transação registrada ainda</p>
            </div>
          )}

          {!loading && data && data.recentTx.map((tx, i) => {
            const cat = tx.category_id ? CAT_MAP[tx.category_id] : null
            const isIncome = tx.type === 'income'
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < data.recentTx.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isIncome ? 'rgba(201,168,88,0.08)' : C.secondary, fontSize: 18,
                  }}>
                    {cat?.icon ?? (isIncome ? '💰' : '📦')}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                      {tx.description || cat?.name || 'Transação'}
                    </p>
                    <p style={{ fontSize: 12, color: C.textMuted }}>
                      {cat?.name ?? (isIncome ? 'Receita' : 'Despesa')} · {formatRelativeDate(tx.date)}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: isIncome ? C.emerald : C.text, whiteSpace: 'nowrap' }}>
                  {isIncome ? '+' : '-'}{display(tx.amount)}
                </p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ========== Right Column ========== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Goals Preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Metas</h3>
              <button onClick={() => router.push('/goals')} style={{
                background: 'none', border: 'none', fontSize: 12, color: C.gold, cursor: 'pointer', fontWeight: 500,
              }}>Ver todas →</button>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Loader2 size={20} style={{ color: C.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            )}

            {!loading && data && data.goals.length === 0 && (
              <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: 16 }}>
                Nenhuma meta definida ainda
              </p>
            )}

            {!loading && data && data.goals.map((g, i) => (
              <div key={g.id} style={{ marginBottom: i < data.goals.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.text }}>{g.icon} {g.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, backgroundColor: C.secondary }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, g.pct)}%`,
                    borderRadius: 999,
                    background: g.color,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Investimentos Resumo */}
          {!loading && data && data.totalInvCurrent > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
              onClick={() => router.push('/investments')}
              style={{ ...cardStyle, padding: 24, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,88,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,88,0.06)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>📈 Carteira</h3>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 500 }}>Detalhes →</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.textMuted }}>Investido</span>
                <span style={{ color: C.text }}>{display(data.totalInvested)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.textMuted }}>Valor Atual</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{display(data.totalInvCurrent)}</span>
              </div>
              {(() => {
                const ret = data.totalInvCurrent - data.totalInvested
                const pct = data.totalInvested > 0 ? (ret / data.totalInvested) * 100 : 0
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: C.textMuted }}>Rendimento</span>
                    <span style={{ fontWeight: 600, color: ret >= 0 ? C.emerald : C.red }}>
                      {ret >= 0 ? '+' : ''}{display(ret)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>Acesso Rápido</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Pagar Boleto', icon: '📄', href: '/boletos' },
                { label: 'Investir', icon: '📈', href: '/investments' },
                { label: 'Orçamento', icon: '💰', href: '/budgets' },
                { label: 'Relatório', icon: '📊', href: '/reports' },
              ].map(a => (
                <button key={a.label} onClick={() => router.push(a.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10,
                    backgroundColor: C.secondary, border: 'none', cursor: 'pointer',
                    fontSize: 13, color: C.text, transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(201,168,88,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.secondary}
                >
                  <span style={{ fontSize: 18 }}>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Insight */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ ...cardHlStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={16} style={{ color: C.gold }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>Insight da IA</h3>
            </div>

            {!loading && data ? (
              <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                {data.monthExpense > data.monthIncome
                  ? `⚠️ Suas despesas (${fmt(data.monthExpense)}) estão acima das receitas (${fmt(data.monthIncome)}) este mês. Avalie seus gastos para evitar déficit.`
                  : data.monthIncome > 0
                    ? `✅ Você está poupando ${fmt(data.monthIncome - data.monthExpense)} este mês (${((1 - data.monthExpense / data.monthIncome) * 100).toFixed(0)}% da renda). ${data.monthExpense / data.monthIncome < 0.5 ? 'Excelente controle!' : 'Continue assim!'}`
                    : 'Comece registrando suas receitas e despesas para obter insights personalizados.'
                }
              </p>
            ) : (
              <p style={{ fontSize: 13, color: C.textMuted }}>Analisando seus dados...</p>
            )}

            <button onClick={() => router.push('/ai')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
              fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer',
            }}>
              <Sparkles size={12} /> Ver análise completa
            </button>
          </motion.div>
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div >
  )
}
