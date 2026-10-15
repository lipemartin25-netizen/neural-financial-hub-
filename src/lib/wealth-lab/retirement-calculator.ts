// src/lib/wealth-lab/retirement-calculator.ts
// ============================================================
// 2. RETIREMENT CALCULATOR (Aposentadoria)
// ============================================================
/*
INPUTS:
- currentAge: idade atual
- retirementAge: idade desejada aposentadoria
- lifeExpectancy: expectativa de vida (default: 85)
- currentSavings: patrimônio atual
- monthlySavings: aporte mensal
- desiredMonthlyIncome: renda mensal na aposentadoria
- expectedReturn: % anual
- inflationRate: % anual
- hasINSS: boolean
- inssContributionYears: anos contribuição
- inssSalary: salário contribuição INSS

OUTPUTS:
- totalNeeded: valor necessário
- projectedSavings: valor projetado na idade de aposentadoria
- gap: diferença (falta ou sobra)
- inssEstimatedBenefit: estimativa benefício INSS
- complementNeeded: complemento necessário além do INSS
- projectionChart: array por ano
- recommendations: sugestões IA

INSS SIMULATOR:
- Tabela INSS atualizada 2026
- Fator previdenciário simplificado
- Regra de transição
- Estimativa de benefício

UI PAGE:
- Form step-by-step (wizard 3 etapas)
- Cards: "Você precisa", "Você terá", "Gap"
- Chart dual: patrimônio acumulado + renda projetada
- Seção INSS separada com slider de anos
*/
