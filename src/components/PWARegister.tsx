'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'
import { C, btnGoldStyle } from '@/lib/theme'

// Type para BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWARegister() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => { })
        }

        // Detectar se já está instalado
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // Capturar prompt de instalação
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Mostrar banner após 30s de uso
            setTimeout(() => setShowBanner(true), 30000)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Detectar instalação
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true)
            setShowBanner(false)
            setDeferredPrompt(null)
        })

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setIsInstalled(true)
        }
        setDeferredPrompt(null)
        setShowBanner(false)
    }

    if (isInstalled) return null

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    style={{
                        position: 'fixed', bottom: 24, left: 24, right: 24,
                        maxWidth: 420, margin: '0 auto', zIndex: 200,
                        padding: 20, borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(17,19,24,0.98), rgba(13,15,20,0.98))',
                        border: '1px solid rgba(201,168,88,0.2)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <button
                        onClick={() => setShowBanner(false)}
                        style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer',
                        }}
                    >
                        <X size={16} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: C.goldGrad,
                        }}>
                            <Smartphone size={22} style={{ color: C.bg }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Instalar Neural Finance Hub</p>
                            <p style={{ fontSize: 12, color: C.textMuted }}>Acesse direto da sua tela inicial</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowBanner(false)}
                            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>
                            Agora não
                        </button>
                        <button onClick={handleInstall}
                            style={{ ...btnGoldStyle, flex: 1, padding: '10px 0', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Download size={14} /> Instalar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
