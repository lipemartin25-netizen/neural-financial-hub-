import { motion } from "framer-motion";
import {
    LayoutDashboard, Receipt, CreditCard, Banknote, Building2,
    TrendingUp, Wallet, Activity, Target, BarChart3,
    Sparkles, FlaskConical, Settings, LogOut, ChevronLeft, ChevronRight, Menu
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const MENU = [
    {
        group: "Dashboard", items: [
            { name: "Início", path: "/dashboard", icon: LayoutDashboard },
            { name: "Transações", path: "/transactions", icon: Receipt },
            { name: "Cartões", path: "/cards", icon: CreditCard },
            { name: "Boletos", path: "/boletos", icon: Banknote },
            { name: "Contas", path: "/accounts", icon: Building2 },
        ]
    },
    {
        group: "Análise", items: [
            { name: "Investimentos", path: "/investments", icon: TrendingUp },
            { name: "Patrimônio", path: "/patrimonio", icon: Wallet },
            { name: "Orçamentos", path: "/budgets", icon: BarChart3 },
            { name: "Relatórios", path: "/reports", icon: Activity },
            { name: "Aposentadoria", path: "/aposentadoria", icon: Sparkles },
        ]
    },
    {
        group: "Explorar", items: [
            { name: "Nexus AI", path: "/ai", icon: Sparkles, highlight: true },
            { name: "Metas", path: "/goals", icon: Target },
            { name: "Wealth Lab", path: "/wealth-lab", icon: FlaskConical },
        ]
    },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <motion.div
            animate={{ width: collapsed ? 80 : 280 }}
            className="fixed left-0 top-0 h-full border-r border-white/5 bg-background p-4 z-40 transition-all overflow-hidden flex flex-col"
        >
            {/* Brand */}
            <div className="mb-8 flex items-center gap-3 px-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-gold">
                    <Sparkles size={20} className="text-background" />
                </div>
                {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-white">
                        Neural <span className="text-gold">Finance Hub</span>
                    </motion.span>
                )}
            </div>

            {/* Menu Sections */}
            <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                {MENU.map((section) => (
                    <div key={section.group}>
                        {!collapsed && (
                            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {section.group}
                            </p>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = location.pathname === item.path;
                                return (
                                    <Link key={item.name} to={item.path}>
                                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${active ? "sidebar-item-active text-gold bg-white/5" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                            } ${item.highlight ? "animate-pulse-slow border border-gold/20" : ""}`}>
                                            <Icon size={20} className={`shrink-0 ${active || item.highlight ? "text-gold" : "group-hover:text-gold"}`} />
                                            {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                                            {collapsed && active && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold rounded-r-full" />
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Settings */}
            <div className="mt-auto space-y-1 pt-4 border-t border-white/5">
                <Link to="/settings">
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${location.pathname === "/settings" ? "sidebar-item-active text-gold" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        <Settings size={20} className="shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">Configurações</span>}
                    </div>
                </Link>
                <button onClick={() => setCollapsed(!collapsed)} className="flex w-full items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground rounded-xl transition-all">
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    {!collapsed && <span className="text-sm font-medium">Recolher</span>}
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
