import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Sparkles, ArrowRight, Github, Chrome, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (!error) navigate("/dashboard");
        setLoading(false);
    };

    const socialLogin = async (provider: 'google' | 'github') => {
        await supabase.auth.signInWithOAuth({ provider });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 overflow-hidden relative" style={{ backgroundColor: '#0b0d10', color: '#ebe6da' }}>
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gold/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-gold/5 blur-[100px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold">
                        <Sparkles size={24} className="text-background" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Aurum<span className="text-gold">Finance</span></h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isLogin ? "Bem-vindo de volta à elite" : "Crie sua conta e comece a evoluir"}
                    </p>
                </div>

                <div className="card-3d p-8">
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full rounded-xl border border-white/5 bg-secondary px-12 py-3.5 text-sm text-white placeholder-muted-foreground outline-none focus:border-gold/40 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Senha</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-white/5 bg-secondary px-12 py-3.5 text-sm text-white placeholder-muted-foreground outline-none focus:border-gold/40 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <a href="#" className="text-xs text-gold/80 hover:text-gold transition-colors">Esqueceu a senha?</a>
                            </div>
                        )}

                        <button disabled={loading} className="btn-gold group mt-4 flex w-full items-center justify-center gap-2 py-4">
                            {loading ? "Processando..." : (isLogin ? "Entrar" : "Criar Conta")}
                            {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                        </button>
                    </form>

                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ou continue com</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => socialLogin('google')} className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-secondary py-3 text-sm font-medium text-white hover:bg-white/5 transition-all">
                            <Chrome size={18} /> Google
                        </button>
                        <button onClick={() => socialLogin('github')} className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-secondary py-3 text-sm font-medium text-white hover:bg-white/5 transition-all">
                            <Github size={18} /> GitHub
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    {isLogin ? "Não tem uma conta?" : "Já possui conta?"}{" "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-bold text-gold hover:underline"
                    >
                        {isLogin ? "Cadastre-se" : "Entrar"}
                    </button>
                </p>

                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-gold" />
                    Conexão Segura AES-256
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
