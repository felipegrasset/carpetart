# CarpetArt

Generate art reference folders for audiovisual production. Paste image URLs, group them by concept, export a clean PDF.

## What it does

- Paste URLs of reference images into a form
- Assign each image to a **concept folder** (e.g. "Noir Lighting", "Brutalist Architecture")
- CarpetArt downloads the images, stores them, and generates a styled PDF per folder
- Download and share the PDF for use in production decks, mood boards, etc.

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 14 App Router |
| API | Next.js Route Handlers (Vercel Serverless) |
| Database | Prisma ORM + Supabase PostgreSQL |
| Storage | Supabase Storage |
| Auth | Supabase Auth |
| PDF | pdf-lib |
| Deployment | Vercel |

## Project Structure

```
carpetart/
├── apps/
│   └── web/                    # Next.js 14 app (frontend + API)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/     # Login / register pages
│       │   │   ├── dashboard/  # Main app pages
│       │   │   └── api/        # Serverless API routes
│       │   ├── components/     # UI components
│       │   └── lib/            # Helpers (auth, pdf, image downloader)
│       └── package.json
├── packages/
│   ├── database/               # Prisma schema + client
│   └── shared/                 # Zod schemas
├── AGENT.md                    # AI agent development guide
├── README.md                   # This file
├── API.md                      # API endpoint reference
├── turbo.json
├── vercel.json
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node >= 18
- pnpm >= 8
- Supabase project (free tier works)
- Vercel account

### 1. Clone and install

```bash
git clone https://github.com/your-org/carpetart
cd carpetart
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` in `apps/web/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 3. Set up database

```bash
pnpm db:push      # applies schema to Supabase
```

### 4. Create Supabase Storage buckets

In the Supabase dashboard create two buckets:
- `carpetart-images` (private)
- `carpetart-pdfs` (private)

### 5. Run locally

```bash
pnpm dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel

```bash
git push origin main
# Vercel picks it up automatically via vercel.json
```

Set the same env vars in the Vercel project settings.

## Usage

1. **Sign up / log in** with email
2. **Create a folder** and give it a concept name
3. **Add images** by pasting a URL and clicking Add
4. Repeat for as many images/folders as needed
5. **Generate PDF** on any folder — download when ready

## Contributing

See `AGENT.md` for the full developer/agent guide.
