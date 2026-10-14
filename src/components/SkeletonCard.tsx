'use client'
import { C, cardStyle } from '@/lib/theme'

/* ── Pulse animation via inline style ── */
const pulseKeyframes = `
@keyframes skeletonPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
`

const bone = (
    width: string | number,
    height: number = 14,
    radius: number = 6,
    marginBottom: number = 0
): React.CSSProperties => ({
    width,
    height,
    borderRadius: radius,
    backgroundColor: C.border,
    animation: 'skeletonPulse 1.5s ease-in-out infinite',
    marginBottom,
})

/* ── Variants ── */

/** Skeleton para cards de summary (Receitas / Despesas / Saldo) */
export function SkeletonSummary() {
    return (
        <>
            <style>{pulseKeyframes}</style>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{ ...cardStyle, borderRadius: 12, padding: '12px 14px' }}>
                        <div style={bone('60%', 10, 4, 8)} />
                        <div style={bone('80%', 22, 6)} />
                    </div>
                ))}
            </div>
        </>
    )
}

/** Skeleton para items de transação (linhas agrupadas por data) */
export function SkeletonTransactionList({ count = 5 }: { count?: number }) {
    return (
        <>
            <style>{pulseKeyframes}</style>
            {/* Date header */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ ...bone('120px', 10, 4), marginBottom: 10 }} />
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            ...cardStyle, borderRadius: 12,
                            padding: '10px 12px', marginBottom: 6,
                            display: 'flex', alignItems: 'center', gap: 10,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    >
                        {/* Icon */}
                        <div style={bone(32, 32, 8)} />
                        {/* Text */}
                        <div style={{ flex: 1 }}>
                            <div style={bone('65%', 12, 4, 6)} />
                            <div style={bone('40%', 10, 4)} />
                        </div>
                        {/* Amount */}
                        <div style={bone(70, 14, 4)} />
                    </div>
                ))}
            </div>
        </>
    )
}

/** Skeleton para cards de boleto (grid) */
export function SkeletonBoletoGrid({ count = 4 }: { count?: number }) {
    return (
        <>
            <style>{pulseKeyframes}</style>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            ...cardStyle, borderRadius: 12, padding: '12px 14px',
                            animationDelay: `${i * 0.1}s`,
                        }}
                    >
                        {/* Top */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                            <div style={bone(32, 32, 8)} />
                            <div style={{ flex: 1 }}>
                                <div style={bone('70%', 12, 4, 6)} />
                                <div style={bone('45%', 10, 4)} />
                            </div>
                            <div style={bone(60, 20, 6)} />
                        </div>
                        {/* Bottom */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={bone(90, 18, 4, 6)} />
                                <div style={bone(70, 10, 4)} />
                            </div>
                            <div style={bone(70, 28, 7)} />
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
