import { describe, it, expect } from 'vitest'
import { parseOFX, cleanDescription, calculateTransactionHash } from '../lib/ofx-parser'
import { sanitizeCSVCell } from '../lib/export'

describe('ofx-parser description preservation', () => {
    it('preserva descricoes textuais legitimas intactas na importacao, inclusive se iniciadas por + ou -', () => {
        expect(cleanDescription('Supermercado Pao de Acucar')).toBe('Supermercado Pao de Acucar')
        expect(cleanDescription('-1234 Pagamento')).toBe('-1234 Pagamento')
        expect(cleanDescription('+TED Recebida')).toBe('+TED Recebida')
        expect(cleanDescription('"Mercadinho"')).toBe('Mercadinho')
    })
})

describe('export CSV sanitization', () => {
    it('escapa formulas perigosas iniciadas por =, +, -, @ estritamente na exportacao de planilhas', () => {
        expect(sanitizeCSVCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
        expect(sanitizeCSVCell('+CMD|')).toBe("'+CMD|")
        expect(sanitizeCSVCell('-1234')).toBe("'-1234")
        expect(sanitizeCSVCell('@CALC')).toBe("'@CALC")
    })

    it('mantem celulas normais intactas na exportacao', () => {
        expect(sanitizeCSVCell('Aluguel')).toBe('Aluguel')
        expect(sanitizeCSVCell('1250.00')).toBe('1250.00')
    })
})

describe('ofx-parser hash calculation', () => {
    it('gera o mesmo hash para entradas identicas (determinismo e idempotencia)', () => {
        const hash1 = calculateTransactionHash('acc-1', '2026-03-01', 150.50, 'Mercado', 'FITID-123')
        const hash2 = calculateTransactionHash('acc-1', '2026-03-01', 150.50, 'Mercado', 'FITID-123')
        expect(hash1).toBe(hash2)
        expect(hash1).toHaveLength(64) // SHA-256 hex string
    })

    it('gera hashes diferentes para contas distintas com o mesmo FITID', () => {
        const hashA = calculateTransactionHash('acc-1', '2026-03-01', 150.50, 'Mercado', 'FITID-123')
        const hashB = calculateTransactionHash('acc-2', '2026-03-01', 150.50, 'Mercado', 'FITID-123')
        expect(hashA).not.toBe(hashB)
    })

    it('gera hash baseado em data, valor e descricao quando FITID esta ausente', () => {
        const hash = calculateTransactionHash('acc-1', '2026-03-01', 99.90, 'Aluguel')
        expect(hash).toHaveLength(64)
    })
})

describe('ofx-parser XML/SGML parsing', () => {
    it('extrai transacoes validas de bloco OFX preservando descricoes reais', () => {
        const sampleOFX = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260301120000</DTPOSTED>
            <TRNAMT>-75.50</TRNAMT>
            <FITID>TX-001</FITID>
            <MEMO>Posto Ipiranga</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20260302120000</DTPOSTED>
            <TRNAMT>1500.00</TRNAMT>
            <FITID>TX-002</FITID>
            <NAME>Salario Mensal</NAME>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
`
        const result = parseOFX(sampleOFX, 'acc-test')
        expect(result.errors).toHaveLength(0)
        expect(result.transactions).toHaveLength(2)

        const [tx1, tx2] = result.transactions
        expect(tx1.date).toBe('2026-03-01')
        expect(tx1.amount).toBe(75.50)
        expect(tx1.type).toBe('expense')
        expect(tx1.description).toBe('Posto Ipiranga')
        expect(tx1.fitid).toBe('TX-001')

        expect(tx2.date).toBe('2026-03-02')
        expect(tx2.amount).toBe(1500.00)
        expect(tx2.type).toBe('income')
        expect(tx2.description).toBe('Salario Mensal')
        expect(tx2.fitid).toBe('TX-002')
    })

    it('registra erro sem abortar ao encontrar bloco com data ou valor invalido', () => {
        const invalidOFX = `
<STMTTRN>
  <TRNTYPE>DEBIT</TRNTYPE>
  <DTPOSTED>INVALID_DATE</DTPOSTED>
  <TRNAMT>NOT_A_NUMBER</TRNAMT>
</STMTTRN>
`
        const result = parseOFX(invalidOFX, 'acc-test')
        expect(result.transactions).toHaveLength(0)
        expect(result.errors.length).toBeGreaterThan(0)
    })
})
