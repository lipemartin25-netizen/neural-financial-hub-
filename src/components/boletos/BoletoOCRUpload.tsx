
'use client'

import { useState, useCallback } from 'react'
import { createWorker } from 'tesseract.js'
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { C, cardStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'

interface Props {
    onDadosExtraidos: (dados: {
        beneficiary?: string
        amount?: number
        dueDate?: string
        barcode?: string
    }) => void
}

export default function BoletoOCRUpload({ onDadosExtraidos }: Props) {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [preview, setPreview] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

    const processImage = async (file: File) => {
        setLoading(true)
        setStatus('processing')
        setProgress(0)

        // Preview
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)

        try {
            const worker = await createWorker('por', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100))
                    }
                }
            })

            const { data: { text } } = await worker.recognize(file)
            await worker.terminate()

            // Regex para extrair dados
            const regexBarcode = /(\d{5}\.\d{5} \d{5}\.\d{6} \d{5}\.\d{6} \d \d{14})|(\d{11,12} \d{11,12} \d{11,12} \d{11,12})|(\d{47,48})/g
            const regexAmount = /(?:VALOR|TOTAL|R\$)\s*:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi
            const regexDate = /(\d{2}\/\d{2}\/\d{4})/g

            const barcodeMatches = text.match(regexBarcode)
            const amountMatches = [...text.matchAll(regexAmount)]
            const dateMatches = text.match(regexDate)

            // Limpar código de barras (remover espaços e pontos)
            const barcode = barcodeMatches ? barcodeMatches[0].replace(/[\s.]/g, '') : undefined

            // Parsear valor
            const amountStr = amountMatches && amountMatches.length > 0 ? amountMatches[0][1] : undefined
            const amount = amountStr ? parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) : undefined

            // Parsear data (pegar a última, geralmente a data do log ou vencimento, dependendo da ordem)
            const dueDateStr = dateMatches && dateMatches.length > 0 ? dateMatches[dateMatches.length - 1] : undefined
            let dueDate: string | undefined
            if (dueDateStr) {
                const [d, m, y] = dueDateStr.split('/')
                dueDate = `${y}-${m}-${d}`
            }

            // Tentar achar o beneficiário (geralmente nas primeiras linhas)
            const lines = text.split('\n').filter(l => l.trim().length > 3)
            const beneficiary = lines.length > 0 ? lines[0].trim() : undefined

            onDadosExtraidos({
                beneficiary,
                amount,
                dueDate,
                barcode
            })

            setStatus('success')
        } catch (err) {
            console.error('Erro no OCR:', err)
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processImage(file)
    }

    return (
        <div style={{ ...cardStyle, border: `2px dashed ${status === 'error' ? C.red : C.border}`, padding: 20, textAlign: 'center' }}>
            <input
                type="file"
                id="ocr-upload"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
            />

            <AnimatePresence mode="wait">
                {status === 'idle' ? (
                    <label htmlFor="ocr-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        <Upload size={32} style={{ color: C.gold, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Upload de Boleto (IA)</p>
                        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Arraste uma foto ou PDF do boleto para extrair os dados automaticamente</p>
                    </label>
                ) : status === 'processing' ? (
                    <div key="processing">
                        <Loader2 className="animate-spin" size={32} style={{ color: C.gold, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Lendo boleto... {progress}%</p>
                        <div style={{ height: 6, background: C.secondary, borderRadius: 10, marginTop: 12, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                style={{ height: '100%', backgroundColor: C.gold }}
                            />
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <div key="success">
                        <CheckCircle2 size={32} style={{ color: C.emerald, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Dados Extraídos!</p>
                        <button
                            onClick={() => { setStatus('idle'); setPreview(null); }}
                            style={{ ...btnOutlineStyle, padding: '4px 12px', fontSize: 12, marginTop: 12 }}
                        >
                            Fazer outro upload
                        </button>
                    </div>
                ) : (
                    <div key="error">
                        <AlertTriangle size={32} style={{ color: C.red, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Erro ao ler boleto</p>
                        <button
                            onClick={() => setStatus('idle')}
                            style={{ ...btnOutlineStyle, padding: '4px 12px', fontSize: 12, marginTop: 12 }}
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}
            </AnimatePresence>

            {preview && (
                <div style={{ marginTop: 16, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, maxHeight: 150 }}>
                    <img src={preview} alt="Boleto Preview" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                </div>
            )}

            <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
        </div>
    )
}
