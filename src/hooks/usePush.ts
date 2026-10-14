'use client'
import { useState, useEffect, useCallback } from 'react'
export function usePush() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
        setIsSupported(supported)
        if (supported) {
            setPermission(Notification.permission)
            // Verificar se já está inscrito
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub)
                })
            })
        }
    }, [])
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false
        try {
            const perm = await Notification.requestPermission()
            setPermission(perm)
            if (perm !== 'granted') return false
            const reg = await navigator.serviceWorker.ready
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                console.warn('VAPID key not configured')
                return false
            }
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey,
            })
            // Enviar para o servidor
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub.toJSON() }),
            })
            if (res.ok) {
                setIsSubscribed(true)
                return true
            }
            return false
        } catch (err) {
            console.error('Push subscribe error:', err)
            return false
        }
    }, [isSupported])
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
                await sub.unsubscribe()
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                })
            }
            setIsSubscribed(false)
            return true
        } catch {
            return false
        }
    }, [])
    return { isSupported, isSubscribed, permission, subscribe, unsubscribe }
}
