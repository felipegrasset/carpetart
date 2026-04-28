import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      project: { select: { id: true, name: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  return NextResponse.json({ category })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({ where: { id: params.id, userId: user.id } })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const { name, description } = await request.json()
  const updated = await prisma.category.update({
    where: { id: params.id },
    data: { name: name ?? category.name, description: description ?? category.description },
  })

  return NextResponse.json({ category: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({ where: { id: params.id, userId: user.id } })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  await prisma.category.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
