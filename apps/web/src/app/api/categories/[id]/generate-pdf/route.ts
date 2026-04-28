import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { generatePdfFromImages } from '@/lib/pdf-generator'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      project: { select: { name: true } },
      images: { where: { status: 'stored' }, orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  if (category.images.length === 0) {
    return NextResponse.json({ error: 'No stored images in this category' }, { status: 422 })
  }

  await prisma.category.update({ where: { id: params.id }, data: { pdfStatus: 'generating' } })

  try {
    const images = category.images.map((img) => ({ ...img, categoryName: category.name }))
    const pdfUrl = await generatePdfFromImages({
      title: category.name,
      subtitle: `${category.project.name}${category.description ? ' — ' + category.description : ''}`,
      images,
      userId: user.id,
      pdfId: `category-${category.id}`,
    })

    await prisma.category.update({
      where: { id: params.id },
      data: { pdfStatus: 'ready', pdfUrl, pdfName: `${category.name}.pdf` },
    })
    return NextResponse.json({ pdfUrl })
  } catch (err) {
    await prisma.category.update({ where: { id: params.id }, data: { pdfStatus: 'error' } })
    console.error('PDF generation error', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
