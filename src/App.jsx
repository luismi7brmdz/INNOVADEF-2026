import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, ChevronRight, Mail } from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import MilitaryBackground from './MilitaryBackground'
import IntroScreen, { MilitaryCursor } from './IntroScreen'
import SleepScreen from './SleepScreen'
import { ACCENT, AMBER, RED, BORDER, TEXT2, FONT, S } from './theme'
import { sfxBootHeader, sfxHudScan, sfxCardAppear, sfxModuleSelect, sfxHover, sfxReset, sfxRadarPing, sfxIntroWipe, sfxBootReady, startAmbient, stopAmbient, markUserInteracted, hasUserInteracted } from './sfx'
import { PLUGIN_REGISTRY } from './plugins/registry'
import PluginRenderer from './plugins/PluginRenderer'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const MODULES = PLUGIN_REGISTRY

// ─── LIVE CLOCK ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i) }, [])
  const pad = n => String(n).padStart(2, '0')
  return (
    <span style={{ fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 20px)', color: TEXT2, letterSpacing: '1px' }}>
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())} UTC+2
    </span>
  )
}

// ─── PANEL WRAPPER (all content panels) ──────────────────────────────────────

function Panel({ label, children, style = {} }) {
  return (
    <div style={{
      border: `1.5px solid ${BORDER}`,
      background: '#070707',
      position: 'relative',
      ...style
    }}>
      {label && (
        <div style={{
          position: 'absolute', top: -1.5, left: 0,
          padding: 'clamp(5px, 1vw, 9px) clamp(12px, 2.5vw, 24px)',
          background: '#070707',
          borderBottom: `1.5px solid ${BORDER}`,
          borderRight: `1.5px solid ${BORDER}`,
          fontSize: 'clamp(16px, 2.5vw, 27px)', letterSpacing: 'clamp(2px, 0.6vw, 4px)', color: TEXT2,
          fontFamily: FONT, textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}
      <div style={{ paddingTop: label ? 'clamp(36px, 5vw, 54px)' : '0' }}>
        {children}
      </div>
    </div>
  )
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────────

function StatusBar({ module, onHome, bootStage = 4 }) {
  const items = [
    { label: 'SYS', value: 'NOMINAL', color: ACCENT },
    { label: 'NET', value: 'ENS-CAT-A', color: ACCENT },
    { label: 'ENC', value: 'AES-256', color: ACCENT },
    { label: 'SESS', value: `FOCO-2026`, color: AMBER },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 'clamp(32px, 4vw, 48px)',
      background: '#050505',
      borderTop: `1.5px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
      padding: '0 clamp(18px, 3vw, 36px)', gap: '0',
      fontFamily: FONT, fontSize: 'clamp(11px, 1.3vw, 15px)',
      transform: bootStage < 2 ? 'translateY(100%)' : 'translateY(0)',
      opacity: bootStage < 2 ? 0 : 1,
      transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px, 1vw, 10px)', paddingRight: 'clamp(10px, 2vw, 22px)', marginRight: 'clamp(10px, 2vw, 22px)', borderRight: `1.5px solid ${BORDER}` }}>
          <span style={{ color: TEXT2 }}>{item.label}:</span>
          <span style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 20px)' }}>
        {module && (
          <span style={{ color: TEXT2 }}>MÓDULO ACTIVO: <span style={{ color: ACCENT }}>{module}</span></span>
        )}
        <LiveClock />
        <div style={{ width: 'clamp(6px, 0.8vw, 8px)', height: 'clamp(6px, 0.8vw, 8px)', background: ACCENT, boxShadow: `0 0 9px ${ACCENT}44`, animation: 'blink 1.5s infinite' }} />
      </div>
    </div>
  )
}

// ─── EMAIL SCREEN ─────────────────────────────────────────────────────────────

// Module metadata for client-side PDF — must stay in sync with server/pdfGenerator.js
const THREAT_LABELS = { apt: 'APT Patrocinada por Estado', ransomware: 'Ransomware en GICEN', insider: 'Amenaza Interna', supply: 'Compromiso Cadena de Suministro', phishing: 'Spear-Phishing Dirigido', desinf: 'Operación de Desinformación' }
const MODULE_META = {
  capacity: {
    code: 'MOD-01', title: 'TEST DE CAPACIDAD DIGITAL', subtitle: 'MADUREZ TECNOLÓGICA — FOCO 2026', color: '#00FF41',
    getDetails: (result) => { const s = result.score ?? result.report?.overall ?? 0; const grade = s >= 80 ? 'MADUREZ AVANZADA' : s >= 60 ? 'MADUREZ INTERMEDIA' : s >= 40 ? 'EN DESARROLLO' : 'FASE INICIAL'; return [{ label: 'ÍNDICE GLOBAL', value: `${s} / 100`, color: '#00FF41' }, { label: 'NIVEL DE MADUREZ', value: grade, color: '#F59E0B' }, { label: 'VECTORES EVALUADOS', value: '5', color: '#9CA3AF' }] },
    getPhases: (result) => { const labels = { cloud: 'Cloud ENS', ia: 'IA & Datos', soberania: 'Soberanía Digital', transformacion: 'Transformación Digital', barreras: 'Superación de Barreras' }; return Object.entries(result.report?.scores || {}).map(([k, v]) => ({ label: labels[k] || k.toUpperCase(), value: `${v} / 100` })) },
  },
  tactical: {
    code: 'MOD-02', title: 'SIMULADOR DE DECISIÓN TÁCTICA', subtitle: 'PERFIL DE LIDERAZGO OPERACIONAL', color: '#FF6644',
    getDetails: (result) => { const s = result.score ?? 0; return [{ label: 'PUNTUACIÓN', value: `${s} / 100`, color: '#FF6644' }, { label: 'PERFIL', value: result.profile ?? '—', color: '#F59E0B' }, { label: 'EVALUACIÓN', value: s >= 80 ? 'EXCELENTE' : s >= 50 ? 'CORRECTO' : 'A MEJORAR', color: '#9CA3AF' }] },
    getPhases: () => [],
  },
  radar: {
    code: 'MOD-03', title: 'RADAR DE MADUREZ ORGANIZACIONAL', subtitle: '6 VECTORES ESTRATÉGICOS', color: '#0099FF',
    getDetails: (result) => { const s = result.score ?? 0; return [{ label: 'ÍNDICE GLOBAL', value: `${s}%`, color: '#0099FF' }, { label: 'VECTORES', value: '6 / 6', color: '#9CA3AF' }, { label: 'NIVEL', value: s >= 75 ? 'AVANZADO' : s >= 50 ? 'INTERMEDIO' : 'EN DESARROLLO', color: '#F59E0B' }] },
    getPhases: (result) => { const labels = { ia: 'IA & Machine Learning', cloud: 'Cloud Soberano', sim: 'Simulación & XR', cyber: 'Ciberseguridad', talento: 'Talento Digital', dato: 'Soberanía del Dato' }; return Object.entries(result.values || {}).map(([k, v]) => ({ label: labels[k] || k.toUpperCase(), value: `${Math.round((v / 4) * 100)}%` })) },
  },
  threats: {
    code: 'MOD-04', title: 'CLASIFICADOR DE AMENAZAS', subtitle: 'PRIORIZACIÓN DE AMENAZAS ACTIVAS', color: '#EF4444',
    getDetails: (result) => { const s = result.score ?? 0; return [{ label: 'PUNTUACIÓN', value: `${s} / 100`, color: '#00FF41' }, { label: 'AMENAZAS PRIORIZADAS', value: `${(result.priorities || []).length} / 3`, color: '#EF4444' }, { label: 'EFICACIA', value: s >= 80 ? 'ALTA' : s >= 50 ? 'MEDIA' : 'BAJA', color: '#F59E0B' }] },
    getPhases: (result) => (result.priorities || []).map((id, i) => ({ label: `PRIORIDAD #${i + 1}`, value: THREAT_LABELS[id] || id })),
  },
  pulse: {
    code: 'MOD-05', title: 'ENCUESTA DE PULSO FOCO 2026', subtitle: 'RESULTADOS AGREGADOS DE ASISTENTES', color: '#F59E0B',
    getDetails: (result) => [{ label: 'PREGUNTAS RESPONDIDAS', value: `${Object.keys(result.answers || {}).length} / 10`, color: '#F59E0B' }, { label: 'TOTAL ASISTENTES', value: `${result.respondents ?? '—'}`, color: '#00FF41' }, { label: 'PARTICIPACIÓN', value: 'COMPLETADA', color: '#9CA3AF' }],
    getPhases: () => [],
  },
  cyberdefense: {
    code: 'MOD-07', title: 'OPERACIÓN ESCUDO DIGITAL', subtitle: 'DEFENSA DE RED EN TIEMPO REAL', color: '#00FF41',
    getDetails: (result) => [{ label: 'PUNTUACIÓN', value: `${result.score ?? 0}`, color: '#00FF41' }, { label: 'RANGO', value: result.rank ?? '—', color: '#F59E0B' }, { label: 'OLEADA ALCANZADA', value: `${result.wave ?? '—'}`, color: '#9CA3AF' }],
    getPhases: () => [],
  },
  tacticalmap: {
    code: 'MOD-08', title: 'SALA DE GUERRA — MANDO TÁCTICO', subtitle: 'EJERCICIO SIERRA-26', color: '#00AAFF',
    getDetails: (result) => { const s = result.score ?? 0; return [{ label: 'PUNTUACIÓN', value: `${s}`, color: '#00AAFF' }, { label: 'CLASIFICACIÓN', value: result.clasif ?? '—', color: '#F59E0B' }, { label: 'EVALUACIÓN', value: s >= 350 ? 'SOBRESALIENTE' : s >= 260 ? 'NOTABLE' : 'CORRECTO', color: '#9CA3AF' }] },
    getPhases: () => [],
  },
  covertmission: {
    code: 'MOD-09', title: 'MISIÓN SOMBRA — TERMINAL CLASIFICADO', subtitle: 'OPERACIÓN CÓDIGO AURORA', color: '#CC44FF',
    getDetails: (result) => [{ label: 'PUNTUACIÓN', value: `${result.score ?? 0}`, color: '#CC44FF' }, { label: 'RANGO', value: result.rank ?? '—', color: '#F59E0B' }, { label: 'TRANSMISIONES DESCIFRADAS', value: `${result.decoded ?? 0} / 3`, color: '#9CA3AF' }],
    getPhases: () => [],
  },
  aerocognitio: {
    code: 'MOD-06', title: 'AEROCOGNITIO', subtitle: 'BATERÍA PSICOTÉCNICA RPAS — EVALUACIÓN COGNITIVO-ESPACIAL', color: '#FFB547',
    getDetails: (result) => { const acc = Math.round((result.metrics?.overallAccuracy ?? 0) * 100); const roles = { rpas_pilot_class_ii: 'Piloto RPAS Clase II', sensor_operator: 'Operador Sensor RPAS', image_analyst: 'Analista de Imagen', mission_controller: 'Controlador de Misión' }; const accColor = acc >= 75 ? '#00FF41' : acc >= 50 ? '#F59E0B' : '#EF4444'; return [{ label: 'PRECISIÓN GLOBAL', value: `${acc}%`, color: accColor }, { label: 'ROL EVALUADO', value: roles[result.role] ?? result.role ?? '—', color: '#F59E0B' }, { label: 'DURACIÓN', value: `${Math.round((result.metrics?.sessionDurationMs ?? 0) / 60000)} min`, color: '#9CA3AF' }] },
    getPhases: (result) => { const ds = result.report?.dimensionScores ?? {}; const lbl = { low: 'BAJO', medium: 'MEDIO', high: 'ALTO' }; return [{ label: 'ROTACIÓN MENTAL', value: lbl[ds.mentalRotation?.level] ?? `${Math.round((result.metrics?.mr_accuracy ?? 0) * 100)}%` }, { label: 'ORIENTACIÓN ESPACIAL', value: lbl[ds.spatialOrientation?.level] ?? `${Math.round((result.metrics?.so_accuracy ?? 0) * 100)}%` }, { label: 'MEMORIA ESPACIAL', value: lbl[ds.spatialMemory?.level] ?? `${Math.round((result.metrics?.sm_changeDetectionRate ?? 0) * 100)}%` }] },
  },
  recruitment: {
    code: 'MOD-10', title: 'SELECCIÓN DE PERSONAL — ARA', subtitle: 'ORIENTACIÓN VOCACIONAL MILITAR — FUERZAS ARMADAS ESPAÑOLAS', color: '#22C55E',
    getDetails: (result) => { const primary = result.recomendacion?.primary ?? result.report?.specialtyMatch?.primary; const gti = result.gti ?? 0; const gtiColor = gti >= 70 ? '#00FF41' : gti >= 40 ? '#F59E0B' : '#EF4444'; return [{ label: 'GTI', value: `${gti} / 100`, color: gtiColor }, { label: 'ESPECIALIDAD RECOMENDADA', value: primary?.name ?? '—', color: '#22C55E' }, { label: 'RAMA', value: primary?.branch ?? '—', color: '#9CA3AF' }] },
    getPhases: (result) => { const famLabels = { F1: 'Combate', F2: 'Técnica/Mecánica', F3: 'Tecnología/Cyber', F4: 'Sanidad/Cuidado', F5: 'Logística/Admin', F6: 'Mando/Liderazgo', F7: 'Marítimo/Aéreo', F8: 'Creativo/Artístico' }; return Object.entries(result.intereses || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => ({ label: `INTERÉS · ${famLabels[k] || k}`, value: `${Math.round(v * 100)}%` })) },
  },
}

function getMeta(moduleId, moduleTitle) {
  return MODULE_META[moduleId] || {
    code:       'MOD-XX',
    title:      (moduleTitle || moduleId || 'MÓDULO').toUpperCase(),
    subtitle:   'INFORME DE PARTICIPANTE',
    color:      '#00FF41',
    getDetails: (result) => [
      { label: 'PUNTUACIÓN', value: `${result.score ?? 0}`, color: '#00FF41' },
    ],
    getPhases: () => [],
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

// Helper: hex to rgb array
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0]
}

function EmailScreen({ sessionId, moduleResult, onReset, qrToken, emailToken }) {
  const [email, setEmail]           = useState('')
  const [pdfUrl, setPdfUrl]         = useState(null)   // blob URL — preview + download
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)

  // Generate PDF locally on mount with design from server/pdfGenerator.js
  useEffect(() => {
    const doc = new jsPDF()
    const moduleId = moduleResult?._moduleId || 'unknown'
    const moduleTitle = moduleResult?._moduleTitle || 'Módulo de Evaluación'
    const { _moduleId, _moduleTitle, ...result } = moduleResult || {}
    const meta = getMeta(moduleId, moduleTitle)
    const details = meta.getDetails(result)
    const phases = meta.getPhases(result)
    const analysis = getAnalysis(moduleId, result)
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

    const W = 210 // A4 width in mm
    const H = 297 // A4 height in mm
    const C = { bg: '#070707', panel: '#0d0d0d', accent: '#00FF41', amber: '#F59E0B', red: '#EF4444', white: '#FFFFFF', grey: '#9CA3AF', grey2: '#4B5563', header: '#0a0a0a' }

    // Background
    doc.setFillColor(7, 7, 7)
    doc.rect(0, 0, W, H, 'F')

    // Header bar
    doc.setFillColor(10, 10, 10)
    doc.rect(0, 0, W, 25, 'F')

    // Logo text (left)
    doc.setTextColor(0, 255, 65)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('INNOVADEF', 10, 10)
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('FOCO 2026', 10, 16)

    // Header right
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

    // Accent bar
    doc.setFillColor(...hexToRgb(meta.color))
    doc.rect(0, 25, W, 2, 'F')

    // Module header
    let y = 35

    // Badge
    doc.setFillColor(...hexToRgb(meta.color))
    doc.roundedRect(10, y, 18, 8, 1, 1, 'F')
    doc.setTextColor(7, 7, 7)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text(meta.code, 10, y + 5.5, { align: 'center' })

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(meta.title, 32, y + 2)
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(meta.subtitle, 32, y + 7)

    y = 50

    // Metric boxes (3 columns)
    const boxW = (W - 20 - 8) / 3
    details.forEach((d, i) => {
      const bx = 10 + i * (boxW + 4)
      const by = y

      doc.setFillColor(13, 13, 13)
      doc.rect(bx, by, boxW, 22, 'F')
      doc.setFillColor(...hexToRgb(d.color))
      doc.rect(bx, by, boxW, 1.5, 'F')

      doc.setTextColor(...hexToRgb(d.color))
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(d.value, bx + boxW / 2, by + 12, { align: 'center' })
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.text(d.label, bx + boxW / 2, by + 18, { align: 'center' })
    })

    y = 78

    // Doctrinal analysis header
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

    // Module-specific details
    if (phases.length > 0) {
      doc.setFillColor(75, 85, 99)
      doc.rect(10, y, W - 20, 5, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DE EJECUCIÓN', 12, y + 3.5)
      y += 7

      phases.forEach((phase) => {
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
      y += 5
    }

    // Footer
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

    // Blob URL — works for both inline preview and download
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [moduleResult, sessionId])

  // Encode report data for QR - use portal URL instead of base64 data
  // QR uses the 30-min token; falls back to sessionId if server is offline
  const qrValue = `${window.location.origin}/report/${qrToken || sessionId}`

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `informe-innovadef-${sessionId}.pdf`
      link.click()
    }
  }

  const handleSendEmail = () => {
    if (!email.includes('@')) return
    // Attach email to session in DB (fire-and-forget)
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
    <div style={{ width: '100%', margin: '0 auto' }}>
      <Panel label="// ENTREGA DE INFORME CLASIFICADO" style={{ marginBottom: 'clamp(27px, 5vw, 45px)' }}>
        <div style={{ padding: 'clamp(24px, 5vw, 42px) clamp(18px, 4vw, 36px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(24px, 5vw, 48px)', alignItems: 'start' }}>

          {/* QR Column */}
          <div>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(14px, 2.5vw, 20.25px)', color: TEXT2, letterSpacing: 'clamp(2px, 0.6vw, 3px)', marginBottom: 'clamp(15px, 4vw, 27px)' }}>
              CÓDIGO QR — ACCESO AL PORTAL
            </div>
            <div style={{ background: '#fff', padding: 'clamp(12px, 3vw, 24px)', display: 'inline-block', marginBottom: 12 }}>
              <QRCode value={qrValue} size={192} level="H" />
            </div>
            <div style={{ fontFamily: FONT, fontSize: 10, color: TEXT2, marginTop: 6 }}>
              Escanea para acceder a tu informe en innovadef.es
            </div>
            {pdfUrl && (
              <button
                onClick={handleDownloadPdf}
                style={{ marginTop: 12, ...S.btnPrimary, fontSize: '11px', padding: '10px 20px', gap: 8 }}
              >
                <Mail size={14} /> DESCARGAR PDF
              </button>
            )}
          </div>

          {/* Email Column */}
          <div>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(14px, 2.5vw, 20.25px)', color: TEXT2, letterSpacing: 'clamp(2px, 0.6vw, 3px)', marginBottom: 'clamp(15px, 4vw, 27px)' }}>
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
                  style={{ width: '100%', padding: 'clamp(15px, 3vw, 27px)', background: '#0a0a0a', border: `1.5px solid ${BORDER}`, color: ACCENT, fontFamily: FONT, fontSize: 'clamp(16px, 3vw, 24.75px)', letterSpacing: 'clamp(1px, 0.3vw, 1.5px)', outline: 'none', marginBottom: 'clamp(9px, 2vw, 15px)', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <button
                  onClick={handleSendEmail}
                  disabled={!email.includes('@')}
                  style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: !email.includes('@') ? 0.35 : 1, gap: 10 }}
                >
                  <Send size={16} /> ENVIAR INFORME
                </button>
                <div style={{ fontFamily: FONT, fontSize: 10, color: TEXT2, marginTop: 14, lineHeight: 1.8 }}>
                  Se abrirá tu cliente de correo. Adjunta el PDF descargado.
                </div>
              </>
            ) : (
              <div style={{ border: `1.5px solid ${ACCENT}44`, padding: 'clamp(18px, 4vw, 36px)', background: 'rgba(0,255,65,0.04)' }}>
                <div style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2.5vw, 22.5px)', color: ACCENT, letterSpacing: 'clamp(2px, 0.6vw, 3px)', marginBottom: 'clamp(6px, 1.5vw, 9px)' }}>
                  CLIENTE DE CORREO ABIERTO
                </div>
                <div style={{ fontFamily: FONT, fontSize: 'clamp(16px, 3vw, 24.75px)', color: TEXT2, marginBottom: 8 }}>
                  DEST: {email.toUpperCase()}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: TEXT2 }}>
                  Adjunta el PDF descargado antes de enviar.
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <button
        onClick={onReset}
        style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', fontFamily: FONT, fontSize: 'clamp(15px, 2.5vw, 22.5px)', letterSpacing: 'clamp(2px, 0.6vw, 3px)', textTransform: 'uppercase', display: 'block', margin: '0 auto' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ffaa00'}
        onMouseLeave={e => e.currentTarget.style.color = TEXT2}
      >
        [ NUEVA EVALUACIÓN ]
      </button>
    </div>
  )
}

// ─── MODULE SELECTOR ──────────────────────────────────────────────────────────

// HUD horizontal scan line that sweeps down on boot
function HudScanLine({ active }) {
  return active ? (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '4.5px', zIndex: 200, pointerEvents: 'none',
      background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT}cc, transparent)`,
      boxShadow: `0 0 36px ${ACCENT}88, 0 0 12px ${ACCENT}`,
      animation: 'hudScan 1.35s ease-in-out forwards'
    }} />
  ) : null
}

function ModuleSelector({ onSelect, bootStage = 4 }) {
  const [hovered, setHovered] = useState(null)
  const [tick, setTick] = useState(0)
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 3000); return () => clearInterval(i) }, [])

  // SFX: boot stages
  const prevStage = useRef(0)
  useEffect(() => {
    if (bootStage > prevStage.current && hasUserInteracted()) {
      prevStage.current = bootStage
      if (bootStage === 1) sfxBootHeader()
      if (bootStage === 2) sfxHudScan()
      if (bootStage === 3) sfxHudScan()
      if (bootStage === 4) sfxCardAppear()
    }
  }, [bootStage])

  // SFX: radar ping every ~15s
  useEffect(() => {
    if (screen === 'intro' || screen === 'sleep') return
    const i = setInterval(() => {
      if (hasUserInteracted()) sfxRadarPing()
    }, 15000)
    return () => clearInterval(i)
  }, [screen])

  // Each element gets its own visibility threshold based on bootStage
  const vis = (minStage, delay = 0) => ({
    opacity: bootStage >= minStage ? 1 : 0,
    transform: bootStage >= minStage ? 'translateY(0) scaleY(1)' : 'translateY(-18px) scaleY(0.92)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.67s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    transformOrigin: 'top',
  })

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>

      {/* HUD scan line sweeps screen on entry */}
      <HudScanLine active={bootStage === 3} />

      {/* System header panels — staggered */}
      <div className="info-panels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(10px, 1.5vw, 16px)', marginBottom: 'clamp(30px, 5vw, 54px)' }}>
        <style>{`
          @media (max-width: 900px) {
            .info-panels-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        {[
          { label: '// SISTEMA', content: (
            <div style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)', fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', lineHeight: 2.2, color: TEXT2 }}>
              <div>PLATFORM: <span style={{ color: ACCENT }}>INNOVADEF-KIOSK v2.0</span></div>
              <div>OPERATOR: <span style={{ color: ACCENT }}>FOCO-2026-OPERATOR</span></div>
              <div>LOCATION: <span style={{ color: AMBER }}>MADRID // 40°25'N 3°41'W</span></div>
            </div>
          )},
          { label: '// SISTEMAS', content: (
            <div style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)', fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', lineHeight: 2.2 }}>
              {[
                { label: 'RED ENS', val: 'CONECTADA', c: ACCENT },
                { label: 'CIFRADO', val: 'AES-256 OK', c: ACCENT },
                { label: 'SERVIDOR', val: 'NOMINAL', c: ACCENT },
              ].map(r => (
                <div key={r.label}><span style={{ color: TEXT2 }}>{r.label}: </span><span style={{ color: r.c }}>▮ {r.val}</span></div>
              ))}
            </div>
          )},
          { label: '// TELEMETRÍA', content: (
            <div style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)', fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', lineHeight: 2.2, color: TEXT2 }}>
              <div>EVALUACIONES HOY: <span style={{ color: AMBER }}>47</span></div>
              <div>MÓDULO + ACTIVO: <span style={{ color: ACCENT }}>MOD-01</span></div>
              <div>SESIÓN ACTUAL: <span style={{ color: ACCENT }}>FOCO-{Date.now().toString(36).toUpperCase().slice(-6)}</span></div>
            </div>
          )},
        ].map((p, i) => (
          <div key={i} style={{ ...vis(3, i * 180) }}>
            <Panel label={p.label}>{p.content}</Panel>
          </div>
        ))}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 'clamp(36px, 6vw, 63px)', borderBottom: `1.5px solid ${BORDER}`, paddingBottom: 'clamp(18px, 4vw, 30px)', ...vis(3, 540) }}>
        <div style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 27px)', color: TEXT2, letterSpacing: 'clamp(3px, 0.6vw, 5px)', marginBottom: 'clamp(18px, 3vw, 33px)' }}>
          // SISTEMA DE EVALUACIÓN INTERACTIVA — SELECCIONE MÓDULO DE OPERACIÓN
        </div>
        <div style={{ fontFamily: FONT, fontSize: 'clamp(28px, 5vw, 80px)', letterSpacing: 'clamp(3px, 0.8vw, 6px)', color: ACCENT, textShadow: `0 0 60px ${ACCENT}33`, lineHeight: 1.1 }}>
          CENTRO DE OPERACIONES<br />
          <span style={{ color: TEXT2, fontSize: '65%' }}>INNOVADEF FOCO 2026 — MADRID</span>
        </div>
      </div>

      {/* Module grid — grouped by category, each card staggers in */}
      {(() => {
        // Group modules by category preserving insertion order
        const byCategory = {}
        MODULES.forEach(mod => {
          if (!byCategory[mod.category]) byCategory[mod.category] = []
          byCategory[mod.category].push(mod)
        })
        let globalIdx = 0
        return Object.entries(byCategory).map(([cat, mods], catIdx) => (
          <div key={cat} style={{ marginBottom: 'clamp(30px, 6vw, 54px)' }}>
            {/* Category header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)',
              marginBottom: 'clamp(10px, 2vw, 18px)',
              ...vis(3, 660 + catIdx * 80),
            }}>
              <div style={{ height: '1px', background: BORDER, flex: 1 }} />
              <span style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2vw, 19px)', color: TEXT2, letterSpacing: 'clamp(3px, 0.6vw, 5px)', textTransform: 'uppercase' }}>
                // {cat.toUpperCase()}
              </span>
              <div style={{ height: '1px', background: BORDER, flex: 1 }} />
            </div>
            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(340px, 45vw, 560px), 1fr))', gap: 'clamp(15px, 2vw, 24px)', alignItems: 'stretch' }}>
              {mods.map((mod) => {
                const idx = globalIdx++
                const Icon = mod.icon
                const isH = hovered === mod.id
                const cardDelay = 720 + idx * 150
                return (
                  <div key={mod.id} style={{ ...vis(3, cardDelay), height: '100%' }}>
                    <button
                      onClick={() => { sfxModuleSelect(); onSelect(mod.id) }}
                      onMouseEnter={() => { sfxHover(); setHovered(mod.id) }}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        display: 'flex', flexDirection: 'column', padding: '0', width: '100%', height: '100%',
                        background: isH ? `rgba(255,170,0,0.03)` : '#070707',
                        border: `1.5px solid ${isH ? `#ffaa0055` : BORDER}`,
                        color: ACCENT, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.18s',
                        boxShadow: isH ? `0 0 0 1.5px #ffaa0022, inset 0 0 45px rgba(255,170,0,0.02)` : 'none'
                      }}
                    >
                      {/* Module header bar */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 'clamp(12px, 2vw, 18px) clamp(16px, 3vw, 28px)',
                        borderBottom: `1.5px solid ${isH ? `#ffaa0033` : BORDER}`,
                        background: isH ? 'rgba(255,170,0,0.04)' : '#0a0a0a'
                      }}>
                        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 15px)', alignItems: 'center' }}>
                          <Icon size={22} color={isH ? '#ffaa00' : TEXT2} />
                          <span style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 26px)', color: TEXT2, letterSpacing: 'clamp(2px, 0.6vw, 3px)' }}>{mod.code}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 18px)', alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2vw, 22px)', letterSpacing: 'clamp(2px, 0.6vw, 3px)', color: isH ? '#ffaa00' : TEXT2, padding: '3px 9px', border: `1.5px solid ${isH ? `#ffaa0044` : BORDER}` }}>
                            {mod.tag}
                          </span>
                          <span style={{ width: 'clamp(6px, 1vw, 9px)', height: 'clamp(6px, 1vw, 9px)', background: isH ? '#ffaa00' : ACCENT, display: 'inline-block', boxShadow: isH ? `0 0 12px #ffaa00` : `0 0 12px ${ACCENT}`, animation: 'blink 3s infinite' }} />
                        </div>
                      </div>
                      {/* Body */}
                      <div style={{ padding: 'clamp(18px, 3.5vw, 30px) clamp(16px, 3vw, 28px)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 25px)', letterSpacing: 'clamp(1px, 0.3vw, 1.5px)', color: isH ? '#ffaa00' : TEXT2, marginBottom: 'clamp(12px, 2vw, 18px)', lineHeight: 1.3 }}>
                          {mod.label}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 'clamp(18px, 2.5vw, 27px)', color: 'rgba(0,255,65,0.3)', lineHeight: 1.7, letterSpacing: '0.75px', marginBottom: 'clamp(15px, 3vw, 27px)' }}>
                          {mod.desc}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT, fontSize: 'clamp(16px, 2.5vw, 25px)', color: 'rgba(0,255,65,0.25)', letterSpacing: 'clamp(1px, 0.3vw, 1.5px)' }}>DURACIÓN: {mod.duration}</span>
                          <span style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 27px)', color: isH ? '#ffaa00' : TEXT2, letterSpacing: 'clamp(1px, 0.3vw, 1.5px)' }}>{isH ? '[EJECUTAR ▶]' : '[──────]'}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      })()}

      {/* Footer */}
      <div style={{ fontFamily: FONT, fontSize: '20.25px', color: 'rgba(0,255,65,0.18)', letterSpacing: '3px', textAlign: 'center', ...vis(3, 1500) }}>
        INNOVADEF FOCO 2026 // 23.06.2026 // MADRID // SISTEMA CERTIFICADO ENS-CAT-A
      </div>
    </div>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── MODULE TRANSITION FLASH ─────────────────────────────────────────────────
function ModuleTransition({ active, onDone }) {
  useEffect(() => {
    if (active) {
      sfxIntroWipe()
      const t = setTimeout(onDone, 1800)
      return () => clearTimeout(t)
    }
  }, [active, onDone])
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
      {/* Base flash layer */}
      <div style={{ position: 'absolute', inset: 0, background: ACCENT, animation: 'modFlash 1.8s ease-out forwards' }} />
      
      {/* Diagonal scanline sweep */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 501, pointerEvents: 'none',
        background: `linear-gradient(135deg, transparent 40%, ${ACCENT}cc 50%, transparent 60%)`,
        animation: 'diagSweep 0.9s ease-in-out forwards'
      }} />
      
      {/* Concentric energy rings from center */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: '0', height: '0', borderRadius: '50%',
          border: `3px solid ${ACCENT}`,
          animation: `ringExpand 0.9s ease-out ${i * 0.12}s forwards`
        }} />
      ))}
      
      {/* Horizontal scan lines crossing */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '4.5px', zIndex: 502, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT}cc, transparent)`,
        boxShadow: `0 0 45px ${ACCENT}88`,
        animation: 'hudScan 0.75s ease-in-out forwards'
      }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '4.5px', zIndex: 502, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT}cc, transparent)`,
        boxShadow: `0 0 45px ${ACCENT}88`,
        animation: 'hudScanUp 0.75s ease-in-out forwards'
      }} />
      
      {/* Glitch overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 503, pointerEvents: 'none',
        background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${ACCENT}22 3px, ${ACCENT}22 6px)`,
        animation: 'glitchFlicker 0.3s ease-in-out forwards'
      }} />
    </div>
  )
}

// ─── TRANSITION OVERLAY ──────────────────────────────────────────────────────
// Central black overlay — covers every screen change so there's never a hard cut
function useScreenTransition(duration = 630) {
  const [overlay, setOverlay] = useState(false) // true = overlay visible (black)
  const queue = useRef(null)

  const go = useCallback((fn) => {
    setOverlay(true)
    // Wait one frame for overlay to start, then change screen content
    setTimeout(() => {
      fn()
      // Fade overlay back out
      setTimeout(() => setOverlay(false), 90)
    }, duration * 0.45)
  }, [duration])

  return { overlay, go }
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const getInitialScreen = () => {
    const path = location.pathname
    if (path === '/') return 'sleep'
    else if (path === '/intro') return 'intro'
    else if (path === '/selector') return 'selector'
    else if (path === '/email') return 'email'
    else if (path.startsWith('/module/')) return 'module'
    return 'sleep'
  }

  const getInitialActiveModule = () => {
    const path = location.pathname
    if (path.startsWith('/module/')) return path.split('/')[2] || null
    return null
  }

  const [screen, setScreen] = useState(getInitialScreen)
  const [activeModule, setActiveModule] = useState(getInitialActiveModule)
  const [moduleResult, setModuleResult] = useState(null)
  const [sessionId] = useState(() => `FOCO-${Date.now().toString(36).toUpperCase()}`)
  const [booting, setBooting] = useState(() => getInitialScreen() === 'selector')
  const [bootStage, setBootStage] = useState(() => ['selector', 'module', 'email'].includes(getInitialScreen()) ? 4 : 0)
  const [qrToken, setQrToken] = useState(null)
  const [emailToken, setEmailToken] = useState(null)
  const [reportId, setReportId] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingModule, setPendingModule] = useState(null)
  const { overlay, go } = useScreenTransition(750)

  // Screen → URL: empuja la URL cuando el estado cambia desde la UI.
  // Solo navega si la URL actual no coincide, evitando entradas duplicadas en el historial.
  useEffect(() => {
    const expected =
      screen === 'sleep'                      ? '/' :
      screen === 'intro'                      ? '/intro' :
      screen === 'selector'                   ? '/selector' :
      screen === 'module' && activeModule     ? `/module/${activeModule}` :
      screen === 'email'                      ? '/email' :
      null
    if (!expected) return
    if (screen === 'email' && !moduleResult) { setScreen('selector'); return }
    if (location.pathname === expected) return   // ya en sync, no hacer nada
    if (screen === 'sleep') navigate('/', { replace: true })
    else navigate(expected)
  }, [screen, activeModule, moduleResult, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  // URL → screen: reacciona a cambios de location (flechas del navegador).
  // React Router actualiza location antes del re-render, así que no hay closure stale.
  useEffect(() => {
    const path = location.pathname
    if (path === '/') { setScreen('sleep') }
    else if (path === '/intro') { setScreen('intro') }
    else if (path === '/selector') { setScreen('selector') }
    else if (path === '/email') { if (moduleResult) setScreen('email'); else setScreen('selector') }
    else if (path.startsWith('/module/')) {
      const moduleId = path.split('/')[2]
      setActiveModule(moduleId)
      setScreen('module')
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ambient background sound — TEMPORARILY DISABLED
  useEffect(() => {
    return () => {}
  }, [])

  // Inactivity timeout - return to sleep after 60 seconds
  useEffect(() => {
    let timeoutId

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      if (screen !== 'sleep') {
        timeoutId = setTimeout(() => {
          navigate('/')
        }, 60000) // 60 seconds
      }
    }

    const handleActivity = () => {
      resetTimeout()
    }

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    resetTimeout()

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [screen, navigate])

  const enterDashboard = () => {
    markUserInteracted()
    sfxIntroWipe()
    go(() => {
      setScreen('selector')
      setBooting(true)
      setBootStage(0)
      setTimeout(() => setBootStage(1), 120)
      setTimeout(() => setBootStage(2), 570)
      setTimeout(() => setBootStage(3), 975)
      setTimeout(() => setBootStage(4), 2700)
    })
  }

  const selectModule = (id) => {
    setPendingModule(id)
    setTransitioning(true)
  }

  const commitModule = () => {
    // Generate the session ID now so plugins can use it for intermediate saves
    setReportId(`FOCO-${Date.now().toString(36).toUpperCase()}`)
    setQrToken(null)
    setEmailToken(null)
    setActiveModule(pendingModule)
    setScreen('module')
    setTransitioning(false)
    setPendingModule(null)
    sfxBootReady()
  }

  const handleComplete = async (result) => {
    const mod = MODULES.find(m => m.id === activeModule)
    const fullResult = { ...result, _moduleId: activeModule, _moduleTitle: mod?.label || activeModule }
    // reportId was set in commitModule when the module started
    // Await the session save so qrToken/emailToken are ready before the QR renders
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reportId, moduleId: activeModule, moduleTitle: mod?.label, result: fullResult }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.qrToken) setQrToken(data.qrToken)
        if (data?.emailToken) setEmailToken(data.emailToken)
      })
      .catch(() => {}) // kiosk keeps working offline — QR falls back to reportId
    go(() => {
      setModuleResult(fullResult)
      setScreen('email')
    })
  }
  const reset = () => {
    markUserInteracted()
    sfxReset()
    go(() => { setScreen('selector'); setActiveModule(null); setModuleResult(null); setQrToken(null); setEmailToken(null); setReportId(null) })
  }

  const activeModCode = MODULES.find(m => m.id === activeModule)?.code

  return (
    <div style={{ fontFamily: FONT, background: '#070707', minHeight: '100vh', color: ACCENT, overflowX: 'hidden', fontSize: '24px' }}>
      <MilitaryCursor />
      {screen === 'sleep' && <SleepScreen onWake={() => go(() => setScreen('intro'))} />}
      {screen === 'intro' && <IntroScreen onEnter={enterDashboard} />}
      <ModuleTransition active={transitioning} onDone={commitModule} />
      <MilitaryBackground />

      {/* ── Universal transition overlay — prevents any hard cut between screens ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400, pointerEvents: 'none',
        background: '#000',
        opacity: overlay ? 1 : 0,
        transition: overlay ? 'opacity 0.33s ease-in' : 'opacity 0.67s ease-out',
      }} />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '90px',
        background: 'rgba(5,5,5,0.96)',
        borderBottom: `1.5px solid ${BORDER}`,
        display: 'flex', alignItems: 'stretch',
        transform: bootStage < 1 ? 'translateY(-150%)' : 'translateY(0)',
        opacity: bootStage < 1 ? 0 : 1,
        transition: 'transform 0.67s cubic-bezier(0.22,1,0.36,1), opacity 0.52s ease',
      }}>
        {/* Logo block */}
        <button onClick={reset} className="hdr-logo" style={{
          background: 'none', border: 'none', borderRight: `1.5px solid ${BORDER}`,
          padding: '0 clamp(16px, 2.5vw, 32px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.5vw, 18px)'
        }}>
          <img src="/logoinnovadef.png" alt="INNOVADEF" style={{ height: '120px' }} />
        </button>

        {/* Nav items */}
        <div className="hdr-nav" style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0', gap: '0' }}>
          {[
            { label: 'CENTRO OPS', active: screen === 'selector', action: reset },
            { label: activeModCode || '—', active: screen === 'module', action: null },
          ].map((nav, i) => (
            <div key={i} style={{
              padding: '0 clamp(12px, 2vw, 24px)', height: '100%', display: 'flex', alignItems: 'center',
              borderRight: `1.5px solid ${BORDER}`,
              fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 20px)', letterSpacing: 'clamp(2px, 0.4vw, 3px)',
              color: nav.active ? ACCENT : TEXT2,
              borderBottom: nav.active ? `3px solid ${ACCENT}` : '3px solid transparent',
              cursor: nav.action ? 'pointer' : 'default',
              background: nav.active ? 'rgba(0,255,65,0.04)' : 'transparent'
            }} onClick={nav.action}>
              {nav.label}
            </div>
          ))}

          {/* Back-to-menu button — visible only during module execution (kiosk-safe) */}
          {screen === 'module' && (
            <button
              onClick={reset}
              onMouseEnter={e => { e.currentTarget.style.color = '#ffaa00'; e.currentTarget.style.borderColor = '#ffaa0066' }}
              onMouseLeave={e => { e.currentTarget.style.color = TEXT2; e.currentTarget.style.borderColor = BORDER }}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 14px)',
                padding: '0 clamp(12px, 2vw, 20px)', height: '100%',
                background: 'none', border: 'none',
                borderLeft: `1.5px solid ${BORDER}`,
                color: TEXT2, cursor: 'pointer',
                fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 20px)', letterSpacing: 'clamp(2px, 0.4vw, 3px)',
                transition: 'color 0.27s, border-color 0.27s',
              }}
            >
              ← MENÚ PRINCIPAL
            </button>
          )}
        </div>

        {/* Right indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', borderLeft: `1.5px solid ${BORDER}` }}>
          {[
            { label: 'SYS', val: 'OK', c: ACCENT },
            { label: 'NET', val: 'ENS', c: ACCENT },
            { label: 'SEC', val: 'A', c: ACCENT },
          ].map((ind, i) => (
            <div key={i} className="hdr-indicators" style={{ padding: '0 clamp(12px, 2vw, 24px)', borderRight: `1.5px solid ${BORDER}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(3px, 0.5vw, 6px)' }}>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(11px, 1.5vw, 16px)', color: TEXT2, letterSpacing: '1px' }}>{ind.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(14px, 2vw, 20px)', color: ind.c, letterSpacing: '1px' }}>{ind.val}</div>
            </div>
          ))}
          <div className="hdr-clock" style={{ padding: '0 clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(3px, 0.5vw, 6px)' }}>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(11px, 1.5vw, 16px)', color: TEXT2, letterSpacing: '1px' }}>HORA LOCAL</div>
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Content — selector and email screens */}
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(140px, 18vw, 200px) clamp(24px, 4vw, 60px) clamp(52px, 7vw, 80px)' }}>
        {screen === 'selector' && (
          <div key="selector" style={{ width: '100%',
            animation: transitioning ? 'contentFadeOut 0.75s ease-in 0.67s forwards' : 'contentFadeIn 0.9s ease-out both' }}>
            <ModuleSelector onSelect={selectModule} bootStage={bootStage} />
          </div>
        )}
        {screen === 'email' && moduleResult && (
          <div key="email" style={{ width: '100%', animation: 'contentFadeIn 0.6s ease-out both' }}>
            <EmailScreen sessionId={reportId || sessionId} moduleResult={moduleResult} onReset={reset} qrToken={qrToken} emailToken={emailToken} />
          </div>
        )}
      </div>

      {/* Module screen — plugin fills the space between header and status bar, sin scroll */}
      {screen === 'module' && (
        <div key={`mod-${activeModule}`} style={{
          position: 'fixed', top: '90px', left: 0, right: 0, bottom: 'clamp(32px, 4vw, 48px)',
          zIndex: 2, overflow: 'hidden',
          animation: 'contentFadeIn 0.6s ease-out both',
        }}>
          <PluginRenderer
            plugin={MODULES.find(m => m.id === activeModule)}
            onComplete={handleComplete}
            sessionId={reportId}
          />
        </div>
      )}

      <StatusBar module={activeModCode} onHome={reset} bootStage={bootStage} />

      <style>{`
        @font-face {
          font-family: 'Share Tech Mono';
          src: url('/ShareTechMono-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        * { box-sizing: border-box; }
        ::selection { background: rgba(0,255,65,0.2); color: #00FF41; }
        ::-webkit-scrollbar { width: 4.01px; background: #070707; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,65,0.2); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4.01px)} to{opacity:1;transform:translateY(0)} }
        @keyframes contentFadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes contentFadeOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-14px) scale(0.97)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes hudScan   { 0%{top:0;opacity:1} 85%{opacity:0.7} 100%{top:100vh;opacity:0} }
        @keyframes hudScanUp { 0%{bottom:0;opacity:1} 85%{opacity:0.7} 100%{bottom:100vh;opacity:0} }
        @keyframes modFlash  { 0%{opacity:0.55} 20%{opacity:0.3} 100%{opacity:0} }
        @keyframes diagSweep { 0%{transform:translateX(-100%) rotate(135deg)} 100%{transform:translateX(100%) rotate(135deg)} }
        @keyframes ringExpand { 0%{width:0;height:0;opacity:0.8} 100%{width:150vmax;height:150vmax;opacity:0} }
        @keyframes glitchFlicker { 0%,100%{opacity:0} 10%{opacity:0.4} 20%{opacity:0} 30%{opacity:0.3} 40%{opacity:0} 50%{opacity:0.5} 60%{opacity:0} 70%{opacity:0.2} 80%{opacity:0} 90%{opacity:0.1} }
        button:focus { outline: 1.5px solid rgba(0,255,65,0.3); outline-offset: 3px; }
      `}</style>
    </div>
  )
}
