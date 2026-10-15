// src/lib/ai/predictive.ts

export interface PredictiveInputs {
    last3MonthsExpenses: Array<{ month: string; amount: number }>;
    recurringExpenses: Array<{ description: string; amount: number }>;
    currentBalance: number;
    recentCategories: Array<{ name: string; amount: number }>;
}

export interface PredictiveInsights {
    projectedEndOfMonthBalance: number;
    forecastStatus: 'positive' | 'warning' | 'alert';
    summary: string;
    actionableTips: string[];
}

export async function generatePredictiveInsights(
    userName: string,
    inputs: PredictiveInputs
): Promise<PredictiveInsights> {
    const avgExpense = inputs.last3MonthsExpenses.length > 0
        ? inputs.last3MonthsExpenses.reduce((acc, m) => acc + m.amount, 0) / inputs.last3MonthsExpenses.length
        : 1500;

    const projectedBalance = Math.round((inputs.currentBalance - avgExpense) * 100) / 100;

    return {
        projectedEndOfMonthBalance: projectedBalance,
        forecastStatus: projectedBalance >= 0 ? 'positive' : 'warning',
        summary: `Previsão financeira gerada para ${userName}: saldo estimado de encerramento em R$ ${projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        actionableTips: [
            'Revise despesas variáveis para manter sua meta de reserva intacta.',
            'Acompanhe os vencimentos de boletos para evitar juros.'
        ]
    };
}
