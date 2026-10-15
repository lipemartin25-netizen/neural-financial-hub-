// src/lib/wealth-lab/tax-optimizer.ts
// ============================================================
// 4. TAX OPTIMIZER (Planejador Tributário IRPF)
// ============================================================
/*
INPUTS:
- annualGrossIncome: renda bruta anual
- dependents: número de dependentes
- healthExpenses: gastos saúde (sem limite)
- educationExpenses: gastos educação (por dependente)
- pensionPayments: pensão alimentícia
- privatePension: previdência PGBL (até 12% renda)
- otherDeductions: outras deduções legais
- hasRent: boolean (dedução moradia)
- rentAmount: valor aluguel anual
- investmentIncome: renda de investimentos

TABELA IRPF 2026 (atualizar com valores reais):
- Até R$ 2.259,20: isento
- R$ 2.259,21 até R$ 2.826,65: 7.5%
- R$ 2.826,66 até R$ 3.751,05: 15%
- R$ 3.751,06 até R$ 4.664,68: 22.5%
- Acima R$ 4.664,68: 27.5%

DESCONTO SIMPLIFICADO: 20% da renda (max R$ 16.754,34)

OUTPUTS:
- simplifiedTax: IR na declaração simplificada
- completeTax: IR na declaração completa
- bestOption: 'simplified' | 'complete'
- savings: quanto economiza na melhor opção
- effectiveRate: alíquota efetiva
- deductionsBreakdown: detalhamento deduções
- tips: dicas IA para reduzir IR

UI PAGE:
- Form com seções expansíveis por tipo de dedução
- Comparação visual: Simplificada vs Completa (2 cards)
- Destaque da ECONOMIA na melhor opção
- Lista de deduções possíveis que user não está usando
- Botão "Otimizar com IA" → sugestões personalizadas
*/
