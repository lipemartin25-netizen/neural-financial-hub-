import { motion } from "framer-motion";

const CTA = () => {
    return (
        <section className="py-24">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="card-3d-highlight relative overflow-hidden rounded-3xl bg-gold/10 p-12 text-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-transparent opacity-50" />
                    <h2 className="relative text-3xl font-bold text-white sm:text-5xl">Pronto para assumir o controle?</h2>
                    <p className="relative mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                        Junte-se a milhares de usuários que transformaram suas vidas financeiras com a inteligência da Nexus.
                    </p>
                    <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <a href="/register" className="btn-gold px-10 py-4 text-base">Criar Conta Grátis</a>
                        <button className="btn-gold-outline px-10 py-4 text-base">Falar com Consultor</button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;
