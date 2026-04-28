import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await request.json()
  
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Updates must be an array of { id, sortOrder }' }, { status: 400 })
  }

  // Update images inside a transaction
  try {
    const transactions = updates.map((update: { id: string, sortOrder: number }) => 
      prisma.image.update({
        where: { id: update.id, userId: user.id },
        data: { sortOrder: update.sortOrder }
      })
    )
    
    await prisma.$transaction(transactions)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering images:', error)
    return NextResponse.json({ error: 'Failed to reorder images' }, { status: 500 })
  }
}
