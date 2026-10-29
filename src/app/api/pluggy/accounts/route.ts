import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({ message: 'Pluggy accounts disabled.' }, { status: 503 })
}
