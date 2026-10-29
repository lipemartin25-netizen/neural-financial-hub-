import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({ message: 'Pluggy webhook disabled.' }, { status: 503 })
}
