import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PLANS = [
    { name: "Basic", price: "0", desc: "Perfeito para começar", features: ["1 Conta bancária", "Controle de despesas", "Relatórios básicos", "App mobile"] },
    { name: "Premium", price: "29", desc: "O mais escolhido", recommended: true, features: ["Bancos ilimitados", "Nexus IA (50 pergs)", "Wealth Lab Completo", "Exportação avançada", "Suporte 24/7"] },
    { name: "Elite", price: "97", desc: "Para alta performance", features: ["Tudo do Premium", "Nexus IA Ilimitada", "Assessoria Exclusiva", "Cashback em parceiros", "Acesso antecipado"] },
];

const Pricing = () => {
    return (
        <section id="preços" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gold mb-3">Planos</h2>
                    <p className="text-3xl font-bold text-white sm:text-4xl">Escolha seu nível de evolução</p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`card-3d relative flex flex-col p-8 ${plan.recommended ? "border-gold/40 bg-gold/5" : ""}`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                                    Recomendado
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-sm font-medium text-white">R$</span>
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-sm text-muted-foreground">/mês</span>
                            </div>

                            <ul className="mt-8 space-y-4 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Check size={14} className="text-gold" /> {f}
                                    </li>
                                ))}
                            </ul>

                            <button className={`mt-10 w-full py-3 rounded-xl font-bold transition-all ${plan.recommended ? "btn-gold" : "btn-gold-outline"}`}>
                                Selecionar {plan.name}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
