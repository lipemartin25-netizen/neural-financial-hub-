// src/app/(auth)/register/page.tsx
'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, Github, Chrome } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
const C = {
    bg: '#0b0d10', card: '#12151a', gold: '#c9a858', goldGrad: 'linear-gradient(135deg, #c9a858, #9a7d3a)',
    goldTextGrad: 'linear-gradient(135deg, #dfc07a, #b8943d, #d4b05e)',
    text: '#ebe6da', textMuted: '#6b7280', border: 'rgba(255,255,255,0.06)',
    borderGold: 'rgba(201,168,88,0.06)', red: '#f87171', emerald: '#34d399',
    secondary: 'rgba(255,255,255,0.03)',
}
function GoldText({ children }: { children: React.ReactNode }) {
    return <span style={{ background: C.goldTextGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{children}</span>
}
export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const passwordChecks = [
        { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
        { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
        { label: 'Número', ok: /[0-9]/.test(password) },
        { label: 'Senhas iguais', ok: password.length > 0 && password === confirmPassword },
    ]
    const allValid = passwordChecks.every(c => c.ok) && email.includes('@') && name.trim().length > 0
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!allValid) { toast.error('Corrija os campos destacados'); return }
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                emailRedirectTo: `${window.location.origin}/dashboard`,
            },
        })
        setLoading(false)
        if (error) {
            if (error.message.includes('already registered')) toast.error('Este email já está cadastrado')
            else toast.error(error.message)
        } else {
            setSuccess(true)
            toast.success('Conta criada!')
        }
    }
    const handleOAuth = async (provider: 'google' | 'github') => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    prompt: 'select_account',
                },
            },
        })
        if (error) {
            toast.error('Erro ao iniciar autenticação social')
            setLoading(false)
        }
    }
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10, fontSize: 14,
        backgroundColor: C.secondary, border: `1px solid ${C.border}`, color: C.text,
        outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    }
    const btnStyle: React.CSSProperties = {
        width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
        background: C.goldGrad, color: C.bg, fontSize: 15, fontWeight: 700,
        cursor: allValid ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: loading ? 0.7 : allValid ? 1 : 0.5, transition: 'opacity 0.2s',
    }
    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                        width: '100%', maxWidth: 420, padding: 40, borderRadius: 20, textAlign: 'center',
                        background: 'linear-gradient(165deg, #13161c, #0d0f14)', border: `1px solid ${C.borderGold}`,
                    }}>
                    <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Check size={32} style={{ color: C.emerald }} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Conta Criada!</h2>
                    <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
                        Enviamos um link de confirmação para <strong style={{ color: C.gold }}>{email}</strong>.
                        Verifique sua caixa de entrada e spam.
                    </p>
                    <button onClick={() => router.push('/login')}
                        style={{ ...btnStyle, cursor: 'pointer', opacity: 1 }}>
                        Ir para Login <ArrowRight size={16} />
                    </button>
                </motion.div>
            </div>
        )
    }
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: 16 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    width: '100%', maxWidth: 420, padding: 32, borderRadius: 20,
                    background: 'linear-gradient(165deg, #13161c, #0d0f14)', border: `1px solid ${C.borderGold}`,
                }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <Image src="/logo-neura.png" alt="Logo" width={48} height={48} style={{ borderRadius: 12, margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Criar Conta</h1>
                    <p style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
                        Comece a usar o <GoldText>Neural Finance Hub</GoldText>
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, marginBottom: 24 }}>
                    <button type="button" onClick={() => handleOAuth('google')} disabled={loading}
                        style={{ ...inputStyle, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                        <Chrome size={16} /> <span style={{ fontSize: 13, fontWeight: 500 }}>Google</span>
                    </button>
                    <button type="button" onClick={() => handleOAuth('github')} disabled={loading}
                        style={{ ...inputStyle, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                        <Github size={16} /> <span style={{ fontSize: 13, fontWeight: 500 }}>GitHub</span>
                    </button>
                </div>
                <div style={{ position: 'relative', marginBottom: 24 }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '100%', borderTop: `1px solid ${C.border}` }} />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        <span style={{ backgroundColor: 'transparent', padding: '0 12px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                            ou cadastre-se com e-mail
                        </span>
                    </div>
                </div>

                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: 14, position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo"
                            style={inputStyle} autoComplete="name"
                            onFocus={e => e.target.style.borderColor = 'rgba(201,168,88,0.3)'}
                            onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                    <div style={{ marginBottom: 14, position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com" style={inputStyle} autoComplete="email"
                            onFocus={e => e.target.style.borderColor = 'rgba(201,168,88,0.3)'}
                            onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                    <div style={{ marginBottom: 14, position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                        <input type={showPassword ? 'text' : 'password'} value={password}
                            onChange={e => setPassword(e.target.value)} placeholder="Criar senha"
                            style={{ ...inputStyle, paddingRight: 42 }} autoComplete="new-password"
                            onFocus={e => e.target.style.borderColor = 'rgba(201,168,88,0.3)'}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div style={{ marginBottom: 16, position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                        <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar senha"
                            style={inputStyle} autoComplete="new-password"
                            onFocus={e => e.target.style.borderColor = 'rgba(201,168,88,0.3)'}
                            onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                    {/* Password checks */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 20 }}>
                        {passwordChecks.map(c => (
                            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 14, height: 14, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: c.ok ? 'rgba(52,211,153,0.15)' : C.secondary,
                                    border: `1px solid ${c.ok ? 'rgba(52,211,153,0.3)' : C.border}`,
                                }}>
                                    {c.ok && <Check size={8} style={{ color: C.emerald }} />}
                                </div>
                                <span style={{ fontSize: 11, color: c.ok ? C.emerald : C.textMuted }}>{c.label}</span>
                            </div>
                        ))}
                    </div>
                    <button type="submit" disabled={loading || !allValid} style={btnStyle}>
                        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <>Criar Conta <ArrowRight size={16} /></>}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <p style={{ fontSize: 13, color: C.textMuted }}>
                        Já tem conta?{' '}
                        <a href="/login" style={{ color: C.gold, textDecoration: 'none', fontWeight: 600 }}>Entrar</a>
                    </p>
                </div>
                <p style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 1.4 }}>
                    Ao criar sua conta, você concorda com os Termos de Uso e Política de Privacidade.
                </p>
            </motion.div>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
