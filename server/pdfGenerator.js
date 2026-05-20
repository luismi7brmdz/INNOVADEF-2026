import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'
import { get as httpsGet } from 'https'
import { get as httpGet } from 'http'

// ─── Brand constants ─────────────────────────────────────────────────────────
const C = {
  bg:       '#070707',
  panel:    '#0d0d0d',
  accent:   '#00FF41',
  amber:    '#F59E0B',
  red:      '#EF4444',
  white:    '#FFFFFF',
  grey:     '#9CA3AF',
  grey2:    '#4B5563',
  header:   '#0a0a0a',
}

// A4 dimensions in points
const W = 595.28
const H = 841.89

// ─── Utility: fetch a remote image buffer ────────────────────────────────────
function fetchBuffer (url) {
  return new Promise((resolve) => {
    const get = url.startsWith('https') ? httpsGet : httpGet
    get(url, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', () => resolve(null))
    }).on('error', () => resolve(null))
  })
}

// ─── Module metadata ─────────────────────────────────────────────────────────
const MODULE_META = {
  'tactical-map': {
    code:     'MOD-07',
    title:    'MAPA TÁCTICO',
    subtitle: 'SALA DE CRISIS — EJERCICIO SIERRA-26',
    color:    C.amber,
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',     value: `${result.score ?? 0} / 400`, color: C.accent },
      { label: 'CLASIFICACIÓN',  value: result.classification ?? '—',  color: C.amber  },
      { label: 'EFICIENCIA',     value: result.efficiency    ?? '—',   color: C.grey   },
    ],
    getPhases: (result) => result.phases || [],
  },
  'covert-mission': {
    code:     'MOD-09',
    title:    'MISIÓN ENCUBIERTA',
    subtitle: 'OPERACIÓN CÓDIGO AURORA',
    color:    C.accent,
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',   value: `${result.score ?? 0} / 300`,   color: C.accent },
      { label: 'RANGO',        value: result.rank  ?? '—',            color: C.amber  },
      { label: 'DESCIFRADOS',  value: `${result.decoded ?? 0} / 3`,   color: C.grey   },
    ],
    getPhases: (result) =>
      (result.keywords || []).map((kw, i) => ({ label: `INTERCEPCIÓN ${i + 1}`, value: kw })),
  },
  'cyberdefense': {
    code:     'MOD-05',
    title:    'CIBERDEFENSA',
    subtitle: 'ANÁLISIS DE AMENAZAS DIGITALES',
    color:    '#3B82F6',
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',     value: `${result.score ?? 0}`,  color: C.accent },
      { label: 'CALIFICACIÓN',   value: result.grade ?? '—',      color: C.amber  },
      { label: 'RESPUESTAS OK',  value: `${result.correct ?? 0}`, color: C.grey   },
    ],
    getPhases: () => [],
  },
  'threats': {
    code:     'MOD-06',
    title:    'ANÁLISIS DE AMENAZAS',
    subtitle: 'EVALUACIÓN DE PRIORIDADES ESTRATÉGICAS',
    color:    C.red,
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',    value: `${result.score ?? 0}`,     color: C.accent },
      { label: 'CALIFICACIÓN',  value: result.grade ?? '—',         color: C.amber  },
      { label: 'PRIORIDADES',   value: result.priorities ?? '—',    color: C.grey   },
    ],
    getPhases: () => [],
  },
}

// Fallback for unknown modules
function getMeta (moduleId, moduleTitle) {
  return MODULE_META[moduleId] || {
    code:       'MOD-XX',
    title:      (moduleTitle || moduleId || 'MÓDULO').toUpperCase(),
    subtitle:   'INFORME DE PARTICIPANTE',
    color:      C.accent,
    getDetails: (result) => [
      { label: 'PUNTUACIÓN', value: `${result.score ?? 0}`, color: C.accent },
    ],
    getPhases: () => [],
  }
}

// ─── Doctrinal analysis text ──────────────────────────────────────────────────
function getAnalysis (moduleId, result) {
  const score = result.score ?? 0

  if (moduleId === 'tactical-map') {
    if (score >= 350) return 'El participante ha demostrado un dominio sobresaliente de los principios doctrinales de mando y control. Sus decisiones reflejan un sólido entendimiento del entorno operativo, aplicando correctamente procedimientos STANAG y protocolos IFF. Perfil altamente recomendado para puestos de responsabilidad en entornos de alta complejidad táctica.'
    if (score >= 260) return 'El participante muestra una sólida comprensión del ciclo de toma de decisiones en entornos de crisis. Se observa capacidad para aplicar medidas de seguridad básicas y gestionar el espectro electromagnético. Se recomienda profundizar en doctrina de contrainteligencia y gestión de la cadena de mando en escenarios degradados.'
    if (score >= 160) return 'El participante conoce los fundamentos doctrinales pero muestra vacíos en la aplicación bajo presión. Las decisiones tomadas indican necesidad de formación adicional en gestión del C2 y en el uso de sistemas de comunicaciones de respaldo (PACE). Se recomienda ciclos de ejercitación adicionales.'
    return 'Los resultados indican oportunidades de mejora significativas en doctrina táctica y toma de decisiones bajo presión. Se recomienda un programa de formación intensivo en fundamentos de mando y control, gestión del espectro electromagnético y análisis de inteligencia en tiempo real.'
  }

  if (moduleId === 'covert-mission') {
    if (score >= 270) return 'El participante ha demostrado excepcionales capacidades de análisis criptográfico y extracción de inteligencia. La identificación precisa de palabras clave en mensajes cifrados refleja un pensamiento analítico estructurado, esencial para operaciones de inteligencia en entornos adversos.'
    if (score >= 180) return 'El participante muestra aptitud para el análisis de señales cifradas con algunas áreas de mejora. La capacidad de descifrar intercomunicaciones es adecuada pero requiere mayor velocidad y precisión para entornos operativos reales.'
    return 'Se recomienda formación adicional en análisis criptográfico básico y técnicas de extracción de inteligencia a partir de comunicaciones interceptadas.'
  }

  if (score >= 80) return 'Resultados satisfactorios. El participante demuestra comprensión sólida de los conceptos evaluados y capacidad de respuesta apropiada en entornos complejos.'
  return 'Se recomienda reforzar los conceptos evaluados mediante formación específica para mejorar la capacidad de respuesta en situaciones de alta presión.'
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateReport ({ id, moduleId, moduleTitle, result, pdfPath }) {
  const meta    = getMeta(moduleId, moduleTitle)
  const details = meta.getDetails(result)
  const phases  = meta.getPhases(result)
  const analysis = getAnalysis(moduleId, result)
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

  // Try to fetch logo (may fail offline — fallback to text)
  const logoBuffer = await fetchBuffer('https://innovadef.es/wp-content/uploads/2026/03/logoinnovadef1.png')

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, compress: true })
    const stream = createWriteStream(pdfPath)
    doc.pipe(stream)
    stream.on('finish', resolve)
    stream.on('error', reject)

    // ── Background ───────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(C.bg)

    // Subtle grid overlay (very faint)
    doc.save()
    doc.strokeColor('#1a1a1a').lineWidth(0.3).opacity(0.6)
    for (let x = 0; x < W; x += 30) doc.moveTo(x, 0).lineTo(x, H).stroke()
    for (let y = 0; y < H; y += 30) doc.moveTo(0, y).lineTo(W, y).stroke()
    doc.restore()

    // ── Header bar ───────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(C.header)

    // Logo or text fallback (left side)
    if (logoBuffer) {
      try { doc.image(logoBuffer, 28, 14, { height: 62 }) } catch (_) { _drawLogoText(doc) }
    } else {
      _drawLogoText(doc)
    }

    // Header right: title + ref
    doc.fillColor(C.grey).font('Helvetica').fontSize(8).text('INFORME DE PARTICIPANTE', 0, 22, { align: 'right', width: W - 28 })
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(10).text('INNOVADEF FOCO 2026', 0, 36, { align: 'right', width: W - 28 })
    doc.fillColor(C.grey).font('Helvetica').fontSize(7.5).text(`REF: ${id.split('-')[0].toUpperCase()} · ${dateStr}`, 0, 52, { align: 'right', width: W - 28 })

    // ── Accent bar ───────────────────────────────────────────────────────────
    doc.rect(0, 90, W, 3).fill(meta.color)

    // ── Module header ────────────────────────────────────────────────────────
    let y = 108

    // Badge
    doc.roundedRect(28, y, 64, 22, 3).fill(meta.color)
    doc.fillColor(C.bg).font('Helvetica-Bold').fontSize(9).text(meta.code, 28, y + 7, { width: 64, align: 'center' })

    // Title
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(24).text(meta.title, 104, y - 2, { width: W - 132 })
    doc.fillColor(C.grey).font('Helvetica').fontSize(10).text(meta.subtitle, 104, y + 24, { width: W - 132 })

    y = 170

    // ── Metric boxes (3 columns) ──────────────────────────────────────────────
    const boxW = (W - 56 - 16) / 3
    details.forEach((d, i) => {
      const bx = 28 + i * (boxW + 8)
      const by = y

      // Box background
      doc.rect(bx, by, boxW, 88).fill(C.panel)
      // Colored top accent
      doc.rect(bx, by, boxW, 3).fill(d.color)

      // Value (big)
      doc.fillColor(d.color).font('Helvetica-Bold').fontSize(20)
         .text(d.value, bx + 8, by + 18, { width: boxW - 16, align: 'center' })
      // Label
      doc.fillColor(C.grey).font('Helvetica').fontSize(8)
         .text(d.label, bx + 8, by + 58, { width: boxW - 16, align: 'center' })
    })

    y = 278

    // ── Doctrinal analysis ───────────────────────────────────────────────────
    doc.rect(28, y, W - 56, 14).fill(meta.color)
    doc.fillColor(C.bg).font('Helvetica-Bold').fontSize(8)
       .text('ANÁLISIS DOCTRINAL', 36, y + 3)

    y += 18
    doc.rect(28, y, W - 56, 1).fill(C.grey2)
    y += 8

    doc.fillColor(C.white).font('Helvetica').fontSize(10).lineGap(3)
       .text(analysis, 28, y, { width: W - 56, align: 'justify' })

    y = doc.y + 18

    // ── Module-specific detail section ────────────────────────────────────────
    if (phases.length > 0) {
      doc.rect(28, y, W - 56, 14).fill(C.grey2)
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
         .text('DETALLE DE EJECUCIÓN', 36, y + 3)
      y += 22

      phases.forEach((phase) => {
        doc.rect(28, y, W - 56, 28).fill(C.panel)
        doc.fillColor(meta.color).font('Helvetica-Bold').fontSize(8)
           .text(phase.label || '', 36, y + 5, { width: (W - 56) * 0.4 })
        doc.fillColor(C.white).font('Helvetica').fontSize(9)
           .text(String(phase.value || ''), W / 2, y + 6, { width: (W - 56) * 0.5 })
        doc.rect(28, y + 28, W - 56, 1).fill(C.grey2)
        y += 29
      })
      y += 12
    }

    // ── CTA / Next steps ─────────────────────────────────────────────────────
    if (y < H - 130) {
      doc.rect(28, y, W - 56, 1).fill(C.grey2)
      y += 14
      doc.rect(28, y, 3, 40).fill(meta.color)
      doc.fillColor(C.grey).font('Helvetica').fontSize(8.5).lineGap(2)
         .text('¿Quieres profundizar en estos resultados?\nVisita innovadef.es o contacta con tu instructor para más información sobre los programas de formación de INNOVADEF FOCO 2026.', 38, y + 4, { width: W - 70 })
    }

    // ── Footer bar ───────────────────────────────────────────────────────────
    doc.rect(0, H - 52, W, 52).fill(C.header)
    doc.rect(0, H - 52, W, 2).fill(meta.color)

    doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(9)
       .text('INNOVADEF FOCO 2026', 28, H - 40)
    doc.fillColor(C.grey).font('Helvetica').fontSize(7.5)
       .text('23 de Junio · EOI Madrid · Av. de Gregorio del Amo, 6 · innovadef.es', 28, H - 28)

    doc.fillColor(C.grey2).font('Helvetica').fontSize(7)
       .text('Pumpun Dixital S.L. — Documento generado automáticamente. Confidencial.', 0, H - 17, { align: 'right', width: W - 28 })

    doc.end()
  })
}

function _drawLogoText (doc) {
  doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(16).text('INNOVADEF', 28, 28)
  doc.fillColor(C.grey).font('Helvetica').fontSize(9).text('FOCO 2026', 28, 50)
}
