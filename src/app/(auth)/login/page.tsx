// src/app/(auth)/login/page.tsx
'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
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
    return (
        <span style={{ background: C.goldTextGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {children}
        </span>
    )
}
export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'forgot'>('login')
    const [resetSent, setResetSent] = useState(false)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) { toast.error('Preencha todos os campos'); return }
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        setLoading(false)
        if (error) {
            if (error.message.includes('Invalid login')) toast.error('Email ou senha incorretos')
            else if (error.message.includes('Email not confirmed')) toast.error('Confirme seu email antes de entrar')
            else toast.error(error.message)
        } else {
            toast.success('Bem-vindo!')
            router.push('/dashboard')
            router.refresh()
        }
    }
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) { toast.error('Digite seu email'); return }
        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        setLoading(false)
        if (error) toast.error(error.message)
        else { setResetSent(true); toast.success('Email de recuperação enviado!') }
    }
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10, fontSize: 14,
        backgroundColor: C.secondary, border: `1px solid ${C.border}`, color: C.text,
        outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    }
    const btnStyle: React.CSSProperties = {
        width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
        background: C.goldGrad, color: C.bg, fontSize: 15, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
    }
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: C.bg, padding: 16,
        }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    width: '100%', maxWidth: 420, padding: 32, borderRadius: 20,
                    background: 'linear-gradient(165deg, #13161c, #0d0f14)',
                    border: `1px solid ${C.borderGold}`,
                }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, background: C.goldGrad,
                        margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: 22, color: C.bg, fontWeight: 800 }}>N</span>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>
                        {mode === 'login' ? 'Entrar' : 'Recuperar Senha'}
                    </h1>
                    <p style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
                        {mode === 'login'
                            ? <><GoldText>Neural Finance Hub</GoldText> — Sua plataforma financeira</>
                            : 'Digite seu email para receber o link'
                        }
                    </p>
                </div>
                {mode === 'login' ? (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 16, position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com" style={inputStyle} autoComplete="email"
                                onFocus={e => e.target.style.borderColor = 'rgba(201,168,88,0.3)'}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <div style={{ marginBottom: 8, position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                            <input type={showPassword ? 'text' : 'password'} value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Sua senha" style={{ ...inputStyle, paddingRight: 42 }} autoComplete="current-password"
                                onFocus={e => e.target.style.borderColor = 'rgba(201,168,88,0.3)'}
                                onBlur={e => e.target.style.borderColor = C.border} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div style={{ textAlign: 'right', marginBottom: 24 }}>
                            <button type="button" onClick={() => setMode('forgot')}
                                style={{ background: 'none', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer' }}>
                                Esqueci minha senha
                            </button>
                        </div>
                        <button type="submit" disabled={loading} style={btnStyle}>
                            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <>Entrar <ArrowRight size={16} /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleForgotPassword}>
                        {resetSent ? (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <p style={{ fontSize: 40, marginBottom: 12 }}>📧</p>
                                <p style={{ color: C.emerald, fontWeight: 600, marginBottom: 8 }}>Email enviado!</p>
                                <p style={{ fontSize: 13, color: C.textMuted }}>Verifique sua caixa de entrada e spam.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 24, position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="seu@email.com" style={inputStyle} autoComplete="email" />
                                </div>
                                <button type="submit" disabled={loading} style={btnStyle}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Enviar link de recuperação'}
                                </button>
                            </>
                        )}
                        <button type="button" onClick={() => { setMode('login'); setResetSent(false) }}
                            style={{ width: '100%', marginTop: 12, padding: '12px 0', background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>
                            Voltar ao login
                        </button>
                    </form>
                )}
                {/* Register link */}
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <p style={{ fontSize: 13, color: C.textMuted }}>
                        Não tem conta?{' '}
                        <a href="/register" style={{ color: C.gold, textDecoration: 'none', fontWeight: 600 }}>Criar conta grátis</a>
                    </p>
                </div>
            </motion.div>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
