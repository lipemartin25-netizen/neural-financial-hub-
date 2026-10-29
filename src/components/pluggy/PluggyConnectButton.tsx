'use client'

import React from 'react'

interface PluggyConnectButtonProps {
    onSuccess?: () => void
    onError?: (error: any) => void
    onClose?: () => void
    className?: string
    label?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    icon?: boolean
}

/**
 * Módulo Open Finance / Pluggy Desativado Temporariamente.
 * Os arquivos originais estão preservados em disabled_features/pluggy.
 */
export function PluggyConnectButton({
    className = '',
    label = 'Open Finance (Desativado)',
    variant = 'secondary'
}: PluggyConnectButtonProps) {
    return (
        <button
            type="button"
            disabled
            className={`opacity-50 cursor-not-allowed px-3 py-1.5 text-xs rounded border border-white/10 bg-white/5 text-gray-400 ${className}`}
            title="Integração Open Finance temporariamente desativada"
        >
            {label}
        </button>
    )
}
