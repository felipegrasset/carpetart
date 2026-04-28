import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const image = await prisma.image.findFirst({ where: { id: params.id, userId: user.id } })
  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  const { sortOrder, description } = await request.json()
  const updated = await prisma.image.update({
    where: { id: params.id },
    data: {
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  })

  return NextResponse.json({ image: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const image = await prisma.image.findFirst({ where: { id: params.id, userId: user.id } })
  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  if (image.fileName) {
    await supabaseAdmin.storage
      .from('carpetart-images')
      .remove([`${user.id}/${image.fileName}`])
  }

  await prisma.image.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
