// src/lib/wealth-lab/mei-calculator.ts
// ============================================================
// 8. TOOLKIT MEI & FREELAS
// ============================================================
/*
FUNCIONALIDADES:

1. DASHBOARD MEI:
   - Faturamento acumulado no ano (gauge circular até R$ 81.000)
   - Alert quando passar de 80% do limite
   - DAS do mês (valor + status pago/pendente)
   - Receitas vs Despesas do CNPJ

2. CALCULADORA DAS:
   - Valor DAS mensal atualizado 2026
   - Comércio: R$ 71,60 (ICMS)
   - Serviço: R$ 75,60 (ISS)
   - Comércio+Serviço: R$ 76,60 (ICMS+ISS)
   - Calendário de pagamento (dia 20)
   - Histórico de DAS pagos

3. CONTROLE FATURAMENTO:
   - Input receita mensal
   - Projeção anual baseado no ritmo
   - Alert se projeção > R$ 81.000
   - Sugestão: quando virar ME
   - Cálculo Simples Nacional se virar ME

4. GERADOR SIMPLIFICADO NF:
   - Dados do cliente (nome, CNPJ/CPF)
   - Descrição serviço
   - Valor
   - Gera PDF estilizado (não é NF-e oficial)
   - Histórico de "recibos" emitidos

5. HELPER DASN-SIMEI:
   - Declaração anual (prazo: 31/maio)
   - Soma automática do faturamento
   - Check se teve funcionário
   - Preview dos valores
   - Reminder do prazo

REGRAS MEI 2026:
- Limite anual: R$ 81.000,00
- Limite mensal proporcional: R$ 6.750,00
- 1 funcionário permitido (salário mínimo ou piso)
- Se estourar até 20%: paga diferença no DAS
- Se estourar > 20%: desenquadra (vira ME)

UI PAGE:
- Dashboard com gauge limite anual DESTACADO
- Cards 3D: DAS, Faturamento, Projeção
- Abas: Dashboard | Faturamento | DAS | Recibos | DASN
*/
