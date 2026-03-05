import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold">
                        <Sparkles size={20} className="text-background" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Neural <span className="text-gold">Finance Hub</span></span>
                </div>

                <div className="hidden items-center gap-8 md:flex">
                    {["Funcionalidades", "Soluções", "Nexus IA", "Preços"].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-gold">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <a href="/login" className="text-sm font-medium text-white hover:text-gold transition-colors">Entrar</a>
                    <a href="/register" className="btn-gold px-5 py-2 text-sm">Começar Agora</a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
