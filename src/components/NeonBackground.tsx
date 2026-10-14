'use client'

import { motion } from 'framer-motion'

export default function NeonBackground() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', backgroundColor: '#010101' }}>
            {/* 🌊 Golden Silk Waves (Main Body) */}
            <motion.div
                animate={{
                    x: ['-25%', '10%', '-25%'],
                    y: ['-10%', '15%', '-10%'],
                    scale: [1, 1.3, 1],
                    rotate: [0, 5, 0],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: '-20%', left: '-20%',
                    width: '150vw', height: '150vh',
                    background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.4) 0%, rgba(201, 168, 88, 0.15) 45%, transparent 75%)',
                    filter: 'blur(100px)',
                    mixBlendMode: 'plus-lighter',
                    opacity: 0.9,
                }}
            />

            <motion.div
                animate={{
                    x: ['10%', '-25%', '10%'],
                    y: ['15%', '-10%', '15%'],
                    scale: [1.2, 0.9, 1.2],
                }}
                transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', bottom: '-15%', right: '-15%',
                    width: '140vw', height: '140vh',
                    background: 'radial-gradient(ellipse at center, rgba(223, 192, 122, 0.3) 0%, rgba(154, 125, 58, 0.1) 50%, transparent 80%)',
                    filter: 'blur(120px)',
                    mixBlendMode: 'screen',
                    opacity: 0.7,
                }}
            />

            {/* ✨ Ultra-Bright Satin Ribbons (Liquid gold moving) */}
            <motion.div
                animate={{
                    y: ['-100%', '150%'],
                    opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: 0, left: '5%',
                    width: '120vw', height: '500px',
                    background: 'linear-gradient(135deg, transparent, rgba(255, 215, 0, 0.4), rgba(255, 255, 255, 0.15), transparent)',
                    filter: 'blur(70px)',
                    transform: 'rotate(-40deg)',
                    mixBlendMode: 'overlay'
                }}
            />

            {/* 💎 Glitter Dust (Tiny intense sparkles) */}
            {[...Array(80)].map((_, i) => {
                const size = Math.random() * 3 + 1
                return (
                    <motion.div
                        key={`glitter-${i}`}
                        initial={{
                            x: Math.random() * 100 + 'vw',
                            y: Math.random() * 100 + 'vh',
                            opacity: 0,
                        }}
                        animate={{
                            opacity: [0, 1, 0.3, 1, 0],
                            scale: [0, 1.2, 0.8, 1.5, 0],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 15,
                        }}
                        style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            boxShadow: `0 0 ${size * 5}px #FFD700, 0 0 ${size * 10}px #fff`,
                        }}
                    />
                )
            })}

            {/* 🪐 Soft Bokeh Orbs (Image 1 reference) */}
            {[...Array(40)].map((_, i) => {
                const size = Math.random() * 80 + 30
                return (
                    <motion.div
                        key={`orb-${i}`}
                        initial={{
                            x: Math.random() * 100 + 'vw',
                            y: '110vh',
                            opacity: 0,
                        }}
                        animate={{
                            y: '-20vh',
                            opacity: [0, 0.7, 0.7, 0],
                            scale: [1, 1.3, 1],
                            x: [null, (Math.random() - 0.5) * 50 + 'vw']
                        }}
                        transition={{
                            duration: Math.random() * 12 + 15,
                            repeat: Infinity,
                            delay: Math.random() * 20,
                        }}
                        style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(201, 168, 88, 0.05) 60%, transparent 80%)',
                            filter: 'blur(8px)',
                            mixBlendMode: 'screen'
                        }}
                    />
                )
            })}

            {/* 🎯 CONTENT FOCUS GLOW - Intense behind cards */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100vw', height: '100vh',
                background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.35) 0%, rgba(201, 168, 88, 0.15) 45%, transparent 75%)',
                filter: 'blur(150px)',
                mixBlendMode: 'plus-lighter',
            }} />

            {/* 🎞️ High-End Grain Texture Overlay */}
            <div style={{
                position: 'fixed', inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='n'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3%3C/svg%3")`,
                opacity: 0.1,
                mixBlendMode: 'soft-light',
            }} />
        </div>
    )
}
