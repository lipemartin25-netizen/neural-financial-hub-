import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ message: 'Pluggy transactions disabled.' }, { status: 503 })
}
