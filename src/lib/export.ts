import { fmt } from '@/lib/theme'

// ========== CSV Export ==========
export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const BOM = '\uFEFF' // UTF-8 BOM para Excel BR
    const csv = BOM + [
        headers.join(';'),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// ========== PDF Export (lightweight — sem lib externa) ==========
export function downloadPDFReport(title: string, sections: Array<{ heading: string; rows: string[][] }>) {
    // Gera HTML → abre janela de impressão nativa (funciona em qualquer browser)
    const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
      body { padding: 40px; color: #1a1a1a; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .subtitle { font-size: 12px; color: #666; margin-bottom: 24px; }
      h2 { font-size: 15px; margin: 20px 0 8px; color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
      th { text-align: left; padding: 6px 8px; background: #f5f5f5; font-weight: 600; border-bottom: 2px solid #ddd; }
      td { padding: 6px 8px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) td { background: #fafafa; }
      .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: center; }
      @media print { body { padding: 20px; } }
    </style>
  `

    const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const sectionHTML = sections.map(s => {
        if (s.rows.length === 0) return ''
        const headers = s.rows[0]
        const data = s.rows.slice(1)
        return `
      <h2>${s.heading}</h2>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${data.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `
    }).join('')

    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${styles}</head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">Gerado em ${now} — AurumFin / NeuraFin Hub</p>
      ${sectionHTML}
      <p class="footer">Relatório gerado automaticamente pelo NeuraFin Hub</p>
    </body></html>
  `

    const win = window.open('', '_blank')
    if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
    }
}

// ========== Helpers ==========
export function formatDateBR(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtPlain(v: number) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
