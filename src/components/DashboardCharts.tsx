'use client'
import { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { C, cardStyle } from '@/lib/theme'
import { BarChart3, PieChart as PieIcon, TrendingUp, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '@/contexts/AppContext'
import { getThemeColors } from '@/lib/themeColors'
type MonthlyData = { month: string; income: number; expense: number; balance: number }
type CategoryData = { name: string; value: number; color: string }
type DailyData = { date: string; value: number }
type AnalyticsData = {
    monthly: MonthlyData[]
    byCategory: CategoryData[]
    daily: DailyData[]
}
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            backgroundColor: '#13161c', border: `1px solid rgba(201,168,88,0.15)`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
        }}>
            <p style={{ color: '#ebe6da', fontWeight: 600, marginBottom: 4 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
            ))}
        </div>
    )
}
export default function DashboardCharts() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const { theme } = useApp()
    const TC = getThemeColors(theme)
    useEffect(() => {
        fetch('/api/dashboard/analytics')
            .then(r => r.json())
            .then(j => setData(j.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader2 size={24} style={{ color: C.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }
    if (!data) return null
    const gridColor = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
    const textColor = TC.textMuted
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
            {/* Tendência Mensal */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={16} style={{ color: C.gold }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Receitas vs Despesas</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.monthly} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="income" name="Receitas" fill="#34d399" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>
            {/* Despesas por Categoria */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <PieIcon size={16} style={{ color: C.gold }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Despesas por Categoria</h3>
                </div>
                {data.byCategory.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: 40 }}>
                        Sem despesas este mês
                    </p>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <ResponsiveContainer width="50%" height={220}>
                            <PieChart>
                                <Pie data={data.byCategory} dataKey="value" cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={80} paddingAngle={2}
                                    stroke="none">
                                    {data.byCategory.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => fmt(Number(v))} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            {data.byCategory.slice(0, 5).map((cat, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: cat.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, color: TC.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cat.name}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: TC.text }}>{fmt(cat.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
            {/* Gastos Diários (30 dias) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ ...cardStyle, padding: 20, gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={16} style={{ color: C.gold }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>Gastos Diários (30 dias)</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.daily}>
                        <defs>
                            <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c9a858" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#c9a858" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false}
                            interval={4} />
                        <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" name="Gastos" stroke="#c9a858" fill="url(#goldArea)"
                            strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#c9a858' }} />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    )
}
