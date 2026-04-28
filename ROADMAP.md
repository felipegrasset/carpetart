# ROADMAP — CarpetArt

## Hoy (MVP funcional)

### Fix & Infrastructure
- [x] Schema Prisma limpio: Project (name, productora?, startDate?, endDate?, status?) > Category > Image (description?)
- [x] Fix POST /api/projects — campos opcionales correctamente mapeados al schema
- [x] Sidebar de navegación con lista de proyectos coloreada por estado
- [x] Dashboard layout persistente (sidebar colapsable)

### Core features
- [x] Form para agregar imagen: URL + categoría + proyecto + descripción opcional
- [x] UI para crear proyectos (con productora, fechas, estado)
- [x] UI para crear categorías (dentro de un proyecto)
- [x] Vista de lista de imágenes filtrable por proyecto / categoría / status
- [x] Descripción opcional en imagen (editable inline en la tabla)
- [x] Generar PDF por proyecto (todas las categorías, agrupadas)
- [x] Generar PDF por categoría
- [x] Generar PDF por selección múltiple en tabla de imágenes

---

## Próxima iteración

### UX inmediato
- [ ] Drag & drop para reordenar imágenes dentro de una categoría (dnd-kit ya instalado)
- [ ] Preview de imagen en modal al hacer click en thumbnail
- [ ] Preview del PDF en iframe antes de descargar
- [ ] Edición inline de nombre de proyecto / categoría (sin modal)
- [ ] Toast notifications en lugar de alertas del browser

### Imágenes
- [ ] Bulk import: pegar múltiples URLs separadas por salto de línea
- [ ] Auto-refresh de status (polling cada 3s mientras hay imágenes en pending/downloading)
- [ ] Mover imagen entre categorías

### PDF
- [ ] Personalizar layout: 1, 2 o 3 columnas
- [ ] Incluir metadata del proyecto en la portada (productora, fechas, estado)
- [ ] Opción de incluir/excluir descripción de cada imagen
- [ ] Historial de PDFs generados

### Proyectos
- [ ] Editar proyecto (campos opcionales) sin borrar y recrear
- [ ] Archivar proyecto
- [ ] Duplicar estructura de proyecto

---

## Futuro

### Mailing con Resend (ya planificado, no implementado)
- [ ] Email cuando el PDF está listo (link de descarga)
- [ ] Invitar colaboradores a un proyecto
- [ ] Email con PDF adjunto

### Colaboración
- [ ] Proyectos compartidos con roles (Owner / Editor / Viewer)
- [ ] Comentarios en imágenes

### Integraciones
- [ ] Import desde Pinterest (board público)
- [ ] Import desde Are.na
- [ ] Export a Google Drive / Dropbox

### Performance
- [ ] Resize automático al descargar (max 2000px)
- [ ] CDN cache para imágenes

---

## Comandos clave

```bash
# Tras cambiar schema.prisma — SIEMPRE hacer esto:
pnpm db:push       # aplica el schema a Supabase
pnpm db:generate   # regenera el Prisma client

# Deploy
git push origin main   # Vercel auto-deploys
```

### Variables de entorno en Vercel
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
```
