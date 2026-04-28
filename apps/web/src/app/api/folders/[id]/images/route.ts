import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { downloadAndStoreImage } from '@/lib/image-downloader'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({ where: { id: params.id, userId: user.id } })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  const images = await prisma.image.findMany({
    where: { folderId: params.id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ images })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({ where: { id: params.id, userId: user.id } })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  const { sourceUrl, sortOrder } = await request.json()
  if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 })

  // Validate URL
  try { new URL(sourceUrl) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Create image record immediately
  const image = await prisma.image.create({
    data: {
      sourceUrl,
      sortOrder: sortOrder ?? 0,
      folderId: params.id,
      userId: user.id,
      status: 'pending',
    },
  })

  // Download and store in background (still within serverless timeout for most images)
  downloadAndStoreImage(image.id, sourceUrl, user.id).catch(console.error)

  return NextResponse.json({ image }, { status: 201 })
}
