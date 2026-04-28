import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@carpetart/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: sbUser }, error } = await supabase.auth.getUser(token)
  if (error || !sbUser) return null

  let user = await prisma.user.findUnique({ where: { supabaseId: sbUser.id } })
  
  // Auto-create user if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        supabaseId: sbUser.id,
        email: sbUser.email || '',
        name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
      },
    })
  }
  
  return user
}
