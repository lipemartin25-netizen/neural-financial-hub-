// src/lib/wealth-lab/couples-splitter.ts
// ============================================================
// 7. CASAIS INTELIGENTES (Divisão 50/50)
// ============================================================
/*
FUNCIONALIDADES:

1. SETUP CASAL:
   - Conectar 2 profiles do mesmo family
   - Definir tipo split: 50/50, proporcional, custom
   - Se proporcional: informar renda de cada um
   - Se custom: definir % por categoria

2. REGISTRAR DESPESA COMPARTILHADA:
   - Quem pagou
   - Valor
   - Categoria
   - Split automático baseado na config
   - Pode ajustar split por despesa

3. DASHBOARD DO CASAL:
   - Card "Quem deve pra quem" (destaque 3D)
   - Total gasto junto no mês
   - Gráfico de gastos por categoria (2 barras)
   - Timeline de despesas compartilhadas
   - Botão "Acertar contas" → zera balanço

4. METAS DO CASAL:
   - Metas compartilhadas (viagem, casa, etc)
   - Contribuição de cada um visível
   - Progress bar dual (2 cores)

UI PAGE:
- Tab 1: Dashboard Casal
- Tab 2: Despesas Compartilhadas
- Tab 3: Metas Juntos
- Tab 4: Configurações
- Resumo mensal com gráfico pizza
*/
