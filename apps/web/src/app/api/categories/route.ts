import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const categories = await prisma.category.findMany({
    where: { userId: user.id, ...(projectId ? { projectId } : {}) },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { images: true } }, project: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ categories })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, projectId } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const category = await prisma.category.create({
    data: { name: name.trim(), description: description?.trim() || null, projectId, userId: user.id },
    include: { project: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ category }, { status: 201 })
}
