'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, TrendingUp, Wallet, PieChart, Info, Save, Calculator } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { toast } from 'sonner'

function RetirementContent() {
    const { retirementPlan, fetchRetirement, saveRetirement, loading } = useFinanceStore()
    const [saving, setSaving] = useState(false)

    // Simulation parameters
    const [age, setAge] = useState(30)
    const [targetAge, setTargetAge] = useState(65)
    const [monthlyExp, setMonthlyExp] = useState(5000)
    const [invested, setInvested] = useState(50000)
    const [contribution, setContribution] = useState(1000)
    const [returnRate, setReturnRate] = useState(8) // % a.a.
    const [inflation, setInflation] = useState(4) // % a.a.

    useEffect(() => {
        fetchRetirement()
    }, [fetchRetirement])

    useEffect(() => {
        if (retirementPlan) {
            setAge(retirementPlan.current_age)
            setTargetAge(retirementPlan.target_retirement_age)
            setMonthlyExp(retirementPlan.monthly_expenses)
            setInvested(retirementPlan.current_investments)
            setContribution(retirementPlan.monthly_contribution)
            setReturnRate(retirementPlan.expected_return_rate)
            setInflation(retirementPlan.inflation_rate)
        }
    }, [retirementPlan])

    // Cálculos da simulação
    const result = useMemo(() => {
        // Taxa real = (1 + r) / (1 + i) - 1
        const realRateYearly = (1 + returnRate / 100) / (1 + inflation / 100) - 1
        const realRateMonthly = Math.pow(1 + realRateYearly, 1 / 12) - 1

        const yearsToInvest = targetAge - age
        const monthsToInvest = yearsToInvest * 12

        if (monthsToInvest <= 0) return { total: invested, passive: 0, possible: false, pct: 0 }

        // FV = P * (1+r)^n + C * (((1+r)^n - 1) / r)
        const futureValue =
            invested * Math.pow(1 + realRateMonthly, monthsToInvest) +
            contribution * ((Math.pow(1 + realRateMonthly, monthsToInvest) - 1) / realRateMonthly)

        // Renda mensal perpétua (Regra dos 4% ou taxa real mensal)
        const monthlyPassive = futureValue * realRateMonthly

        return {
            total: futureValue,
            passive: monthlyPassive,
            possible: monthlyPassive >= monthlyExp,
            pct: Math.min((monthlyPassive / monthlyExp) * 100, 100)
        }
    }, [age, targetAge, monthlyExp, invested, contribution, returnRate, inflation])

    const handleSave = async () => {
        setSaving(true)
        const { error } = await saveRetirement({
            current_age: age,
            target_retirement_age: targetAge,
            monthly_income: 10000, // placeholder
            monthly_expenses: monthlyExp,
            current_investments: invested,
            monthly_contribution: contribution,
            expected_return_rate: returnRate,
            inflation_rate: inflation
        })
        setSaving(false)
        if (error) toast.error(error)
        else toast.success('Plano salvo com sucesso!')
    }

    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }
    const compactInput: React.CSSProperties = { ...inputStyle, padding: '10px 14px', fontSize: 13 }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Simulador de Aposentadoria</h1>
                    <p style={{ color: C.textMuted, fontSize: 13 }}>Planeje sua liberdade financeira</p>
                </div>
                <button onClick={handleSave} disabled={saving} style={compactBtn}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Salvar Plano</>}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* Parametros */}
                <div style={{ ...compactCard, padding: '16px' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calculator size={16} style={{ color: C.gold }} /> Seus Dados
                    </h2>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Idade Atual</label>
                            <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} style={compactInput} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Idade Aposentadoria</label>
                            <input type="number" value={targetAge} onChange={e => setTargetAge(Number(e.target.value))} style={compactInput} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Custo Mensal Desejado (Hoje)</label>
                        <input type="number" value={monthlyExp} onChange={e => setMonthlyExp(Number(e.target.value))} style={compactInput} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Patrimônio Atual</label>
                            <input type="number" value={invested} onChange={e => setInvested(Number(e.target.value))} style={compactInput} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Aporte Mensal</label>
                            <input type="number" value={contribution} onChange={e => setContribution(Number(e.target.value))} style={compactInput} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Rentabilidade (% a.a.)</label>
                            <input type="number" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} style={compactInput} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Inflação (% a.a.)</label>
                            <input type="number" value={inflation} onChange={e => setInflation(Number(e.target.value))} style={compactInput} />
                        </div>
                    </div>
                </div>

                {/* Resultados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ ...compactCard, padding: '20px', background: `linear-gradient(135deg, ${C.card}, ${C.secondary})`, textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Renda Mensal Passiva Estimada</p>
                        <p style={{ fontSize: 32, fontWeight: 800, color: result.possible ? C.emerald : C.gold, lineHeight: 1.2 }}>{fmt(result.passive)}</p>
                        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>em valores de hoje (poder de compra preservado)</p>
                    </div>

                    <div style={{ ...compactCard, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: C.text }}>Progresso até a meta</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: result.possible ? C.emerald : C.gold }}>{result.pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 5, background: C.secondary, overflow: 'hidden', marginBottom: 16 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${result.pct}%` }} transition={{ duration: 1 }}
                                style={{ height: '100%', borderRadius: 5, background: result.possible ? C.emerald : C.gold }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <p style={{ fontSize: 10, color: C.textMuted }}>Patrimônio Acumulado</p>
                                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmt(result.total)}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 10, color: C.textMuted }}>Anos até o objetivo</p>
                                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{targetAge - age} anos</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...compactCard, padding: '12px 16px', background: result.possible ? 'rgba(16,185,129,0.05)' : 'rgba(212,175,55,0.05)', border: `1px solid ${result.possible ? C.emerald : C.gold}22` }}>
                        <p style={{ fontSize: 12, color: result.possible ? C.emerald : C.gold, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            {result.possible
                                ? 'Parabéns! Seus parâmetros atuais são suficientes para cobrir seu custo de vida perpétuo.'
                                : 'Você ainda não atingiu a independência financeira. Considere aumentar seu aporte mensal ou a idade de aposentadoria.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function RetirementPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro no Simulador">
            <RetirementContent />
        </ErrorBoundary>
    )
}
