import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({
    where: { id: params.id, userId: user.id },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  return NextResponse.json({ folder })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({ where: { id: params.id, userId: user.id } })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  const { name, description } = await request.json()

  const updated = await prisma.folder.update({
    where: { id: params.id },
    data: { name: name ?? folder.name, description: description ?? folder.description },
  })

  return NextResponse.json({ folder: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({ where: { id: params.id, userId: user.id } })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  await prisma.folder.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
