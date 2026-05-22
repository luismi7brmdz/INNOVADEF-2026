import { useState, useEffect } from 'react'
import { Send, Mail } from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import Panel from '../components/Panel'
import { ACCENT, BORDER, TEXT2, FONT, S } from '../theme'

// ─── MODULE METADATA ─────────────────────────────────────────────────────────

const THREAT_LABELS = {
  apt:      'APT Patrocinada por Estado',
  ransomware: 'Ransomware en GICEN',
  insider:  'Amenaza Interna',
  supply:   'Compromiso Cadena de Suministro',
  phishing: 'Spear-Phishing Dirigido',
  desinf:   'Operación de Desinformación',
}

const MODULE_META = {
  capacity: {
    code: 'MOD-01', title: 'TEST DE CAPACIDAD DIGITAL', subtitle: 'MADUREZ TECNOLÓGICA — FOCO 2026', color: '#00FF41',
    getDetails: (result) => {
      const s = result.score ?? result.report?.overall ?? 0
      const grade = s >= 80 ? 'MADUREZ AVANZADA' : s >= 60 ? 'MADUREZ INTERMEDIA' : s >= 40 ? 'EN DESARROLLO' : 'FASE INICIAL'
      return [
        { label: 'ÍNDICE GLOBAL',    value: `${s} / 100`, color: '#00FF41' },
        { label: 'NIVEL DE MADUREZ', value: grade,         color: '#F59E0B' },
        { label: 'VECTORES EVALUADOS', value: '5',         color: '#9CA3AF' },
      ]
    },
    getPhases: (result) => {
      const labels = { cloud: 'Cloud ENS', ia: 'IA & Datos', soberania: 'Soberanía Digital', transformacion: 'Transformación Digital', barreras: 'Superación de Barreras' }
      return Object.entries(result.report?.scores || {}).map(([k, v]) => ({ label: labels[k] || k.toUpperCase(), value: `${v} / 100` }))
    },
  },
  tactical: {
    code: 'MOD-02', title: 'SIMULADOR DE DECISIÓN TÁCTICA', subtitle: 'PERFIL DE LIDERAZGO OPERACIONAL', color: '#FF6644',
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'PUNTUACIÓN', value: `${s} / 100`, color: '#FF6644' },
        { label: 'PERFIL',     value: result.profile ?? '—', color: '#F59E0B' },
        { label: 'EVALUACIÓN', value: s >= 80 ? 'EXCELENTE' : s >= 50 ? 'CORRECTO' : 'A MEJORAR', color: '#9CA3AF' },
      ]
    },
    getPhases: () => [],
  },
  radar: {
    code: 'MOD-03', title: 'RADAR DE MADUREZ ORGANIZACIONAL', subtitle: '6 VECTORES ESTRATÉGICOS', color: '#0099FF',
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'ÍNDICE GLOBAL', value: `${s}%`, color: '#0099FF' },
        { label: 'VECTORES',      value: '6 / 6', color: '#9CA3AF' },
        { label: 'NIVEL',         value: s >= 75 ? 'AVANZADO' : s >= 50 ? 'INTERMEDIO' : 'EN DESARROLLO', color: '#F59E0B' },
      ]
    },
    getPhases: (result) => {
      const labels = { ia: 'IA & Machine Learning', cloud: 'Cloud Soberano', sim: 'Simulación & XR', cyber: 'Ciberseguridad', talento: 'Talento Digital', dato: 'Soberanía del Dato' }
      return Object.entries(result.values || {}).map(([k, v]) => ({ label: labels[k] || k.toUpperCase(), value: `${Math.round((v / 4) * 100)}%` }))
    },
  },
  threats: {
    code: 'MOD-04', title: 'CLASIFICADOR DE AMENAZAS', subtitle: 'PRIORIZACIÓN DE AMENAZAS ACTIVAS', color: '#EF4444',
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'PUNTUACIÓN',          value: `${s} / 100`, color: '#00FF41' },
        { label: 'AMENAZAS PRIORIZADAS', value: `${(result.priorities || []).length} / 3`, color: '#EF4444' },
        { label: 'EFICACIA',            value: s >= 80 ? 'ALTA' : s >= 50 ? 'MEDIA' : 'BAJA', color: '#F59E0B' },
      ]
    },
    getPhases: (result) => (result.priorities || []).map((id, i) => ({ label: `PRIORIDAD #${i + 1}`, value: THREAT_LABELS[id] || id })),
  },
  pulse: {
    code: 'MOD-05', title: 'ENCUESTA DE PULSO FOCO 2026', subtitle: 'RESULTADOS AGREGADOS DE ASISTENTES', color: '#F59E0B',
    getDetails: (result) => [
      { label: 'PREGUNTAS RESPONDIDAS', value: `${Object.keys(result.answers || {}).length} / 10`, color: '#F59E0B' },
      { label: 'TOTAL ASISTENTES',      value: `${result.respondents ?? '—'}`, color: '#00FF41' },
      { label: 'PARTICIPACIÓN',         value: 'COMPLETADA', color: '#9CA3AF' },
    ],
    getPhases: () => [],
  },
  cyberdefense: {
    code: 'MOD-07', title: 'OPERACIÓN ESCUDO DIGITAL', subtitle: 'DEFENSA DE RED EN TIEMPO REAL', color: '#00FF41',
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',     value: `${result.score ?? 0}`, color: '#00FF41' },
      { label: 'RANGO',          value: result.rank ?? '—',     color: '#F59E0B' },
      { label: 'OLEADA ALCANZADA', value: `${result.wave ?? '—'}`, color: '#9CA3AF' },
    ],
    getPhases: () => [],
  },
  tacticalmap: {
    code: 'MOD-08', title: 'SALA DE GUERRA — MANDO TÁCTICO', subtitle: 'EJERCICIO SIERRA-26', color: '#00AAFF',
    getDetails: (result) => {
      const s = result.score ?? 0
      return [
        { label: 'PUNTUACIÓN',    value: `${s}`,           color: '#00AAFF' },
        { label: 'CLASIFICACIÓN', value: result.clasif ?? '—', color: '#F59E0B' },
        { label: 'EVALUACIÓN',    value: s >= 350 ? 'SOBRESALIENTE' : s >= 260 ? 'NOTABLE' : 'CORRECTO', color: '#9CA3AF' },
      ]
    },
    getPhases: () => [],
  },
  covertmission: {
    code: 'MOD-09', title: 'MISIÓN SOMBRA — TERMINAL CLASIFICADO', subtitle: 'OPERACIÓN CÓDIGO AURORA', color: '#CC44FF',
    getDetails: (result) => [
      { label: 'PUNTUACIÓN',               value: `${result.score ?? 0}`, color: '#CC44FF' },
      { label: 'RANGO',                    value: result.rank ?? '—',     color: '#F59E0B' },
      { label: 'TRANSMISIONES DESCIFRADAS', value: `${result.decoded ?? 0} / 3`, color: '#9CA3AF' },
    ],
    getPhases: () => [],
  },
  aerocognitio: {
    code: 'MOD-06', title: 'AEROCOGNITIO', subtitle: 'BATERÍA PSICOTÉCNICA RPAS — EVALUACIÓN COGNITIVO-ESPACIAL', color: '#FFB547',
    getDetails: (result) => {
      const acc = Math.round((result.metrics?.overallAccuracy ?? 0) * 100)
      const roles = { rpas_pilot_class_ii: 'Piloto RPAS Clase II', sensor_operator: 'Operador Sensor RPAS', image_analyst: 'Analista de Imagen', mission_controller: 'Controlador de Misión' }
      const accColor = acc >= 75 ? '#00FF41' : acc >= 50 ? '#F59E0B' : '#EF4444'
      return [
        { label: 'PRECISIÓN GLOBAL', value: `${acc}%`,                                  color: accColor },
        { label: 'ROL EVALUADO',     value: roles[result.role] ?? result.role ?? '—',   color: '#F59E0B' },
        { label: 'DURACIÓN',         value: `${Math.round((result.metrics?.sessionDurationMs ?? 0) / 60000)} min`, color: '#9CA3AF' },
      ]
    },
    getPhases: (result) => {
      const ds = result.report?.dimensionScores ?? {}
      const lbl = { low: 'BAJO', medium: 'MEDIO', high: 'ALTO' }
      return [
        { label: 'ROTACIÓN MENTAL',     value: lbl[ds.mentalRotation?.level]    ?? `${Math.round((result.metrics?.mr_accuracy ?? 0) * 100)}%` },
        { label: 'ORIENTACIÓN ESPACIAL', value: lbl[ds.spatialOrientation?.level] ?? `${Math.round((result.metrics?.so_accuracy ?? 0) * 100)}%` },
        { label: 'MEMORIA ESPACIAL',    value: lbl[ds.spatialMemory?.level]     ?? `${Math.round((result.metrics?.sm_changeDetectionRate ?? 0) * 100)}%` },
      ]
    },
  },
  recruitment: {
    code: 'MOD-10', title: 'SELECCIÓN DE PERSONAL — ARA', subtitle: 'ORIENTACIÓN VOCACIONAL MILITAR — FUERZAS ARMADAS ESPAÑOLAS', color: '#22C55E',
    getDetails: (result) => {
      const primary = result.recomendacion?.primary ?? result.report?.specialtyMatch?.primary
      const gti = result.gti ?? 0
      const gtiColor = gti >= 70 ? '#00FF41' : gti >= 40 ? '#F59E0B' : '#EF4444'
      return [
        { label: 'GTI',                    value: `${gti} / 100`,         color: gtiColor },
        { label: 'ESPECIALIDAD RECOMENDADA', value: primary?.name ?? '—', color: '#22C55E' },
        { label: 'RAMA',                   value: primary?.branch ?? '—', color: '#9CA3AF' },
      ]
    },
    getPhases: (result) => {
      const famLabels = { F1: 'Combate', F2: 'Técnica/Mecánica', F3: 'Tecnología/Cyber', F4: 'Sanidad/Cuidado', F5: 'Logística/Admin', F6: 'Mando/Liderazgo', F7: 'Marítimo/Aéreo', F8: 'Creativo/Artístico' }
      return Object.entries(result.intereses || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => ({ label: `INTERÉS · ${famLabels[k] || k}`, value: `${Math.round(v * 100)}%` }))
    },
  },
}

function getMeta(moduleId, moduleTitle) {
  return MODULE_META[moduleId] || {
    code:       'MOD-XX',
    title:      (moduleTitle || moduleId || 'MÓDULO').toUpperCase(),
    subtitle:   'INFORME DE PARTICIPANTE',
    color:      '#00FF41',
    getDetails: (result) => [{ label: 'PUNTUACIÓN', value: `${result.score ?? 0}`, color: '#00FF41' }],
    getPhases:  () => [],
  }
}

function getAnalysis(moduleId, result) {
  const score = result.score ?? 0
  if (moduleId === 'capacity') {
    if (score >= 80) return 'El participante refleja una organización con madurez digital avanzada, con vectores clave como cloud soberano, IA y soberanía del dato en un estado operativo consolidado. Se recomienda mantener el liderazgo explorando casos de uso emergentes en simulación avanzada y gemelos digitales.'
    if (score >= 60) return 'La organización presenta una madurez digital intermedia con bases sólidas en varios vectores. Existen oportunidades claras de mejora, especialmente en la certificación ENS Categoría Alta y en la definición de una estrategia de soberanía del dato.'
    if (score >= 40) return 'Los resultados indican una organización en fase de desarrollo de su capacidad digital. La prioridad inmediata debe ser la certificación ENS y la adopción de un plan de adopción de IA con casos de uso de bajo riesgo.'
    return 'La organización se encuentra en fase inicial de transformación digital. Se recomienda un diagnóstico profundo y la definición de un plan estratégico plurianual alineado con los vectores FOCO 2026.'
  }
  if (moduleId === 'tactical') {
    if (score >= 80) return 'El participante demuestra un perfil de liderazgo digital estratégico consolidado. Sus decisiones reflejan una comprensión profunda del entorno tecnológico y una capacidad de respuesta madura ante escenarios de crisis.'
    if (score >= 50) return 'El participante muestra capacidades de gestión en transición hacia el liderazgo digital. Buen instinto técnico con áreas de mejora en comunicación institucional y toma de decisiones bajo incertidumbre.'
    return 'El perfil indica oportunidades de desarrollo en competencias de liderazgo digital. Se recomienda formación en gestión del cambio y comunicación estratégica en entornos de alta presión.'
  }
  if (moduleId === 'radar') {
    if (score >= 75) return 'La organización presenta un índice de madurez avanzado con capacidades consolidadas en la mayoría de los vectores estratégicos. Se recomienda identificar los ejes con menor puntuación para convertirlos en áreas de excelencia diferencial.'
    if (score >= 50) return 'El perfil radar revela una organización en transición hacia la madurez digital plena. Se recomienda un plan de nivelación con objetivos trimestrales por eje estratégico.'
    return 'El diagnóstico indica una organización en etapas iniciales de madurez. Se recomienda priorizar ciberseguridad y cloud soberano como base para el desarrollo progresivo de los restantes vectores.'
  }
  if (moduleId === 'threats') {
    if (score >= 80) return 'El participante demuestra una capacidad de priorización de amenazas sobresaliente, identificando correctamente los vectores de mayor riesgo y asignando recursos de forma eficiente.'
    if (score >= 50) return 'La priorización refleja un buen entendimiento del panorama de amenazas con áreas de mejora en la asignación óptima de recursos. Se recomienda profundizar en inteligencia de amenazas avanzadas (APT) y respuesta a incidentes de cadena de suministro.'
    return 'Los resultados indican necesidad de reforzar los fundamentos de análisis de riesgos. Se recomienda formación en marcos de ciberseguridad (NIST, ENS) y ejercicios de simulación de crisis.'
  }
  if (moduleId === 'pulse') return 'Gracias por participar en la Encuesta de Pulso FOCO 2026. Sus respuestas han sido incorporadas al agregado de asistentes y contribuyen a generar una imagen colectiva del estado de la transformación digital en Defensa.'
  if (moduleId === 'cyberdefense') {
    const rank = result.rank ?? ''
    if (rank === 'LEYENDA')  return 'Rendimiento excepcional. El participante ha demostrado capacidades de defensa de red de nivel élite, neutralizando oleadas de amenazas con precisión y velocidad sobresalientes.'
    if (rank === 'ÉLITE')    return 'Rendimiento muy alto. Sólidas competencias en defensa activa de redes con capacidad para gestionar múltiples vectores de ataque simultáneos.'
    if (rank === 'VETERANO') return 'Buen desempeño en la defensa de la infraestructura. Se recomienda formación adicional en detección de anomalías y correlación de eventos de seguridad.'
    return 'El participante demuestra comprensión básica de los principios de defensa de red. Se recomienda formación en fundamentos de ciberseguridad operacional y análisis de logs en tiempo real.'
  }
  if (moduleId === 'tacticalmap') {
    const clasif = result.clasif ?? ''
    if (clasif === 'GENERAL DE BRIGADA') return 'Mando excepcional. El participante ha demostrado un dominio sobresaliente de los principios doctrinales de mando y control, gestionando todas las oleadas con precisión táctica superior.'
    if (clasif === 'CORONEL')            return 'Mando competente con visión estratégica consolidada. Las decisiones reflejan una sólida comprensión del ciclo C2 y la gestión del espectro de amenazas.'
    if (clasif === 'TENIENTE CORONEL')   return 'El participante conoce los fundamentos tácticos. Se observan vacíos en situaciones de alta presión y oleadas de amenaza compuesta. Se recomiendan ciclos adicionales de ejercitación.'
    return 'Los resultados indican oportunidades de mejora en doctrina táctica y gestión de recursos bajo presión. Se recomienda formación en fundamentos de C2 y gestión de la saturación del mando.'
  }
  if (moduleId === 'covertmission') {
    if (score >= 800) return 'El participante ha demostrado excepcionales capacidades de análisis criptográfico e inteligencia de señales. La infiltración precisa en sistemas clasificados refleja un pensamiento analítico estructurado esencial para operaciones encubiertas.'
    if (score >= 600) return 'El participante muestra aptitud para el análisis de señales cifradas con áreas de mejora. Se recomienda formación adicional en criptoanálisis y técnicas OSINT avanzadas.'
    return 'Se recomienda formación adicional en análisis criptográfico básico y fundamentos de operaciones encubiertas en entornos digitales.'
  }
  if (moduleId === 'aerocognitio') {
    if (result.report?.narrative) return result.report.narrative
    const acc = Math.round((result.metrics?.overallAccuracy ?? 0) * 100)
    if (acc >= 75) return 'El rendimiento cognitivo-espacial del participante es sobresaliente. Los indicadores de rotación mental, orientación espacial y memoria táctica se sitúan en niveles compatibles con los requisitos de las especialidades RPAS de mayor exigencia.'
    if (acc >= 50) return 'El participante demuestra capacidades cognitivo-espaciales adecuadas para roles RPAS estándar. Se identifican áreas de mejora que pueden desarrollarse mediante entrenamiento específico en simuladores de vuelo.'
    return 'Los resultados indican un perfil cognitivo-espacial con margen de desarrollo. Se recomienda un programa de preparación específica antes de continuar el proceso de selección para roles RPAS.'
  }
  if (moduleId === 'recruitment') {
    if (result.report?.narrative) return result.report.narrative
    const primary = result.recomendacion?.primary
    if (primary?.name) return `El perfil del candidato muestra una afinidad destacada con la especialidad de ${primary.name} (${primary.branch ?? 'Fuerzas Armadas'}). Los vectores de intereses vocacionales, aptitudes cognitivas y personalidad convergen hacia este destino.`
    return 'La evaluación ha sido completada. Consulte los resultados completos con el orientador vocacional asignado.'
  }
  if (score >= 80) return 'Resultados sobresalientes. El participante demuestra comprensión avanzada de los conceptos evaluados y capacidad de respuesta eficaz ante escenarios complejos.'
  if (score >= 60) return 'Resultados satisfactorios. El participante demuestra comprensión sólida de los conceptos evaluados y capacidad de respuesta apropiada en entornos complejos.'
  return 'Se recomienda reforzar los conceptos evaluados mediante formación específica para mejorar la capacidad de respuesta en situaciones de alta presión.'
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
}

// ─── PDF GENERATION ───────────────────────────────────────────────────────────

function buildPdf(moduleResult, sessionId) {
  const doc = new jsPDF()
  const moduleId = moduleResult?._moduleId || 'unknown'
  const moduleTitle = moduleResult?._moduleTitle || 'Módulo de Evaluación'
  const { _moduleId, _moduleTitle, ...result } = moduleResult || {}
  const meta = getMeta(moduleId, moduleTitle)
  const details = meta.getDetails(result)
  const phases = meta.getPhases(result)
  const analysis = getAnalysis(moduleId, result)
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

  const W = 210
  const H = 297

  doc.setFillColor(7, 7, 7)
  doc.rect(0, 0, W, H, 'F')
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, W, 25, 'F')

  doc.setTextColor(0, 255, 65)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('INNOVADEF', 10, 10)
  doc.setTextColor(156, 163, 175)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('FOCO 2026', 10, 16)

  doc.setTextColor(156, 163, 175)
  doc.setFontSize(7)
  doc.text('INFORME DE PARTICIPANTE', W - 10, 10, { align: 'right' })
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INNOVADEF FOCO 2026', W - 10, 16, { align: 'right' })
  doc.setTextColor(156, 163, 175)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`REF: ${sessionId.split('-')[0].toUpperCase()} · ${dateStr}`, W - 10, 22, { align: 'right' })

  doc.setFillColor(...hexToRgb(meta.color))
  doc.rect(0, 25, W, 2, 'F')

  let y = 35
  doc.setFillColor(...hexToRgb(meta.color))
  doc.roundedRect(10, y, 18, 8, 1, 1, 'F')
  doc.setTextColor(7, 7, 7)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.text(meta.code, 10, y + 5.5, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text(meta.title, 32, y + 2)
  doc.setTextColor(156, 163, 175)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(meta.subtitle, 32, y + 7)

  y = 50
  const boxW = (W - 20 - 8) / 3
  details.forEach((d, i) => {
    const bx = 10 + i * (boxW + 4)
    doc.setFillColor(13, 13, 13)
    doc.rect(bx, y, boxW, 22, 'F')
    doc.setFillColor(...hexToRgb(d.color))
    doc.rect(bx, y, boxW, 1.5, 'F')
    doc.setTextColor(...hexToRgb(d.color))
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(d.value, bx + boxW / 2, y + 12, { align: 'center' })
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text(d.label, bx + boxW / 2, y + 18, { align: 'center' })
  })

  y = 78
  doc.setFillColor(...hexToRgb(meta.color))
  doc.rect(10, y, W - 20, 5, 'F')
  doc.setTextColor(7, 7, 7)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.text('ANÁLISIS DOCTRINAL', 12, y + 3.5)

  y += 7
  doc.setFillColor(75, 85, 99)
  doc.rect(10, y, W - 20, 0.5, 'F')
  y += 4
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const splitAnalysis = doc.splitTextToSize(analysis, W - 20)
  doc.text(splitAnalysis, 10, y, { maxWidth: W - 20 })
  y += splitAnalysis.length * 4 + 8

  if (phases.length > 0) {
    doc.setFillColor(75, 85, 99)
    doc.rect(10, y, W - 20, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE EJECUCIÓN', 12, y + 3.5)
    y += 7
    phases.forEach(phase => {
      doc.setFillColor(13, 13, 13)
      doc.rect(10, y, W - 20, 10, 'F')
      doc.setTextColor(...hexToRgb(meta.color))
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text(phase.label || '', 12, y + 4)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text(String(phase.value || ''), W / 2, y + 4)
      doc.setFillColor(75, 85, 99)
      doc.rect(10, y + 10, W - 20, 0.5, 'F')
      y += 10.5
    })
  }

  const footerY = H - 20
  doc.setFillColor(10, 10, 10)
  doc.rect(0, footerY, W, 20, 'F')
  doc.setFillColor(...hexToRgb(meta.color))
  doc.rect(0, footerY, W, 1, 'F')
  doc.setTextColor(0, 255, 65)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('INNOVADEF FOCO 2026', 10, footerY + 7)
  doc.setTextColor(156, 163, 175)
  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'normal')
  doc.text('23 de Junio · EOI Madrid · Av. de Gregorio del Amo, 6 · innovadef.es', 10, footerY + 13)
  doc.setTextColor(75, 85, 99)
  doc.setFontSize(5)
  doc.text('Pumpun Dixital S.L. — Documento generado automáticamente. Confidencial.', W - 10, footerY + 13, { align: 'right' })

  return doc
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function EmailScreen({ sessionId, moduleResult, onReset, qrToken, emailToken }) {
  const [email, setEmail]   = useState('')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [sent, setSent]     = useState(false)

  useEffect(() => {
    const doc = buildPdf(moduleResult, sessionId)
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [moduleResult, sessionId])

  const qrValue = `${window.location.origin}/report/${qrToken || sessionId}`

  const handleDownloadPdf = () => {
    if (!pdfUrl) return
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `informe-innovadef-${sessionId}.pdf`
    link.click()
  }

  const handleSendEmail = () => {
    if (!email.includes('@')) return
    fetch(`/api/session/${sessionId}/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, emailToken }),
    }).catch(() => {})
    const reportUrl = emailToken
      ? `${window.location.origin}/report/${emailToken}`
      : `${window.location.origin}/report/${sessionId}`
    const subject = encodeURIComponent(`INNOVADEF 2026 - Informe ${sessionId}`)
    const body = encodeURIComponent(`Informe de evaluación INNOVADEF 2026\n\nSesión: ${sessionId}\n\nAccede a tu informe aquí:\n${reportUrl}\n\nEste enlace es permanente.`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <Panel label="// ENTREGA DE INFORME CLASIFICADO" style={{ marginBottom: 'clamp(24px, 5vw, 60px)' }}>
        <div className="email-grid" style={{
          padding: 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 40px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(24px, 4vw, 48px)',
          alignItems: 'start',
        }}>

          {/* QR Column */}
          <div>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 2vw, 18px)', color: TEXT2, letterSpacing: 'clamp(2px, 0.4vw, 4px)', marginBottom: 'clamp(16px, 3vw, 32px)' }}>
              CÓDIGO QR — ACCESO AL PORTAL
            </div>
            <div style={{ background: '#fff', padding: 'clamp(12px, 2vw, 24px)', display: 'inline-block', marginBottom: 'clamp(8px, 1.5vw, 16px)' }}>
              <QRCode value={qrValue} size={Math.min(192, window.innerWidth * 0.35)} level="H" style={{ width: 'clamp(120px, 25vw, 192px)', height: 'clamp(120px, 25vw, 192px)' }} />
            </div>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', color: TEXT2, marginBottom: 'clamp(12px, 2vw, 20px)' }}>
              Escanea para acceder a tu informe en innovadef.es
            </div>
            {pdfUrl && (
              <button
                onClick={handleDownloadPdf}
                style={{ ...S.btnPrimary, fontSize: 'clamp(11px, 1.4vw, 16px)', padding: 'clamp(10px, 1.5vw, 18px) clamp(16px, 2.5vw, 28px)', gap: 'clamp(6px, 1vw, 12px)' }}
              >
                <Mail size={14} /> DESCARGAR PDF
              </button>
            )}
          </div>

          {/* Email Column */}
          <div>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 2vw, 18px)', color: TEXT2, letterSpacing: 'clamp(2px, 0.4vw, 4px)', marginBottom: 'clamp(16px, 3vw, 32px)' }}>
              ENVÍO POR EMAIL
            </div>
            {!sent ? (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                  placeholder="USUARIO@ORGANIZACION.ES"
                  style={{
                    width: '100%', padding: 'clamp(12px, 2vw, 20px)',
                    background: '#0a0a0a', border: `1.5px solid ${BORDER}`,
                    color: ACCENT, fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 20px)',
                    letterSpacing: 'clamp(1px, 0.2vw, 2px)', outline: 'none',
                    marginBottom: 'clamp(12px, 2vw, 20px)', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <button
                  onClick={handleSendEmail}
                  disabled={!email.includes('@')}
                  style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: !email.includes('@') ? 0.35 : 1, gap: 'clamp(6px, 1vw, 12px)', fontSize: 'clamp(12px, 1.6vw, 18px)', padding: 'clamp(12px, 1.8vw, 20px)' }}
                >
                  <Send size={16} /> ENVIAR INFORME
                </button>
                <div style={{ fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', color: TEXT2, marginTop: 'clamp(12px, 2vw, 20px)', lineHeight: 1.8 }}>
                  Se abrirá tu cliente de correo. Adjunta el PDF descargado.
                </div>
              </>
            ) : (
              <div style={{ border: `1.5px solid ${ACCENT}44`, padding: 'clamp(16px, 3vw, 32px)', background: 'rgba(0,255,65,0.04)' }}>
                <div style={{ fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 20px)', color: ACCENT, letterSpacing: 'clamp(2px, 0.4vw, 4px)', marginBottom: 'clamp(8px, 1.5vw, 16px)' }}>
                  CLIENTE DE CORREO ABIERTO
                </div>
                <div style={{ fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 22px)', color: TEXT2, marginBottom: 'clamp(6px, 1vw, 12px)', wordBreak: 'break-all' }}>
                  DEST: {email.toUpperCase()}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', color: TEXT2 }}>
                  Adjunta el PDF descargado antes de enviar.
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <button
        onClick={onReset}
        style={{
          background: 'none', border: 'none', color: TEXT2, cursor: 'pointer',
          fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 22px)', letterSpacing: 'clamp(2px, 0.4vw, 4px)',
          textTransform: 'uppercase', display: 'block', margin: '0 auto',
          padding: 'clamp(12px, 2vw, 20px)',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ffaa00'}
        onMouseLeave={e => e.currentTarget.style.color = TEXT2}
      >
        [ NUEVA EVALUACIÓN ]
      </button>
    </div>
  )
}
