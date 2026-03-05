'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sparkles, Building2, Wallet, Target, ArrowRight, Check, Loader2, X,
} from 'lucide-react'
import { C, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'
import GoldText from './GoldText'
import { toast } from 'sonner'

type Step = 'welcome' | 'account' | 'income' | 'goal' | 'done'

const STEPS: Step[] = ['welcome', 'account', 'income', 'goal', 'done']

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('welcome')
    const [saving, setSaving] = useState(false)

    // Form fields
    const [accountName, setAccountName] = useState('Nubank')
    const [accountBalance, setAccountBalance] = useState('')
    const [monthlyIncome, setMonthlyIncome] = useState('')
    const [financialGoal, setFinancialGoal] = useState('')

    const stepIdx = STEPS.indexOf(step)
    const progress = ((stepIdx) / (STEPS.length - 1)) * 100

    const next = () => {
        const nextIdx = stepIdx + 1
        if (nextIdx < STEPS.length) setStep(STEPS[nextIdx])
    }

    const handleCreateAccount = async () => {
        if (!accountName) { toast.error('Digite o nome da conta'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: accountName,
                    type: 'checking',
                    balance: parseFloat(accountBalance) || 0,
                    currency: 'BRL',
                }),
            })
            if (!res.ok) throw new Error()
            next()
        } catch {
            toast.error('Erro ao criar conta. Tente novamente.')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monthly_income: parseFloat(monthlyIncome) || null,
                    financial_goal: financialGoal || null,
                }),
            })
            next()
        } catch {
            // Não bloqueia se falhar — prossegue
            next()
        } finally {
            setSaving(false)
        }
    }

    const handleFinish = async () => {
        // Gerar recorrentes pendentes ao completar
        try { await fetch('/api/transactions/recurring/generate', { method: 'POST' }) } catch { }
        onComplete()
        router.push('/dashboard')
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)',
                padding: 16,
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                style={{
                    ...cardHlStyle, width: '100%', maxWidth: 480, padding: 32,
                    position: 'relative', overflow: 'visible',
                }}
            >
                {/* Close */}
                <button aria-label="Fechar" onClick={onComplete} style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer',
                }}>
                    <X size={18} />
                </button>

                {/* Progress */}
                <div style={{ height: 3, borderRadius: 999, backgroundColor: C.secondary, marginBottom: 32 }}>
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ height: '100%', borderRadius: 999, background: C.goldGrad }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {/* ========== WELCOME ========== */}
                    {step === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 16, background: C.goldGrad,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            }}>
                                <Sparkles size={28} style={{ color: C.bg }} />
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                                Bem-vindo ao <GoldText>Neural Finance Hub</GoldText>!
                            </h2>
                            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 32 }}>
                                Vamos configurar sua conta em 3 passos rápidos para você começar a ter controle total das suas finanças.
                            </p>
                            <button aria-label="Avançar" onClick={next} style={{ ...btnGoldStyle, width: '100%', padding: '14px 0' }}>
                                Começar <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* ========== ACCOUNT ========== */}
                    {step === 'account' && (
                        <motion.div key="account" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Building2 size={20} style={{ color: C.gold }} />
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Sua primeira conta</h2>
                            </div>
                            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
                                Adicione sua conta bancária principal para começar a registrar transações.
                            </p>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Nome da conta</label>
                                <input aria-label="Nome da Conta" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Ex: Nubank, Itaú..." style={inputStyle} />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Saldo atual (opcional)</label>
                                <input aria-label="Saldo atual" type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} placeholder="0,00" style={inputStyle} step="0.01" />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button aria-label="Pular" onClick={next} style={{ ...btnOutlineStyle, flex: 1 }}>Pular</button>
                                <button aria-label="Criar conta" onClick={handleCreateAccount} disabled={saving} style={{ ...btnGoldStyle, flex: 1, opacity: saving ? 0.7 : 1 }}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {saving ? 'Criando...' : 'Criar conta'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== INCOME ========== */}
                    {step === 'income' && (
                        <motion.div key="income" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Wallet size={20} style={{ color: C.gold }} />
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Renda mensal</h2>
                            </div>
                            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
                                Isso nos ajuda a calcular sua saúde financeira e sugerir metas de economia.
                            </p>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Renda mensal líquida</label>
                                <input aria-label="Renda" type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="5.000,00" style={{ ...inputStyle, fontSize: 20, fontWeight: 600 }} step="0.01" />
                            </div>

                            {/* Quick presets */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                                {[3000, 5000, 8000, 12000, 20000].map(v => (
                                    <button aria-label={`R$ ${v.toLocaleString('pt-BR')}`} key={v} onClick={() => setMonthlyIncome(String(v))} style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                        backgroundColor: monthlyIncome === String(v) ? 'rgba(201,168,88,0.1)' : C.secondary,
                                        border: monthlyIncome === String(v) ? '1px solid rgba(201,168,88,0.3)' : '1px solid transparent',
                                        color: monthlyIncome === String(v) ? C.gold : C.textMuted,
                                    }}>
                                        R$ {v.toLocaleString('pt-BR')}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button aria-label="Pular" onClick={next} style={{ ...btnOutlineStyle, flex: 1 }}>Pular</button>
                                <button aria-label="Continuar" onClick={handleSaveProfile} disabled={saving} style={{ ...btnGoldStyle, flex: 1, opacity: saving ? 0.7 : 1 }}>
                                    {saving ? 'Salvando...' : 'Continuar'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== GOAL ========== */}
                    {step === 'goal' && (
                        <motion.div key="goal" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Target size={20} style={{ color: C.gold }} />
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Seu objetivo</h2>
                            </div>
                            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
                                O que você mais quer alcançar com o controle financeiro?
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                {[
                                    { value: 'save', label: '💰 Economizar mais', desc: 'Poupar para reserva de emergência' },
                                    { value: 'debt', label: '🎯 Quitar dívidas', desc: 'Sair do vermelho o mais rápido possível' },
                                    { value: 'invest', label: '📈 Investir melhor', desc: 'Fazer o dinheiro trabalhar pra mim' },
                                    { value: 'control', label: '📊 Controlar gastos', desc: 'Entender para onde meu dinheiro vai' },
                                    { value: 'freedom', label: '🏖️ Independência financeira', desc: 'Viver de renda passiva' },
                                ].map(opt => (
                                    <button aria-label={opt.label} key={opt.value} onClick={() => setFinancialGoal(opt.value)} style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                                        borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                                        backgroundColor: financialGoal === opt.value ? 'rgba(201,168,88,0.08)' : C.secondary,
                                        border: financialGoal === opt.value ? `1px solid rgba(201,168,88,0.3)` : `1px solid ${C.border}`,
                                        transition: 'all 0.2s',
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 14, fontWeight: 500, color: financialGoal === opt.value ? C.gold : C.text }}>{opt.label}</p>
                                            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{opt.desc}</p>
                                        </div>
                                        {financialGoal === opt.value && <Check size={16} style={{ color: C.gold }} />}
                                    </button>
                                ))}
                            </div>

                            <button aria-label="Finalizar" onClick={handleSaveProfile} disabled={saving} style={{ ...btnGoldStyle, width: '100%', padding: '14px 0', opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'Salvando...' : 'Finalizar'} <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* ========== DONE ========== */}
                    {step === 'done' && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 999, background: C.goldGrad,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            }}>
                                <Check size={28} style={{ color: C.bg }} />
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                                Tudo pronto! 🎉
                            </h2>
                            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 32 }}>
                                Sua conta está configurada. Agora você tem o poder de controlar cada centavo.
                            </p>
                            <button aria-label="Avançar" onClick={handleFinish} style={{ ...btnGoldStyle, width: '100%', padding: '14px 0' }}>
                                Ir para o Dashboard <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
        </motion.div>
    )
}
