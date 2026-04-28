# API.md — CarpetArt API Reference

Base URL (local): `http://localhost:3000/api`
Base URL (production): `https://carpetart.vercel.app/api`

All endpoints require `Authorization: Bearer <supabase_jwt>` unless marked public.

---

## Auth

### GET /api/auth/me
Returns the currently authenticated user.

**Response 200**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "name": "Jane" }
}
```

---

### POST /api/auth/register
Creates a user record after Supabase sign-up.

**Body**
```json
{ "name": "Jane Doe" }
```

**Response 201**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "name": "Jane Doe" }
}
```

---

## Projects

A **Project** is the top-level grouping (e.g. a film, series, or ad). It contains Categories.

### Project fields
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Project name |
| `description` | string? | — | Free-text description |
| `productora` | string? | — | Production company |
| `startDate` | ISO date? | — | Production start date |
| `endDate` | ISO date? | — | Production end date |
| `status` | string? | — | `desarrollo` \| `preproduccion` \| `rodaje` \| `postpro` \| `entregado` |

---

### GET /api/projects
List all projects for the authenticated user.

**Response 200**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Film Noir Short",
      "productora": "Black Frame Films",
      "status": "preproduccion",
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-06-15T00:00:00Z",
      "description": "...",
      "createdAt": "2026-04-27T10:00:00Z",
      "_count": { "categories": 4 }
    }
  ]
}
```

---

### POST /api/projects
Create a new project.

**Body**
```json
{
  "name": "Film Noir Short",
  "productora": "Black Frame Films",
  "startDate": "2026-06-01",
  "endDate": "2026-06-15",
  "status": "preproduccion",
  "description": "optional"
}
```

**Response 201**
```json
{
  "project": { "id": "uuid", "name": "Film Noir Short", "status": "preproduccion" }
}
```

---

### GET /api/projects/:id
Get a single project with all its categories.

**Response 200**
```json
{
  "project": {
    "id": "uuid",
    "name": "Film Noir Short",
    "productora": "Black Frame Films",
    "status": "rodaje",
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-06-15T00:00:00Z",
    "categories": [
      {
        "id": "uuid",
        "name": "Lighting",
        "description": "Low-key refs",
        "pdfStatus": "ready",
        "pdfUrl": "https://...",
        "_count": { "images": 12 }
      }
    ]
  }
}
```

---

### PUT /api/projects/:id
Update project fields (partial — only include fields to change).

**Body**
```json
{
  "name": "Updated Name",
  "status": "rodaje",
  "endDate": "2026-06-20"
}
```

**Response 200**
```json
{ "project": { "id": "uuid", "name": "Updated Name", "status": "rodaje" } }
```

---

### DELETE /api/projects/:id
Delete a project and cascade-delete all its categories and images.

**Response 200**
```json
{ "success": true }
```

---

### POST /api/projects/:id/generate-pdf
Generate a PDF containing all images from all categories in the project.

**Body**: none

**Response 200**
```json
{ "pdfUrl": "https://supabase.co/storage/v1/object/sign/carpetart-pdfs/uuid.pdf?token=..." }
```

---

## Categories

A **Category** belongs to a Project (e.g. "Lighting", "Wardrobe", "Location").

### GET /api/categories
List categories. Filter by project with `?projectId=<id>`.

**Response 200**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Lighting",
      "description": "...",
      "projectId": "uuid",
      "pdfStatus": "none",
      "pdfUrl": null,
      "project": { "id": "uuid", "name": "Film Noir Short" },
      "_count": { "images": 8 }
    }
  ]
}
```

---

### POST /api/categories
Create a new category inside a project.

**Body**
```json
{
  "name": "Lighting",
  "description": "optional",
  "projectId": "uuid"
}
```

**Response 201**
```json
{
  "category": { "id": "uuid", "name": "Lighting", "projectId": "uuid" }
}
```

---

### GET /api/categories/:id
Get a single category with its images.

**Response 200**
```json
{
  "category": {
    "id": "uuid",
    "name": "Lighting",
    "images": [
      { "id": "uuid", "storedUrl": "https://...", "status": "stored", "description": "Low-key setup" }
    ]
  }
}
```

---

### PUT /api/categories/:id
Update category name or description.

**Body**
```json
{ "name": "Updated Name", "description": "Updated description" }
```

**Response 200**
```json
{ "category": { "id": "uuid", "name": "Updated Name" } }
```

---

### DELETE /api/categories/:id
Delete a category and cascade-delete all its images.

**Response 200**
```json
{ "success": true }
```

---

### POST /api/categories/:id/generate-pdf
Generate a PDF for this category only.

**Response 200**
```json
{ "pdfUrl": "https://..." }
```

---

## Images

An **Image** belongs to a Category. Adding a URL triggers an async background download to Supabase Storage.

### GET /api/images
List images. Filters: `?projectId=<id>` or `?categoryId=<id>` (category takes precedence).

**Response 200**
```json
{
  "images": [
    {
      "id": "uuid",
      "sourceUrl": "https://example.com/photo.jpg",
      "storedUrl": "https://supabase.co/storage/...",
      "description": "Low-key setup ref",
      "status": "stored",
      "sortOrder": 0,
      "createdAt": "2026-04-27T10:00:00Z",
      "category": {
        "id": "uuid",
        "name": "Lighting",
        "project": { "id": "uuid", "name": "Film Noir Short" }
      }
    }
  ]
}
```

---

### POST /api/images
Add an image URL to a category. Download is triggered asynchronously.

**Body**
```json
{
  "sourceUrl": "https://example.com/photo.jpg",
  "categoryId": "uuid",
  "description": "optional annotation"
}
```

**Response 201**
```json
{
  "image": { "id": "uuid", "sourceUrl": "https://...", "status": "pending", "sortOrder": 0 }
}
```

**Errors**: 400 invalid URL · 404 category not found

---

### PATCH /api/images/:id
Update image `sortOrder` or `description`.

**Body**
```json
{ "sortOrder": 3, "description": "Updated annotation" }
```

**Response 200**
```json
{ "image": { "id": "uuid", "sortOrder": 3, "description": "Updated annotation" } }
```

---

### DELETE /api/images/:id
Remove an image and delete it from Supabase Storage.

**Response 200**
```json
{ "success": true }
```

---

### POST /api/images/generate-pdf
Generate a PDF from a custom selection of images.

**Body**
```json
{
  "imageIds": ["uuid1", "uuid2", "uuid3"],
  "title": "Custom Selection PDF"
}
```

**Response 200**
```json
{ "pdfUrl": "https://..." }
```

---

## Error Responses

All errors follow this format:

```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid JWT |
| 403 | Forbidden |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Supabase Storage Structure

```
carpetart-images/
  {userId}/
    {imageId}.jpg      # downloaded reference images

carpetart-pdfs/
  {userId}/
    {pdfId}.pdf        # generated PDFs (project / category / custom)
```
