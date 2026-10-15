// src/lib/boletos/parser.ts
// IMPLEMENTAR:

/*
============================================================
PARSER DE BOLETOS BRASILEIRO:
============================================================

TIPOS DE BOLETO:
1. BANCÁRIO (código começa com número do banco)
   - 44 dígitos código de barras
   - 47 dígitos linha digitável
   - Campos: banco, moeda, fator vencimento, valor, campo livre

2. CONCESSIONÁRIA (código começa com 8)
   - Água, luz, gás, telefone
   - 44 dígitos código de barras
   - 48 dígitos linha digitável
   - Campos: produto, segmento, valor, empresa

IMPLEMENTAR:
- parseBankSlip(barcode | digitableLine) → BoletoData
- parseUtilityBill(barcode | digitableLine) → BoletoData
- identifyBoletoType(code) → 'bank_slip' | 'utility'
- extractAmount(code) → number
- extractDueDate(code) → Date | null
- extractBankCode(code) → string (001=BB, 033=Santander, etc)
- validateCheckDigit(code) → boolean
- formatDigitableLine(code) → formatted string with dots/spaces
- barcodeToDigitableLine(barcode) → digitableLine
- digitableLineToBarcode(line) → barcode
*/

export interface BoletoData {
    barcode: string;
    digitableLine: string;
    type: 'bank_slip' | 'utility';
    amount: number;
    dueDate: Date | null;
    bankCode?: string;
    bankName?: string;
    beneficiary?: string;
    isValid: boolean;
    errors?: string[];
}
