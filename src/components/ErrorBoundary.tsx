'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { C, cardStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
    children: ReactNode
    fallbackTitle?: string
    fallbackDescription?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    handleGoHome = () => {
        window.location.href = '/dashboard'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: '60vh', padding: 24,
                }}>
                    <div style={{
                        ...cardStyle, borderRadius: 16, padding: 32,
                        textAlign: 'center', maxWidth: 420, width: '100%',
                        border: `1px solid ${C.red}22`,
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: 64, height: 64, borderRadius: 16,
                            background: 'rgba(248,113,113,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <AlertTriangle size={28} style={{ color: C.red }} />
                        </div>

                        {/* Title */}
                        <h2 style={{
                            fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8,
                        }}>
                            {this.props.fallbackTitle || 'Algo deu errado'}
                        </h2>

                        {/* Description */}
                        <p style={{
                            fontSize: 13, color: C.textMuted, marginBottom: 8, lineHeight: 1.5,
                        }}>
                            {this.props.fallbackDescription || 'Ocorreu um erro inesperado. Tente novamente ou volte para o início.'}
                        </p>

                        {/* Error details (dev only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div style={{
                                background: C.secondary, borderRadius: 8, padding: '10px 14px',
                                marginBottom: 20, textAlign: 'left',
                            }}>
                                <p style={{
                                    fontSize: 11, color: C.red, fontFamily: 'monospace',
                                    wordBreak: 'break-all', lineHeight: 1.4,
                                }}>
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    ...btnOutlineStyle, flex: 1,
                                    padding: '10px 16px', fontSize: 13,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                <Home size={14} /> Início
                            </button>
                            <button
                                onClick={this.handleRetry}
                                style={{
                                    ...btnGoldStyle, flex: 1,
                                    padding: '10px 16px', fontSize: 13,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                <RefreshCw size={14} /> Tentar novamente
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
