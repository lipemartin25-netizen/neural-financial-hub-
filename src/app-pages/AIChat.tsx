'use client'
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, User, Loader2, ArrowRight } from "lucide-react";
import { C } from "@/lib/theme";

type Message = { role: "user" | "ai"; content: string };

const STARTERS = [
    "📊 Analise meu orçamento atual",
    "📈 Qual meu patrimônio líquido?",
    "🏖️ Quando posso me aposentar?",
    "💡 Como reduzir meus gastos?",
];

const AIChat = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Olá! Sou o **Nexus AI**, seu mentor financeiro. Acabei de analisar seus novos orçamentos, metas e patrimônio. Como posso te guiar hoje?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { role: "user", content: text };
        setMessages((m) => [...m, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({
                        role: m.role === 'ai' ? 'model' : 'user',
                        text: m.content
                    }))
                })
            });

            if (!response.ok) throw new Error('Falha na resposta da IA');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let aiContent = "";

            setMessages((m) => [...m, { role: "ai", content: "" }]);

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = decoder.decode(value);
                aiContent += chunk;

                setMessages((m) => {
                    const last = m[m.length - 1];
                    const rest = m.slice(0, -1);
                    return [...rest, { ...last, content: aiContent }];
                });
            }
        } catch (error) {
            console.error(error);
            setMessages((m) => [...m, { role: "ai", content: "⚠️ Desculpe, tive um problema de conexão. Poderia repetir?" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 p-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Nexus AI <span className="text-[10px] font-medium bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded ml-2 uppercase">Beta</span></h1>
                    <p className="text-xs text-gray-400">Inteligência Preditiva & Mentoria</p>
                </div>
            </div>

            {/* Chat Box */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'ai' ? 'bg-amber-500/10 text-amber-500' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                                </div>

                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'ai'
                                        ? 'bg-white/[0.03] border border-white/5 text-gray-200'
                                        : 'bg-amber-500 text-black font-medium'
                                    }`}>
                                    {msg.content ? (
                                        <div className="whitespace-pre-wrap">
                                            {msg.content.split('**').map((part, k) =>
                                                k % 2 === 1 ? <strong key={k} className="text-amber-400">{part}</strong> : part
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 py-1">
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={endRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                    {STARTERS.map(s => (
                        <button
                            key={s}
                            onClick={() => sendMessage(s)}
                            className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-full text-xs transition-colors flex items-center gap-2 group"
                        >
                            {s} <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="relative mt-auto pt-4 border-t border-white/5 bg-background">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    placeholder="Nexus conhece suas finanças. Pergunte qualquer coisa..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                />
                <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-[24px] w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
};

export default AIChat;
