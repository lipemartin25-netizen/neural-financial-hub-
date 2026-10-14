import { motion } from "framer-motion";
import {
    TrendingUp, TrendingDown, Wallet, CreditCard,
    ArrowUpRight, ArrowDownRight, Clock, Target,
    Sparkles, ChevronRight, PieChart, Activity, ArrowRight
} from "lucide-react";

const DashboardContent = () => {
    const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="space-y-6">
            {/* Welcome & Main Stats */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:items-end">
                <div className="lg:col-span-1">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-2xl font-bold text-foreground">Olá, Felipe</h1>
                        <p className="text-sm text-muted-foreground">Seu patrimônio subiu 2.4% este mês.</p>
                    </motion.div>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:col-span-3">
                    {[
                        { label: "Patrimônio", value: 342890.50, trend: "+R$ 8.4k", icon: Wallet, color: "text-gold" },
                        { label: "Gasto Mensal", value: 12450.32, trend: "-15%", icon: TrendingDown, color: "text-red-400" },
                        { label: "Receita", value: 18500.00, trend: "+12%", icon: TrendingUp, color: "text-emerald-400" },
                        { label: "Investido", value: 215300.20, trend: "+R$ 3.2k", icon: Activity, color: "text-gold" },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="card-3d p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <s.icon size={14} className={s.color} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
                            </div>
                            <p className="text-lg font-bold text-foreground">{fmt(s.value)}</p>
                            <span className={`text-[10px] font-bold ${s.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {s.trend}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Chart Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card-3d p-6 lg:col-span-2 min-h-[300px] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <PieChart size={18} className="text-gold" /> Evolução Patrimonial
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gold" />
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Patrimônio</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-2 lg:gap-4 px-2">
                        {[30, 45, 40, 60, 55, 75, 70, 85, 80, 95, 90, 100].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.05, duration: 1 }}
                                    className="w-full bg-gradient-gold opacity-30 group-hover:opacity-60 rounded-t-sm transition-all"
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    <p className="text-[10px] font-bold text-gold">{fmt(200000 + h * 1000)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Insight Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="card-3d-highlight p-6 border-gold/40 bg-gold/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-gold" />
                            <h3 className="font-bold text-foreground">Nexus IA Insight</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Notamos que seus gastos em <strong>Restaurantes</strong> subiram 15% esta semana. Se mantiver esse ritmo, você pode comprometer sua meta de <strong>Viagem Europa</strong> em 2 meses.
                        </p>
                        <button className="mt-6 flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-widest hover:gap-3 transition-all">
                            Ver análise completa <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="card-3d p-6">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Próximos Boletos</h3>
                        <div className="space-y-3">
                            {[
                                { name: "Aluguel", date: "Dia 05", val: 3500 },
                                { name: "Condomínio", date: "Dia 10", val: 850 },
                            ].map((b, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-gold" />
                                        <div>
                                            <p className="text-xs font-medium text-foreground">{b.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{b.date}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-foreground">{fmt(b.val)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Grid lower */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Transactions */}
                <div className="card-3d p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-foreground">Transações Recentes</h3>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-gold hover:underline">Ver todas</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: "Supermercado", date: "Hoje, 14:20", amount: -450.32, cat: "Alimentos" },
                            { name: "Salário Nexus", date: "Ontem", amount: 18500.00, cat: "Receita" },
                            { name: "Uber", date: "28 Fev", amount: -42.90, cat: "Transporte" },
                            { name: "Netflix", date: "27 Fev", amount: -55.90, cat: "Streaming" },
                        ].map((t, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${t.amount > 0 ? 'bg-emerald-500/10' : 'bg-secondary'}`}>
                                        {t.amount > 0 ? <ArrowUpRight size={18} className="text-emerald-400" /> : <ArrowDownRight size={18} className="text-red-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{t.date} · {t.cat}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                                    {t.amount > 0 ? '+' : ''}{fmt(t.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Meta */}
                <div className="card-3d p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-6">Meta Principal</h3>
                    <div className="text-center mb-6">
                        <div className="relative inline-flex items-center justify-center">
                            <svg className="h-32 w-32 border-gold/10">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset="120" className="text-gold" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-foreground">65%</span>
                                <span className="text-[8px] uppercase font-bold text-muted-foreground">Concluído</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-center text-foreground">Viagem Europa 2026</p>
                        <p className="text-[10px] text-center text-muted-foreground">Faltam R$ 12.450 para atingir seu objetivo.</p>
                    </div>
                    <button className="btn-gold w-full mt-6 py-2.5 text-xs">Aportar Agora</button>
                </div>
            </div>
        </div>
    );
};

export default DashboardContent;
