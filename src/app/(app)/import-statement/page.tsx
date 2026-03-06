'use client'

import { motion } from 'framer-motion'
import { FileUp, FileText, Upload, Loader2, ChevronDown, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import { useAccounts } from '@/hooks/useAccounts'
import { toast } from 'sonner'
import GoldText from '@/components/GoldText'

type ImportResult = {
    imported: number; total_found?: number; errors?: number; skipped?: number
    sample?: Array<{ date: string; description: string; amount: number; type: string }>
}

export default function ImportStatementPage() {
    const { accounts } = useAccounts()
    const [accountId, setAccountId] = useState('')
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [importType, setImportType] = useState<'pdf' | 'csv'>('pdf')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!accountId) { toast.error('Selecione uma conta primeiro'); return }

        setImporting(true)
        setResult(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('account_id', accountId)

        const endpoint = importType === 'pdf' ? '/api/transactions/import-pdf' : '/api/transactions/import'

        try {
            const res = await fetch(endpoint, { method: 'POST', body: formData })
            const json = await res.json()

            if (!res.ok) {
                toast.error(json.error || 'Erro na importação')
                return
            }

            setResult(json.data)
            toast.success(`${json.data.imported} transações importadas!`, {
                style: { background: C.card, color: C.text, border: `1px solid ${C.border}` },
            })
        } catch {
            toast.error('Erro ao importar arquivo')
        } finally {
            setImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', cursor: 'pointer' }

    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                    <FileUp size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: C.gold }} />
                    Importar Extrato
                </h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                    Importe transações automaticamente via PDF, Foto ou CSV do seu banco
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                {/* Left — Upload */}
                <div>
                    {/* Import Type */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        {[
                            { v: 'pdf' as const, icon: '📄', label: 'PDF ou Foto', desc: 'IA analisa extrato ou foto automaticamente' },
                            { v: 'csv' as const, icon: '📊', label: 'Arquivo CSV', desc: 'Formato padrão de planilhas' },
                        ].map(t => (
                            <motion.button key={t.v} whileHover={{ scale: 1.02 }} onClick={() => setImportType(t.v)}
                                style={{
                                    flex: 1, padding: 20, borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                                    background: importType === t.v ? C.cardHlGrad : C.cardGrad,
                                    border: `1px solid ${importType === t.v ? 'rgba(201,168,88,0.3)' : C.borderGold}`,
                                }}>
                                <span style={{ fontSize: 24 }}>{t.icon}</span>
                                <p style={{ fontSize: 14, fontWeight: 600, color: importType === t.v ? C.gold : C.text, marginTop: 8 }}>{t.label}</p>
                                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{t.desc}</p>
                                {t.v === 'pdf' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                                        <Sparkles size={12} style={{ color: C.gold }} />
                                        <span style={{ fontSize: 10, color: C.gold }}>Gemini Vision IA</span>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Account select */}
                    <div style={{ ...cardStyle, padding: 24 }}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Conta destino</label>
                            <div style={{ position: 'relative' }}>
                                <select value={accountId} onChange={e => setAccountId(e.target.value)} style={selectStyle}>
                                    <option value="">Selecione a conta</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} {acc.bank_name ? `(${acc.bank_name})` : ''}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Upload area */}
                        <input ref={fileInputRef} type="file"
                            accept={importType === 'pdf' ? '.pdf,image/*' : '.csv,.txt,.tsv'}
                            onChange={handleImport} style={{ display: 'none' }} />

                        <button onClick={() => {
                            if (!accountId) { toast.error('Selecione uma conta primeiro'); return }
                            fileInputRef.current?.click()
                        }}
                            disabled={importing}
                            style={{
                                width: '100%', padding: 40, borderRadius: 16, cursor: 'pointer',
                                border: `2px dashed ${importing ? C.gold : C.border}`,
                                backgroundColor: importing ? 'rgba(201,168,88,0.03)' : 'transparent',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={e => { if (!importing) e.currentTarget.style.borderColor = 'rgba(201,168,88,0.3)' }}
                            onMouseLeave={e => { if (!importing) e.currentTarget.style.borderColor = C.border }}
                        >
                            {importing ? (
                                <>
                                    <Loader2 size={32} style={{ color: C.gold, animation: 'spin 1s linear infinite' }} />
                                    <p style={{ fontSize: 14, color: C.gold, fontWeight: 500 }}>
                                        {importType === 'pdf' ? 'IA analisando arquivo...' : 'Processando CSV...'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} style={{ color: C.textMuted }} />
                                    <p style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
                                        Clique para selecionar {importType === 'pdf' ? 'PDF ou Foto' : 'CSV'}
                                    </p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>
                                        {importType === 'pdf' ? 'Suporta extratos e fotos de qualquer banco brasileiro' : 'Separadores: vírgula, ponto-e-vírgula ou tab'}
                                    </p>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div style={{ ...cardStyle, padding: 16, marginTop: 16 }}>
                        <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                            {importType === 'pdf' ? (
                                <>
                                    <strong style={{ color: C.text }}>Como funciona:</strong> O Gemini Vision analisa o PDF ou a Foto do extrato,
                                    identifica cada transação (data, descrição, valor) e importa automaticamente.
                                    Funciona com Nubank, Itaú, Bradesco, BB, Inter, C6 e outros.
                                </>
                            ) : (
                                <>
                                    <strong style={{ color: C.text }}>Formatos aceitos:</strong> CSV com colunas de Data, Descrição e Valor.
                                    Detecta automaticamente separadores e formato de data BR (dd/mm/aaaa).
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Right — Result */}
                <div>
                    {result ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Success card */}
                            <div style={{ ...cardHlStyle, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                                <CheckCircle2 size={40} style={{ color: C.emerald, margin: '0 auto 12px' }} />
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                                    <GoldText>{result.imported}</GoldText> transações importadas
                                </h3>
                                {result.skipped !== undefined && result.skipped > 0 && (
                                    <p style={{ fontSize: 13, color: C.yellow, marginTop: 4 }}>
                                        <AlertCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                        {result.skipped} linhas ignoradas
                                    </p>
                                )}
                            </div>

                            {/* Sample */}
                            {result.sample && result.sample.length > 0 && (
                                <div style={{ ...cardStyle, padding: 20 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Amostra importada</h4>
                                    {result.sample.map((tx, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                                            borderBottom: i < result.sample!.length - 1 ? `1px solid ${C.border}` : 'none',
                                        }}>
                                            <div>
                                                <p style={{ fontSize: 13, color: C.text }}>{tx.description}</p>
                                                <p style={{ fontSize: 11, color: C.textMuted }}>{tx.date}</p>
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'income' ? C.emerald : C.red }}>
                                                {tx.type === 'income' ? '+' : '-'}R$ {tx.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button onClick={() => setResult(null)} style={{ ...btnOutlineStyle, width: '100%', marginTop: 16, padding: '12px 0' }}>
                                Importar outro extrato
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                            <FileText size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                            <p style={{ fontSize: 16, fontWeight: 500, color: C.textMuted }}>Aguardando upload</p>
                            <p style={{ fontSize: 13, color: C.textMuted2, marginTop: 8 }}>
                                Selecione um arquivo {importType === 'pdf' ? 'PDF ou Foto' : 'CSV'} para começar
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
