'use client'

export default function OfflinePage() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#0b0d10', color: '#ebe6da', fontFamily: 'system-ui',
        }}>
            <div style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sem Conexão</h1>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
                    Você está offline. Verifique sua conexão com a internet e tente novamente.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: 24, padding: '12px 32px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #c9a858, #b8943f)',
                        color: '#0b0d10', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}
