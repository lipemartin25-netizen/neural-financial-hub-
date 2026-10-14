'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2, X, Loader2 } from 'lucide-react'
import { C, cardHlStyle } from '@/lib/theme'
import { motion, AnimatePresence } from 'framer-motion'
import type { Notification } from '@/types/database'

const TYPE_ICONS: Record<string, string> = {
    boleto_due: '📄', boleto_overdue: '🔴', budget_alert: '⚠️',
    goal_almost: '🎯', system: '🔔', debt_tip: '💡',
}

const TIME_AGO = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
}

export default function NotificationCenter() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications?limit=20')
            if (!res.ok) return
            const json = await res.json()
            setNotifications(json.data ?? [])
            setUnreadCount(json.unreadCount ?? 0)
        } catch { }
    }, [])

    // Gerar + buscar ao montar
    useEffect(() => {
        fetch('/api/notifications/generate', { method: 'POST' })
            .then(() => fetchNotifications())
            .catch(() => fetchNotifications())
    }, [fetchNotifications])

    // Poll a cada 2 min
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 120000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const markRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        }).catch(() => { })
    }

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mark_all: true }),
        }).catch(() => { })
    }

    const clearAll = async () => {
        setLoading(true)
        await fetch('/api/notifications?clear_all=true', { method: 'DELETE' }).catch(() => { })
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: 'relative', background: 'none', border: 'none',
                    color: unreadCount > 0 ? C.gold : C.textMuted,
                    cursor: 'pointer', padding: 4,
                    transition: 'color 0.2s',
                }}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -4,
                        width: 16, height: 16, borderRadius: 999,
                        background: C.red, color: '#fff', fontSize: 9,
                        fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: 8, zIndex: 100,
                            width: 360, maxHeight: 480,
                            ...cardHlStyle,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                                Notificações {unreadCount > 0 && `(${unreadCount})`}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} title="Marcar todas como lidas"
                                        style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 2 }}>
                                        <CheckCheck size={14} />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} title="Limpar todas"
                                        style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 2 }}>
                                        {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)}
                                    style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 2 }}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 400 }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Bell size={24} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 12px' }} />
                                    <p style={{ fontSize: 13, color: C.textMuted }}>Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.is_read && markRead(n.id)}
                                        style={{
                                            display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer',
                                            borderBottom: `1px solid ${C.border}`,
                                            backgroundColor: n.is_read ? 'transparent' : 'rgba(201,168,88,0.03)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.backgroundColor = 'rgba(201,168,88,0.06)' }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'rgba(201,168,88,0.03)' }}
                                    >
                                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
                                            {TYPE_ICONS[n.type] ?? '🔔'}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                <p style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {n.title}
                                                </p>
                                                <span style={{ fontSize: 10, color: C.textMuted2, flexShrink: 0, marginLeft: 8 }}>
                                                    {TIME_AGO(n.created_at)}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                                        </div>
                                        {!n.is_read && (
                                            <div style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: C.gold, flexShrink: 0, marginTop: 6 }} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
