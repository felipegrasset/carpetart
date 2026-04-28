import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { generatePdfFromImages } from '@/lib/pdf-generator'

// POST /api/images/generate-pdf  body: { imageIds: string[], title?: string }
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageIds, title } = await request.json()
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return NextResponse.json({ error: 'imageIds array is required' }, { status: 400 })
  }

  const images = await prisma.image.findMany({
    where: { id: { in: imageIds }, userId: user.id, status: 'stored' },
    orderBy: { sortOrder: 'asc' },
    include: { 
      category: { select: { name: true } },
      folder: { select: { name: true } }
    },
  })

  if (images.length === 0) {
    return NextResponse.json({ error: 'No stored images found for given IDs' }, { status: 422 })
  }

  try {
    const pdfUrl = await generatePdfFromImages({
      title: title || 'Custom Selection',
      images: images.map((img) => ({ 
        ...img, 
        categoryName: img.category?.name || img.folder?.name || 'Uncategorized' 
      })),
      userId: user.id,
      pdfId: `selection-${user.id}-${Date.now()}`,
    })
    return NextResponse.json({ pdfUrl })
  } catch (err) {
    console.error('PDF generation error', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
