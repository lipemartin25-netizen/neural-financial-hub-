'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard, ArrowLeftRight, CreditCard, FileText, Building2,
    TrendingUp, PieChart, Heart, Target, BarChart3, Bot, FlaskConical,
    Settings, Menu, X, LogOut, Bell, ChevronLeft,
} from 'lucide-react'
import { C, cardStyle, btnGoldStyle } from '@/lib/theme'
import GoldText from './GoldText'

const MENU = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Transações', icon: ArrowLeftRight, href: '/transactions' },
    { label: 'Cartões', icon: CreditCard, href: '/cards' },
    { label: 'Contas a Pagar', icon: FileText, href: '/boletos' },
    { label: 'Saldos & Bancos', icon: Building2, href: '/accounts' },
    { label: 'Investimentos', icon: TrendingUp, href: '/investments' },
    { label: 'Patrimônio', icon: PieChart, href: '/patrimony' },
    { label: 'Saúde Financeira', icon: Heart, href: '/health' },
    { label: 'Orçamentos', icon: Target, href: '/budgets' },
    { label: 'Metas', icon: Target, href: '/goals' },
    { label: 'Relatórios', icon: BarChart3, href: '/reports' },
    { label: 'Assistente IA', icon: Bot, href: '/ai' },
    { label: 'Wealth Lab', icon: FlaskConical, href: '/wealth-lab', highlight: true },
    { label: 'Configurações', icon: Settings, href: '/settings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.bg, color: C.text }}>
            {/* Sidebar — Desktop */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0, left: 0, bottom: 0,
                    width: sidebarOpen ? 260 : 72,
                    backgroundColor: '#0d0f14',
                    borderRight: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                    zIndex: 40,
                    overflow: 'hidden',
                }}
                className="hidden lg:flex"
            >
                {/* Logo */}
                <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.goldGrad, flexShrink: 0 }} />
                        {sidebarOpen && (
                            <span style={{ fontSize: 16, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>
                                Aurum<GoldText>Fin</GoldText>
                            </span>
                        )}
                    </Link>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}>
                        <ChevronLeft size={16} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
                    </button>
                </div>

                {/* Menu */}
                <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {MENU.map((item) => {
                        const active = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: sidebarOpen ? '10px 12px' : '10px 0',
                                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                    marginBottom: 2,
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: active ? 600 : 400,
                                    color: active ? C.gold : C.textMuted,
                                    backgroundColor: active ? 'rgba(201,168,88,0.08)' : 'transparent',
                                    borderLeft: active ? `2px solid ${C.gold}` : '2px solid transparent',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    ...(item.highlight && !active ? { animation: 'gold-pulse 3s infinite' } : {}),
                                }}
                            >
                                <Icon size={18} style={{ flexShrink: 0 }} />
                                {sidebarOpen && item.label}
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Mobile Header */}
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    height: 56,
                    backgroundColor: 'rgba(11,13,16,0.9)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    zIndex: 50,
                }}
                className="lg:hidden"
            >
                <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer' }}>
                    <Menu size={22} />
                </button>
                <span style={{ fontWeight: 700, color: C.text }}>Aurum<GoldText>Fin</GoldText></span>
                <Bell size={18} style={{ color: C.textMuted }} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden"
                >
                    <div
                        style={{
                            width: 280,
                            height: '100%',
                            backgroundColor: '#0d0f14',
                            borderRight: `1px solid ${C.border}`,
                            padding: 16,
                            overflowY: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <span style={{ fontWeight: 700, color: C.text, fontSize: 16 }}>Aurum<GoldText>Fin</GoldText></span>
                            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        {MENU.map((item) => {
                            const active = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                                        marginBottom: 2, borderRadius: 10, fontSize: 13,
                                        fontWeight: active ? 600 : 400,
                                        color: active ? C.gold : C.textMuted,
                                        backgroundColor: active ? 'rgba(201,168,88,0.08)' : 'transparent',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <Icon size={18} /> {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    marginLeft: sidebarOpen ? 260 : 72,
                    padding: 24,
                    minHeight: '100vh',
                    transition: 'margin-left 0.3s ease',
                }}
                className="ml-0 pt-[72px] lg:ml-auto lg:pt-0"
            >
                {children}
            </main>
        </div>
    )
}
