import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'
import { generateFolderPdf } from '@/lib/pdf-generator'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({
    where: { id: params.id, userId: user.id },
    include: { images: { where: { status: 'stored' }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  if (folder.images.length === 0) {
    return NextResponse.json({ error: 'No stored images in this folder' }, { status: 422 })
  }

  // Mark as generating
  await prisma.folder.update({ where: { id: params.id }, data: { status: 'generating' } })

  try {
    const pdfUrl = await generateFolderPdf(folder, user.id)
    await prisma.folder.update({
      where: { id: params.id },
      data: { status: 'ready', pdfUrl, pdfName: `${folder.name}.pdf` },
    })
    return NextResponse.json({ message: 'PDF generated', pdfUrl })
  } catch (err) {
    await prisma.folder.update({ where: { id: params.id }, data: { status: 'error' } })
    console.error('PDF generation error', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
