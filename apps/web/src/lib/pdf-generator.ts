import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface PdfImage {
  id: string
  storedUrl: string | null
  description: string | null
  categoryName: string
}

interface GeneratePdfOptions {
  title: string
  subtitle?: string
  images: PdfImage[]
  userId: string
  pdfId: string
}

const PAGE_W = PageSizes.A4[0]  // 595
const PAGE_H = PageSizes.A4[1]  // 842
const MARGIN = 36
const IMG_GAP = 12
const COLS = 2
const CELL_W = (PAGE_W - MARGIN * 2 - IMG_GAP * (COLS - 1)) / COLS
const CELL_H = 260
const CAPTION_H = 20
const ROW_H = CELL_H + CAPTION_H + IMG_GAP

export async function generatePdfFromImages(opts: GeneratePdfOptions): Promise<string> {
  const { title, subtitle, images, userId, pdfId } = opts

  const pdfDoc = await PDFDocument.create()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // ── Cover page ──────────────────────────────────────────────────────────────
  const cover = pdfDoc.addPage([PAGE_W, PAGE_H])
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(0.06, 0.06, 0.06) })
  cover.drawText(title, {
    x: MARGIN, y: PAGE_H - 140, size: 40, font: fontBold, color: rgb(1, 1, 1), maxWidth: PAGE_W - MARGIN * 2,
  })
  if (subtitle) {
    cover.drawText(subtitle, {
      x: MARGIN, y: PAGE_H - 200, size: 16, font: fontReg, color: rgb(0.65, 0.65, 0.65), maxWidth: PAGE_W - MARGIN * 2,
    })
  }
  cover.drawText(`${images.length} reference images`, {
    x: MARGIN, y: MARGIN + 20, size: 12, font: fontReg, color: rgb(0.4, 0.4, 0.4),
  })

  // ── Group images by category ─────────────────────────────────────────────
  const grouped: Map<string, PdfImage[]> = new Map()
  for (const img of images) {
    if (!grouped.has(img.categoryName)) grouped.set(img.categoryName, [])
    grouped.get(img.categoryName)!.push(img)
  }

  for (const [categoryName, catImages] of grouped) {
    // Category header page (if more than one category)
    if (grouped.size > 1) {
      const catPage = pdfDoc.addPage([PAGE_W, PAGE_H])
      catPage.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: rgb(0.1, 0.1, 0.1) })
      catPage.drawText(categoryName, {
        x: MARGIN, y: PAGE_H - 50, size: 28, font: fontBold, color: rgb(1, 1, 1),
      })
      catPage.drawText(`${catImages.length} images`, {
        x: MARGIN, y: PAGE_H - 70, size: 12, font: fontReg, color: rgb(0.5, 0.5, 0.5),
      })
    }

    // Image grid pages for this category
    let col = 0
    let rowOnPage = 0
    let page = pdfDoc.addPage([PAGE_W, PAGE_H])

    // Category label at top of first image page
    page.drawText(categoryName.toUpperCase(), {
      x: MARGIN, y: PAGE_H - MARGIN - 4, size: 9, font: fontBold, color: rgb(0.5, 0.5, 0.5),
    })
    const contentTop = PAGE_H - MARGIN - 20

    for (const img of catImages) {
      if (!img.storedUrl) continue

      try {
        const imgRes = await fetch(img.storedUrl)
        const bytes = await imgRes.arrayBuffer()

        let embedded
        try {
          embedded = await pdfDoc.embedJpg(bytes)
        } catch {
          embedded = await pdfDoc.embedPng(bytes)
        }

        const x = MARGIN + col * (CELL_W + IMG_GAP)
        const y = contentTop - (rowOnPage + 1) * ROW_H + CAPTION_H

        // Check if we need a new page
        if (y < MARGIN) {
          page = pdfDoc.addPage([PAGE_W, PAGE_H])
          page.drawText(categoryName.toUpperCase(), {
            x: MARGIN, y: PAGE_H - MARGIN - 4, size: 9, font: fontBold, color: rgb(0.5, 0.5, 0.5),
          })
          col = 0
          rowOnPage = 0
        }

        const recalcY = contentTop - (rowOnPage + 1) * ROW_H + CAPTION_H
        const dims = embedded.scaleToFit(CELL_W, CELL_H)
        const imgX = MARGIN + col * (CELL_W + IMG_GAP) + (CELL_W - dims.width) / 2

        page.drawImage(embedded, { x: imgX, y: recalcY, width: dims.width, height: dims.height })

        // Caption
        if (img.description) {
          page.drawText(img.description, {
            x: MARGIN + col * (CELL_W + IMG_GAP),
            y: recalcY - CAPTION_H + 4,
            size: 9,
            font: fontReg,
            color: rgb(0.4, 0.4, 0.4),
            maxWidth: CELL_W,
          })
        }

        col++
        if (col >= COLS) {
          col = 0
          rowOnPage++
        }
      } catch (err) {
        console.warn(`Skipping image ${img.id}:`, err)
      }
    }
  }

  const pdfBytes = await pdfDoc.save()
  const path = `${userId}/${pdfId}.pdf`

  const { error } = await supabaseAdmin.storage
    .from('carpetart-pdfs')
    .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (error) throw error

  const { data } = supabaseAdmin.storage.from('carpetart-pdfs').getPublicUrl(path)
  return data.publicUrl
}
