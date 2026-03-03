'use client'
import { C } from '@/lib/theme'

export default function GoldText({ children, className = '', style = {} }: {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
}) {
    return (
        <span className={className} style={{
            background: C.goldTextGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            ...style,
        }}>
            {children}
        </span>
    )
}
