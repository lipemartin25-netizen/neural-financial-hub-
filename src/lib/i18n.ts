export type Locale = 'pt-BR' | 'en' | 'es'

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
    { value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
]

const translations: Record<string, Record<Locale, string>> = {
    // ===== NAV =====
    'nav.dashboard': { 'pt-BR': 'Dashboard', en: 'Dashboard', es: 'Panel' },
    'nav.transactions': { 'pt-BR': 'Transações', en: 'Transactions', es: 'Transacciones' },
    'nav.cards': { 'pt-BR': 'Cartões', en: 'Cards', es: 'Tarjetas' },
    'nav.boletos': { 'pt-BR': 'Contas a Pagar', en: 'Bills', es: 'Cuentas por Pagar' },
    'nav.accounts': { 'pt-BR': 'Saldos & Bancos', en: 'Accounts', es: 'Cuentas' },
    'nav.investments': { 'pt-BR': 'Investimentos', en: 'Investments', es: 'Inversiones' },
    'nav.patrimony': { 'pt-BR': 'Patrimônio', en: 'Net Worth', es: 'Patrimonio' },
    'nav.health': { 'pt-BR': 'Saúde Financeira', en: 'Financial Health', es: 'Salud Financiera' },
    'nav.budgets': { 'pt-BR': 'Orçamentos', en: 'Budgets', es: 'Presupuestos' },
    'nav.goals': { 'pt-BR': 'Metas', en: 'Goals', es: 'Metas' },
    'nav.emergency_fund': { 'pt-BR': 'Reserva de Emergência', en: 'Emergency Fund', es: 'Fondo de Emergencia' },
    'nav.subscriptions': { 'pt-BR': 'Assinaturas', en: 'Subscriptions', es: 'Suscripciones' },
    'nav.family': { 'pt-BR': 'Família', en: 'Family', es: 'Familia' },
    'nav.debt_planner': { 'pt-BR': 'Plano de Dívidas', en: 'Debt Planner', es: 'Plan de Deudas' },
    'nav.reports': { 'pt-BR': 'Relatórios', en: 'Reports', es: 'Reportes' },
    'nav.import': { 'pt-BR': 'Import Extrato', en: 'Import Statement', es: 'Importar Extracto' },
    'nav.rules': { 'pt-BR': 'Regras IA', en: 'AI Rules', es: 'Reglas IA' },
    'nav.ai': { 'pt-BR': 'Assistente IA', en: 'AI Assistant', es: 'Asistente IA' },
    'nav.wealth_lab': { 'pt-BR': 'Wealth Lab', en: 'Wealth Lab', es: 'Wealth Lab' },
    'nav.settings': { 'pt-BR': 'Configurações', en: 'Settings', es: 'Configuración' },
    'nav.achievements': { 'pt-BR': 'Conquistas', en: 'Achievements', es: 'Logros' },
    'nav.logout': { 'pt-BR': 'Sair', en: 'Log Out', es: 'Salir' },
    'nav.open_finance': { 'pt-BR': 'Open Finance', en: 'Open Finance', es: 'Open Finance' },
    'nav.plans': { 'pt-BR': 'Planos & Premium', en: 'Plans & Premium', es: 'Planes & Premium' },

    // ===== DASHBOARD =====
    'dash.welcome': { 'pt-BR': 'Bem-vindo de volta 👋', en: 'Welcome back 👋', es: 'Bienvenido de vuelta 👋' },
    'dash.summary': { 'pt-BR': 'Aqui está o resumo das suas finanças', en: 'Here is your financial summary', es: 'Aquí está el resumen de tus finanzas' },
    'dash.loading': { 'pt-BR': 'Carregando seus dados...', en: 'Loading your data...', es: 'Cargando tus datos...' },
    'dash.balance': { 'pt-BR': 'Saldo Total', en: 'Total Balance', es: 'Saldo Total' },
    'dash.income': { 'pt-BR': 'Receitas (mês)', en: 'Income (month)', es: 'Ingresos (mes)' },
    'dash.expense': { 'pt-BR': 'Despesas (mês)', en: 'Expenses (month)', es: 'Gastos (mes)' },
    'dash.investments': { 'pt-BR': 'Investimentos', en: 'Investments', es: 'Inversiones' },
    'dash.recent': { 'pt-BR': 'Últimas Transações', en: 'Recent Transactions', es: 'Últimas Transacciones' },
    'dash.view_all': { 'pt-BR': 'Ver todas →', en: 'View all →', es: 'Ver todas →' },
    'dash.no_tx': { 'pt-BR': 'Nenhuma transação registrada ainda', en: 'No transactions recorded yet', es: 'Ninguna transacción registrada aún' },
    'dash.goals': { 'pt-BR': 'Metas', en: 'Goals', es: 'Metas' },
    'dash.no_goals': { 'pt-BR': 'Nenhuma meta definida ainda', en: 'No goals defined yet', es: 'Ninguna meta definida aún' },
    'dash.quick': { 'pt-BR': 'Acesso Rápido', en: 'Quick Access', es: 'Acceso Rápido' },
    'dash.insight': { 'pt-BR': 'Insight da IA', en: 'AI Insight', es: 'Insight de IA' },
    'dash.hide': { 'pt-BR': 'Ocultar', en: 'Hide', es: 'Ocultar' },
    'dash.show': { 'pt-BR': 'Mostrar', en: 'Show', es: 'Mostrar' },
    'dash.new_tx': { 'pt-BR': 'Nova Transação', en: 'New Transaction', es: 'Nueva Transacción' },

    // ===== SETTINGS =====
    'settings.title': { 'pt-BR': 'Configurações', en: 'Settings', es: 'Configuración' },
    'settings.subtitle': { 'pt-BR': 'Personalize sua experiência', en: 'Customize your experience', es: 'Personaliza tu experiencia' },
    'settings.personal': { 'pt-BR': 'Dados Pessoais', en: 'Personal Info', es: 'Datos Personales' },
    'settings.name': { 'pt-BR': 'Nome Completo', en: 'Full Name', es: 'Nombre Completo' },
    'settings.phone': { 'pt-BR': 'Telefone', en: 'Phone', es: 'Teléfono' },
    'settings.dob': { 'pt-BR': 'Data de Nascimento', en: 'Date of Birth', es: 'Fecha de Nacimiento' },
    'settings.currency': { 'pt-BR': 'Moeda', en: 'Currency', es: 'Moneda' },
    'settings.income': { 'pt-BR': 'Renda Mensal', en: 'Monthly Income', es: 'Ingreso Mensual' },
    'settings.goal': { 'pt-BR': 'Objetivo Financeiro', en: 'Financial Goal', es: 'Objetivo Financiero' },
    'settings.timezone': { 'pt-BR': 'Fuso Horário', en: 'Timezone', es: 'Zona Horaria' },
    'settings.mei': { 'pt-BR': 'Sou MEI', en: 'I am MEI', es: 'Soy MEI' },
    'settings.save': { 'pt-BR': 'Salvar Perfil', en: 'Save Profile', es: 'Guardar Perfil' },
    'settings.saving': { 'pt-BR': 'Salvando...', en: 'Saving...', es: 'Guardando...' },
    'settings.notifications': { 'pt-BR': 'Notificações', en: 'Notifications', es: 'Notificaciones' },
    'settings.security': { 'pt-BR': 'Segurança', en: 'Security', es: 'Seguridad' },
    'settings.change_password': { 'pt-BR': 'Alterar Senha', en: 'Change Password', es: 'Cambiar Contraseña' },
    'settings.logout_all': { 'pt-BR': 'Sair de Todas as Sessões', en: 'Sign Out All Sessions', es: 'Cerrar Todas las Sesiones' },
    'settings.delete': { 'pt-BR': 'Excluir Conta', en: 'Delete Account', es: 'Eliminar Cuenta' },
    'settings.language': { 'pt-BR': 'Idioma', en: 'Language', es: 'Idioma' },
    'settings.theme': { 'pt-BR': 'Tema', en: 'Theme', es: 'Tema' },
    'settings.theme_dark': { 'pt-BR': 'Escuro', en: 'Dark', es: 'Oscuro' },
    'settings.theme_light': { 'pt-BR': 'Claro', en: 'Light', es: 'Claro' },
    'settings.appearance': { 'pt-BR': 'Aparência', en: 'Appearance', es: 'Apariencia' },

    // ===== GAMIFICATION =====
    'gam.achievements': { 'pt-BR': 'Conquistas', en: 'Achievements', es: 'Logros' },
    'gam.level': { 'pt-BR': 'Nível', en: 'Level', es: 'Nivel' },
    'gam.xp': { 'pt-BR': 'Experiência', en: 'Experience', es: 'Experiencia' },
    'gam.streak': { 'pt-BR': 'Sequência', en: 'Streak', es: 'Racha' },
    'gam.days': { 'pt-BR': 'dias', en: 'days', es: 'días' },
    'gam.unlocked': { 'pt-BR': 'Desbloqueada', en: 'Unlocked', es: 'Desbloqueado' },
    'gam.locked': { 'pt-BR': 'Bloqueada', en: 'Locked', es: 'Bloqueado' },
    'gam.secret': { 'pt-BR': '???', en: '???', es: '???' },
    'gam.all': { 'pt-BR': 'Todas', en: 'All', es: 'Todas' },
    'gam.best_streak': { 'pt-BR': 'Melhor sequência', en: 'Best streak', es: 'Mejor racha' },

    // ===== COMMON =====
    'common.cancel': { 'pt-BR': 'Cancelar', en: 'Cancel', es: 'Cancelar' },
    'common.confirm': { 'pt-BR': 'Confirmar', en: 'Confirm', es: 'Confirmar' },
    'common.loading': { 'pt-BR': 'Carregando...', en: 'Loading...', es: 'Cargando...' },
    'common.error': { 'pt-BR': 'Erro', en: 'Error', es: 'Error' },
    'common.success': { 'pt-BR': 'Sucesso', en: 'Success', es: 'Éxito' },
    'common.today': { 'pt-BR': 'Hoje', en: 'Today', es: 'Hoy' },
    'common.yesterday': { 'pt-BR': 'Ontem', en: 'Yesterday', es: 'Ayer' },
    'common.days_ago': { 'pt-BR': 'dias atrás', en: 'days ago', es: 'días atrás' },

    // ===== SPRINT 8 =====
    'plan.active': { 'pt-BR': 'Plano Ativo', en: 'Active Plan', es: 'Plan Activo' },
    'plan.manage': { 'pt-BR': 'Gerenciar Assinatura', en: 'Manage Subscription', es: 'Gestionar Suscripción' },
    'of.connect': { 'pt-BR': 'Conectar Banco', en: 'Connect Bank', es: 'Conectar Banco' },
    'of.sync': { 'pt-BR': 'Sincronizar', en: 'Sync', es: 'Sincronizar' },
    'onb.welcome': { 'pt-BR': 'Bem-vindo ao Neural Finance Hub', en: 'Welcome to Neural Finance Hub', es: 'Bienvenido a Neural Finance Hub' },
    'onb.start': { 'pt-BR': 'Começar', en: 'Get Started', es: 'Empezar' },
    'push.allow': { 'pt-BR': 'Ativar Notificações', en: 'Enable Notifications', es: 'Activar Notificaciones' },
}

export function t(key: string, locale: Locale = 'pt-BR'): string {
    return translations[key]?.[locale] ?? translations[key]?.['pt-BR'] ?? key
}

export function tBadge(field: Record<string, string>, locale: Locale = 'pt-BR'): string {
    return field[locale] ?? field['pt-BR'] ?? ''
}
