// src/lib/wealth-lab/investment-comparator.ts
// ============================================================
// 3. INVESTMENT COMPARATOR (Simulador lado a lado)
// ============================================================
/*
INPUTS:
- initialAmount: valor inicial
- monthlyDeposit: aporte mensal
- period: meses
- investments: array de até 4 para comparar, cada um:
  { name, type, annualRate, taxRate, hasIR }

TIPOS DE INVESTIMENTO DISPONÍVEIS:
- Poupança (6.17% a.a. quando Selic > 8.5%)
- Selic (taxa atual)
- CDI (% do CDI)
- CDB (% do CDI, com IR regressivo)
- LCI/LCA (% do CDI, isento IR)
- Tesouro Selic
- Tesouro IPCA+ (IPCA + spread)
- Tesouro Prefixado
- Fundo DI (CDI - taxa admin)
- CRI/CRA
- Debêntures
- Ações (historical avg)
- FIIs (dividend yield médio)
- Bitcoin (historical avg - alto risco)

IMPOSTO DE RENDA REGRESSIVO:
- Até 180 dias: 22.5%
- 181-360 dias: 20%
- 361-720 dias: 17.5%
- Acima 720 dias: 15%
- LCI/LCA/CRI/CRA: isento

OUTPUTS POR INVESTIMENTO:
- grossAmount: valor bruto final
- netAmount: valor líquido (após IR)
- totalReturn: rendimento total
- monthlyReturn: rendimento médio mensal
- realReturn: retorno real (descontando inflação)
- chart: array [{month, gross, net}]

UI PAGE:
- Seletor de até 4 investimentos lado a lado
- Sliders para valor inicial, aporte, período
- Chart com 4 linhas sobrepostas
- Tabela comparativa detalhada
- Cards destacando "Melhor opção"
- Toggle: valores nominais vs reais
*/
