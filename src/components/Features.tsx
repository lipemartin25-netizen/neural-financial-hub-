import { motion } from "framer-motion";
import { Sparkles, Layout, Shield, PieChart, Zap, Globe } from "lucide-react";

const ITEMS = [
    { title: "Design 3D Premium", desc: "Interface imersiva que torna a gestão financeira prazerosa e intuitiva.", icon: Layout },
    { title: "Nexus IA", desc: "Consultoria personalizada baseada em seus hábitos reais de consumo.", icon: Sparkles },
    { title: "Segurança Bancária", desc: "Criptografia de ponta a ponta e total privacidade dos seus dados.", icon: Shield },
    { title: "Wealth Lab", desc: "Simuladores avançados para independência financeira e aportes.", icon: PieChart },
    { title: "Open Finance", desc: "Conecte todos os seus bancos e cartões em segundos automaticamente.", icon: Zap },
    { title: "Dashboard Global", desc: "Visão 360 do seu patrimônio, ativos, passivos e investimentos.", icon: Globe },
];

const Features = () => {
    return (
        <section id="funcionalidades" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gold mb-3">Tecnologia</h2>
                    <p className="text-3xl font-bold text-white sm:text-4xl">Tudo que você precisa para dominar o jogo</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {ITEMS.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="card-3d group p-8"
                            >
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-background transition-all duration-300">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Features;
