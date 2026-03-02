'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff, Brain, Github, Chrome } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            window.location.href = '/dashboard'
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao fazer login'
            toast.error(msg === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : msg)
        } finally {
            setLoading(false)
        }
    }

    async function handleOAuth(provider: 'google' | 'github') {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) toast.error('Erro ao iniciar autenticação social')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 neural-bg">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neural-gradient mb-4 animate-pulse-glow">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">NeuraFin Hub</h1>
                    <p className="text-muted-foreground text-sm mt-1">Finanças com inteligência neural</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <h2 className="text-xl font-semibold text-foreground mb-6">Entrar na conta</h2>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleOAuth('google')}
                            className="btn-ghost flex items-center justify-center gap-2"
                        >
                            <Chrome className="w-4 h-4" />
                            <span>Google</span>
                        </button>
                        <button
                            onClick={() => handleOAuth('github')}
                            className="btn-ghost flex items-center justify-center gap-2"
                        >
                            <Github className="w-4 h-4" />
                            <span>GitHub</span>
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-card px-3 text-muted-foreground">ou continue com e-mail</span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="neural-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="neural-input pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="text-right">
                            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-neural w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Não tem conta?{' '}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
