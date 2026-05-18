import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import { Send, Cpu, CheckCircle, ChevronRight, Mail, Target, BarChart2, AlertTriangle, Activity, FileText } from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import MilitaryBackground from './MilitaryBackground'
import IntroScreen, { MilitaryCursor } from './IntroScreen'
import SleepScreen from './SleepScreen'
import TacticalSimulator from './modules/TacticalSimulator'
import MaturityRadar from './modules/MaturityRadar'
import ThreatClassifier from './modules/ThreatClassifier'
import PulseSurvey from './modules/PulseSurvey'
import { ACCENT, ACCENT2, AMBER, RED, DIM, DIMLO, BORDER, BG, TEXT, TEXT2, FONT, CARD, S } from './theme'
import { sfxBootHeader, sfxHudScan, sfxCardAppear, sfxModuleSelect, sfxHover, sfxReset, sfxRadarPing, sfxIntroWipe, startAmbient, stopAmbient } from './sfx'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const PH = `${ACCENT}` // shorthand for inline phosphor color

const questions = [
  { id: 1, text: "¿CUÁL CONSIDERA EL MAYOR VECTOR DE TRANSFORMACIÓN EN LA ENSEÑANZA MILITAR EN LOS PRÓXIMOS 3 AÑOS?", category: "transformacion", options: ["INTEGRACIÓN DE IA GENERATIVA EN PROCESOS FORMATIVOS", "SIMULACIÓN AVANZADA Y ENTORNOS INMERSIVOS", "GESTIÓN UNIFICADA DEL CONOCIMIENTO INSTITUCIONAL", "PLATAFORMAS LMS ADAPTATIVAS DE NUEVA GENERACIÓN"] },
  { id: 2, text: "¿EN QUÉ FASE SE ENCUENTRA SU ORGANIZACIÓN RESPECTO AL DESPLIEGUE CLOUD CON CERTIFICACIÓN ENS?", category: "cloud", options: ["CERTIFICACIÓN ENS CATEGORÍA ALTA OPERATIVA", "EN PROCESO ACTIVO DE CERTIFICACIÓN", "PLANIFICADO PARA EL PRESENTE EJERCICIO", "AÚN EN FASE DE ANÁLISIS Y EVALUACIÓN"] },
  { id: 3, text: "¿CÓMO DESCRIBIRÍA EL NIVEL DE MADUREZ EN INTELIGENCIA ARTIFICIAL APLICADA?", category: "ia", options: ["IA EN PRODUCCIÓN CON CASOS DE USO CONSOLIDADOS", "PROYECTOS PILOTO ACTIVOS CON RESULTADOS MEDIBLES", "FASE DE EXPLORACIÓN Y EVALUACIÓN TECNOLÓGICA", "PENDIENTE DE DEFINIR HOJA DE RUTA ESTRATÉGICA"] },
  { id: 4, text: "¿CÓMO VALORA LA SOBERANÍA DEL DATO EN SUS INFRAESTRUCTURAS ACTUALES?", category: "soberania", options: ["CONTROL TOTAL CON MODELO DE NUBE SOBERANA", "MODELO HÍBRIDO CON PROTOCOLOS DE SEGURIDAD", "EN PROCESO DE IMPLEMENTACIÓN DE CONTROLES", "REQUIERE REVISIÓN ESTRATÉGICA URGENTE"] },
  { id: 5, text: "¿CUÁL ES LA PRINCIPAL BARRERA PARA ACELERAR LA TRANSFORMACIÓN DIGITAL?", category: "barreras", options: ["MARCO REGULATORIO Y PROCESOS DE CERTIFICACIÓN", "DISPONIBILIDAD DE TALENTO ESPECIALIZADO", "PRESUPUESTO Y PRIORIZACIÓN DE INVERSIONES", "RESISTENCIA AL CAMBIO ORGANIZACIONAL"] }
]

const categoryLabels = {
  transformacion: "TRANSF. DIGITAL", cloud: "CLOUD & ENS", ia: "INTELIGENCIA ARTIFICIAL",
  soberania: "SOBERANÍA DEL DATO", barreras: "CAPACIDAD DE CAMBIO"
}

const MODULES = [
  { id: 'capacity', code: 'MOD-01', label: 'TEST DE CAPACIDAD DIGITAL', desc: '5 VECTORES DE MADUREZ TECNOLÓGICA — GENERA INFORME CLASIFICADO PERSONALIZADO', icon: FileText, color: ACCENT, duration: '~3 MIN', tag: 'EVALUACIÓN', status: 'ACTIVO' },
  { id: 'tactical', code: 'MOD-02', label: 'SIMULADOR DE DECISIÓN TÁCTICA', desc: 'ESCENARIO DE CRISIS DIGITAL EN TIEMPO REAL — PERFIL DE LIDERAZGO OPERACIONAL', icon: Target, color: '#FF6644', duration: '~4 MIN', tag: 'SIMULACRO', status: 'ACTIVO' },
  { id: 'radar', code: 'MOD-03', label: 'RADAR DE MADUREZ ORGANIZACIONAL', desc: '6 VECTORES ESTRATÉGICOS — VISUALIZACIÓN RADAR EN TIEMPO REAL', icon: BarChart2, color: '#0099FF', duration: '~3 MIN', tag: 'DIAGNÓSTICO', status: 'ACTIVO' },
  { id: 'threats', code: 'MOD-04', label: 'CLASIFICADOR DE AMENAZAS', desc: 'PRIORIZACIÓN DE AMENAZAS ACTIVAS — ASIGNACIÓN DE RECURSOS — ANÁLISIS DE RIESGOS', icon: AlertTriangle, color: RED, duration: '~4 MIN', tag: 'INTELIGENCIA', status: 'ACTIVO' },
  { id: 'pulse', code: 'MOD-05', label: 'ENCUESTA DE PULSO FOCO 2026', desc: '10 PREGUNTAS — RESULTADOS AGREGADOS EN TIEMPO REAL CON OTROS ASISTENTES', icon: Activity, color: AMBER, duration: '~2 MIN', tag: 'COMUNIDAD', status: 'ACTIVO' },
]

// ─── LIVE CLOCK ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i) }, [])
  const pad = n => String(n).padStart(2, '0')
  return (
    <span style={{ fontFamily: FONT, fontSize: '16.5px', color: TEXT2, letterSpacing: '3px' }}>
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
          padding: '6px 18px',
          background: '#070707',
          borderBottom: `1.5px solid ${BORDER}`,
          borderRight: `1.5px solid ${BORDER}`,
          fontSize: '20.25px', letterSpacing: '3px', color: TEXT2,
          fontFamily: FONT, textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}
      <div style={{ paddingTop: label ? '42px' : '0' }}>
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
      height: '48px',
      background: '#050505',
      borderTop: `1.5px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
      padding: '0 45px', gap: '0',
      fontFamily: FONT, fontSize: '22.5px',
      transform: bootStage < 2 ? 'translateY(100%)' : 'translateY(0)',
      opacity: bootStage < 2 ? 0 : 1,
      transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '13.5px', paddingRight: '30px', marginRight: '30px', borderRight: `1.5px solid ${BORDER}` }}>
          <span style={{ color: TEXT2 }}>{item.label}:</span>
          <span style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '30px' }}>
        {module && (
          <span style={{ color: TEXT2 }}>MÓDULO ACTIVO: <span style={{ color: ACCENT }}>{module}</span></span>
        )}
        <LiveClock />
        <div style={{ width: '9px', height: '9px', background: ACCENT, boxShadow: `0 0 9px ${ACCENT}44`, animation: 'blink 1.5s infinite' }} />
      </div>
    </div>
  )
}

// ─── CAPACITY TEST ────────────────────────────────────────────────────────────

function CapacityTest({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('questions')
  const [thinkingLines, setThinkingLines] = useState([])
  const [report, setReport] = useState(null)
  const [barWidths, setBarWidths] = useState({})

  const handleAnswer = (qId, answer) => {
    const updated = { ...answers, [qId]: answer }
    setAnswers(updated)
    if (step < questions.length - 1) setTimeout(() => setStep(s => s + 1), 300)
    else setTimeout(() => runAnalysis(updated), 300)
  }

  const runAnalysis = (fa) => {
    setThinkingLines([]); setPhase('thinking')
    const steps = [
      "INIT SECURE CHANNEL... ENS-CAT-A",
      "LOADING ASSESSMENT PROFILE 23JUN2026...",
      "PROCESSING VECTOR[1/5]: TRANSFORMACIÓN DIGITAL...",
      "PROCESSING VECTOR[2/5]: CLOUD & ENS...",
      "PROCESSING VECTOR[3/5]: IA ESTRATÉGICA...",
      "PROCESSING VECTOR[4/5]: SOBERANÍA DEL DATO...",
      "PROCESSING VECTOR[5/5]: CAPACIDAD DE CAMBIO...",
      "CALCULATING ÍNDICE GLOBAL...",
      "COMPILING CLASSIFIED REPORT >> DONE",
    ]
    steps.forEach((txt, i) => setTimeout(() => setThinkingLines(l => [...l, txt]), i * 1050))
    setTimeout(() => {
      const scores = {}
      questions.forEach(q => {
        const idx = q.options.indexOf(fa[q.id])
        scores[q.category] = idx === -1 ? 50 : Math.round((4 - idx) / 3 * 100)
      })
      const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5)
      const recs = []
      if (scores.cloud < 60) recs.push("CERTIFICAR ENS CATEGORÍA ALTA — REQUISITO OPERACIONAL PRIORITARIO")
      if (scores.ia < 60) recs.push("DESARROLLAR PLAN DE ADOPCIÓN IA CON CASOS DE USO EN FORMACIÓN Y SIMULACIÓN")
      if (scores.soberania < 60) recs.push("DISEÑAR ARQUITECTURA NUBE SOBERANA — CONTROL TOTAL DEL DATO CLASIFICADO")
      if (scores.transformacion < 60) recs.push("DEFINIR HOJA DE RUTA ALINEADA CON VECTORES FOCO 2026")
      if (scores.barreras < 60) recs.push("IMPLEMENTAR PROGRAMA DE GESTIÓN DEL CAMBIO Y CAPACITACIÓN DE TALENTO")
      if (recs.length === 0) recs.push("ORGANIZACIÓN EN NIVEL DE MADUREZ AVANZADO — LIDERAR ECOSISTEMA DE INNOVACIÓN DEFENSA")
      setReport({ overall, scores, recs })
      setPhase('report')
      setTimeout(() => setBarWidths(scores), 450)
    }, steps.length * 1050 + 600)
  }

  if (phase === 'thinking') return (
    <div style={{ maxWidth: '1050px', width: '100%', margin: '0 auto' }}>
      <Panel label="// ANÁLISIS EN CURSO — CLASIFICADO">
        <div style={{ padding: '54px', fontFamily: FONT, fontSize: '18px' }}>
          <div style={{ display: 'flex', gap: '18px', marginBottom: '45px', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', background: '#FF5F57' }} />
            <div style={{ width: '12px', height: '12px', background: '#FFBD2E' }} />
            <div style={{ width: '12px', height: '12px', background: '#28C840' }} />
            <span style={{ color: TEXT2, marginLeft: '12px', letterSpacing: '3px', fontSize: '15.75px' }}>TERMINAL — AES-256 — ENS-CAT-A</span>
          </div>
          {thinkingLines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '12px', color: i === thinkingLines.length - 1 ? ACCENT : TEXT2, animation: 'fadeIn 0.45s ease' }}>
              <span style={{ color: ACCENT, opacity: 0.5 }}>{'>'}</span>
              <span>{l}</span>
              {i === thinkingLines.length - 1 && <span style={{ color: '#28C840' }}> [OK]</span>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '15px', color: ACCENT }}>
            <span style={{ opacity: 0.5 }}>{'>'}</span>
            <span style={{ animation: 'blink 1.5s infinite' }}>█</span>
          </div>
        </div>
      </Panel>
    </div>
  )

  if (phase === 'report') return (
    <div style={{ maxWidth: '1350px', width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '36px', marginBottom: '24px', alignItems: 'start' }}>
        <Panel label="// INFORME DE CAPACIDAD DIGITAL — CLASIFICADO">
          <div style={{ padding: '45px 36px', display: 'flex', alignItems: 'center', gap: '48px' }}>
            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div style={{ fontFamily: FONT, fontSize: '96px', fontWeight: 400, color: ACCENT, lineHeight: 1, textShadow: `0 0 45px ${ACCENT}44` }}>
                {report.overall}
              </div>
              <div style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '3px', marginTop: '27px' }}>ÍNDICE GLOBAL</div>
            </div>
            <div style={{ borderLeft: `1.5px solid ${BORDER}`, paddingLeft: '48px', flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '3px', marginBottom: '12px' }}>CLASIFICACIÓN OPERATIVA</div>
              <div style={{ fontFamily: FONT, fontSize: '63px', letterSpacing: '3px', color: ACCENT, marginBottom: '12px' }}>
                {report.overall >= 80 ? 'MADUREZ AVANZADA' : report.overall >= 60 ? 'MADUREZ INTERMEDIA' : report.overall >= 40 ? 'EN DESARROLLO' : 'FASE INICIAL'}
              </div>
              <div style={{ fontFamily: FONT, fontSize: '24.75px', color: TEXT2, lineHeight: 1.7 }}>
                {report.overall >= 80
                  ? 'SU ORGANIZACIÓN LIDERA LA TRANSFORMACIÓN DIGITAL EN EL ÁMBITO DE LA DEFENSA NACIONAL.'
                  : report.overall >= 60
                  ? 'POSICIONAMIENTO SÓLIDO. MARGEN DE MEJORA EN VECTORES TECNOLÓGICOS CLAVE.'
                  : 'OPORTUNIDADES ESTRATÉGICAS SIGNIFICATIVAS PARA ACELERAR LA TRANSFORMACIÓN.'}
              </div>
            </div>
          </div>
        </Panel>
        <Panel label="// FOCO 2026">
          <div style={{ padding: '45px 36px', fontFamily: FONT, fontSize: '15.75px', color: TEXT2, letterSpacing: '1.5px', lineHeight: 3.2, minWidth: '240px' }}>
            <div>DATE: 23JUN2026</div>
            <div>LOC: EOI MADRID</div>
            <div>ORG: INNOVADEF</div>
            <div style={{ color: ACCENT }}>STAT: CLASIFICADO</div>
          </div>
        </Panel>
      </div>

      {/* Vectors */}
      <Panel label="// VECTORES DE CAPACIDAD" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '45px 36px' }}>
          {questions.map(q => (
            <div key={q.category} style={{ display: 'grid', gridTemplateColumns: '270px 1fr 72px', gap: '36px', alignItems: 'center', marginBottom: '27px' }}>
              <div style={{ fontFamily: FONT, fontSize: '15.75px', color: TEXT2, letterSpacing: '1.5px' }}>{categoryLabels[q.category]}</div>
              <div style={{ height: '2.25px', background: 'rgba(0,255,65,0.06)', border: `1.5px solid ${BORDER}` }}>
                <div style={{
                  height: '100%',
                  width: `${barWidths[q.category] || 0}%`,
                  background: `${ACCENT}`,
                  boxShadow: `0 0 9px ${ACCENT}55`,
                  transition: 'width 1.8s cubic-bezier(0.4,0,0.2,1)'
                }} />
              </div>
              <div style={{ fontFamily: FONT, fontSize: '19.5px', color: ACCENT, textAlign: 'right', letterSpacing: '1.5px' }}>{report.scores[q.category]}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recommendations */}
      <Panel label="// DIRECTIVAS ESTRATÉGICAS" style={{ marginBottom: '45px' }}>
        <div style={{ padding: '45px 36px' }}>
          {report.recs.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: '21px', marginBottom: '15px', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: FONT, fontSize: '15.75px', color: ACCENT, minWidth: '42px', paddingTop: '3px' }}>[{String(i+1).padStart(2,'0')}]</div>
              <div style={{ fontFamily: FONT, fontSize: '24.75px', color: TEXT2, lineHeight: 1.7, letterSpacing: '0.75px' }}>{rec}</div>
            </div>
          ))}
        </div>
      </Panel>

      <button onClick={() => onComplete({ type: 'capacity', score: report.overall, report })}
        style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center' }}>
        <Mail size={18} /> ENVIAR INFORME AL EMAIL REGISTRADO <ChevronRight size={18} />
      </button>
    </div>
  )

  // Questions phase
  return (
    <div style={{ maxWidth: '1260px', width: '100%', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '9px', marginBottom: '63px' }}>
        {questions.map((q, i) => (
          <div key={i} style={{
            height: '6px',
            background: i < step ? ACCENT : i === step ? `${ACCENT}88` : `${ACCENT}12`,
            transition: 'background 0.45s',
            boxShadow: i <= step ? `0 0 6px ${ACCENT}44` : 'none'
          }} />
        ))}
      </div>
      <Panel label={`// VECTOR ${step + 1}/${questions.length} — EVALUACIÓN EN CURSO`} style={{ marginBottom: '45px' }}>
        <div style={{ padding: '42px 36px 36px' }}>
          <div style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '3px', marginBottom: '24px' }}>
            CATEGORÍA: {categoryLabels[questions[step].category]}
          </div>
          <div style={{ fontFamily: FONT, fontSize: '45px', color: ACCENT, lineHeight: 1.6, letterSpacing: '0.75px', textShadow: `0 0 30px ${ACCENT}22` }}>
            {questions[step].text}
          </div>
        </div>
      </Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '13.5px' }}>
        {questions[step].options.map((opt, i) => (
          <button key={`${step}-${i}`}
            onClick={() => handleAnswer(questions[step].id, opt)}
            style={{
              display: 'flex', alignItems: 'center', gap: '36px',
              padding: '24px 30px', textAlign: 'left', width: '100%',
              background: '#070707',
              border: `1.5px solid ${BORDER}`,
              color: TEXT2, cursor: 'pointer', transition: 'all 0.18s',
              fontFamily: FONT, fontSize: '24.75px', letterSpacing: '1.5px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,170,0,0.05)'
              e.currentTarget.style.borderColor = '#ffaa0066'
              e.currentTarget.style.color = '#ffaa00'
              e.currentTarget.style.boxShadow = `inset 0 0 30px rgba(0,255,65,0.04)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#070707'
              e.currentTarget.style.borderColor = BORDER
              e.currentTarget.style.color = TEXT2
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ color: ACCENT, minWidth: '42px', fontSize: '22.5px' }}>[{String.fromCharCode(65+i)}]</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── EMAIL SCREEN ─────────────────────────────────────────────────────────────

function EmailScreen({ sessionId, onReset }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
      <Panel label="// ENTREGA DE INFORME CLASIFICADO" style={{ marginBottom: '45px' }}>
        <div style={{ padding: '42px 36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '3px', marginBottom: '27px' }}>CÓDIGO QR — ACCESO SEGURO</div>
            <div style={{ background: '#fff', padding: '36px', display: 'inline-block' }}>
              <QRCode value={`https://innovadef.es/?informe=${sessionId}`} size={240} level="H" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '3px', marginBottom: '27px' }}>ENVÍO A EMAIL REGISTRADO</div>
            {!sent ? (
              <>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && email.includes('@') && setSent(true)}
                  placeholder="USUARIO@ORGANIZACION.ES"
                  style={{ width: '100%', padding: '27px', background: '#0a0a0a', border: `1.5px solid ${BORDER}`, color: ACCENT, fontFamily: FONT, fontSize: '24.75px', letterSpacing: '1.5px', outline: 'none', marginBottom: '15px', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <button onClick={() => email.includes('@') && setSent(true)}
                  disabled={!email.includes('@')}
                  style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: email.includes('@') ? 1 : 0.35 }}>
                  <Send size={18} /> TRANSMITIR
                </button>
              </>
            ) : (
              <div style={{ border: `1.5px solid ${ACCENT}44`, padding: '36px', background: 'rgba(0,255,65,0.04)' }}>
                <div style={{ fontFamily: FONT, fontSize: '22.5px', color: ACCENT, letterSpacing: '3px', marginBottom: '9px' }}>TRANSMISIÓN EXITOSA</div>
                <div style={{ fontFamily: FONT, fontSize: '24.75px', color: TEXT2 }}>DEST: {email.toUpperCase()}</div>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <button onClick={onReset} style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', fontFamily: FONT, fontSize: '22.5px', letterSpacing: '3px', textTransform: 'uppercase', display: 'block', margin: '0 auto' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ffaa00'}
        onMouseLeave={e => e.currentTarget.style.color = TEXT2}>
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
    if (bootStage > prevStage.current) {
      if (bootStage === 1) sfxBootHeader()
      if (bootStage === 3) setTimeout(() => sfxHudScan(), 75)
      if (bootStage === 3) MODULES.forEach((_, i) => setTimeout(() => sfxCardAppear(), 720 + i * 150))
      prevStage.current = bootStage
    }
  }, [bootStage])

  // SFX: radar ping every ~6s
  useEffect(() => {
    const i = setInterval(() => sfxRadarPing(), 6300)
    return () => clearInterval(i)
  }, [])

  // Each element gets its own visibility threshold based on bootStage
  const vis = (minStage, delay = 0) => ({
    opacity: bootStage >= minStage ? 1 : 0,
    transform: bootStage >= minStage ? 'translateY(0) scaleY(1)' : 'translateY(-18px) scaleY(0.92)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.67s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    transformOrigin: 'top',
  })

  return (
    <div style={{ maxWidth: '1800px', width: '100%', margin: '0 auto' }}>

      {/* HUD scan line sweeps screen on entry */}
      <HudScanLine active={bootStage === 3} />

      {/* System header panels — staggered */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '72px' }}>
        {[
          { label: '// SISTEMA', content: (
            <div style={{ padding: '31.5px 36px', fontFamily: FONT, fontSize: '22.5px', lineHeight: 3, color: TEXT2 }}>
              <div>PLATFORM: <span style={{ color: ACCENT }}>INNOVADEF-KIOSK v2.0</span></div>
              <div>OPERATOR: <span style={{ color: ACCENT }}>FOCO-2026-OPERATOR</span></div>
              <div>LOCATION: <span style={{ color: AMBER }}>EOI MADRID // 40°25'N 3°41'W</span></div>
            </div>
          )},
          { label: '// ESTADO DE SISTEMAS', content: (
            <div style={{ padding: '31.5px 36px', fontFamily: FONT, fontSize: '22.5px', lineHeight: 3 }}>
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
            <div style={{ padding: '31.5px 36px', fontFamily: FONT, fontSize: '22.5px', lineHeight: 3, color: TEXT2 }}>
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
      <div style={{ marginBottom: '63px', borderBottom: `1.5px solid ${BORDER}`, paddingBottom: '30px', ...vis(3, 540) }}>
        <div style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '4.01px', marginBottom: '27px' }}>
          // SISTEMA DE EVALUACIÓN INTERACTIVA — SELECCIONE MÓDULO DE OPERACIÓN
        </div>
        <div style={{ fontFamily: FONT, fontSize: '33px', letterSpacing: '5px', color: ACCENT, textShadow: `0 0 60px ${ACCENT}33`, lineHeight: 1.1 }}>
          CENTRO DE OPERACIONES<br />
          <span style={{ color: TEXT2, fontSize: '65%' }}>INNOVADEF FOCO 2026 — MADRID</span>
        </div>
      </div>

      {/* Module grid — each card staggers in */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(465px, 1fr))', gap: '18px', marginBottom: '72px' }}>
        {MODULES.map((mod, idx) => {
          const Icon = mod.icon
          const isH = hovered === mod.id
          const cardDelay = 720 + idx * 150
          return (
            <div key={mod.id} style={{ ...vis(3, cardDelay) }}>
              <button
                onClick={() => { sfxModuleSelect(); onSelect(mod.id) }}
                onMouseEnter={() => { sfxHover(); setHovered(mod.id) }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', flexDirection: 'column', padding: '0', width: '100%',
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
                  padding: '12px 21px',
                  borderBottom: `1.5px solid ${isH ? `#ffaa0033` : BORDER}`,
                  background: isH ? 'rgba(255,170,0,0.04)' : '#0a0a0a'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Icon size={21} color={isH ? '#ffaa00' : TEXT2} />
                    <span style={{ fontFamily: FONT, fontSize: '20.25px', color: TEXT2, letterSpacing: '3px' }}>{mod.code}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <span style={{ fontFamily: FONT, fontSize: '18px', letterSpacing: '3px', color: isH ? '#ffaa00' : TEXT2, padding: '3px 9px', border: `1.5px solid ${isH ? `#ffaa0044` : BORDER}` }}>
                      {mod.tag}
                    </span>
                    <span style={{ width: '9px', height: '9px', background: isH ? '#ffaa00' : ACCENT, display: 'inline-block', boxShadow: isH ? `0 0 12px #ffaa00` : `0 0 12px ${ACCENT}`, animation: 'blink 3s infinite' }} />
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '24px 21px' }}>
                  <div style={{ fontFamily: FONT, fontSize: '19.5px', letterSpacing: '1.5px', color: isH ? '#ffaa00' : TEXT2, marginBottom: '15px', lineHeight: 1.3 }}>
                    {mod.label}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: '22.5px', color: 'rgba(0,255,65,0.3)', lineHeight: 1.7, letterSpacing: '0.75px', marginBottom: '21px' }}>
                    {mod.desc}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: FONT, fontSize: '20.25px', color: 'rgba(0,255,65,0.25)', letterSpacing: '1.5px' }}>DURACIÓN: {mod.duration}</span>
                    <span style={{ fontFamily: FONT, fontSize: '22.5px', color: isH ? '#ffaa00' : TEXT2, letterSpacing: '1.5px' }}>{isH ? '[EJECUTAR ▶]' : '[──────]'}</span>
                  </div>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ fontFamily: FONT, fontSize: '20.25px', color: 'rgba(0,255,65,0.18)', letterSpacing: '3px', textAlign: 'center', ...vis(3, 1500) }}>
        INNOVADEF FOCO 2026 // 23.06.2026 // EOI MADRID // SISTEMA CERTIFICADO ENS-CAT-A
      </div>
    </div>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── MODULE TRANSITION FLASH ─────────────────────────────────────────────────
function ModuleTransition({ active, onDone }) {
  useEffect(() => {
    if (active) {
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
  const [screen, setScreen] = useState('sleep')
  const [activeModule, setActiveModule] = useState(null)
  const [moduleResult, setModuleResult] = useState(null)
  const [sessionId] = useState(() => `FOCO-${Date.now().toString(36).toUpperCase()}`)
  const [booting, setBooting] = useState(false)
  const [bootStage, setBootStage] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingModule, setPendingModule] = useState(null)
  const { overlay, go } = useScreenTransition(750)

  // Sync screen with URL
  useEffect(() => {
    const path = location.pathname
    if (path === '/') setScreen('sleep')
    else if (path === '/intro') setScreen('intro')
    else if (path === '/selector') setScreen('selector')
    else if (path === '/email') setScreen('email')
    else if (path.startsWith('/module/')) setScreen('module')
  }, [location.pathname])

  // Sync URL with screen
  useEffect(() => {
    if (screen === 'sleep') navigate('/', { replace: true })
    else if (screen === 'intro') navigate('/intro', { replace: true })
    else if (screen === 'selector') navigate('/selector', { replace: true })
    else if (screen === 'module' && activeModule) navigate(`/module/${activeModule}`, { replace: true })
    else if (screen === 'email') navigate('/email', { replace: true })
  }, [screen, activeModule, navigate])

  // Ambient background sound
  useEffect(() => {
    if (screen !== 'sleep') {
      startAmbient()
    } else {
      stopAmbient()
    }
    return () => stopAmbient()
  }, [screen])

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
    setActiveModule(pendingModule)
    setScreen('module')
    setTransitioning(false)
    setPendingModule(null)
  }

  const handleComplete = (result) => {
    go(() => { setModuleResult(result); setScreen('email') })
  }
  const reset = () => {
    sfxReset()
    go(() => { setScreen('selector'); setActiveModule(null); setModuleResult(null) })
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
        height: '117px',
        background: 'rgba(5,5,5,0.96)',
        borderBottom: `1.5px solid ${BORDER}`,
        display: 'flex', alignItems: 'stretch',
        transform: bootStage < 1 ? 'translateY(-150%)' : 'translateY(0)',
        opacity: bootStage < 1 ? 0 : 1,
        transition: 'transform 0.67s cubic-bezier(0.22,1,0.36,1), opacity 0.52s ease',
      }}>
        {/* Logo block */}
        <button onClick={reset} style={{
          background: 'none', border: 'none', borderRight: `1.5px solid ${BORDER}`,
          padding: '0 54px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '27px'
        }}>
          <img src="/logoinnovadef.png" alt="INNOVADEF" style={{ height: '120px'}} />
        </button>

        {/* Nav items */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 45px', gap: '0' }}>
          {[
            { label: 'CENTRO OPS', active: screen === 'selector', action: reset },
            { label: activeModCode || '—', active: screen === 'module', action: null },
          ].map((nav, i) => (
            <div key={i} style={{
              padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center',
              borderRight: `1.5px solid ${BORDER}`,
              fontFamily: FONT, fontSize: '22.5px', letterSpacing: '3px',
              color: nav.active ? ACCENT : TEXT2,
              borderBottom: nav.active ? `3px solid ${ACCENT}` : '3px solid transparent',
              cursor: nav.action ? 'pointer' : 'default',
              background: nav.active ? 'rgba(0,255,65,0.03)' : 'transparent'
            }} onClick={nav.action}>
              {nav.label}
            </div>
          ))}
        </div>

        {/* Right indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', borderLeft: `1.5px solid ${BORDER}` }}>
          {[
            { label: 'SYS', val: 'OK', c: ACCENT },
            { label: 'NET', val: 'ENS', c: ACCENT },
            { label: 'SEC', val: 'A', c: ACCENT },
          ].map((ind, i) => (
            <div key={i} style={{ padding: '0 31.5px', borderRight: `1.5px solid ${BORDER}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4.5px' }}>
              <div style={{ fontFamily: FONT, fontSize: '18px', color: TEXT2, letterSpacing: '1.5px' }}>{ind.label}</div>
              <div style={{ fontFamily: FONT, fontSize: '22.5px', color: ind.c, letterSpacing: '1.5px' }}>{ind.val}</div>
            </div>
          ))}
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4.5px' }}>
            <div style={{ fontFamily: FONT, fontSize: '18px', color: TEXT2, letterSpacing: '1.5px' }}>HORA LOCAL</div>
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: '78px', paddingBottom: '48px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 48px 72px' }}>
        {screen === 'selector' && <ModuleSelector onSelect={selectModule} bootStage={bootStage} />}
        {screen === 'module' && (
          <>
            {activeModule === 'capacity' && <CapacityTest onComplete={handleComplete} />}
            {activeModule === 'tactical' && <TacticalSimulator onComplete={handleComplete} />}
            {activeModule === 'radar' && <MaturityRadar onComplete={handleComplete} />}
            {activeModule === 'threats' && <ThreatClassifier onComplete={handleComplete} />}
            {activeModule === 'pulse' && <PulseSurvey onComplete={handleComplete} />}
          </>
        )}
        {screen === 'email' && <EmailScreen sessionId={sessionId} onReset={reset} />}
      </div>

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
