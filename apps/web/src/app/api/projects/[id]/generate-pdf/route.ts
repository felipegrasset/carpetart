import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { generatePdfFromImages } from '@/lib/pdf-generator'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      categories: {
        orderBy: { createdAt: 'asc' },
        include: {
          images: {
            where: { status: 'stored' },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const allImages = project.categories.flatMap((c) =>
    c.images.map((img) => ({ ...img, categoryName: c.name }))
  )
  if (allImages.length === 0) {
    return NextResponse.json({ error: 'No stored images in this project' }, { status: 422 })
  }

  try {
    const pdfUrl = await generatePdfFromImages({
      title: project.name,
      subtitle: project.description ?? undefined,
      images: allImages,
      userId: user.id,
      pdfId: `project-${project.id}`,
    })
    return NextResponse.json({ pdfUrl })
  } catch (err) {
    console.error('PDF generation error', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
