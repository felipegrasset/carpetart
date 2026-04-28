import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { categories: true } },
        categories: {
          select: { _count: { select: { images: true } } },
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (err) {
    console.error('GET /api/projects error:', err)
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/projects started')
    
    const user = await getAuthUser(request)
    console.log('Authenticated user:', user?.id)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    console.log('Request body:', { name: body.name, hasDesc: !!body.description })
    
    const { name, description, productora, startDate, endDate, status } = body
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    console.log('Creating project:', name)
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        productora: productora?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status?.trim() || null,
        userId: user.id,
      },
    })
    console.log('Project created:', project.id)

    return NextResponse.json({ project }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/projects error:', err)
    return NextResponse.json({ 
      error: 'Failed to create project',
      details: err.message || String(err)
    }, { status: 500 })
  }
}
