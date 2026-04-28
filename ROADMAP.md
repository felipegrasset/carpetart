# CarpetArt — Roadmap

## ✅ Phase 1 — Core (current sprint)

### Data model
- [x] `Project` (name*, productora?, duracion?, description?)
- [x] `Category` (name*, description?, belongs to Project)
- [x] `Image` (sourceUrl*, description?, belongs to Category)

### Projects
- [x] List projects on dashboard
- [x] Create project (name + productora + duracion + description)
- [x] Delete project (cascades to categories + images)
- [x] Project detail page (categories grid)

### Categories
- [x] Create category inside a project
- [x] Delete category (cascades to images)
- [x] Generate PDF per category

### Images
- [x] Add image via URL → downloaded to Supabase Storage asynchronously
- [x] Optional description per image (editable inline in table)
- [x] Global images table with filters: project, category, status
- [x] Multi-select rows → generate PDF from selection
- [x] Delete image (removes from storage)
- [x] `AddImagePanel` drawer with inline category creation

### PDF generation (`pdf-lib`)
- [x] Cover page (dark, title + subtitle + image count)
- [x] Images grouped by category with section headers
- [x] 2-column grid layout per page, A4
- [x] Optional caption under each image
- [x] Upload to Supabase Storage → returns public URL
- [x] Generate from: single category / full project / custom multi-selection

---

## 🔜 Phase 2 — Polish & UX

- [ ] Project edit form (update name / productora / duracion / description)
- [ ] Category edit (rename, change description)
- [ ] Image drag-and-drop reorder (`sortOrder`)
- [ ] Image gallery view (lightbox) in addition to table
- [ ] Bulk delete selected images
- [ ] PDF: choose cover color / layout (1-col vs 2-col)
- [ ] PDF status polling (currently synchronous, slow for large sets)
- [ ] Toast notifications (success / error feedback)
- [ ] Loading skeletons instead of spinner text

---

## 🔜 Phase 3 — Collaboration & Sharing

- [ ] Shareable PDF link (public, time-limited token)
- [ ] Export as ZIP (original images + PDF)
- [ ] Project collaborators (invite by email, read-only vs edit)
- [ ] Comment / annotation per image

---

## 🔜 Phase 4 — Mailing (Resend — ready to integrate)

> Backend skeleton already ready (`RESEND_API_KEY` env var reserved).

- [ ] Email on PDF ready: "Your PDF for _Project X_ is ready → Download"
- [ ] Invite collaborator by email
- [ ] Weekly digest (optional): projects updated this week
- [ ] Transactional: account confirmation on sign-up

---

## 🔜 Phase 5 — Advanced

- [ ] AI auto-tagging: send image to Vision API → suggest category + description
- [ ] Duplicate detection (perceptual hash)
- [ ] Import from Pinterest board URL (bulk add)
- [ ] Mood board canvas (free-form arrange images)
- [ ] Export to Notion / Google Slides
