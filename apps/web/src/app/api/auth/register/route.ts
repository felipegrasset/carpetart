import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@carpetart/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token)
    if (error || !sbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name } = body

    const existing = await prisma.user.findUnique({ where: { supabaseId: sbUser.id } })
    if (existing) return NextResponse.json({ user: existing })

    const user = await prisma.user.create({
      data: {
        email: sbUser.email!,
        supabaseId: sbUser.id,
        name: name || null,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('register error', err)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
