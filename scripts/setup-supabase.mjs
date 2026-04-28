#!/usr/bin/env node
/**
 * setup-supabase.mjs
 *
 * Hace todo el setup de Supabase:
 *   - Crea buckets de storage (carpetart-images, carpetart-pdfs)
 *   - Verifica conectividad a las tablas
 *   - Imprime el SQL para correr manualmente si las tablas faltan
 *
 * Uso: node scripts/setup-supabase.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lpaonnxljyvkehhnygjj.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYW9ubnhsanl2a2VoaG55Z2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyNzk0NiwiZXhwIjoyMDkyOTAzOTQ2fQ.ENANR7ZFwtQERr_N8jkLNx1VFTbX5rdmhQGzpZWm05E'

const H = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

// ─── Storage Buckets ─────────────────────────────────────────────────────────

async function ensureBucket(name) {
  // Check if exists
  const check = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${name}`, { headers: H })
  if (check.ok) {
    console.log(`  ~ bucket "${name}" already exists`)
    return
  }

  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      id: name,
      name,
      public: false,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/gif', 'image/avif', 'image/svg+xml',
        'application/pdf',
      ],
    }),
  })
  const data = await res.json()
  if (res.ok) {
    console.log(`  ✓ bucket "${name}" created`)
  } else {
    console.log(`  ✗ bucket "${name}" failed:`, data.message || JSON.stringify(data))
  }
}

// ─── Table check via PostgREST ───────────────────────────────────────────────

async function checkTable(name) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${name}?limit=0`, { headers: H })
  if (r.ok) {
    console.log(`  ✓ table "${name}" OK`)
    return true
  }
  const err = await r.json().catch(() => ({ message: `HTTP ${r.status}` }))
  console.log(`  ✗ table "${name}": ${err.message || err.hint || r.status}`)
  return false
}

async function checkProjectColumns() {
  // Try to select the new columns — if they don't exist PostgREST returns an error
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/Project?select=id,name,productora,startDate,endDate,status&limit=0`,
    { headers: H }
  )
  if (r.ok) {
    console.log(`  ✓ Project has all required columns (productora, startDate, endDate, status)`)
    return true
  }
  const err = await r.json().catch(() => ({}))
  console.log(`  ✗ Project missing columns: ${err.message || err.hint || ''}`)
  return false
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔧 CarpetArt — Supabase Setup\n')
  console.log(`Project: ${SUPABASE_URL}\n`)

  // 1. Storage buckets
  console.log('── Storage Buckets ──────────────────────')
  await ensureBucket('carpetart-images')
  await ensureBucket('carpetart-pdfs')

  // List all buckets
  const bucketsRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers: H })
  const buckets = await bucketsRes.json()
  if (Array.isArray(buckets)) {
    console.log(`\n  All buckets: ${buckets.map(b => b.name).join(', ') || '(none)'}`)
  }

  // 2. Database tables
  console.log('\n── Database Tables ──────────────────────')
  const userOk     = await checkTable('User')
  const projectOk  = await checkTable('Project')
  const categoryOk = await checkTable('Category')
  const imageOk    = await checkTable('Image')

  if (projectOk) {
    await checkProjectColumns()
  }

  const allTablesOk = userOk && projectOk && categoryOk && imageOk

  // 3. Summary
  console.log('\n── Summary ──────────────────────────────')
  if (allTablesOk) {
    console.log('✅ Everything looks good! App should work.')
  } else {
    console.log('⚠️  Some tables are missing. Run this SQL in Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/lpaonnxljyvkehhnygjj/sql/new\n')
    console.log(`────────────────── SQL ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "User" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"      TEXT NOT NULL,
  "supabaseId" TEXT NOT NULL,
  "name"       TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"      ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseId_key" ON "User"("supabaseId");

CREATE TABLE IF NOT EXISTS "Project" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "productora"  TEXT,
  "startDate"   TIMESTAMPTZ,
  "endDate"     TIMESTAMPTZ,
  "status"      TEXT,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "projectId"   TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "pdfUrl"      TEXT,
  "pdfName"     TEXT,
  "pdfStatus"   TEXT NOT NULL DEFAULT 'none',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Category_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "Category_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "Image" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sourceUrl"   TEXT NOT NULL,
  "storedUrl"   TEXT,
  "fileName"    TEXT,
  "mimeType"    TEXT,
  "sizeBytes"   INTEGER,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "errorMsg"    TEXT,
  "categoryId"  TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Image_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Image_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE,
  CONSTRAINT "Image_userId_fkey"     FOREIGN KEY ("userId")     REFERENCES "User"("id")
);

-- Idempotent: add columns if missing
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "productora" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "startDate"  TIMESTAMPTZ;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "endDate"    TIMESTAMPTZ;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "status"     TEXT;
ALTER TABLE "Image"   ADD COLUMN IF NOT EXISTS "description" TEXT;
────────────────────────────────────────────────────────────────`)
  }

  console.log()
}

main().catch(console.error)
