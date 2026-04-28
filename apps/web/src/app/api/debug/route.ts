import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest) {
  const result: Record<string, any> = {
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
    }
  }

  // 1. Check token
  const authHeader = request.headers.get('authorization')
  result.hasAuthHeader = !!authHeader
  if (!authHeader) return NextResponse.json(result)

  const token = authHeader.replace('Bearer ', '').trim()
  result.tokenLength = token.length
  result.tokenPreview = token.substring(0, 20)

  // 2. Check Supabase auth
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)
    result.supabaseUser = user ? { id: user.id, email: user.email } : null
    result.supabaseError = error?.message || null
  } catch (e: any) {
    result.supabaseException = e.message
  }

  // 3. Check DB connection
  try {
    await prisma.$queryRaw`SELECT 1 as ok`
    result.dbConnected = true
  } catch (e: any) {
    result.dbConnected = false
    result.dbError = e.message
  }

  // 4. Check tables and columns if DB connected
  if (result.dbConnected) {
    try {
      const tables = await prisma.$queryRaw<{tablename: string}[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
      `
      result.tables = (tables as any[]).map((t) => t.tablename)
    } catch (e: any) {
      result.tablesError = e.message
    }

    try {
      const cols = await prisma.$queryRaw<any[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'Project' AND table_schema = 'public'
        ORDER BY column_name
      `
      result.projectColumns = (cols as any[]).map((c) => c.column_name)
    } catch (e: any) {
      result.projectColumnsError = e.message
    }
  }

  return NextResponse.json(result)
}
