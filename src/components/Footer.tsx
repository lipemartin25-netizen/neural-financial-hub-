import { Sparkles } from "lucide-react";

const Footer = () => {
    return (
        <footer className="border-t border-white/5 py-12 bg-background">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
                            <Sparkles size={16} className="text-background" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">Neural <span className="text-gold">Finance Hub</span></span>
                    </div>

                    <div className="flex gap-8 text-sm text-muted-foreground">
                        {["Privacidade", "Termos", "API", "Suporte"].map((item) => (
                            <a key={item} href="#" className="hover:text-gold transition-colors">{item}</a>
                        ))}
                    </div>

                    © {new Date().getFullYear()} Neural Finance Hub. Todos os direitos reservados.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
