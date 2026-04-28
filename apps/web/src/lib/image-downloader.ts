import { createClient } from '@supabase/supabase-js'
import { prisma } from '@carpetart/database'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function downloadAndStoreImage(imageId: string, sourceUrl: string, userId: string) {
  try {
    await prisma.image.update({ where: { id: imageId }, data: { status: 'downloading' } })

    const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'CarpetArt/1.0' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) throw new Error('URL does not point to an image')

    const ext = contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'jpg'
    const fileName = `${imageId}.${ext}`
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabaseAdmin.storage
      .from('carpetart-images')
      .upload(`${userId}/${fileName}`, buffer, { contentType, upsert: true })

    if (error) throw error

    const { data: urlData } = supabaseAdmin.storage
      .from('carpetart-images')
      .getPublicUrl(`${userId}/${fileName}`)

    await prisma.image.update({
      where: { id: imageId },
      data: {
        storedUrl: urlData.publicUrl,
        fileName,
        mimeType: contentType,
        sizeBytes: buffer.length,
        status: 'stored',
      },
    })
  } catch (err: any) {
    await prisma.image.update({
      where: { id: imageId },
      data: { status: 'error', errorMsg: err?.message || 'Unknown error' },
    })
  }
}
