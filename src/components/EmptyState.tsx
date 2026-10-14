import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { C, btnGoldStyle } from '@/lib/theme'
import Image from 'next/image'

interface EmptyStateProps {
    illustration: string
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
}

export default function EmptyState({ illustration, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '60px 24px',
                width: '100%',
            }}
        >
            <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 24 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(circle, ${C.gold}22 0%, transparent 70%)`,
                    filter: 'blur(30px)', zIndex: 0
                }} />
                <Image
                    src={illustration}
                    alt={title}
                    width={200}
                    height={200}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, maxWidth: 300, marginBottom: 32 }}>
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    style={{ ...btnGoldStyle, padding: '12px 24px', fontSize: 14 }}
                >
                    <Plus size={16} /> {actionLabel}
                </button>
            )}
        </motion.div>
    )
}
