'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function OpenFinancePage() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="p-2 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Open Finance</h1>
            </div>

            <div className="p-8 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-white">Módulo em Manutenção / Desativado</h2>
                <p className="text-gray-400 max-w-md text-sm">
                    A sincronização bancária via Open Finance e Sandbox Pluggy está desativada temporariamente. Todos os arquivos de integração e chaves estão preservados isoladamente.
                </p>
                <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
                >
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    )
}
