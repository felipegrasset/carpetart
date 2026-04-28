import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { downloadAndStoreImage } from '@/lib/image-downloader'

// GET /api/images?projectId=&categoryId=
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const categoryId = searchParams.get('categoryId')

  const images = await prisma.image.findMany({
    where: {
      userId: user.id,
      ...(categoryId ? { categoryId } : {}),
      ...(projectId && !categoryId ? { category: { projectId } } : {}),
    },
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
    },
  })

  return NextResponse.json({ images })
}

// POST /api/images — add image URL to a category
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sourceUrl, categoryId, description, sortOrder } = await request.json()
  if (!sourceUrl?.trim()) return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })

  try { new URL(sourceUrl) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId: user.id } })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const image = await prisma.image.create({
    data: {
      sourceUrl: sourceUrl.trim(),
      description: description?.trim() || null,
      sortOrder: sortOrder ?? 0,
      categoryId,
      userId: user.id,
      status: 'pending',
    },
    include: {
      category: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
    },
  })

  downloadAndStoreImage(image.id, sourceUrl.trim(), user.id).catch(console.error)

  return NextResponse.json({ image }, { status: 201 })
}
