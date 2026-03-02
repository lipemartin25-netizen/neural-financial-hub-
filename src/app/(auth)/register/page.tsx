'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Brain, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const supabase = createClient()

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        if (password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres')
            return
        }
        setLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
            setDone(true)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao criar conta'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 neural-bg">
                <div className="w-full max-w-md animate-fade-in text-center">
                    <div className="glass-card p-10">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">Verifique seu e-mail!</h2>
                        <p className="text-muted-foreground text-sm">
                            Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>.
                            Clique no link para ativar sua conta.
                        </p>
                        <Link href="/login" className="btn-neural inline-block mt-6">
                            Voltar ao Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 neural-bg">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neural-gradient mb-4">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Criar conta grátis</h1>
                    <p className="text-muted-foreground text-sm mt-1">Comece a controlar suas finanças hoje</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="João Silva"
                                required
                                className="neural-input"
                            />
                        </div>

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
                                    placeholder="Mínimo 8 caracteres"
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

                            {/* Password strength indicator */}
                            {password.length > 0 && (
                                <div className="mt-2 flex gap-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= (i + 1) * 2
                                                    ? i < 2 ? 'bg-red-400' : i < 3 ? 'bg-amber-400' : 'bg-green-400'
                                                    : 'bg-border'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-neural w-full flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {loading ? 'Criando conta...' : 'Criar conta grátis'}
                        </button>

                        <p className="text-center text-xs text-muted-foreground">
                            Ao criar uma conta você concorda com nossos{' '}
                            <Link href="/terms" className="text-primary hover:underline">Termos de Uso</Link>
                        </p>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Já tem conta?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
