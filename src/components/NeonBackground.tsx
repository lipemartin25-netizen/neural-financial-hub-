'use client'

export default function NeonBackground() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', backgroundColor: '#050608' }}>
            {/* Primary Glowing Mesh (CSS hardware accelerated, sem sobrecarga de JS) */}
            <div
                style={{
                    position: 'absolute', top: '-15%', right: '-10%',
                    width: '70vw', height: '70vw',
                    background: 'radial-gradient(circle at center, rgba(201,168,88,0.18) 0%, rgba(201,168,88,0.03) 50%, transparent 75%)',
                    filter: 'blur(80px)',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                }}
            />

            <div
                style={{
                    position: 'absolute', bottom: '-15%', left: '-10%',
                    width: '80vw', height: '80vw',
                    background: 'radial-gradient(circle at center, rgba(154,125,58,0.14) 0%, rgba(201,168,88,0.03) 50%, transparent 75%)',
                    filter: 'blur(90px)',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                }}
            />

            {/* Center Focus */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%) translateZ(0)',
                width: '90vw', height: '90vh',
                background: 'radial-gradient(circle at center, rgba(201,168,88,0.08) 0%, transparent 65%)',
                filter: 'blur(100px)',
            }} />
        </div>
    )
}
