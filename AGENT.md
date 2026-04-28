# AGENT.md - CarpetArt: AI Art Reference Folder Generator

**Status**: Initial Setup
**Stack**: Turborepo, Next.js 14 App Router, Vercel Serverless Functions, Prisma ORM, Supabase
**Purpose**: Download images from URLs, group them by concept, generate PDFs for audiovisual art reference
**Last Updated**: 2026-04-27

---

## Architecture Overview

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend + API (apps/web)**: Next.js 14 App Router with serverless API Routes
- **Database (packages/database)**: Prisma ORM over Supabase PostgreSQL
- **Shared (packages/shared)**: Zod schemas and validators
- **Auth**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (bucket `carpetart-images`, `carpetart-pdfs`)
- **Deployment**: Vercel

---

## Database Schema (Prisma)

```prisma
// packages/database/prisma/schema.prisma

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  supabaseId String   @unique
  name       String?

  folders    Folder[]
  images     Image[]
}

// Folder - A concept/theme group that collects images and generates a PDF
model Folder {
  id          String   @id @default(uuid())
  name        String                // concept name, e.g. "Noir Lighting"
  description String?
  userId      String
  status      String   @default("draft") // draft | generating | ready | error
  pdfUrl      String?               // Supabase Storage URL for generated PDF
  pdfName     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   User    @relation(fields: [userId], references: [id])
  images Image[]
}

// Image - Single reference image, belongs to a Folder
model Image {
  id         String   @id @default(uuid())
  sourceUrl  String               // original URL provided by user
  storedUrl  String?              // Supabase Storage URL after download
  fileName   String?
  mimeType   String?
  sizeBytes  Int?
  sortOrder  Int      @default(0) // order within folder for PDF layout
  status     String   @default("pending") // pending | downloading | stored | error
  errorMsg   String?
  folderId   String
  userId     String
  createdAt  DateTime @default(now())

  folder Folder @relation(fields: [folderId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])
}
```

---

## API Architecture (Vercel Serverless)

All endpoints live in `apps/web/src/app/api/`. Auth via `Authorization: Bearer <supabase_jwt>`.

### Route Map

```
apps/web/src/app/api/
├── auth/
│   ├── me/route.ts                     # GET  - Current user
│   └── register/route.ts               # POST - Register user
├── folders/
│   ├── route.ts                        # GET, POST - List / create folder
│   └── [id]/
│       ├── route.ts                    # GET, PUT, DELETE - Folder CRUD
│       ├── images/route.ts             # GET, POST - Add image to folder
│       └── generate-pdf/route.ts       # POST - Trigger PDF generation
├── images/
│   └── [id]/route.ts                   # DELETE, PATCH (reorder)
└── pdfs/
    └── [folderId]/route.ts             # GET - PDF status + download URL
```

### Shared Helpers

- `apps/web/src/lib/api-helpers/auth.ts` - `getAuthUser(request)`
- `apps/web/src/lib/supabase.ts` - Supabase browser + server clients
- `apps/web/src/lib/pdf-generator.ts` - PDF assembly with `pdf-lib`
- `apps/web/src/lib/image-downloader.ts` - Download + store image in Supabase Storage

### Authentication Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-helpers/auth'
import { prisma } from '@carpetart/database'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
  return NextResponse.json({ data })
}
```

### Response Format

**Success**: `{ data }` with 200/201
**Error**: `{ error: "Message" }` with 4xx/5xx

---

## Key Flows

### Add Image Flow
1. User submits `{ sourceUrl, folderId, sortOrder? }` via UI form
2. POST `/api/folders/:id/images` saves Image record with `status: pending`
3. Server-side: downloads image → uploads to Supabase Storage → updates record to `status: stored`
4. UI polls or receives optimistic update

### Generate PDF Flow
1. User clicks "Generate PDF" on a folder
2. POST `/api/folders/:id/generate-pdf`
3. Server fetches all images (sorted by `sortOrder`) from Supabase Storage
4. Assembles PDF using `pdf-lib`: cover page with folder name, then images laid out in a grid
5. Uploads PDF to `carpetart-pdfs` bucket
6. Updates `Folder.pdfUrl` + `status: ready`
7. Returns download URL

---

## Development Phases

### Phase 0: Infrastructure
- [ ] Turborepo + pnpm monorepo setup
- [ ] Next.js 14 app scaffold
- [ ] Supabase project (Auth + Storage + DB)
- [ ] Prisma schema + `prisma db push`
- [ ] Vercel deployment pipeline

### Phase 1: Core CRUD
- [ ] Auth (Supabase magic link / email+password)
- [ ] Folder create/list/delete
- [ ] Image add (URL input) + download + store
- [ ] Image reorder within folder

### Phase 2: PDF Generation
- [ ] `pdf-lib` integration
- [ ] Grid layout with concept title page
- [ ] Upload PDF to Supabase Storage
- [ ] PDF download from UI

### Phase 3: UX Polish
- [ ] Drag-and-drop image reordering
- [ ] Image preview in folder view
- [ ] PDF preview (iframe/embed)
- [ ] Bulk URL import (paste multiple URLs)
- [ ] Public share link for a folder PDF

---

## Agent Development Guidelines

### Adding a New Feature

1. **DB change**: edit `packages/database/prisma/schema.prisma` → `pnpm db:push`
2. **API**: create `apps/web/src/app/api/<feature>/route.ts`, use `getAuthUser`
3. **Frontend**: use TanStack Query, include `Authorization: Bearer <token>` header

### Key Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, for storage uploads

# Database (Supabase Postgres)
DATABASE_URL=
```

### Supabase Storage Buckets

| Bucket              | Access  | Purpose                    |
|---------------------|---------|----------------------------|
| `carpetart-images`  | private | Downloaded reference images |
| `carpetart-pdfs`    | private | Generated PDF files         |

### Local Development

```bash
pnpm dev          # start all apps
pnpm db:push      # sync schema to Supabase
pnpm db:studio    # Prisma Studio GUI
```

### Deployment

```bash
git push origin main   # Vercel auto-deploys
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `packages/database/prisma/schema.prisma` | DB schema |
| `apps/web/src/app/api/**/*.ts` | API endpoints |
| `apps/web/src/lib/api-helpers/auth.ts` | Auth helper |
| `apps/web/src/lib/supabase.ts` | Supabase clients |
| `apps/web/src/lib/pdf-generator.ts` | PDF assembly |
| `apps/web/src/lib/image-downloader.ts` | Image fetch + store |
| `apps/web/next.config.js` | Next.js config |
| `turbo.json` | Turborepo pipeline |
| `vercel.json` | Vercel build config |

---

**Current Phase**: 0 - Setup
