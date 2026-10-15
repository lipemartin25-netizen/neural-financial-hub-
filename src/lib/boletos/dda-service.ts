// src/lib/boletos/dda-service.ts
// IMPLEMENTAR:

/*
DDA (Débito Direto Autorizado) Service:

NO MODO MOCK:
- Gera boletos realistas para o user
- Mix: 3-5 boletos por mês
- Tipos variados (utility, tax, rent, etc)
- Status: pending, paid, overdue
- Valores realistas BR (R$ 50 - R$ 3000)
- Empresas realistas (Enel, Sabesp, IPTU, etc)
- Auto-popula ao conectar Open Finance

IMPLEMENTAR:
- fetchDDABoletos(userId) → Boleto[]
- scheduleBoletoPayment(boletoId, date, accountId) → void
- markBoletoAsPaid(boletoId, paymentData) → void
- getBoletosByStatus(userId, status) → Boleto[]
- getUpcomingBoletos(userId, days=30) → Boleto[]
- getOverdueBoletos(userId) → Boleto[]
- getBoletoStats(userId) → { pending, paid, overdue, total }
*/
