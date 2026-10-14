export type PermissionLevel = {
    view: boolean
    edit: boolean
    delete: boolean
    invite: boolean
}

export type FamilyMember = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: 'owner' | 'adult' | 'member' | 'view_only'
    joined_at: string
}

export type SharedBudget = {
    id: string
    category_id: string
    name: string
    amount: number
    spent: number
    month: number
    year: number
    contributors: string[]
}

export interface FamilyGroup {
    id: string
    name: string
    owner_id: string
    members: FamilyMember[]
    sharedBudgets: SharedBudget[]
    permissions: PermissionLevel
    invite_code: string | null
}

export type CoupleShareConfig = {
    id: string
    family_id: string
    partner_1_id: string
    partner_2_id: string
    split_type: 'equal' | 'proportional' | 'custom'
    partner_1_income: number | null
    partner_2_income: number | null
    custom_splits: Record<string, number> | null
}
