'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
    Brain, LayoutDashboard, ArrowLeftRight, CreditCard, Target,
    PiggyBank, FileText, Landmark, Sparkles, GraduationCap,
    Settings, LogOut, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Contas', href: '/accounts', icon: CreditCard },
    { label: 'Orçamentos', href: '/budgets', icon: PiggyBank },
    { label: 'Metas', href: '/goals', icon: Target },
    { label: 'Boletos (DDA)', href: '/boletos', icon: FileText },
    { label: 'Open Finance', href: '/open-finance', icon: Landmark },
    { label: 'Wealth Lab', href: '/wealth-lab', icon: Zap },
    { label: 'Academia IA', href: '/academy', icon: GraduationCap },
    { label: 'NeuraFin IA', href: '/ai', icon: Sparkles },
]

interface SidebarProps {
    profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const supabase = createClient()

    async function handleLogout() {
        setLoggingOut(true)
        await supabase.auth.signOut()
        toast.success('Até logo!')
        router.push('/login')
    }

    return (
        <aside
            className={cn(
                'relative flex flex-col border-r transition-all duration-300',
                'border-white/5 bg-card',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center gap-3 px-4 py-5 border-b border-white/5',
                collapsed ? 'justify-center' : ''
            )}>
                <div className="w-8 h-8 rounded-lg neural-gradient flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in">
                        <div className="text-sm font-bold leading-tight neural-gradient-text">NeuraFin</div>
                        <div className="text-xs text-muted-foreground">Hub</div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link key={href} href={href}>
                            <div
                                className={cn('sidebar-item', isActive && 'active', collapsed && 'justify-center px-2')}
                                title={collapsed ? label : undefined}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {!collapsed && (
                                    <span className="animate-fade-in">{label}</span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom: Profile + Settings */}
            <div className="px-2 py-4 border-t border-white/5 space-y-0.5">
                <Link href="/settings">
                    <div className={cn('sidebar-item', collapsed && 'justify-center px-2')}>
                        <Settings className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>Configurações</span>}
                    </div>
                </Link>

                {/* Profile */}
                {!collapsed && profile && (
                    <div className="flex items-center gap-3 px-3 py-2 mt-1">
                        <div className="w-8 h-8 rounded-full neural-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {profile.full_name?.[0]?.toUpperCase() ?? profile.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">
                                {profile.full_name ?? 'Usuário'}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">{profile.email}</div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn('sidebar-item w-full text-red-400/70 hover:text-red-400', collapsed && 'justify-center px-2')}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Sair</span>}
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
                title={collapsed ? 'Expandir' : 'Recolher'}
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
        </aside>
    )
}
