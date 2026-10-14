import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-[500px] bg-gold/5 blur-[120px] rounded-full" />

            <div className="mx-auto max-w-7xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Nexus AI v2.5 Liberada</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-7xl"
                >
                    Seu dinheiro sob <span className="text-gradient-gold">Gestão de Elite</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground"
                >
                    Unimos design premium, inteligência artificial avançada e as melhores ferramentas do Wealth Lab para transformar sua relação com o patrimônio.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <a href="/register" className="btn-gold flex items-center gap-2 px-8 py-4 text-base">
                        Abrir conta gratuita <ArrowRight size={18} />
                    </a>
                    <button className="btn-gold-outline px-8 py-4 text-base">Ver Demonstração</button>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 grid grid-cols-2 gap-8 border-t border-white/5 pt-16 md:grid-cols-4"
                >
                    {[
                        { label: "Usuários Ativos", val: "50k+", icon: Globe },
                        { label: "Patrimônio Gestão", val: "R$ 2B", icon: ShieldCheck },
                        { label: "Análise IA/Dia", val: "100k+", icon: Zap },
                        { label: "Satisfação NPS", val: "98", icon: ArrowRight },
                    ].map((s, i) => (
                        <div key={i} className="text-center">
                            <p className="text-3xl font-bold text-white mb-1">{s.val}</p>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
