'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, User, Loader2, Sparkles, Trash2, RotateCcw } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle } from '@/lib/theme'

type Msg = { role: 'user' | 'ai'; text: string }

const SUGGESTIONS = [
    '📊 Resuma meus gastos do mês',
    '💡 Como posso economizar mais?',
    '📈 Analise minha carteira de investimentos',
    '🎯 Como estão minhas metas?',
    '💳 Qual a situação dos meus cartões?',
    '📋 Tenho boletos a vencer?',
]

const WELCOME_MSG = `Olá! Sou a **NeuraFin IA** 🧠✨, sua consultora financeira pessoal.

Tenho acesso completo às suas finanças em tempo real — contas, transações, investimentos, metas, orçamentos e muito mais.

Como posso te ajudar hoje?`

export default function AIPage() {
    const [messages, setMessages] = useState<Msg[]>([
        { role: 'ai', text: WELCOME_MSG },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [streamingText, setStreamingText] = useState('')
    const endRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingText])

    const send = useCallback(async (text: string) => {
        const trimmed = text.trim()
        if (!trimmed || loading) return

        // Adicionar mensagem do usuário
        const userMsg: Msg = { role: 'user', text: trimmed }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)
        setStreamingText('')

        // Montar histórico para API (converter formato)
        const apiMessages = [...messages.filter(m => m.role !== 'ai' || m !== messages[0]), userMsg].map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            text: m.text,
        }))

        // Abort controller para cancelar se necessário
        abortRef.current = new AbortController()

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
                signal: abortRef.current.signal,
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || `HTTP ${res.status}`)
            }

            // Ler streaming
            const reader = res.body?.getReader()
            if (!reader) throw new Error('No reader')

            const decoder = new TextDecoder()
            let fullText = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                fullText += chunk
                setStreamingText(fullText)
            }

            // Streaming completo — adicionar como mensagem final
            setMessages(prev => [...prev, { role: 'ai', text: fullText }])
            setStreamingText('')
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Cancelado pelo usuário
                setStreamingText('')
            } else {
                const errorMsg = '⚠️ Desculpe, não consegui processar sua pergunta. Verifique sua conexão e tente novamente.'
                setMessages(prev => [...prev, { role: 'ai', text: errorMsg }])
                setStreamingText('')
            }
        } finally {
            setLoading(false)
            abortRef.current = null
            inputRef.current?.focus()
        }
    }, [messages, loading])

    const handleClear = useCallback(() => {
        // Cancelar streaming ativo
        if (abortRef.current) abortRef.current.abort()
        setMessages([{ role: 'ai', text: WELCOME_MSG }])
        setStreamingText('')
        setLoading(false)
        setInput('')
    }, [])

    const handleRetry = useCallback(() => {
        // Reenviar última mensagem do usuário
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
        if (lastUserMsg) {
            // Remover última resposta da IA
            setMessages(prev => {
                const copy = [...prev]
                if (copy[copy.length - 1]?.role === 'ai') copy.pop()
                if (copy[copy.length - 1]?.role === 'user') copy.pop()
                return copy
            })
            setTimeout(() => send(lastUserMsg.text), 100)
        }
    }, [messages, send])

    // Renderizar texto com Markdown básico (negrito, listas)
    const renderText = (text: string) => {
        return text
            .split('\n')
            .map((line, i) => {
                // Negrito
                let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                // Itálico
                processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')

                return (
                    <span key={i}>
                        <span dangerouslySetInnerHTML={{ __html: processed }} />
                        {i < text.split('\n').length - 1 && <br />}
                    </span>
                )
            })
    }

    const showSuggestions = messages.length <= 1 && !loading

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: C.goldGrad,
                        }}>
                            <Sparkles size={18} style={{ color: C.bg }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>NeuraFin IA</h1>
                            <p style={{ fontSize: 12, color: C.textMuted }}>Consultora financeira pessoal com dados em tempo real</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {messages.length > 1 && (
                        <button onClick={handleRetry} title="Repetir última pergunta" style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8,
                            background: 'none', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer',
                            fontSize: 12, transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,88,0.3)'; e.currentTarget.style.color = C.gold }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted }}
                        >
                            <RotateCcw size={14} /> Repetir
                        </button>
                    )}
                    {messages.length > 1 && (
                        <button onClick={handleClear} title="Limpar conversa" style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8,
                            background: 'none', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer',
                            fontSize: 12, transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = C.red }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted }}
                        >
                            <Trash2 size={14} /> Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1, overflowY: 'auto', paddingBottom: 16, paddingRight: 4,
                scrollbarWidth: 'thin', scrollbarColor: `${C.secondary} transparent`,
            }}>
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: 'flex', gap: 12, marginBottom: 16,
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            {msg.role === 'ai' && (
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: C.goldGrad, flexShrink: 0,
                                }}>
                                    <Bot size={18} style={{ color: C.bg }} />
                                </div>
                            )}
                            <div style={{
                                maxWidth: '75%', padding: 16, borderRadius: 16,
                                ...(msg.role === 'user'
                                    ? { background: C.goldGrad, color: C.bg, borderBottomRightRadius: 4 }
                                    : {
                                        background: C.cardGrad,
                                        border: `1px solid ${C.borderGold}`,
                                        borderBottomLeftRadius: 4,
                                        color: C.text,
                                    }),
                            }}>
                                <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {renderText(msg.text)}
                                </div>
                            </div>
                            {msg.role === 'user' && (
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: C.secondary, flexShrink: 0,
                                }}>
                                    <User size={18} style={{ color: C.textMuted }} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Streaming em progresso */}
                {loading && streamingText && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', gap: 12, marginBottom: 16 }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: C.goldGrad, flexShrink: 0,
                        }}>
                            <Bot size={18} style={{ color: C.bg }} />
                        </div>
                        <div style={{
                            maxWidth: '75%', padding: 16, borderRadius: 16,
                            background: C.cardGrad, border: `1px solid ${C.borderGold}`,
                            borderBottomLeftRadius: 4, color: C.text,
                        }}>
                            <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                {renderText(streamingText)}
                                <span style={{
                                    display: 'inline-block', width: 6, height: 16, backgroundColor: C.gold,
                                    marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom',
                                }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Loading indicator (antes do streaming começar) */}
                {loading && !streamingText && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', gap: 12, marginBottom: 16 }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: C.goldGrad, flexShrink: 0,
                        }}>
                            <Bot size={18} style={{ color: C.bg }} />
                        </div>
                        <div style={{
                            ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', gap: 10,
                            borderBottomLeftRadius: 4,
                        }}>
                            <Loader2 size={16} style={{ color: C.gold, animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: 13, color: C.textMuted }}>Analisando seus dados financeiros...</span>
                        </div>
                    </motion.div>
                )}

                <div ref={endRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}
                >
                    {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => send(s)} style={{
                            padding: '8px 14px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                            backgroundColor: 'rgba(201,168,88,0.05)', border: '1px solid rgba(201,168,88,0.15)',
                            color: C.gold, transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(201,168,88,0.1)'
                                e.currentTarget.style.borderColor = 'rgba(201,168,88,0.3)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(201,168,88,0.05)'
                                e.currentTarget.style.borderColor = 'rgba(201,168,88,0.15)'
                            }}
                        >{s}</button>
                    ))}
                </motion.div>
            )}

            {/* Input Bar */}
            <div style={{
                display: 'flex', gap: 12, paddingTop: 12,
                borderTop: `1px solid ${C.border}`,
            }}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            send(input)
                        }
                    }}
                    placeholder="Pergunte sobre suas finanças..."
                    disabled={loading}
                    style={{
                        ...inputStyle,
                        flex: 1,
                        opacity: loading ? 0.6 : 1,
                    }}
                />
                <button
                    onClick={() => loading ? abortRef.current?.abort() : send(input)}
                    style={{
                        width: 48, height: 48, borderRadius: 12, border: 'none',
                        cursor: (input.trim() || loading) ? 'pointer' : 'default',
                        background: loading ? 'rgba(248,113,113,0.15)' : input.trim() ? C.goldGrad : C.secondary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: (input.trim() || loading) ? 1 : 0.5,
                        transition: 'all 0.2s',
                    }}
                    title={loading ? 'Cancelar' : 'Enviar'}
                >
                    {loading ? (
                        <div style={{
                            width: 16, height: 16, borderRadius: 3, backgroundColor: C.red,
                        }} />
                    ) : (
                        <Send size={18} style={{ color: input.trim() ? C.bg : C.textMuted }} />
                    )}
                </button>
            </div>

            {/* Footer info */}
            <p style={{ fontSize: 11, color: C.textMuted2, textAlign: 'center', marginTop: 8, paddingBottom: 4 }}>
                NeuraFin IA pode cometer erros. Verifique informações importantes.
            </p>

            <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
        </div>
    )
}
