'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard, ArrowLeftRight, CreditCard, FileText, Building2,
    TrendingUp, PieChart, Heart, Target, BarChart3, Bot, FlaskConical,
    Settings, Menu, X, LogOut, ChevronLeft, DollarSign, Repeat, Zap,
    TrendingDown, FileUp, Users, Trophy, Sun, Moon, Wifi, Shield,
} from 'lucide-react'
import { getThemeColors } from '@/lib/themeColors'
import GoldText from './GoldText'
import NotificationCenter from './NotificationCenter'
// PWA install popup removido
import { useApp } from '@/contexts/AppContext'
import { LOCALES } from '@/lib/i18n'

const MENU_KEYS = [
    { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { key: 'nav.transactions', icon: ArrowLeftRight, href: '/transactions' },
    { key: 'nav.cards', icon: CreditCard, href: '/cards' },
    { key: 'nav.boletos', icon: FileText, href: '/boletos' },
    { key: 'nav.accounts', icon: Building2, href: '/accounts' },
    { key: 'nav.open_finance', icon: Wifi, href: '/open-finance', highlight: true },
    { key: 'nav.investments', icon: TrendingUp, href: '/investments' },
    { key: 'nav.patrimony', icon: PieChart, href: '/patrimonio' },
    { key: 'nav.health', icon: Heart, href: '/health' },
    { key: 'nav.budgets', icon: DollarSign, href: '/budgets' },
    { key: 'nav.goals', icon: Target, href: '/goals' },
    { key: 'nav.emergency_fund', icon: Shield, href: '/emergency-fund' },
    { key: 'nav.subscriptions', icon: Repeat, href: '/subscriptions' },
    { key: 'nav.family', icon: Users, href: '/family' },
    { key: 'nav.achievements', icon: Trophy, href: '/achievements' },
    { key: 'nav.debt_planner', icon: TrendingDown, href: '/debt-planner' },
    { key: 'nav.reports', icon: BarChart3, href: '/reports' },
    { key: 'nav.import', icon: FileUp, href: '/import-statement' },
    { key: 'nav.rules', icon: Zap, href: '/rules' },
    { key: 'nav.ai', icon: Bot, href: '/ai' },
    { key: 'nav.wealth_lab', icon: FlaskConical, href: '/wealth-lab' },
    { key: 'nav.settings', icon: Settings, href: '/settings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { t, theme, setTheme, locale, setLocale } = useApp()
    const TC = getThemeColors(theme)

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    useEffect(() => { setMobileOpen(false) }, [pathname])

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { }
        router.push('/login')
    }

    const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
        const showLabel = mobile || sidebarOpen
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{
                    padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: `1px solid ${TC.border}`,
                }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: TC.goldGrad, flexShrink: 0 }} />
                        {showLabel && (
                            <span style={{ fontSize: 16, fontWeight: 700, color: TC.text, whiteSpace: 'nowrap' }}>
                                Neural Finance <GoldText>Hub</GoldText>
                            </span>
                        )}
                    </Link>
                    {mobile ? (
                        <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TC.textMuted, padding: 4 }}>
                            <X size={18} />
                        </button>
                    ) : (
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TC.textMuted, padding: 4 }}>
                            <ChevronLeft size={16} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
                        </button>
                    )}
                </div>

                {/* Theme + Language (compact) */}
                {showLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderBottom: `1px solid ${TC.border}` }}>
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                            style={{
                                padding: '5px 8px', borderRadius: 8, border: `1px solid ${TC.border}`,
                                background: 'none', cursor: 'pointer', color: TC.gold, display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 11,
                            }}>
                            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                        </button>
                        {LOCALES.map(l => (
                            <button key={l.value} onClick={() => setLocale(l.value)}
                                style={{
                                    padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                    fontSize: 14, background: locale === l.value ? 'rgba(201,168,88,0.1)' : 'none',
                                    opacity: locale === l.value ? 1 : 0.5,
                                }}>
                                {l.flag}
                            </button>
                        ))}
                    </div>
                )}

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {MENU_KEYS.map((item) => {
                        const active = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href} title={!showLabel ? t(item.key) : undefined}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: showLabel ? '10px 12px' : '10px 0',
                                    justifyContent: showLabel ? 'flex-start' : 'center',
                                    marginBottom: 2, borderRadius: 10, fontSize: 13,
                                    fontWeight: active ? 600 : 400,
                                    color: active ? TC.gold : TC.textMuted,
                                    backgroundColor: active ? `rgba(201,168,88,0.08)` : 'transparent',
                                    borderLeft: active ? `2px solid ${TC.gold}` : '2px solid transparent',
                                    textDecoration: 'none', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                                }}
                            >
                                <Icon size={18} style={{ flexShrink: 0 }} />
                                {showLabel && t(item.key)}
                                {showLabel && item.highlight && (
                                    <span style={{
                                        marginLeft: 'auto', padding: '2px 6px', borderRadius: 999,
                                        fontSize: 9, fontWeight: 600, color: TC.bg, background: TC.goldGrad,
                                    }}>NEW</span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: '12px 8px', borderTop: `1px solid ${TC.border}` }}>
                    <button onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                            padding: showLabel ? '10px 12px' : '10px 0',
                            justifyContent: showLabel ? 'flex-start' : 'center',
                            background: 'none', border: 'none', borderRadius: 10,
                            fontSize: 13, color: TC.red, cursor: 'pointer', transition: 'background 0.2s',
                        }}
                    >
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        {showLabel && t('nav.logout')}
                    </button>
                </div>
            </div>
        )
    }

    const sidebarBg = theme === 'light' ? '#faf8f4' : '#0d0f14'

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: TC.bg, color: TC.text }}>
            {/* Desktop Sidebar */}
            {!isMobile && (
                <aside style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0,
                    width: sidebarOpen ? 260 : 72, backgroundColor: sidebarBg,
                    borderRight: `1px solid ${TC.border}`, transition: 'width 0.3s ease',
                    zIndex: 40, overflow: 'hidden',
                }}>
                    <SidebarContent />
                </aside>
            )}

            {/* Mobile Header */}
            {isMobile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: 56,
                    backgroundColor: theme === 'light' ? 'rgba(245,243,238,0.9)' : 'rgba(11,13,16,0.9)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${TC.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', zIndex: 50,
                }}>
                    <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: TC.text, cursor: 'pointer' }}>
                        <Menu size={22} />
                    </button>
                    <Link href="/dashboard" style={{ textDecoration: 'none', fontWeight: 700, color: TC.text }}>
                        Neural Finance <GoldText>Hub</GoldText>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: TC.gold, padding: 2 }}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <NotificationCenter />
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {isMobile && mobileOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setMobileOpen(false)}>
                    <div style={{ width: 280, height: '100%', backgroundColor: sidebarBg, borderRight: `1px solid ${TC.border}` }}
                        onClick={(e) => e.stopPropagation()}>
                        <SidebarContent mobile />
                    </div>
                </div>
            )}

            {/* Desktop Notification */}
            {!isMobile && (
                <div style={{ position: 'fixed', top: 16, right: 24, zIndex: 45 }}>
                    <NotificationCenter />
                </div>
            )}

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : (sidebarOpen ? 260 : 72),
                paddingTop: isMobile ? 72 : 24,
                padding: isMobile ? '72px 16px 24px' : 24,
                minHeight: '100vh', transition: 'margin-left 0.3s ease',
            }}>
                {children}
            </main>

        </div>
    )
}
