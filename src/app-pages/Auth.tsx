import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: window.location.origin + '/dashboard' }
            });

        if (!error) navigate("/dashboard");
        setLoading(false);
    };

    const socialLogin = async (provider: 'google' | 'github') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                queryParams: {
                    prompt: 'select_account',
                }
            }
        });
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#0b0d10' }}>
            {/* Left Panel - Hidden on small screens */}
            <div className="hidden lg:flex" style={{
                flex: 1,
                backgroundColor: '#12151a',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: 420 }}>
                    <div style={{
                        width: 72,
                        height: 72,
                        background: 'linear-gradient(135deg, #dfc07a, #9a7d3a)',
                        borderRadius: 20,
                        margin: '0 auto 32px'
                    }}></div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, fontFamily: 'serif', letterSpacing: '-0.02em', color: '#fff', marginBottom: 16 }}>
                        Neural Finance <span style={{ color: '#c9a858' }}>Hub</span>
                    </h1>
                    <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, marginBottom: 48 }}>
                        Tecnologia financeira de próxima geração.<br />
                        Segura, inteligente e sofisticada.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                            { value: '256-bit', label: 'Encriptação' },
                            { value: '99.99%', label: 'Uptime' },
                            { value: '< 50ms', label: 'Latência' },
                            { value: 'SOC 2', label: 'Compliance' }
                        ].map(stat => (
                            <div key={stat.label} style={{
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.03)',
                                borderRadius: 16,
                                padding: '24px',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: 16, fontWeight: 700, color: '#dfc07a', marginBottom: 4 }}>{stat.value}</p>
                                <p style={{ fontSize: 12, color: '#6b7280' }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#07080a', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 32, left: 32 }}>
                    <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '24px 10%' }}>
                    <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'serif', color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                        </h2>
                        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
                            {isLogin ? 'Entre para acessar seu dashboard' : 'Faça parte da elite financeira'}
                        </p>

                        <button
                            type="button"
                            onClick={() => socialLogin('google')}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.06)',
                                padding: '14px',
                                borderRadius: 8,
                                color: '#ebe6da',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: 32
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continuar com Google
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>ou</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                        </div>

                        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ebe6da', marginBottom: 8 }}>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#12151a',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 6,
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: 14,
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 4 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ebe6da', marginBottom: 8 }}>Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#12151a',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 6,
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: 14,
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#dfc07a',
                                    color: '#07080a',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '14px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.8 : 1,
                                    transition: 'all 0.2s',
                                    marginTop: 4
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d4b05e'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dfc07a'}
                            >
                                {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>
                                {isLogin ? 'Não tem conta? ' : 'Já possui conta? '}
                            </span>
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8b92a5',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    padding: 0
                                }}
                            >
                                {isLogin ? 'Criar conta' : 'Entrar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;

