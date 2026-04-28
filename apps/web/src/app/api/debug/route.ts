import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@carpetart/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(request: NextRequest) {
  const result: Record<string, any> = {}

  // 1. Check token
  const authHeader = request.headers.get('authorization')
  result.hasAuthHeader = !!authHeader
  if (!authHeader) return NextResponse.json(result)

  const token = authHeader.replace('Bearer ', '')
  result.tokenLength = token.length

  // 2. Check Supabase auth
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    result.supabaseUser = user ? { id: user.id, email: user.email } : null
    result.supabaseError = error?.message || null
  } catch (e: any) {
    result.supabaseException = e.message
  }

  // 3. Check DB connection
  try {
    await prisma.$queryRaw`SELECT 1`
    result.dbConnected = true
  } catch (e: any) {
    result.dbConnected = false
    result.dbError = e.message
  }

  // 4. Check tables exist
  if (result.dbConnected) {
    try {
      const tables = await prisma.$queryRaw<{tablename: string}[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `
      result.tables = tables.map((t: any) => t.tablename)
    } catch (e: any) {
      result.tablesError = e.message
    }

    // 5. Check Project columns
    try {
      const cols = await prisma.$queryRaw<{column_name: string}[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'Project' AND table_schema = 'public'
      `
      result.projectColumns = cols.map((c: any) => c.column_name)
    } catch (e: any) {
      result.projectColumnsError = e.message
    }
  }

  return NextResponse.json(result)
}
