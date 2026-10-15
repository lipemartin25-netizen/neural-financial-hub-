// src/lib/wealth-lab/fire-calculator.ts
// ============================================================
// 1. FIRE CALCULATOR (Independência Financeira)
// ============================================================
/*
INPUTS:
- monthlyExpenses: número (gastos mensais atuais)
- currentSavings: número (patrimônio atual)
- monthlySavings: número (quanto poupa por mês)
- expectedReturn: % anual (default: 8% = IPCA+4)
- inflationRate: % anual (default: 4.5%)
- withdrawalRate: % anual (default: 4% = regra dos 4%)
- desiredMonthlyIncome: número (renda passiva desejada)

OUTPUTS:
- fireNumber: valor necessário para independência
- yearsToFire: anos até atingir
- monthsToFire: meses até atingir
- dateToFire: data projetada
- projectionChart: array [{month, savings, passive_income, expenses}]
- strategies: sugestões IA para acelerar

FÓRMULA:
- FIRE Number = (despesas_anuais / taxa_retirada)
- Projeção com juros compostos + aportes mensais
- Ajustar por inflação (valores reais)
- Milestone markers: 25%, 50%, 75%, 100%

UI PAGE (wealth-lab/independence/page.tsx):
- Form com sliders interativos
- Card 3D gigante com FIRE Number
- Chart de projeção (line chart)
- Timeline com marcos
- Botão "Analisar com IA" → insights personalizados
- Salvar simulação no banco
*/
