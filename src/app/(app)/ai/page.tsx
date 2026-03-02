'use client'

import { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatMessage = {
    id: string
    role: 'user' | 'model'
    text: string
    loading?: boolean
}

const STARTER_PROMPTS = [
    '📊 Analise meus gastos deste mês',
    '💡 Onde posso economizar mais?',
    '🎯 Como atingir minha meta de reserva?',
    '📈 Qual a minha taxa de poupança ideal?',
]

export default function AIPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'model',
            text: '👋 Olá! Sou a **NeuraFin IA**, sua assistente financeira pessoal. Tenho acesso ao seu contexto financeiro em tempo real. Como posso ajudar você hoje?',
        },
    ])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function sendMessage(text: string) {
        if (!text.trim() || isStreaming) return
        setInput('')
        setIsStreaming(true)

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text }
        const aiMsgId = (Date.now() + 1).toString()
        const aiMsg: ChatMessage = { id: aiMsgId, role: 'model', text: '', loading: true }
        setMessages(prev => [...prev, userMsg, aiMsg])

        try {
            const history = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, text: m.text }))

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...history, { role: 'user', text }] }),
            })

            if (!res.ok) throw new Error('Falha na comunicação com IA')

            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    fullText += decoder.decode(value, { stream: true })
                    setMessages(prev =>
                        prev.map(m => m.id === aiMsgId ? { ...m, text: fullText, loading: false } : m)
                    )
                }
            }
        } catch {
            setMessages(prev =>
                prev.map(m =>
                    m.id === aiMsgId
                        ? { ...m, text: '❌ Erro ao conectar com a IA. Tente novamente.', loading: false }
                        : m
                )
            )
        } finally {
            setIsStreaming(false)
            inputRef.current?.focus()
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    function renderText(text: string) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>')
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl neural-gradient flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-semibold text-foreground flex items-center gap-2">
                        NeuraFin IA <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    </h1>
                    <p className="text-xs text-muted-foreground">Assistente financeiro com contexto real</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn('flex gap-3 animate-fade-in', msg.role === 'user' && 'flex-row-reverse')}
                    >
                        <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            msg.role === 'model' ? 'neural-gradient' : 'bg-secondary'
                        )}>
                            {msg.role === 'model' ? <Brain className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-foreground" />}
                        </div>
                        <div className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                            msg.role === 'model'
                                ? 'glass-card text-foreground rounded-tl-none'
                                : 'neural-gradient text-white rounded-tr-none font-medium'
                        )}>
                            {msg.loading ? (
                                <div className="flex gap-1 py-1">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                            ) : (
                                <span dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Starter Prompts */}
            {messages.length <= 1 && (
                <div className="grid grid-cols-2 gap-2 pb-3">
                    {STARTER_PROMPTS.map((prompt) => (
                        <button
                            key={prompt}
                            onClick={() => sendMessage(prompt)}
                            className="btn-ghost text-left text-xs px-3 py-2.5 rounded-xl"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="border-t border-border pt-4">
                <div className="flex gap-3 items-end glass-card px-4 py-3">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pergunte sobre seus gastos, metas ou investimentos..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed"
                        style={{ maxHeight: 120 }}
                    />
                    {isStreaming ? (
                        <button
                            onClick={() => setIsStreaming(false)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim()}
                            className="p-2 rounded-lg neural-gradient text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                    Powered by Gemini · Seus dados são privados e não são usados para treinar IA
                </p>
            </div>
        </div>
    )
}
