export const CATEGORIES = [
    // Despesas
    { id: 'housing', name: 'Moradia', icon: '🏠', color: '#8b5cf6', type: 'expense' },
    { id: 'food', name: 'Alimentação', icon: '🍔', color: '#f59e0b', type: 'expense' },
    { id: 'transport', name: 'Transporte', icon: '🚗', color: '#3b82f6', type: 'expense' },
    { id: 'health', name: 'Saúde', icon: '💊', color: '#10b981', type: 'expense' },
    { id: 'education', name: 'Educação', icon: '📚', color: '#06b6d4', type: 'expense' },
    { id: 'entertainment', name: 'Lazer', icon: '🎬', color: '#ec4899', type: 'expense' },
    { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#ef4444', type: 'expense' },
    { id: 'subscriptions', name: 'Assinaturas', icon: '📱', color: '#f97316', type: 'expense' },
    { id: 'utilities', name: 'Contas', icon: '⚡', color: '#eab308', type: 'expense' },
    { id: 'insurance', name: 'Seguros', icon: '🛡️', color: '#14b8a6', type: 'expense' },
    { id: 'pets', name: 'Pets', icon: '🐾', color: '#a855f7', type: 'expense' },
    { id: 'clothing', name: 'Vestuário', icon: '👕', color: '#f472b6', type: 'expense' },
    { id: 'personal', name: 'Pessoal', icon: '🧴', color: '#fb923c', type: 'expense' },
    { id: 'other_expense', name: 'Outros', icon: '📦', color: '#6b7280', type: 'expense' },
    // Receitas
    { id: 'salary', name: 'Salário', icon: '💰', color: '#10b981', type: 'income' },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3b82f6', type: 'income' },
    { id: 'investments_return', name: 'Investimentos', icon: '📈', color: '#8b5cf6', type: 'income' },
    { id: 'rental', name: 'Aluguel', icon: '🏠', color: '#f59e0b', type: 'income' },
    { id: 'gift', name: 'Presente', icon: '🎁', color: '#ec4899', type: 'income' },
    { id: 'refund', name: 'Reembolso', icon: '💵', color: '#06b6d4', type: 'income' },
    { id: 'other_income', name: 'Outros', icon: '💰', color: '#6b7280', type: 'income' },
]

export const PLAN_LIMITS = {
    free: { ai_messages_per_day: 3, max_accounts: 3, max_cards: 2, max_goals: 5 },
    pro: { ai_messages_per_day: 100, max_accounts: 999, max_cards: 999, max_goals: 999 },
    family: { ai_messages_per_day: 200, max_accounts: 999, max_cards: 999, max_goals: 999 },
    mei: { ai_messages_per_day: 50, max_accounts: 10, max_cards: 5, max_goals: 20 },
}
