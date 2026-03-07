'use client'

import { motion } from 'framer-motion'
import NextImage from 'next/image'

import {
    ArrowRight, Brain, Shield, BarChart3, Zap, Fingerprint, Globe,
    Check, Menu, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

// ===== CONSTANTS =====
const C = {
    bg: '#0b0d10',
    card: '#12151a',
    cardGrad: 'linear-gradient(165deg, #13161c, #0d0f14)',
    cardHlGrad: 'linear-gradient(165deg, #171a20, #0f1115)',
    gold: '#c9a858',
    goldLight: '#dfc07a',
    goldDark: '#9a7d3a',
    text: '#ebe6da',
    textMuted: '#6b7280',
    border: 'rgba(255,255,255,0.06)',
    borderGold: 'rgba(201,168,88,0.06)',
    borderGoldHover: 'rgba(201,168,88,0.15)',
    goldGrad: 'linear-gradient(135deg, #c9a858, #9a7d3a)',
    goldTextGrad: 'linear-gradient(135deg, #dfc07a, #b8943d, #d4b05e)',
}

function GoldText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={className}
            style={{
                background: C.goldTextGrad,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            {children}
        </span>
    )
}

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <nav
            style={{
                position: 'fixed', left: 0, right: 0, top: 0, zIndex: 50,
                backgroundColor: scrolled ? 'rgba(11,13,16,0.85)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
                transition: 'all 0.5s ease',
            }}
        >
            <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <NextImage src="/logo-neura.png" alt="Logo" width={32} height={32} style={{ borderRadius: 8, objectFit: 'contain' }} />
                    <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                        Neural Finance <GoldText>Hub</GoldText>
                    </span>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
                    {['Soluções', 'Planos', 'Contato'].map((l) => (
                        <a key={l} href={`#${l.toLowerCase().replace('õ', 'o')}`}
                            style={{ fontSize: 14, color: C.textMuted, textDecoration: 'none', transition: 'color 0.3s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
                        >
                            {l}
                        </a>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="hidden md:flex">
                    <a href="/login" style={{ fontSize: 14, color: C.textMuted, textDecoration: 'none' }}>Entrar</a>
                    <a href="/register" className="btn-gold" style={{ fontSize: 14 }}>Começar agora</a>
                </div>

                <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: C.text, background: 'none', border: 'none', cursor: 'pointer' }} className="md:hidden">
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {mobileOpen && (
                <div style={{ padding: '0 24px 24px', backgroundColor: 'rgba(11,13,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }} className="md:hidden">
                    {['Soluções', 'Planos', 'Contato'].map((l) => (
                        <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                            style={{ display: 'block', fontSize: 14, color: C.textMuted, padding: '8px 0', textDecoration: 'none' }}>
                            {l}
                        </a>
                    ))}
                    <a href="/register" className="btn-gold" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 14 }}>
                        Começar agora
                    </a>
                </div>
            )}
        </nav>
    )
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
    return (
        <section style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Grid bg */}
            <div className="bg-grid-gold" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

            {/* Radial glow */}
            <div style={{
                position: 'absolute', left: '50%', top: '33%', width: 600, height: 600,
                transform: 'translate(-50%, -50%)', borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(201,168,88,0.06), transparent 70%)',
            }} />

            <div style={{ position: 'relative', maxWidth: 896, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
                {/* Badge */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
                        borderRadius: 999, border: '1px solid rgba(201,168,88,0.15)', backgroundColor: 'rgba(201,168,88,0.05)',
                        padding: '6px 16px',
                    }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.goldGrad }} />
                    <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', color: C.gold }}>
                        Plataforma Premium · Open Finance · IA
                    </span>
                </motion.div>

                {/* Title */}
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                    style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1.1, color: C.text }}
                >
                    O Futuro das{' '}<GoldText>Finanças Digitais</GoldText>
                </motion.h1>

                {/* Subtitle */}
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
                    style={{ maxWidth: 640, margin: '24px auto 0', fontSize: 18, color: C.textMuted, lineHeight: 1.6 }}
                >
                    Gerencie suas finanças, automatize investimentos e tome decisões com inteligência artificial — tudo em uma plataforma segura e sofisticada.
                </motion.p>

                {/* Buttons */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 40 }}
                >
                    <a href="/register" className="btn-gold" style={{ padding: '12px 32px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Explorar Plataforma <ArrowRight size={18} />
                    </a>
                    <a href="#solucoes" className="btn-gold-outline" style={{ padding: '12px 32px', fontSize: 16 }}>
                        Ver Demo
                    </a>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 64 }}
                >
                    {[
                        { value: 'R$ 2.4B+', label: 'Volume processado' },
                        { value: '150K+', label: 'Usuários ativos' },
                        { value: '99.97%', label: 'Uptime garantido' },
                    ].map((s) => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'clamp(1.25rem, 3vw, 1.875rem)', fontWeight: 700 }}>
                                <GoldText>{s.value}</GoldText>
                            </p>
                            <p style={{ marginTop: 4, fontSize: 12, color: C.textMuted }}>{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Scroll indicator */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ marginTop: 64 }}>
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ color: 'rgba(201,168,88,0.4)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

/* ============================================================
   FEATURES
   ============================================================ */
const FEATURES = [
    { icon: Brain, title: 'IA Preditiva', desc: 'Machine learning que antecipa tendências do mercado e otimiza seus investimentos automaticamente.' },
    { icon: Shield, title: 'Segurança Bancária', desc: 'Criptografia AES-256, autenticação biométrica e monitoramento 24/7 contra fraudes.' },
    { icon: BarChart3, title: 'Analytics em Tempo Real', desc: 'Dashboards dinâmicos com streaming de dados e visualizações interativas.' },
    { icon: Zap, title: 'Transferências Instantâneas', desc: 'Liquidação em milissegundos com as menores taxas do mercado via blockchain.' },
    { icon: Fingerprint, title: 'Auth Biométrica', desc: 'Face ID, Touch ID e autenticação multifator para máxima proteção.' },
    { icon: Globe, title: 'Multi-moeda & Cripto', desc: 'Opere em mais de 30 moedas fiduciárias e 200+ criptoativos nativamente.' },
]

function Features() {
    return (
        <section id="solucoes" style={{ position: 'relative', padding: '96px 0' }}>
            <div className="bg-grid-gold" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: 64 }}
                >
                    <span style={{
                        display: 'inline-block', marginBottom: 16, borderRadius: 999,
                        border: '1px solid rgba(201,168,88,0.2)', backgroundColor: 'rgba(201,168,88,0.05)',
                        padding: '6px 16px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gold,
                    }}>
                        Tecnologia de Ponta
                    </span>
                    <h2 style={{ marginTop: 16, fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 700, color: C.text }}>
                        Infraestrutura <GoldText><em style={{ fontStyle: 'normal' }}>next-gen</em></GoldText>
                    </h2>
                    <p style={{ maxWidth: 640, margin: '16px auto 0', color: C.textMuted }}>
                        Ferramentas de nível institucional, powered by AI e blockchain.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                    {FEATURES.map((f, i) => (
                        <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
                            className="card-3d" style={{ padding: 32 }}
                        >
                            <div style={{
                                display: 'inline-flex', marginBottom: 20, borderRadius: 12,
                                border: '1px solid rgba(201,168,88,0.08)', backgroundColor: '#181c22',
                                padding: 12, color: C.gold,
                            }}>
                                <f.icon size={22} strokeWidth={1.5} />
                            </div>
                            <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600, color: C.text }}>{f.title}</h3>
                            <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textMuted }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

/* ============================================================
   PRICING
   ============================================================ */
const PLANS = [
    {
        name: 'Plano Gratuito', desc: 'Para começar a organizar suas finanças', price: 'R$ 0,00', period: '/mês', hl: false, cta: 'Começar grátis',
        features: ['50 mensagens IA/dia', '10 contas bancárias', 'Dashboard básico', 'Relatórios mensais']
    },
    {
        name: 'Pro', desc: 'Para quem leva finanças a sério', price: 'R$ 19,90', period: '/mês', hl: true, cta: 'Assinar Pro',
        features: ['100 mensagens IA/dia', 'Contas ilimitadas', 'IA Vision (OCR)', 'Relatórios avançados', 'Wealth Lab']
    },
    {
        name: 'Family', desc: 'Para gerir as finanças da casa', price: 'R$ 39,90', period: '/mês', hl: false, cta: 'Assinar Family',
        features: ['200 mensagens IA/dia', 'Até 5 membros', 'Dashboard familiar', 'Metas compartilhadas', 'Suporte prioritário']
    },
]

function Pricing() {
    return (
        <section id="planos" style={{ position: 'relative', padding: '96px 0' }}>
            <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: 64 }}
                >
                    <span style={{
                        display: 'inline-block', marginBottom: 16, borderRadius: 999,
                        border: '1px solid rgba(201,168,88,0.2)', backgroundColor: 'rgba(201,168,88,0.05)',
                        padding: '6px 16px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gold,
                    }}>
                        Planos
                    </span>
                    <h2 style={{ marginTop: 16, fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 700, color: C.text }}>
                        Escolha seu <GoldText><em style={{ fontStyle: 'normal' }}>plano</em></GoldText>
                    </h2>
                    <p style={{ maxWidth: 640, margin: '16px auto 0', color: C.textMuted }}>
                        Transparência total. Sem taxas ocultas. Cancele quando quiser.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6 }}
                            className={plan.hl ? 'card-3d-highlight' : 'card-3d'}
                            style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: 32 }}
                        >
                            {plan.hl && (
                                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                                    <span style={{ borderRadius: 999, background: C.goldGrad, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: C.bg }}>
                                        Mais popular
                                    </span>
                                </div>
                            )}

                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{plan.name}</h3>
                                <p style={{ marginTop: 4, fontSize: 14, fontStyle: 'italic', color: C.textMuted }}>{plan.desc}</p>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <span style={{ fontSize: 36, fontWeight: 700, color: C.text }}>{plan.price}</span>
                                {plan.period && <span style={{ color: C.textMuted }}>{plan.period}</span>}
                            </div>

                            <ul style={{ flex: 1, listStyle: 'none', padding: 0, marginBottom: 32 }}>
                                {plan.features.map((f) => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: C.textMuted, marginBottom: 12 }}>
                                        <Check size={16} style={{ flexShrink: 0, color: C.gold }} /> {f}
                                    </li>
                                ))}
                            </ul>

                            <a href="/register" className={plan.hl ? 'btn-gold' : 'btn-gold-outline'}
                                style={{ textAlign: 'center', fontSize: 14 }}
                            >
                                {plan.cta}
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

/* ============================================================
   CTA
   ============================================================ */
function CTA() {
    return (
        <section id="contato" style={{ position: 'relative', padding: '96px 0' }}>
            <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 24px' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.7 }} className="card-3d-highlight"
                    style={{ padding: 'clamp(48px, 6vw, 64px)', textAlign: 'center' }}
                >
                    <span style={{ display: 'inline-block', marginBottom: 16, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.gold }}>
                        Comece Hoje
                    </span>
                    <h2 style={{ marginTop: 8, fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 700, color: C.text }}>
                        Pronto para transformar{' '}<GoldText>suas finanças?</GoldText>
                    </h2>
                    <p style={{ maxWidth: 560, margin: '24px auto 0', color: C.textMuted }}>
                        Junte-se a milhares de pessoas que já confiam no Neural Finance Hub para alcançar a liberdade financeira.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 40 }}>
                        <a href="/register" className="btn-gold" style={{ padding: '12px 32px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Criar conta gratuita <ArrowRight size={18} />
                        </a>
                        <a href="#contato" className="btn-gold-outline" style={{ padding: '12px 32px', fontSize: 16 }}>
                            Falar com especialista
                        </a>
                    </div>
                    <p style={{ marginTop: 32, fontSize: 12, color: C.textMuted }}>
                        Sem taxas ocultas · Cancele quando quiser · Suporte 24/7
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
    return (
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '64px 0 32px' }}>
            <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 48, marginBottom: 48 }}>
                    <div>
                        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
                            <NextImage src="/logo-neura.png" alt="Logo" width={28} height={28} style={{ borderRadius: 8, objectFit: 'contain' }} />
                            <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Neural Finance <GoldText>Hub</GoldText></span>
                        </a>
                        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
                            O Neural Finance Hub é a evolução definitiva da gestão financeira financeira na nuvem.
                            Utilizamos inteligência artificial preditiva e integração Open Finance para
                            centralizar sua vida, categorizar automaticamente e acelerar sua liberdade financeira.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 20 }}>Funções do Sistema</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: 0 }}>
                                <span style={{ fontSize: 14, color: C.gold, fontWeight: 500 }}>Gestão por IA</span>
                                <span style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Análises inteligentes e chatbot (Gemini)</span>
                            </button>
                            <button style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: 0, marginTop: 8 }}>
                                <span style={{ fontSize: 14, color: C.gold, fontWeight: 500 }}>Open Finance</span>
                                <span style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Sincronização automática com Pluggy</span>
                            </button>
                            <button style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: 0, marginTop: 8 }}>
                                <span style={{ fontSize: 14, color: C.gold, fontWeight: 500 }}>Evolução Patrimonial</span>
                                <span style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Dashboards de investimentos e metas</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 20 }}>Plataforma</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: C.textMuted }}>
                            <a href="#solucoes" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Soluções</a>
                            <a href="#planos" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Planos e Preços</a>
                            <a href="/login" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Entrar na Conta</a>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <p style={{ fontSize: 13, color: C.textMuted }}>© 2026 Neural Finance Hub. Todos os direitos reservados.</p>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13, color: C.textMuted }}>
                        <a href="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Termos de Uso</a>
                        <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Privacidade</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

/* ============================================================
   NEON BACKGROUND EFFECT
   ============================================================ */
import NeonBackground from '@/components/NeonBackground'

/* ============================================================
   LANDING PAGE
   ============================================================ */
export default function HomePage() {
    return (
        <main style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text }}>
            <NeonBackground />
            <Navbar />
            <Hero />
            <div className="divider-gold" style={{ maxWidth: 896, margin: '0 auto' }} />
            <Features />
            <div className="divider-gold" style={{ maxWidth: 896, margin: '0 auto' }} />
            <Pricing />
            <CTA />
            <Footer />
        </main>
    )
}
