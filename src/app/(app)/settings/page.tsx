'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Bell, Shield, LogOut, Check, Loader2, X, Save,
    Mail, Phone, Calendar, DollarSign, Target, Crown, Zap,
    KeyRound, Smartphone, AlertTriangle, Trash2, Globe,
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, inputStyle, fmt } from '@/lib/theme'
import { toast } from 'sonner'
import { useProfile } from '@/hooks/useProfile'
import PlanCard from '@/components/PlanCard'

// ========== Toggle Component ==========
function Toggle({ on, flip, disabled }: { on: boolean; flip: () => void; disabled?: boolean }) {
    return (
        <button aria-label="Ação" onClick={flip} disabled={disabled} style={{
            width: 44, height: 24, borderRadius: 999, padding: 2, border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: on ? C.gold : C.muted, transition: 'all 0.3s',
            opacity: disabled ? 0.5 : 1,
        }}>
            <div style={{
                width: 20, height: 20, borderRadius: 999, backgroundColor: 'white',
                transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.3s',
            }} />
        </button>
    )
}

// ========== Plan Badge ==========
function PlanBadge({ plan }: { plan: string }) {
    const config: Record<string, { bg: string; color: string; label: string; icon: typeof Crown }> = {
        free: { bg: 'rgba(107,114,128,0.15)', color: C.textMuted, label: 'Free', icon: Zap },
        pro: { bg: 'rgba(201,168,88,0.15)', color: C.gold, label: 'Pro', icon: Crown },
        family: { bg: 'rgba(168,85,247,0.15)', color: '#a78bfa', label: 'Family', icon: Crown },
        mei: { bg: 'rgba(52,211,153,0.15)', color: C.emerald, label: 'MEI', icon: Crown },
    }
    const c = config[plan] ?? config.free
    const Icon = c.icon

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            backgroundColor: c.bg, color: c.color,
        }}>
            <Icon size={12} /> {c.label}
        </span>
    )
}

// ========== Neural Score Ring ==========
function NeuralScoreRing({ score }: { score: number }) {
    const radius = 30
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const color = score >= 80 ? C.emerald : score >= 60 ? C.gold : score >= 40 ? C.yellow : C.red

    return (
        <div style={{ position: 'relative', width: 76, height: 76 }}>
            <svg width={76} height={76} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={38} cy={38} r={radius} fill="none" stroke={C.secondary} strokeWidth={5} />
                <circle cx={38} cy={38} r={radius} fill="none" stroke={color} strokeWidth={5}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: 18, fontWeight: 700, color }}>{score}</span>
                <span style={{ fontSize: 8, color: C.textMuted }}>SCORE</span>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    const router = useRouter()
    const { profile, loading, updateProfile, settingsAction } = useProfile()

    // Form State
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [monthlyIncome, setMonthlyIncome] = useState('')
    const [financialGoal, setFinancialGoal] = useState('')
    const [currency, setCurrency] = useState('BRL')
    const [timezone, setTimezone] = useState('America/Sao_Paulo')
    const [isMei, setIsMei] = useState(false)

    // UI State
    const [saving, setSaving] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState('')

    // Notificações (local state — futuro: salvar no DB)
    const [notifs, setNotifs] = useState({
        boletos: true,
        budget: true,
        goals: true,
        weekly: false,
        aiTips: true,
    })

    // Preencher form quando profile carrega
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name ?? '')
            setPhone(profile.phone ?? '')
            setDateOfBirth(profile.date_of_birth ?? '')
            setMonthlyIncome(profile.monthly_income ? String(profile.monthly_income) : '')
            setFinancialGoal(profile.financial_goal ?? '')
            setCurrency(profile.currency ?? 'BRL')
            setTimezone(profile.timezone ?? 'America/Sao_Paulo')
            setIsMei(profile.is_mei ?? false)
        }
    }, [profile])

    // ========== Handlers ==========
    const handleSaveProfile = useCallback(async () => {
        setSaving(true)
        const { error } = await updateProfile({
            full_name: fullName || null,
            phone: phone || null,
            date_of_birth: dateOfBirth || null,
            monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
            financial_goal: financialGoal || null,
            currency,
            timezone,
            is_mei: isMei,
        })
        setSaving(false)

        if (error) {
            toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
        } else {
            toast.success('Perfil atualizado!', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
        }
    }, [fullName, phone, dateOfBirth, monthlyIncome, financialGoal, currency, timezone, isMei, updateProfile])

    const handleChangePassword = useCallback(async () => {
        if (!newPassword || newPassword.length < 8) {
            toast.error('Senha deve ter no mínimo 8 caracteres')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('Senhas não conferem')
            return
        }

        setPasswordSaving(true)
        const { error, message } = await settingsAction('change_password', { newPassword })
        setPasswordSaving(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success(message || 'Senha alterada!')
            setShowPasswordModal(false)
            setNewPassword('')
            setConfirmPassword('')
        }
    }, [newPassword, confirmPassword, settingsAction])

    const handleSignOut = useCallback(async () => {
        await settingsAction('sign_out_all')
        router.push('/login')
    }, [settingsAction, router])

    const handleDeleteAccount = useCallback(async () => {
        if (deleteConfirm !== 'EXCLUIR') {
            toast.error('Digite EXCLUIR para confirmar')
            return
        }
        const { error } = await settingsAction('delete_account')
        if (error) {
            toast.error(error)
        } else {
            router.push('/login')
        }
    }, [deleteConfirm, settingsAction, router])

    // ========== Loading ==========
    if (loading) {
        return (
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Configurações</h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 24 }}>Carregando...</p>
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: C.gold, margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Configurações</h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Personalize sua experiência</p>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24, maxWidth: 720 }}>

                {/* ========== PROFILE CARD ========== */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    style={{ ...cardHlStyle, padding: 24 }}>

                    {/* Header com Score + Plano */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: C.goldGrad, fontSize: 22, fontWeight: 700, color: C.bg,
                            }}>
                                {(profile?.full_name ?? 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h3 style={{ fontWeight: 600, color: C.text, fontSize: 18 }}>{profile?.full_name || 'Usuário'}</h3>
                                    <PlanBadge plan={profile?.plan ?? 'free'} />
                                </div>
                                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                                    <Mail size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                    {profile?.email}
                                </p>
                                {profile?.last_sign_in && (
                                    <p style={{ fontSize: 11, color: C.textMuted2, marginTop: 2 }}>
                                        Último login: {new Date(profile.last_sign_in).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <NeuralScoreRing score={profile?.neural_score ?? 0} />
                    </div>

                    <div style={{ height: 1, backgroundColor: C.border, marginBottom: 20 }} />

                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: C.text, marginBottom: 20, fontSize: 15 }}>
                        <User size={16} style={{ color: C.gold }} /> Dados Pessoais
                    </h3>

                    {/* Name + Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <User size={12} /> Nome Completo
                            </label>
                            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <Phone size={12} /> Telefone
                            </label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" style={inputStyle} />
                        </div>
                    </div>

                    {/* Date of Birth + Currency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <Calendar size={12} /> Data de Nascimento
                            </label>
                            <input aria-label="Entrada de texto" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <Globe size={12} /> Moeda
                            </label>
                            <select aria-label="Selecionar opção" value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="BRL">R$ — Real Brasileiro</option>
                                <option value="USD">US$ — Dólar Americano</option>
                                <option value="EUR">€ — Euro</option>
                            </select>
                        </div>
                    </div>

                    {/* Monthly Income + Financial Goal */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <DollarSign size={12} /> Renda Mensal
                            </label>
                            <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="0,00" step="0.01" min="0" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <Target size={12} /> Objetivo Financeiro
                            </label>
                            <select aria-label="Selecionar opção" value={financialGoal} onChange={e => setFinancialGoal(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="">Selecione...</option>
                                <option value="save_more">Economizar mais</option>
                                <option value="invest">Começar a investir</option>
                                <option value="debt_free">Sair das dívidas</option>
                                <option value="emergency_fund">Montar reserva de emergência</option>
                                <option value="financial_independence">Independência financeira</option>
                                <option value="retirement">Aposentadoria</option>
                                <option value="buy_home">Comprar casa/apartamento</option>
                                <option value="travel">Viajar</option>
                            </select>
                        </div>
                    </div>

                    {/* Timezone + MEI */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                <Globe size={12} /> Fuso Horário
                            </label>
                            <select aria-label="Selecionar opção" value={timezone} onChange={e => setTimezone(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                <option value="America/Manaus">Manaus (GMT-4)</option>
                                <option value="America/Belem">Belém (GMT-3)</option>
                                <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
                                <option value="America/Recife">Recife (GMT-3)</option>
                                <option value="America/Noronha">Noronha (GMT-2)</option>
                                <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24 }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>Sou MEI</p>
                                <p style={{ fontSize: 11, color: C.textMuted }}>Ativa recursos para microempreendedor</p>
                            </div>
                            <Toggle on={isMei} flip={() => setIsMei(!isMei)} />
                        </div>
                    </div>

                    {/* Save Button */}
                    <button onClick={handleSaveProfile} disabled={saving} style={{
                        ...btnGoldStyle,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: saving ? 0.7 : 1, width: '100%', padding: '14px 0',
                    }}>
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                        {saving ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
                </motion.div>

                {/* ========== PLANOS DE ASSINATURA ========== */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: C.text, marginBottom: 20 }}>
                        <Crown size={18} style={{ color: C.gold }} /> Plano & Assinatura
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        <PlanCard planId="pro" />
                        <PlanCard planId="family" />
                        <PlanCard planId="mei" />
                    </div>
                </motion.div>

                {/* ========== NOTIFICAÇÕES ========== */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: C.text, marginBottom: 20 }}>
                        <Bell size={18} style={{ color: C.gold }} /> Notificações
                    </h3>
                    {([
                        { key: 'boletos' as const, label: 'Boletos vencendo', desc: 'Alerta 3 dias antes do vencimento', icon: '📄' },
                        { key: 'budget' as const, label: 'Orçamento estourado', desc: 'Alerta ao ultrapassar 80% do limite', icon: '💰' },
                        { key: 'goals' as const, label: 'Progresso de metas', desc: 'Atualizações semanais de progresso', icon: '🎯' },
                        { key: 'weekly' as const, label: 'Resumo semanal', desc: 'Relatório toda segunda-feira', icon: '📊' },
                        { key: 'aiTips' as const, label: 'Dicas da IA', desc: 'Insights personalizados da Neural IA', icon: '🤖' },
                    ]).map((n, i, arr) => (
                        <div key={n.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0',
                            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 20 }}>{n.icon}</span>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{n.label}</p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>{n.desc}</p>
                                </div>
                            </div>
                            <Toggle on={notifs[n.key]} flip={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                        </div>
                    ))}
                </motion.div>

                {/* ========== SEGURANÇA ========== */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: C.text, marginBottom: 20 }}>
                        <Shield size={18} style={{ color: C.gold }} /> Segurança
                    </h3>

                    {/* Provider info */}
                    {profile?.auth_provider && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
                            backgroundColor: C.secondary, marginBottom: 16,
                        }}>
                            <Smartphone size={16} style={{ color: C.textMuted }} />
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Login via {profile.auth_provider === 'email' ? 'Email/Senha' : profile.auth_provider.charAt(0).toUpperCase() + profile.auth_provider.slice(1)}</p>
                                <p style={{ fontSize: 11, color: C.textMuted }}>Método de autenticação atual</p>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Alterar senha — só se for email auth */}
                        {(profile?.auth_provider === 'email' || !profile?.auth_provider) && (
                            <button onClick={() => setShowPasswordModal(true)} style={{ ...btnOutlineStyle, width: '100%', padding: '12px 0' }}>
                                <KeyRound size={16} /> Alterar Senha
                            </button>
                        )}

                        <button onClick={handleSignOut}
                            style={{ ...btnOutlineStyle, width: '100%', padding: '12px 0', color: C.yellow, borderColor: 'rgba(251,191,36,0.3)' }}>
                            <LogOut size={16} /> Sair de Todas as Sessões
                        </button>

                        <button onClick={() => setShowDeleteModal(true)}
                            style={{ ...btnOutlineStyle, width: '100%', padding: '12px 0', color: C.red, borderColor: 'rgba(248,113,113,0.3)' }}>
                            <Trash2 size={16} /> Excluir Conta
                        </button>
                    </div>
                </motion.div>

                {/* ========== INFO CONTA ========== */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ ...cardStyle, padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
                        <div>
                            <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Plano</p>
                            <PlanBadge plan={profile?.plan ?? 'free'} />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Membro desde</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Neural Score</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>{profile?.neural_score ?? 0}/100</p>
                        </div>
                    </div>
                </motion.div>

                {/* Spacer bottom */}
                <div style={{ height: 32 }} />
            </div>

            {/* ========== MODAL: ALTERAR SENHA ========== */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowPasswordModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 420, padding: 24 }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <KeyRound size={18} style={{ color: C.gold }} /> Alterar Senha
                                </h2>
                                <button aria-label="Ação" onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Nova Senha</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Confirmar Senha</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" style={inputStyle}
                                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
                            </div>

                            {newPassword && newPassword.length < 8 && (
                                <p style={{ fontSize: 12, color: C.yellow, marginBottom: 12 }}>⚠️ Mínimo 8 caracteres</p>
                            )}
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>❌ Senhas não conferem</p>
                            )}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setShowPasswordModal(false)} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button onClick={handleChangePassword} disabled={passwordSaving || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                                    style={{
                                        ...btnGoldStyle, flex: 1, padding: '12px 0',
                                        opacity: (passwordSaving || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword) ? 0.5 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}>
                                    {passwordSaving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {passwordSaving ? 'Salvando...' : 'Alterar Senha'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========== MODAL: EXCLUIR CONTA ========== */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowDeleteModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 420, padding: 24 }}>

                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: 'rgba(248,113,113,0.15)', margin: '0 auto 16px',
                                }}>
                                    <AlertTriangle size={28} style={{ color: C.red }} />
                                </div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Excluir Conta</h2>
                                <p style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>
                                    Esta ação é <strong style={{ color: C.red }}>irreversível</strong>. Todos os seus dados serão desativados permanentemente.
                                </p>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                    Digite <strong style={{ color: C.red }}>EXCLUIR</strong> para confirmar
                                </label>
                                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="EXCLUIR" style={{
                                    ...inputStyle, borderColor: 'rgba(248,113,113,0.3)',
                                }} />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>
                                    Cancelar
                                </button>
                                <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'EXCLUIR'}
                                    style={{
                                        ...btnOutlineStyle, flex: 1, padding: '12px 0',
                                        color: C.red, borderColor: 'rgba(248,113,113,0.3)',
                                        backgroundColor: deleteConfirm === 'EXCLUIR' ? 'rgba(248,113,113,0.15)' : 'transparent',
                                        opacity: deleteConfirm === 'EXCLUIR' ? 1 : 0.4,
                                    }}>
                                    <Trash2 size={16} /> Excluir Conta
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
