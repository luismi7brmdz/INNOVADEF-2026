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

// ─── Threat label lookup (ThreatClassifier) ──────────────────────────────────
const THREAT_LABELS = {
  apt:       'APT Patrocinada por Estado',
  ransomware:'Ransomware en GICEN',
  insider:   'Amenaza Interna',
  supply:    'Compromiso Cadena de Suministro',
  phishing:  'Spear-Phishing Dirigido',
  desinf:    'Operación de Desinformación',
}

// ─── Module metadata ──────────────────────────────────────────────────────────
// Keys match registry IDs exactly (src/plugins/registry.js).
const MODULE_META = {

  capacity: {
    code:     'MOD-01',
    title:    'TEST DE CAPACIDAD DIGITAL',
    subtitle: 'MADUREZ TECNOLÓGICA — FOCO 2026',
    color:    C.accent,
    getDetails: (result) => {
      const s = result.score ?? result.report?.overall ?? 0
      const grade = s >= 80 ? 'MADUREZ AVANZADA' : s >= 60 ? 'MADUREZ INTERMEDIA' : s >= 40 ? 'EN DESARROLLO' : 'FASE INICIAL'
      return [
        { label: 'ÍNDICE GLOBAL',      value: `${s} / 100`, color: C.accent },
        { label: 'NIVEL DE MADUREZ',   value: grade,        color: C.amber  },
        { label: 'VECTORES EVALUADOS', value: '5',          color: C.grey   },
      ]
    },
    getPhases: (result) => {
      const scores = result.report?.scores || {}
      const labels = { cloud: 'Cloud ENS', ia: 'IA & Datos', soberania: 'Soberanía Digital', transformacion: 'Transformación Digital', barreras: 'Superación de Barreras' }
      return Object.entries(scores).map(([k, v]) => ({ label: labels[k] || k.toUpperCase(), value: `${v} / 100` }))
    },
  },

  tactical: {
    code:     'MOD-02',
    title:    'SIMULADOR DE DECISIÓN TÁCTICA',
    subtitle: 'PERFIL DE LIDERAZGO OPERACIONAL',
    color:    '#FF6644',
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'PUNTUACIÓN',  value: `${s} / 100`,                                                   color: '#FF6644' },
        { label: 'PERFIL',      value: result.profile ?? '—',                                           color: C.amber  },
        { label: 'EVALUACIÓN',  value: s >= 80 ? 'EXCELENTE' : s >= 50 ? 'CORRECTO' : 'A MEJORAR',     color: C.grey   },
      ]
    },
    getPhases: () => [],
  },

  radar: {
    code:     'MOD-03',
    title:    'RADAR DE MADUREZ ORGANIZACIONAL',
    subtitle: '6 VECTORES ESTRATÉGICOS',
    color:    '#0099FF',
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'ÍNDICE GLOBAL', value: `${s}%`,                                                                 color: '#0099FF' },
        { label: 'VECTORES',      value: '6 / 6',                                                                 color: C.grey   },
        { label: 'NIVEL',         value: s >= 75 ? 'AVANZADO' : s >= 50 ? 'INTERMEDIO' : 'EN DESARROLLO',        color: C.amber  },
      ]
    },
    getPhases: (result) => {
      const labels = { ia: 'IA & Machine Learning', cloud: 'Cloud Soberano', sim: 'Simulación & XR', cyber: 'Ciberseguridad', talento: 'Talento Digital', dato: 'Soberanía del Dato' }
      return Object.entries(result.values || {}).map(([k, v]) => ({
        label: labels[k] || k.toUpperCase(),
        value: `${Math.round((v / 4) * 100)}%`,
      }))
    },
  },

  threats: {
    code:     'MOD-04',
    title:    'CLASIFICADOR DE AMENAZAS',
    subtitle: 'PRIORIZACIÓN DE AMENAZAS ACTIVAS',
    color:    C.red,
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'PUNTUACIÓN',            value: `${s} / 100`,                               color: C.accent },
        { label: 'AMENAZAS PRIORIZADAS',  value: `${(result.priorities || []).length} / 3`,  color: C.red    },
        { label: 'EFICACIA',              value: s >= 80 ? 'ALTA' : s >= 50 ? 'MEDIA' : 'BAJA', color: C.amber },
      ]
    },
    getPhases: (result) =>
      (result.priorities || []).map((id, i) => ({ label: `PRIORIDAD #${i + 1}`, value: THREAT_LABELS[id] || id })),
  },

  pulse: {
    code:     'MOD-05',
    title:    'ENCUESTA DE PULSO FOCO 2026',
    subtitle: 'RESULTADOS AGREGADOS DE ASISTENTES',
    color:    C.amber,
    getDetails: (result) => [
      { label: 'PREGUNTAS RESPONDIDAS', value: `${Object.keys(result.answers || {}).length} / 10`, color: C.amber  },
      { label: 'TOTAL ASISTENTES',      value: `${result.respondents ?? '—'}`,                     color: C.accent },
      { label: 'PARTICIPACIÓN',         value: 'COMPLETADA',                                       color: C.grey   },
    ],
    getPhases: () => [],
  },

  cyberdefense: {
    code:     'MOD-07',
    title:    'OPERACIÓN ESCUDO DIGITAL',
    subtitle: 'DEFENSA DE RED EN TIEMPO REAL',
    color:    C.accent,
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',        value: `${result.score ?? 0}`,  color: C.accent },
      { label: 'RANGO',             value: result.rank  ?? '—',      color: C.amber  },
      { label: 'OLEADA ALCANZADA',  value: `${result.wave ?? '—'}`,  color: C.grey   },
    ],
    getPhases: () => [],
  },

  tacticalmap: {
    code:     'MOD-08',
    title:    'SALA DE GUERRA — MANDO TÁCTICO',
    subtitle: 'EJERCICIO SIERRA-26',
    color:    '#00AAFF',
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',   value: `${result.score ?? 0}`, color: '#00AAFF' },
      { label: 'CLASIFICACIÓN', value: result.clasif ?? '—',  color: C.amber  },
      { label: 'EVALUACIÓN',   value: (result.score ?? 0) >= 350 ? 'SOBRESALIENTE' : (result.score ?? 0) >= 260 ? 'NOTABLE' : 'CORRECTO', color: C.grey },
    ],
    getPhases: () => [],
  },

  covertmission: {
    code:     'MOD-09',
    title:    'MISIÓN SOMBRA — TERMINAL CLASIFICADO',
    subtitle: 'OPERACIÓN CÓDIGO AURORA',
    color:    '#CC44FF',
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',              value: `${result.score ?? 0}`, color: '#CC44FF' },
      { label: 'RANGO',                   value: result.rank ?? '—',     color: C.amber   },
      { label: 'TRANSMISIONES DESCIFRADAS', value: `${result.decoded ?? 0} / 3`, color: C.grey },
    ],
    getPhases: () => [],
  },

  // ── External plugins ──────────────────────────────────────────────────────

  aerocognitio: {
    code:     'MOD-06',
    title:    'AEROCOGNITIO',
    subtitle: 'BATERÍA PSICOTÉCNICA RPAS — EVALUACIÓN COGNITIVO-ESPACIAL',
    color:    '#FFB547',
    getDetails: (result) => {
      const acc  = Math.round((result.metrics?.overallAccuracy ?? 0) * 100)
      const roles = { rpas_pilot_class_ii: 'Piloto RPAS Clase II', sensor_operator: 'Operador Sensor RPAS', image_analyst: 'Analista de Imagen', mission_controller: 'Controlador de Misión' }
      const accColor = acc >= 75 ? C.accent : acc >= 50 ? C.amber : C.red
      return [
        { label: 'PRECISIÓN GLOBAL',  value: `${acc}%`,                              color: accColor },
        { label: 'ROL EVALUADO',      value: roles[result.role] ?? result.role ?? '—', color: C.amber },
        { label: 'DURACIÓN',          value: `${Math.round((result.metrics?.sessionDurationMs ?? 0) / 60000)} min`, color: C.grey },
      ]
    },
    getPhases: (result) => {
      const ds  = result.report?.dimensionScores ?? {}
      const lbl = { low: 'BAJO', medium: 'MEDIO', high: 'ALTO' }
      return [
        { label: 'ROTACIÓN MENTAL',     value: lbl[ds.mentalRotation?.level]    ?? `${Math.round((result.metrics?.mr_accuracy ?? 0) * 100)}%` },
        { label: 'ORIENTACIÓN ESPACIAL', value: lbl[ds.spatialOrientation?.level] ?? `${Math.round((result.metrics?.so_accuracy ?? 0) * 100)}%` },
        { label: 'MEMORIA ESPACIAL',    value: lbl[ds.spatialMemory?.level]     ?? `${Math.round((result.metrics?.sm_changeDetectionRate ?? 0) * 100)}%` },
      ]
    },
  },

  recruitment: {
    code:     'MOD-10',
    title:    'SELECCIÓN DE PERSONAL — ARA',
    subtitle: 'ORIENTACIÓN VOCACIONAL MILITAR — FUERZAS ARMADAS ESPAÑOLAS',
    color:    '#22C55E',
    getDetails: (result) => {
      const primary = result.recomendacion?.primary ?? result.report?.specialtyMatch?.primary
      const gti     = result.gti ?? 0
      const gtiColor = gti >= 70 ? C.accent : gti >= 40 ? C.amber : C.red
      return [
        { label: 'GTI',                    value: `${gti} / 100`,        color: gtiColor  },
        { label: 'ESPECIALIDAD RECOMENDADA', value: primary?.name ?? '—', color: '#22C55E' },
        { label: 'RAMA',                   value: primary?.branch ?? '—', color: C.grey   },
      ]
    },
    getPhases: (result) => {
      const famLabels = { F1: 'Combate', F2: 'Técnica/Mecánica', F3: 'Tecnología/Cyber', F4: 'Sanidad/Cuidado', F5: 'Logística/Admin', F6: 'Mando/Liderazgo', F7: 'Marítimo/Aéreo', F8: 'Creativo/Artístico' }
      const intereses = result.intereses || {}
      return Object.entries(intereses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, v]) => ({ label: `INTERÉS · ${famLabels[k] || k}`, value: `${Math.round(v * 100)}%` }))
    },
  },
}

// Fallback for external plugins (demo-aerocognitio, demo-recruitment, etc.)
function getMeta (moduleId, moduleTitle) {
  return MODULE_META[moduleId] || {
    code:       'MOD-EXT',
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

  if (moduleId === 'capacity') {
    if (score >= 80) return 'El participante refleja una organización con madurez digital avanzada, con vectores clave como cloud soberano, IA y soberanía del dato en un estado operativo consolidado. Se recomienda mantener el liderazgo explorando casos de uso emergentes en simulación avanzada y gemelos digitales.'
    if (score >= 60) return 'La organización presenta una madurez digital intermedia con bases sólidas en varios vectores. Existen oportunidades claras de mejora, especialmente en la certificación ENS Categoría Alta y en la definición de una estrategia de soberanía del dato. Se recomienda priorizar una hoja de ruta de 18 meses con hitos concretos.'
    if (score >= 40) return 'Los resultados indican una organización en fase de desarrollo de su capacidad digital. Se identifican brechas significativas que requieren un plan de acción estructurado. La prioridad inmediata debe ser la certificación ENS y la adopción de un plan de adopción de IA con casos de uso de bajo riesgo.'
    return 'La organización se encuentra en fase inicial de transformación digital. Se recomienda un diagnóstico profundo y la definición de un plan estratégico plurianual alineado con los vectores FOCO 2026, con especial atención a la formación del talento y la reducción de barreras organizacionales.'
  }

  if (moduleId === 'tactical') {
    if (score >= 80) return 'El participante demuestra un perfil de liderazgo digital estratégico consolidado. Sus decisiones reflejan una comprensión profunda del entorno tecnológico y una capacidad de respuesta madura ante escenarios de crisis. Recomendado para roles de dirección en procesos de transformación digital institucional.'
    if (score >= 50) return 'El participante muestra capacidades de gestión en transición hacia el liderazgo digital. Buen instinto técnico con áreas de mejora en comunicación institucional y toma de decisiones bajo incertidumbre. Se recomienda formación específica en gestión del cambio y liderazgo en entornos VUCA.'
    return 'El perfil indica oportunidades de desarrollo en competencias de liderazgo digital. Se recomienda un programa de formación en fundamentos de transformación digital, gestión de proyectos tecnológicos y comunicación estratégica en entornos de alta presión.'
  }

  if (moduleId === 'radar') {
    if (score >= 75) return 'La organización presenta un índice de madurez avanzado con capacidades consolidadas en la mayoría de los vectores estratégicos. Se recomienda identificar los ejes con menor puntuación para convertirlos en áreas de excelencia diferencial dentro del sector Defensa.'
    if (score >= 50) return 'El perfil radar revela una organización en transición hacia la madurez digital plena. Existen vectores sólidos que pueden actuar como palancas para el desarrollo de los más débiles. Se recomienda un plan de nivelación con objetivos trimestrales por eje.'
    return 'El diagnóstico indica una organización en etapas iniciales de madurez en la mayoría de los vectores estratégicos. Se recomienda priorizar los ejes de mayor impacto operacional — ciberseguridad y cloud soberano — como base para el desarrollo progresivo de los restantes.'
  }

  if (moduleId === 'threats') {
    if (score >= 80) return 'El participante demuestra una capacidad de priorización de amenazas sobresaliente, identificando correctamente los vectores de mayor riesgo y asignando recursos de forma eficiente. Este perfil es esencial para roles de dirección en centros de operaciones de seguridad y gestión de crisis.'
    if (score >= 50) return 'La priorización refleja un buen entendimiento del panorama de amenazas con algunas áreas de mejora en la asignación óptima de recursos. Se recomienda profundizar en inteligencia de amenazas avanzadas (APT) y en la doctrina de respuesta a incidentes de cadena de suministro.'
    return 'Los resultados indican necesidad de reforzar los fundamentos de análisis de riesgos y priorización de amenazas. Se recomienda formación específica en marcos de ciberseguridad (NIST, ENS) y ejercicios de simulación de crisis con escenarios de amenazas híbridas.'
  }

  if (moduleId === 'pulse') {
    return 'Gracias por participar en la Encuesta de Pulso FOCO 2026. Sus respuestas han sido incorporadas al agregado de asistentes y contribuyen a generar una imagen colectiva del estado de la transformación digital en Defensa. Los resultados completos serán compartidos al cierre del evento.'
  }

  if (moduleId === 'cyberdefense') {
    const rank = result.rank ?? ''
    if (rank === 'LEYENDA')   return 'Rendimiento excepcional. El participante ha demostrado capacidades de defensa de red de nivel élite, neutralizando oleadas de amenazas con una precisión y velocidad sobresalientes. Perfil ideal para roles de liderazgo en Centros de Operaciones de Seguridad (SOC) y equipos CERT-Defensa.'
    if (rank === 'ÉLITE')     return 'Rendimiento muy alto. El participante demuestra sólidas competencias en defensa activa de redes, con capacidad para gestionar múltiples vectores de ataque simultáneos. Se recomienda profundizar en técnicas de threat hunting y respuesta avanzada a incidentes.'
    if (rank === 'VETERANO')  return 'Buen desempeño en la defensa de la infraestructura. El participante gestiona correctamente las amenazas más frecuentes con algunas dificultades ante ataques compuestos. Se recomienda formación adicional en detección de anomalías y correlación de eventos de seguridad.'
    return 'El participante demuestra comprensión básica de los principios de defensa de red. Se recomienda un programa de formación estructurado en fundamentos de ciberseguridad operacional, gestión de firewalls y análisis de logs en tiempo real.'
  }

  if (moduleId === 'tacticalmap') {
    const clasif = result.clasif ?? ''
    if (clasif === 'GENERAL DE BRIGADA') return 'Mando excepcional. El participante ha demostrado un dominio sobresaliente de los principios doctrinales de mando y control, gestionando las seis oleadas con precisión táctica y eficiencia de recursos superior. Perfil altamente recomendado para puestos de responsabilidad en entornos de alta complejidad operacional.'
    if (clasif === 'CORONEL')            return 'Mando competente con visión estratégica consolidada. Las decisiones tomadas reflejan una sólida comprensión del ciclo C2 y la gestión del espectro de amenazas. Se recomienda profundizar en escenarios de mando degradado y coordinación interoperable con fuerzas aliadas.'
    if (clasif === 'TENIENTE CORONEL')   return 'El participante conoce los fundamentos tácticos y aplica correctamente la doctrina básica de mando. Se observan vacíos en situaciones de alta presión y oleadas de amenaza compuesta. Se recomienda ciclos de ejercitación adicionales en entornos de toma de decisión bajo incertidumbre.'
    return 'Los resultados indican oportunidades de mejora en doctrina táctica y gestión de recursos bajo presión. Se recomienda un programa de formación intensivo en fundamentos de C2, asignación de prioridades en combate y gestión de la saturación del mando.'
  }

  if (moduleId === 'covertmission') {
    if (score >= 800) return 'El participante ha demostrado excepcionales capacidades de análisis criptográfico e inteligencia de señales. La infiltración precisa en sistemas clasificados y la identificación de agentes encubiertos refleja un pensamiento analítico estructurado, esencial para operaciones de inteligencia en entornos adversos de alta complejidad.'
    if (score >= 600) return 'El participante muestra aptitud para el análisis de señales cifradas con algunas áreas de mejora. La capacidad de descifrar intercomunicaciones es adecuada pero requiere mayor velocidad y precisión para entornos operativos reales. Se recomienda formación adicional en criptoanálisis y técnicas OSINT avanzadas.'
    return 'Se recomienda formación adicional en análisis criptográfico básico, técnicas de extracción de inteligencia a partir de comunicaciones interceptadas y fundamentos de operaciones encubiertas en entornos digitales.'
  }

  if (moduleId === 'aerocognitio') {
    // Use AI-generated narrative if available
    if (result.report?.narrative) return result.report.narrative
    const acc = Math.round((result.metrics?.overallAccuracy ?? 0) * 100)
    if (acc >= 75) return 'El rendimiento cognitivo-espacial del participante es sobresaliente. Los indicadores de rotación mental, orientación espacial y memoria táctica se sitúan en niveles compatibles con los requisitos de las especialidades RPAS de mayor exigencia. Se recomienda continuar el proceso oficial de selección.'
    if (acc >= 50) return 'El participante demuestra capacidades cognitivo-espaciales adecuadas para roles RPAS estándar. Se identifican áreas de mejora que pueden desarrollarse mediante entrenamiento específico en simuladores de vuelo y ejercicios de orientación cartográfica.'
    return 'Los resultados indican un perfil cognitivo-espacial con margen de desarrollo. Se recomienda un programa de preparación específica antes de continuar el proceso de selección para roles RPAS.'
  }

  if (moduleId === 'recruitment') {
    // Use AI-generated narrative if available
    if (result.report?.narrative) return result.report.narrative
    const primary = result.recomendacion?.primary
    if (primary?.name) return `El perfil del candidato muestra una afinidad destacada con la especialidad de ${primary.name} (${primary.branch ?? 'Fuerzas Armadas'}). Los vectores de intereses vocacionales, aptitudes cognitivas (GTI) y perfil de personalidad convergen hacia este destino. Se recomienda consultar los requisitos específicos de acceso en el Centro de Reclutamiento correspondiente.`
    return 'La evaluación ha sido completada. El sistema ARA ha procesado los perfiles de intereses, aptitudes cognitivas y personalidad del candidato. Consulte los resultados completos con el orientador vocacional asignado.'
  }

  // Generic fallback (other external plugins)
  if (score >= 80) return 'Resultados sobresalientes. El participante demuestra una comprensión sólida y avanzada de los conceptos evaluados, con capacidad de respuesta eficaz ante escenarios complejos.'
  if (score >= 60) return 'Resultados satisfactorios. El participante demuestra comprensión sólida de los conceptos evaluados y capacidad de respuesta apropiada en entornos complejos.'
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
