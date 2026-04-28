import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      categories: {
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { images: true } } },
      },
    },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ project })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: user.id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { name, description, productora, startDate, endDate, status } = await request.json()
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: name ?? project.name,
      description: description !== undefined ? description : project.description,
      productora: productora !== undefined ? (productora?.trim() || null) : project.productora,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : project.startDate,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : project.endDate,
      status: status !== undefined ? (status?.trim() || null) : project.status,
    },
  })

  return NextResponse.json({ project: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: user.id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
