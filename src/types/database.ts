export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    phone: string | null
                    date_of_birth: string | null
                    currency: string
                    locale: string
                    timezone: string
                    monthly_income: number | null
                    financial_goal: string | null
                    neural_score: number
                    is_mei: boolean
                    plan: 'free' | 'pro' | 'family' | 'mei'
                    plan_expires_at: string | null
                    stripe_customer_id: string | null
                    onboarding_completed: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    currency?: string
                    plan?: 'free' | 'pro' | 'family' | 'mei'
                    onboarding_completed?: boolean
                }
                Update: {
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    monthly_income?: number | null
                    plan?: 'free' | 'pro' | 'family' | 'mei'
                    onboarding_completed?: boolean
                    neural_score?: number
                }
            }
            accounts: {
                Row: {
                    id: string
                    user_id: string
                    family_id: string | null
                    name: string
                    type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash' | 'wallet' | 'other'
                    bank_name: string | null
                    bank_code: string | null
                    bank_logo: string | null
                    balance: number
                    credit_limit: number | null
                    available_credit: number | null
                    closing_day: number | null
                    due_day: number | null
                    color: string
                    icon: string | null
                    is_active: boolean
                    include_in_total: boolean
                    open_finance_id: string | null
                    is_shared: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    name: string
                    type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash' | 'wallet' | 'other'
                    bank_name?: string | null
                    balance?: number
                    credit_limit?: number | null
                    color?: string
                }
                Update: {
                    name?: string
                    balance?: number
                    is_active?: boolean
                    include_in_total?: boolean
                    color?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    user_id: string | null
                    name: string
                    type: 'income' | 'expense' | 'transfer'
                    icon: string | null
                    color: string
                    is_default: boolean
                    parent_id: string | null
                    created_at: string
                }
                Insert: {
                    user_id?: string | null
                    name: string
                    type: 'income' | 'expense' | 'transfer'
                    icon?: string | null
                    color?: string
                    is_default?: boolean
                }
                Update: {
                    name?: string
                    icon?: string | null
                    color?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    account_id: string
                    category_id: string | null
                    family_id: string | null
                    amount: number
                    type: 'income' | 'expense' | 'transfer'
                    description: string
                    notes: string | null
                    date: string
                    is_recurring: boolean
                    recurring_frequency: string | null
                    recurring_end_date: string | null
                    parent_transaction_id: string | null
                    tags: string[] | null
                    transfer_account_id: string | null
                    invoice_id: string | null
                    installments: number | null
                    installment_number: number | null
                    open_finance_id: string | null
                    ai_categorized: boolean
                    ai_confidence: number | null
                    ai_reviewed: boolean
                    receipt_url: string | null
                    latitude: number | null
                    longitude: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    account_id: string
                    amount: number
                    type: 'income' | 'expense' | 'transfer'
                    description: string
                    date?: string
                    category_id?: string | null
                    notes?: string | null
                    is_recurring?: boolean
                    tags?: string[] | null
                }
                Update: {
                    amount?: number
                    description?: string
                    category_id?: string | null
                    notes?: string | null
                    date?: string
                    ai_reviewed?: boolean
                }
            }
            budgets: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string
                    amount: number
                    period: 'weekly' | 'monthly' | 'yearly'
                    month: number | null
                    year: number | null
                    alert_threshold: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    category_id: string
                    amount: number
                    period?: 'weekly' | 'monthly' | 'yearly'
                    month?: number | null
                    year?: number | null
                    alert_threshold?: number
                }
                Update: {
                    amount?: number
                    alert_threshold?: number
                }
            }
            goals: {
                Row: {
                    id: string
                    user_id: string
                    family_id: string | null
                    account_id: string | null
                    name: string
                    description: string | null
                    target_amount: number
                    current_amount: number
                    target_date: string | null
                    icon: string
                    color: string
                    category: string
                    priority: number
                    is_completed: boolean
                    completed_at: string | null
                    is_shared: boolean
                    monthly_contribution: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    name: string
                    target_amount: number
                    category?: string
                    icon?: string
                    color?: string
                    priority?: number
                }
                Update: {
                    name?: string
                    target_amount?: number
                    current_amount?: number
                    is_completed?: boolean
                }
            }
            bills: {
                Row: {
                    id: string
                    user_id: string
                    account_id: string | null
                    category_id: string | null
                    name: string
                    amount: number
                    type: 'income' | 'expense'
                    frequency: string
                    due_day: number | null
                    next_due_date: string | null
                    last_paid_date: string | null
                    is_active: boolean
                    auto_pay: boolean
                    reminder_days: number
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    name: string
                    amount: number
                    frequency: string
                    type?: 'income' | 'expense'
                    due_day?: number | null
                    next_due_date?: string | null
                }
                Update: {
                    name?: string
                    amount?: number
                    is_active?: boolean
                    next_due_date?: string | null
                    last_paid_date?: string | null
                }
            }
            boletos: {
                Row: {
                    id: string
                    user_id: string
                    account_id: string | null
                    barcode: string | null
                    digitable_line: string | null
                    amount: number
                    discount_amount: number | null
                    fine_amount: number | null
                    final_amount: number | null
                    beneficiary_name: string | null
                    beneficiary_document: string | null
                    payer_name: string | null
                    due_date: string
                    payment_date: string | null
                    category_id: string | null
                    type: string
                    dda_detected: boolean
                    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
                    is_recurring: boolean
                    bill_id: string | null
                    notes: string | null
                    ai_categorized: boolean
                    ai_confidence: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    amount: number
                    due_date: string
                    type?: string
                    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
                    beneficiary_name?: string | null
                    barcode?: string | null
                }
                Update: {
                    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
                    payment_date?: string | null
                    notes?: string | null
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    data: Json | null
                    is_read: boolean
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    user_id: string
                    type: string
                    title: string
                    message: string
                    data?: Json | null
                }
                Update: {
                    is_read?: boolean
                    read_at?: string | null
                }
            }
            wealth_lab_simulations: {
                Row: {
                    id: string
                    user_id: string
                    type: 'independence' | 'retirement' | 'investment' | 'tax_planning' | 'objective' | 'mei_projection'
                    name: string
                    inputs: Json
                    results: Json
                    is_favorite: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    type: 'independence' | 'retirement' | 'investment' | 'tax_planning' | 'objective' | 'mei_projection'
                    name: string
                    inputs: Json
                    results: Json
                }
                Update: {
                    name?: string
                    inputs?: Json
                    results?: Json
                    is_favorite?: boolean
                    notes?: string | null
                }
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Bill = Database['public']['Tables']['bills']['Row']
export type Boleto = Database['public']['Tables']['boletos']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type WealthLabSimulation = Database['public']['Tables']['wealth_lab_simulations']['Row']

export type TransactionWithCategory = Transaction & {
    categories: Category | null
    accounts: Pick<Account, 'id' | 'name' | 'type' | 'color'> | null
}
