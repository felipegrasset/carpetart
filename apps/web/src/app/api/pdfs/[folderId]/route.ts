import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest, { params }: { params: { folderId: string } }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folder = await prisma.folder.findFirst({
    where: { id: params.folderId, userId: user.id },
    select: { status: true, pdfUrl: true, pdfName: true },
  })
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  return NextResponse.json({ status: folder.status, pdfUrl: folder.pdfUrl, pdfName: folder.pdfName })
}
