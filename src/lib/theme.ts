export const C = {
    bg: '#0b0d10',
    bgAlt: '#0d0f14',
    card: '#12151a',
    cardGrad: 'linear-gradient(165deg, #13161c, #0d0f14)',
    cardHlGrad: 'linear-gradient(165deg, #171a20, #0f1115)',
    secondary: '#181c22',
    muted: '#1e2228',
    gold: '#c9a858',
    goldLight: '#dfc07a',
    goldDark: '#9a7d3a',
    goldGrad: 'linear-gradient(135deg, #c9a858, #9a7d3a)',
    goldTextGrad: 'linear-gradient(135deg, #dfc07a, #b8943d, #d4b05e)',
    text: '#ebe6da',
    textMuted: '#6b7280',
    textMuted2: '#4b5563',
    border: 'rgba(255,255,255,0.06)',
    borderGold: 'rgba(201,168,88,0.06)',
    borderGoldMed: 'rgba(201,168,88,0.15)',
    borderGoldStrong: 'rgba(201,168,88,0.3)',
    emerald: '#34d399',
    red: '#f87171',
    yellow: '#fbbf24',
    blue: '#60a5fa',
    violet: '#a78bfa',
    cyan: '#22d3ee',
    orange: '#fb923c',
    pink: '#f472b6',
}

export const cardStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    background: C.cardGrad,
    border: `1px solid ${C.borderGold}`,
    borderRadius: 16,
    boxShadow: `0 1px 0 0 rgba(201,168,88,0.04), inset 0 1px 0 0 rgba(201,168,88,0.03), 0 8px 30px -10px rgba(0,0,0,0.5)`,
    overflow: 'hidden',
    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
}

export const cardHlStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    background: C.cardHlGrad,
    border: `1px solid rgba(201,168,88,0.18)`,
    borderRadius: 16,
    boxShadow: `0 1px 0 0 rgba(201,168,88,0.1), inset 0 1px 0 0 rgba(201,168,88,0.06), 0 12px 40px -10px rgba(0,0,0,0.6), 0 0 50px -15px rgba(201,168,88,0.1)`,
    overflow: 'hidden',
}

export const inputStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    backgroundColor: C.card,
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.3s',
}

export const btnGoldStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: C.goldGrad,
    color: C.bg,
    fontWeight: 600,
    border: 'none',
    borderRadius: 10,
    padding: '10px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 10px -3px rgba(201,168,88,0.3)',
    textDecoration: 'none',
    fontSize: 14,
}

export const btnOutlineStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'transparent',
    color: C.gold,
    fontWeight: 600,
    border: `1px solid rgba(201,168,88,0.3)`,
    borderRadius: 10,
    padding: '10px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    fontSize: 14,
}

export const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: C.bg,
    color: C.text,
}

export const progressBar = (pct: number, color: string): React.CSSProperties => ({
    height: '100%',
    width: `${Math.min(100, pct)}%`,
    borderRadius: 999,
    background: color,
    transition: 'width 1s ease',
})

export const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    color,
    backgroundColor: bg,
})

export const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

/* ── Layout Constants ── */
export const NAV_HEIGHT = 72
export const NAV_SAFE_AREA = NAV_HEIGHT + 8 // 80px — padding bottom das páginas
