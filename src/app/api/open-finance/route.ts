import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json(
        { message: 'Open Finance (Pluggy) desativado temporariamente.' },
        { status: 503 }
    )
}

export async function POST() {
    return NextResponse.json(
        { message: 'Open Finance (Pluggy) desativado temporariamente.' },
        { status: 503 }
    )
}
