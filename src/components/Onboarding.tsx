'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Sparkles, Check, Loader2, Wallet, Target, Brain } from 'lucide-react'
import { C, cardHlStyle, btnGoldStyle, inputStyle } from '@/lib/theme'
import GoldText from './GoldText'
type Props = {
    onComplete: () => void
}
const STEPS = [
    { id: 'welcome', title: 'Bem-vindo ao Neural Finance Hub!', icon: '✨' },
    { id: 'profile', title: 'Seus dados', icon: '👤' },
    { id: 'income', title: 'Renda e Objetivos', icon: '💰' },
    { id: 'accounts', title: 'Contas bancárias', icon: '🏦' },
    { id: 'done', title: 'Tudo pronto!', icon: '🎉' },
]
export default function Onboarding({ onComplete }: Props) {
    const [step, setStep] = useState(0)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        monthly_income: '',
        financial_goal: '',
        is_mei: false,
        first_account_name: 'Conta Principal',
        first_account_type: 'checking',
        first_account_balance: '',
    })
    const updateForm = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }))
    const handleComplete = async () => {
        setSaving(true)
        try {
            // 1. Salvar perfil
            await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: form.full_name || null,
                    phone: form.phone || null,
                    monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : null,
                    financial_goal: form.financial_goal || null,
                    is_mei: form.is_mei,
                    onboarding_completed: true,
                }),
            })
            // 2. Criar conta se informou
            if (form.first_account_name) {
                await fetch('/api/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: form.first_account_name,
                        type: form.first_account_type,
                        balance: form.first_account_balance ? parseFloat(form.first_account_balance) : 0,
                    }),
                })
            }
            // 3. Dar XP de onboarding
            await fetch('/api/gamification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'daily_login' }),
            })
            onComplete()
        } catch {
            onComplete() // Continuar mesmo com erro
        } finally { setSaving(false) }
    }
    const canNext = () => {
        if (step === 1) return form.full_name.trim().length > 0
        return true
    }
    const next = () => {
        if (step === STEPS.length - 1) {
            handleComplete()
        } else {
            setStep(s => Math.min(STEPS.length - 1, s + 1))
        }
    }
    const prev = () => setStep(s => Math.max(0, s - 1))
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}>
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.3,
                background: 'radial-gradient(circle at 50% 30%, rgba(201,168,88,0.08), transparent 60%)',
            }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ ...cardHlStyle, width: '100%', maxWidth: 500, padding: 0, position: 'relative' }}>
                {/* Progress */}
                <div style={{ padding: '20px 24px 0', display: 'flex', gap: 4 }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 999,
                            backgroundColor: i <= step ? C.gold : C.secondary,
                            transition: 'background 0.5s',
                        }} />
                    ))}
                </div>
                {/* Content */}
                <div style={{ padding: '32px 24px', minHeight: 360 }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}>
                            {/* Step 0: Welcome */}
                            {step === 0 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                                        Bem-vindo ao <GoldText>Neural Finance Hub</GoldText>
                                    </h2>
                                    <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
                                        Seu assistente financeiro inteligente com IA.
                                        Vamos configurar tudo em menos de 2 minutos.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { icon: <Wallet size={16} />, text: 'Controle total das suas finanças' },
                                            { icon: <Target size={16} />, text: 'Metas e orçamentos inteligentes' },
                                            { icon: <Brain size={16} />, text: 'IA que aprende seus hábitos' },
                                        ].map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMuted, fontSize: 13 }}>
                                                <span style={{ color: C.gold }}>{f.icon}</span> {f.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Step 1: Profile */}
                            {step === 1 && (
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>👤 Seus dados</h2>
                                    <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Como devemos te chamar?</p>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Nome completo *</label>
                                        <input value={form.full_name} onChange={e => updateForm('full_name', e.target.value)}
                                            placeholder="Seu nome" style={inputStyle} />
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Telefone (opcional)</label>
                                        <input value={form.phone} onChange={e => updateForm('phone', e.target.value)}
                                            placeholder="(11) 99999-9999" style={inputStyle} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMuted, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.is_mei} onChange={e => updateForm('is_mei', e.target.checked)}
                                            style={{ accentColor: C.gold }} />
                                        Sou MEI / Microempreendedor
                                    </label>
                                </div>
                            )}
                            {/* Step 2: Income & Goals */}
                            {step === 2 && (
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>💰 Renda e Objetivos</h2>
                                    <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Ajuda a gerar insights melhores</p>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Renda mensal aproximada</label>
                                        <input value={form.monthly_income} onChange={e => updateForm('monthly_income', e.target.value)}
                                            placeholder="5000" type="number" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Principal objetivo financeiro</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            {[
                                                { value: 'save', label: '💰 Poupar mais' },
                                                { value: 'invest', label: '📈 Investir' },
                                                { value: 'debt', label: '🔓 Sair de dívidas' },
                                                { value: 'organize', label: '📊 Organizar' },
                                            ].map(opt => (
                                                <button key={opt.value} onClick={() => updateForm('financial_goal', opt.value)}
                                                    style={{
                                                        padding: 12, borderRadius: 10, border: `1px solid ${form.financial_goal === opt.value ? C.gold : C.border}`,
                                                        backgroundColor: form.financial_goal === opt.value ? 'rgba(201,168,88,0.06)' : 'transparent',
                                                        color: C.text, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                                                        textAlign: 'left', background: 'none',
                                                    }}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Step 3: First Account */}
                            {step === 3 && (
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>🏦 Sua primeira conta</h2>
                                    <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Pode alterar depois nas configurações</p>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Nome da conta</label>
                                        <input value={form.first_account_name} onChange={e => updateForm('first_account_name', e.target.value)}
                                            placeholder="Conta Principal" style={inputStyle} />
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Tipo</label>
                                        <select value={form.first_account_type} onChange={e => updateForm('first_account_type', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                            <option value="checking">Conta Corrente</option>
                                            <option value="savings">Poupança</option>
                                            <option value="cash">Dinheiro</option>
                                            <option value="wallet">Carteira Digital</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Saldo atual (opcional)</label>
                                        <input value={form.first_account_balance} onChange={e => updateForm('first_account_balance', e.target.value)}
                                            placeholder="0.00" type="number" step="0.01" style={inputStyle} />
                                    </div>
                                </div>
                            )}
                            {/* Step 4: Done */}
                            {step === 4 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                                        Tudo <GoldText>pronto!</GoldText>
                                    </h2>
                                    <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
                                        Sua conta está configurada. Você ganhou seus primeiros XP!
                                        Vamos começar a organizar suas finanças. 🚀
                                    </p>
                                    <div style={{
                                        padding: 16, borderRadius: 12, backgroundColor: 'rgba(201,168,88,0.06)',
                                        border: `1px solid rgba(201,168,88,0.15)`, marginBottom: 8,
                                    }}>
                                        <p style={{ fontSize: 13, color: C.gold }}>
                                            <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                                            +5 XP por completar o onboarding!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {/* Footer */}
                <div style={{
                    padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: `1px solid ${C.border}`,
                }}>
                    {step > 0 ? (
                        <button onClick={prev} style={{
                            background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
                        }}>
                            <ChevronLeft size={14} /> Voltar
                        </button>
                    ) : <div />}
                    <button onClick={next} disabled={!canNext() || saving}
                        style={{ ...btnGoldStyle, opacity: (!canNext() || saving) ? 0.5 : 1 }}>
                        {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
                            step === STEPS.length - 1 ? <Check size={14} /> : null}
                        {step === STEPS.length - 1 ? 'Começar' : 'Próximo'}
                        {step < STEPS.length - 1 && <ChevronRight size={14} />}
                    </button>
                </div>
            </motion.div>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
