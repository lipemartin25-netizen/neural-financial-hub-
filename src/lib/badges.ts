export type Badge = {
    id: string
    name: Record<string, string>
    description: Record<string, string>
    icon: string
    category: 'beginner' | 'finance' | 'streak' | 'social' | 'mastery'
    xpReward: number
    condition: (stats: UserStats) => boolean
    secret?: boolean
}

export type UserStats = {
    totalTransactions: number
    totalGoalsCompleted: number
    totalBudgetsOnTrack: number
    currentStreak: number
    longestStreak: number
    xp: number
    level: number
    daysActive: number
    hasFamily: boolean
    totalInvested: number
    totalCategories: number
    neuralScore: number
}

export const XP_PER_LEVEL = 500

export const XP_ACTIONS = {
    add_transaction: 10,
    add_recurring: 15,
    complete_goal: 100,
    budget_on_track: 50,
    daily_login: 5,
    streak_7: 50,
    streak_30: 200,
    ai_chat: 5,
    share_family: 20,
    first_investment: 75,
}

export function getLevelFromXP(xp: number): number {
    return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1)
}

export function getXPForNextLevel(level: number): number {
    return level * XP_PER_LEVEL
}

export function getXPProgress(xp: number): { current: number; needed: number; pct: number } {
    const level = getLevelFromXP(xp)
    const xpForCurrentLevel = (level - 1) * XP_PER_LEVEL
    const current = xp - xpForCurrentLevel
    const needed = XP_PER_LEVEL
    return { current, needed, pct: Math.min(100, (current / needed) * 100) }
}

export const LEVEL_TITLES: Record<number, Record<string, string>> = {
    1: { 'pt-BR': 'Iniciante', en: 'Beginner', es: 'Principiante' },
    2: { 'pt-BR': 'Aprendiz', en: 'Apprentice', es: 'Aprendiz' },
    3: { 'pt-BR': 'Organizador', en: 'Organizer', es: 'Organizador' },
    4: { 'pt-BR': 'Planejador', en: 'Planner', es: 'Planificador' },
    5: { 'pt-BR': 'Estrategista', en: 'Strategist', es: 'Estratega' },
    6: { 'pt-BR': 'Investidor', en: 'Investor', es: 'Inversor' },
    7: { 'pt-BR': 'Expert', en: 'Expert', es: 'Experto' },
    8: { 'pt-BR': 'Mestre', en: 'Master', es: 'Maestro' },
    9: { 'pt-BR': 'Guru Financeiro', en: 'Financial Guru', es: 'Gurú Financiero' },
    10: { 'pt-BR': 'Lenda Neural', en: 'Neural Legend', es: 'Leyenda Neural' },
}

export const BADGES: Badge[] = [
    // ===== BEGINNER =====
    {
        id: 'first_transaction',
        name: { 'pt-BR': 'Primeira Transação', en: 'First Transaction', es: 'Primera Transacción' },
        description: { 'pt-BR': 'Registre sua primeira transação', en: 'Record your first transaction', es: 'Registra tu primera transacción' },
        icon: '🎯', category: 'beginner', xpReward: 20,
        condition: (s) => s.totalTransactions >= 1,
    },
    {
        id: 'ten_transactions',
        name: { 'pt-BR': '10 Transações', en: '10 Transactions', es: '10 Transacciones' },
        description: { 'pt-BR': 'Registre 10 transações', en: 'Record 10 transactions', es: 'Registra 10 transacciones' },
        icon: '📊', category: 'beginner', xpReward: 50,
        condition: (s) => s.totalTransactions >= 10,
    },
    {
        id: 'hundred_transactions',
        name: { 'pt-BR': 'Centurião', en: 'Centurion', es: 'Centurión' },
        description: { 'pt-BR': 'Registre 100 transações', en: 'Record 100 transactions', es: 'Registra 100 transacciones' },
        icon: '💯', category: 'beginner', xpReward: 200,
        condition: (s) => s.totalTransactions >= 100,
    },
    // ===== FINANCE =====
    {
        id: 'first_goal',
        name: { 'pt-BR': 'Sonhador', en: 'Dreamer', es: 'Soñador' },
        description: { 'pt-BR': 'Complete sua primeira meta', en: 'Complete your first goal', es: 'Completa tu primera meta' },
        icon: '⭐', category: 'finance', xpReward: 100,
        condition: (s) => s.totalGoalsCompleted >= 1,
    },
    {
        id: 'five_goals',
        name: { 'pt-BR': 'Conquistador', en: 'Achiever', es: 'Conquistador' },
        description: { 'pt-BR': 'Complete 5 metas', en: 'Complete 5 goals', es: 'Completa 5 metas' },
        icon: '🏆', category: 'finance', xpReward: 300,
        condition: (s) => s.totalGoalsCompleted >= 5,
    },
    {
        id: 'budget_master',
        name: { 'pt-BR': 'Mestre do Orçamento', en: 'Budget Master', es: 'Maestro del Presupuesto' },
        description: { 'pt-BR': 'Mantenha 3 orçamentos dentro do limite', en: 'Keep 3 budgets on track', es: 'Mantén 3 presupuestos en el límite' },
        icon: '💰', category: 'finance', xpReward: 150,
        condition: (s) => s.totalBudgetsOnTrack >= 3,
    },
    {
        id: 'first_investment',
        name: { 'pt-BR': 'Investidor Nato', en: 'Born Investor', es: 'Inversor Nato' },
        description: { 'pt-BR': 'Registre seu primeiro investimento', en: 'Record your first investment', es: 'Registra tu primera inversión' },
        icon: '📈', category: 'finance', xpReward: 75,
        condition: (s) => s.totalInvested > 0,
    },
    {
        id: 'neural_80',
        name: { 'pt-BR': 'Saúde de Ouro', en: 'Golden Health', es: 'Salud de Oro' },
        description: { 'pt-BR': 'Alcance Neural Score 80+', en: 'Reach Neural Score 80+', es: 'Alcanza Neural Score 80+' },
        icon: '🧠', category: 'finance', xpReward: 250,
        condition: (s) => s.neuralScore >= 80,
    },
    // ===== STREAK =====
    {
        id: 'streak_3',
        name: { 'pt-BR': '3 Dias Seguidos', en: '3-Day Streak', es: '3 Días Seguidos' },
        description: { 'pt-BR': 'Use o app por 3 dias seguidos', en: 'Use the app 3 days in a row', es: 'Usa la app 3 días seguidos' },
        icon: '🔥', category: 'streak', xpReward: 30,
        condition: (s) => s.currentStreak >= 3 || s.longestStreak >= 3,
    },
    {
        id: 'streak_7',
        name: { 'pt-BR': 'Semana Perfeita', en: 'Perfect Week', es: 'Semana Perfecta' },
        description: { 'pt-BR': '7 dias seguidos de uso', en: '7-day streak', es: '7 días seguidos de uso' },
        icon: '⚡', category: 'streak', xpReward: 50,
        condition: (s) => s.currentStreak >= 7 || s.longestStreak >= 7,
    },
    {
        id: 'streak_30',
        name: { 'pt-BR': 'Mês de Ferro', en: 'Iron Month', es: 'Mes de Hierro' },
        description: { 'pt-BR': '30 dias seguidos de uso', en: '30-day streak', es: '30 días seguidos de uso' },
        icon: '💎', category: 'streak', xpReward: 200,
        condition: (s) => s.currentStreak >= 30 || s.longestStreak >= 30,
    },
    {
        id: 'streak_100',
        name: { 'pt-BR': 'Disciplina Lendária', en: 'Legendary Discipline', es: 'Disciplina Legendaria' },
        description: { 'pt-BR': '100 dias seguidos!', en: '100-day streak!', es: '¡100 días seguidos!' },
        icon: '👑', category: 'streak', xpReward: 1000, secret: true,
        condition: (s) => s.currentStreak >= 100 || s.longestStreak >= 100,
    },
    // ===== SOCIAL =====
    {
        id: 'family_created',
        name: { 'pt-BR': 'Líder Familiar', en: 'Family Leader', es: 'Líder Familiar' },
        description: { 'pt-BR': 'Crie ou entre em uma família', en: 'Create or join a family', es: 'Crea o únete a una familia' },
        icon: '👨👩👧', category: 'social', xpReward: 50,
        condition: (s) => s.hasFamily,
    },
    // ===== MASTERY =====
    {
        id: 'level_5',
        name: { 'pt-BR': 'Estrategista', en: 'Strategist', es: 'Estratega' },
        description: { 'pt-BR': 'Alcance nível 5', en: 'Reach level 5', es: 'Alcanza el nivel 5' },
        icon: '🎖️', category: 'mastery', xpReward: 100,
        condition: (s) => s.level >= 5,
    },
    {
        id: 'level_10',
        name: { 'pt-BR': 'Lenda Neural', en: 'Neural Legend', es: 'Leyenda Neural' },
        description: { 'pt-BR': 'Alcance nível 10', en: 'Reach level 10', es: 'Alcanza el nivel 10' },
        icon: '🏅', category: 'mastery', xpReward: 500, secret: true,
        condition: (s) => s.level >= 10,
    },
    {
        id: 'thousand_xp',
        name: { 'pt-BR': '1K XP', en: '1K XP', es: '1K XP' },
        description: { 'pt-BR': 'Acumule 1.000 XP', en: 'Accumulate 1,000 XP', es: 'Acumula 1.000 XP' },
        icon: '✨', category: 'mastery', xpReward: 0,
        condition: (s) => s.xp >= 1000,
    },
]
