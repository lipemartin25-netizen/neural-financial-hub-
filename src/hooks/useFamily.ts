'use client'

import { useState, useEffect, useCallback } from 'react'

export type FamilyMember = {
    id: string; user_id: string; role: string; nickname: string | null; joined_at: string
    profile: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null
}

export type FamilyGoal = {
    id: string; name: string; icon: string; target_amount: number; current_amount: number
    deadline: string | null; is_completed: boolean; created_by: string | null
}

type SharedTx = {
    id: string; shared_at: string; split_type: string; shared_by: string
    transactions: { id: string; description: string; amount: number; type: string; date: string; category_id: string | null } | null
}

export type FamilyBudget = {
    id: string; category_id: string; amount: number; spent: number; month: string
    categories: { name: string; icon: string | null } | null
}

export type FamilyData = {
    family: { id: string; name: string; owner_id: string; invite_code: string } | null
    myRole: string
    myMemberId: string
    members: FamilyMember[]
    goals: FamilyGoal[]
    sharedTransactions: SharedTx[]
    budgets: FamilyBudget[]
}

export function useFamily() {
    const [data, setData] = useState<FamilyData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetch_ = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/family')
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            setData(json.data)
        } catch { } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetch_() }, [fetch_])

    const createFamily = async (name: string) => {
        const res = await fetch('/api/family', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', name }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        await fetch_()
        return json.data
    }

    const joinFamily = async (invite_code: string) => {
        const res = await fetch('/api/family', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'join', invite_code }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        await fetch_()
        return json.data
    }

    const leaveFamily = async () => {
        const res = await fetch('/api/family', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'leave' }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setData(null)
    }

    const updateMemberRole = async (member_id: string, role: string) => {
        await fetch('/api/family', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_member_role', member_id, role }),
        })
        await fetch_()
    }

    const removeMember = async (member_id: string) => {
        await fetch('/api/family', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove_member', member_id }),
        })
        await fetch_()
    }

    const shareTransaction = async (transaction_id: string, split_type = 'none') => {
        const res = await fetch('/api/family', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'share_transaction', transaction_id, split_type }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        await fetch_()
    }

    const createGoal = async (goal: { name: string; icon?: string; target_amount: number; deadline?: string }) => {
        const res = await fetch('/api/family/goals', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_goal', ...goal }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        await fetch_()
    }

    const contributeToGoal = async (goal_id: string, amount: number, note?: string) => {
        const res = await fetch('/api/family/goals', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'contribute', goal_id, amount, note }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        await fetch_()
    }

    const createFamilyBudget = async (category_id: string, amount: number) => {
        const res = await fetch('/api/family/budgets', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', category_id, amount }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        await fetch_()
    }

    return {
        data, loading, refetch: fetch_,
        hasFamily: !!data?.family,
        createFamily, joinFamily, leaveFamily,
        updateMemberRole, removeMember, shareTransaction,
        createGoal, contributeToGoal, createFamilyBudget,
    }
}
