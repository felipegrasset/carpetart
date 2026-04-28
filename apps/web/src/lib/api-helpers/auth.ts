import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@carpetart/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('No authorization header')
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token)
    if (error || !sbUser) {
      console.log('Supabase auth error:', error)
      return null
    }

    let user = await prisma.user.findUnique({ where: { supabaseId: sbUser.id } })
    
    // Auto-create user if doesn't exist
    if (!user) {
      console.log('Creating user for supabaseId:', sbUser.id)
      try {
        user = await prisma.user.create({
          data: {
            supabaseId: sbUser.id,
            email: sbUser.email || '',
            name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
          },
        })
        console.log('User created:', user.id)
      } catch (createErr: any) {
        console.error('Error creating user:', createErr.message)
        // User might have been created by another request, try to find it
        user = await prisma.user.findUnique({ where: { supabaseId: sbUser.id } })
        if (!user) throw createErr
      }
    }
    
    return user
  } catch (err) {
    console.error('getAuthUser error:', err)
    return null
  }
}
