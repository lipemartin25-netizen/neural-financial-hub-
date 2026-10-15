// src/lib/ai/whatsapp.ts

export interface WhatsAppActionResult {
    type: 'add_expense' | 'add_income' | 'query_balance' | 'unknown';
    data?: {
        amount?: number;
        description?: string;
        category?: string;
    };
    response: string;
}

export async function processWhatsAppMessage(
    text: string,
    userName: string
): Promise<WhatsAppActionResult> {
    const lower = text.toLowerCase().trim();

    // Consulta de saldo
    if (lower.includes('saldo') || lower.includes('quanto tenho')) {
        return {
            type: 'query_balance',
            response: `Consultando o seu saldo atual, ${userName}...`
        };
    }

    // Adição de despesa simples: ex "gastei 50 no mercado"
    const expenseMatch = lower.match(/(?:gastei|paguei|comprei)\s+(?:r\$\s*)?(\d+(?:[.,]\d+)?)(?:\s+(?:no|na|com|em)\s+(.+))?/);
    if (expenseMatch) {
        const amount = parseFloat(expenseMatch[1].replace(',', '.'));
        const desc = expenseMatch[2]?.trim() || 'Despesa rápida via WhatsApp';
        return {
            type: 'add_expense',
            data: {
                amount,
                description: desc,
                category: 'Alimentação'
            },
            response: `Lançamento de R$ ${amount.toFixed(2)} registrado com sucesso em "${desc}".`
        };
    }

    // Adição de receita: ex "recebi 200 de pix"
    const incomeMatch = lower.match(/(?:recebi|ganhei|pix de)\s+(?:r\$\s*)?(\d+(?:[.,]\d+)?)(?:\s+(?:de|do|da)\s+(.+))?/);
    if (incomeMatch) {
        const amount = parseFloat(incomeMatch[1].replace(',', '.'));
        const desc = incomeMatch[2]?.trim() || 'Receita rápida via WhatsApp';
        return {
            type: 'add_income',
            data: {
                amount,
                description: desc,
                category: 'Outros'
            },
            response: `Receita de R$ ${amount.toFixed(2)} lançada na sua conta.`
        };
    }

    return {
        type: 'unknown',
        response: `Olá ${userName}! Posso te ajudar a registrar gastos rápidos ("Gastei 45 no almoço") ou verificar seu saldo ("Qual meu saldo?").`
    };
}
