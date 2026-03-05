import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Bell, Palette, Shield, LogOut, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                setName(data.user.user_metadata?.display_name || "");
            }
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await supabase.auth.updateUser({ data: { display_name: name } });
        setSaving(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const TABS = [
        { id: "profile", label: "Perfil", icon: User },
        { id: "security", label: "Segurança", icon: Shield },
        { id: "notifications", label: "Notificações", icon: Bell },
        { id: "appearance", label: "Aparência", icon: Palette },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Tabs */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? "sidebar-item-active text-gold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    }`}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/5">
                        <LogOut size={16} /> Sair da conta
                    </button>
                </motion.div>

                {/* Content */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-3d space-y-6 p-6 lg:col-span-3">
                    {activeTab === "profile" && (
                        <>
                            <h3 className="text-lg font-semibold text-foreground">Perfil</h3>

                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold text-2xl font-bold text-background">
                                    {(name || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{name || "Usuário"}</p>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><User size={14} /> Nome</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-gold/40"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail size={14} /> Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm text-muted-foreground outline-none"
                                    />
                                </div>
                            </div>

                            <button onClick={handleSave} disabled={saving} className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Salvar alterações
                            </button>
                        </>
                    )}

                    {activeTab === "security" && (
                        <>
                            <h3 className="text-lg font-semibold text-foreground">Segurança</h3>
                            <div>
                                <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Lock size={14} /> Senha atual</label>
                                <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-gold/40" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Nova senha</label>
                                <input type="password" placeholder="Mínimo 6 caracteres" className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-gold/40" />
                            </div>
                            <button className="btn-gold px-6 py-2.5 text-sm">Atualizar senha</button>
                        </>
                    )}

                    {activeTab === "notifications" && (
                        <>
                            <h3 className="text-lg font-semibold text-foreground">Notificações</h3>
                            {[
                                { label: "Boletos vencendo", desc: "Receba alertas 3 dias antes do vencimento", on: true },
                                { label: "Limite de orçamento", desc: "Aviso quando atingir 80% do orçamento", on: true },
                                { label: "Metas atingidas", desc: "Comemore quando alcançar uma meta", on: true },
                                { label: "Relatórios semanais", desc: "Resumo semanal por email", on: false },
                                { label: "Dicas da IA", desc: "Insights personalizados", on: false },
                            ].map((n) => (
                                <div key={n.label} className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{n.label}</p>
                                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                                    </div>
                                    <div className={`h-6 w-11 cursor-pointer rounded-full p-0.5 transition-colors ${n.on ? "bg-gold" : "bg-border"}`}>
                                        <div className={`h-5 w-5 rounded-full bg-background transition-transform ${n.on ? "translate-x-5" : ""}`} />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === "appearance" && (
                        <>
                            <h3 className="text-lg font-semibold text-foreground">Aparência</h3>
                            <p className="text-sm text-muted-foreground">Tema atual: <span className="font-medium text-gold">Dark Gold (Neural Finance Hub)</span></p>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { name: "Dark Gold", colors: ["#0d0f12", "#C9A858"], active: true },
                                    { name: "Dark Blue", colors: ["#0a0e1a", "#3B82F6"], active: false },
                                    { name: "Dark Green", colors: ["#0a1210", "#10B981"], active: false },
                                ].map((t) => (
                                    <div key={t.name} className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${t.active ? "border-gold/40 bg-gold/5" : "border-border/50 hover:border-border"}`}>
                                        <div className="mx-auto mb-2 flex gap-1">
                                            {t.colors.map((c) => <div key={c} className="h-6 w-6 rounded-full" style={{ backgroundColor: c }} />)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{t.name}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Settings;
