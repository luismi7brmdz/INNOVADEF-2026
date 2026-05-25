import { useState } from 'react'
import { Mail, ChevronRight } from 'lucide-react'
import { ACCENT, AMBER, BORDER, TEXT2, FONT, S } from '../theme'

// ─── DATA ────────────────────────────────────────────────────────────────────

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

// ─── PANEL ────────────────────────────────────────────────────────────────────

function Panel({ label, children, style = {} }) {
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, background: '#070707', position: 'relative', ...style }}>
      {label && (
        <div style={{
          position: 'absolute', top: -1.5, left: 0,
          padding: '6px 1.67vmin', background: '#070707',
          borderBottom: `1.5px solid ${BORDER}`, borderRight: `1.5px solid ${BORDER}`,
          fontSize: 'clamp(12px, 1.88vmin, 9999px)', letterSpacing: '3px', color: TEXT2, fontFamily: FONT, textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}
      <div style={{ paddingTop: label ? '3.89vmin' : '0' }}>{children}</div>
    </div>
  )
}

// ─── CAPACITY TEST ────────────────────────────────────────────────────────────

export default function CapacityTest({ onComplete }) {
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
        <div style={{ padding: '5vmin', fontFamily: FONT, fontSize: 'clamp(11px, 1.67vmin, 9999px)' }}>
          <div style={{ display: 'flex', gap: '1.67vmin', marginBottom: '4.17vmin', alignItems: 'center' }}>
            <div style={{ width: '1.11vmin', height: '1.11vmin', background: '#FF5F57' }} />
            <div style={{ width: '1.11vmin', height: '1.11vmin', background: '#FFBD2E' }} />
            <div style={{ width: '1.11vmin', height: '1.11vmin', background: '#28C840' }} />
            <span style={{ color: TEXT2, marginLeft: '1.11vmin', letterSpacing: '3px', fontSize: 'clamp(10px, 1.46vmin, 9999px)' }}>TERMINAL — AES-256 — ENS-CAT-A</span>
          </div>
          {thinkingLines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.39vmin', marginBottom: '1.11vmin', color: i === thinkingLines.length - 1 ? ACCENT : TEXT2, animation: 'fadeIn 0.45s ease' }}>
              <span style={{ color: ACCENT, opacity: 0.5 }}>{'>'}</span>
              <span>{l}</span>
              {i === thinkingLines.length - 1 && <span style={{ color: '#28C840' }}> [OK]</span>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '1.39vmin', color: ACCENT }}>
            <span style={{ opacity: 0.5 }}>{'>'}</span>
            <span style={{ animation: 'blink 1.5s infinite' }}>█</span>
          </div>
        </div>
      </Panel>
    </div>
  )

  if (phase === 'report') return (
    <div style={{ maxWidth: '1350px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3.33vmin', marginBottom: '2.22vmin', alignItems: 'start' }}>
        <Panel label="// INFORME DE CAPACIDAD DIGITAL — CLASIFICADO">
          <div style={{ padding: '4.17vmin 3.33vmin', display: 'flex', alignItems: 'center', gap: '4.44vmin' }}>
            <div style={{ textAlign: 'center', minWidth: '13.89vmin' }}>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(58px, 8.89vmin, 9999px)', fontWeight: 400, color: ACCENT, lineHeight: 1, textShadow: `0 0 4.17vmin ${ACCENT}44` }}>
                {report.overall}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 1.88vmin, 9999px)', color: TEXT2, letterSpacing: '3px', marginTop: '2.5vmin' }}>ÍNDICE GLOBAL</div>
            </div>
            <div style={{ borderLeft: `1.5px solid ${BORDER}`, paddingLeft: '4.44vmin', flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 1.88vmin, 9999px)', color: TEXT2, letterSpacing: '3px', marginBottom: '1.11vmin' }}>CLASIFICACIÓN OPERATIVA</div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(38px, 5.83vmin, 9999px)', letterSpacing: '3px', color: ACCENT, marginBottom: '1.11vmin' }}>
                {report.overall >= 80 ? 'MADUREZ AVANZADA' : report.overall >= 60 ? 'MADUREZ INTERMEDIA' : report.overall >= 40 ? 'EN DESARROLLO' : 'FASE INICIAL'}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2.29vmin, 9999px)', color: TEXT2, lineHeight: 1.7 }}>
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
          <div style={{ padding: '4.17vmin 3.33vmin', fontFamily: FONT, fontSize: 'clamp(10px, 1.46vmin, 9999px)', color: TEXT2, letterSpacing: '1.5px', lineHeight: 3.2, minWidth: '22.22vmin' }}>
            <div>DATE: 23JUN2026</div>
            <div>LOC: EOI MADRID</div>
            <div>ORG: INNOVADEF</div>
            <div style={{ color: ACCENT }}>STAT: CLASIFICADO</div>
          </div>
        </Panel>
      </div>

      <Panel label="// VECTORES DE CAPACIDAD" style={{ marginBottom: '2.22vmin' }}>
        <div style={{ padding: '4.17vmin 3.33vmin' }}>
          {questions.map(q => (
            <div key={q.category} style={{ display: 'grid', gridTemplateColumns: '25vmin 1fr 6.67vmin', gap: '3.33vmin', alignItems: 'center', marginBottom: '2.5vmin' }}>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(10px, 1.46vmin, 9999px)', color: TEXT2, letterSpacing: '1.5px' }}>{categoryLabels[q.category]}</div>
              <div style={{ height: '2.25px', background: 'rgba(0,255,65,0.06)', border: `1.5px solid ${BORDER}` }}>
                <div style={{
                  height: '100%',
                  width: `${barWidths[q.category] || 0}%`,
                  background: `${ACCENT}`,
                  boxShadow: `0 0 0.83vmin ${ACCENT}55`,
                  transition: 'width 1.8s cubic-bezier(0.4,0,0.2,1)'
                }} />
              </div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 1.81vmin, 9999px)', color: ACCENT, textAlign: 'right', letterSpacing: '1.5px' }}>{report.scores[q.category]}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel label="// DIRECTIVAS ESTRATÉGICAS" style={{ marginBottom: '4.17vmin' }}>
        <div style={{ padding: '4.17vmin 3.33vmin' }}>
          {report.recs.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.94vmin', marginBottom: '1.39vmin', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(10px, 1.46vmin, 9999px)', color: ACCENT, minWidth: '3.89vmin', paddingTop: '3px' }}>[{String(i+1).padStart(2,'0')}]</div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2.29vmin, 9999px)', color: TEXT2, lineHeight: 1.7, letterSpacing: '0.75px' }}>{rec}</div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.83vmin', marginBottom: '5.83vmin' }}>
        {questions.map((q, i) => (
          <div key={i} style={{
            height: '6px',
            background: i < step ? ACCENT : i === step ? `${ACCENT}88` : `${ACCENT}12`,
            transition: 'background 0.45s',
            boxShadow: i <= step ? `0 0 6px ${ACCENT}44` : 'none'
          }} />
        ))}
      </div>
      <Panel label={`// VECTOR ${step + 1}/${questions.length} — EVALUACIÓN EN CURSO`} style={{ marginBottom: '4.17vmin' }}>
        <div style={{ padding: '3.89vmin 3.33vmin 3.33vmin' }}>
          <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 1.88vmin, 9999px)', color: TEXT2, letterSpacing: '3px', marginBottom: '2.22vmin' }}>
            CATEGORÍA: {categoryLabels[questions[step].category]}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 'clamp(27px, 4.17vmin, 9999px)', color: ACCENT, lineHeight: 1.6, letterSpacing: '0.75px', textShadow: `0 0 2.78vmin ${ACCENT}22` }}>
            {questions[step].text}
          </div>
        </div>
      </Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25vmin' }}>
        {questions[step].options.map((opt, i) => (
          <button key={`${step}-${i}`}
            onClick={() => handleAnswer(questions[step].id, opt)}
            style={{
              display: 'flex', alignItems: 'center', gap: '3.33vmin',
              padding: '2.22vmin 2.78vmin', textAlign: 'left', width: '100%',
              background: '#070707', border: `1.5px solid ${BORDER}`,
              color: TEXT2, cursor: 'pointer', transition: 'all 0.18s',
              fontFamily: FONT, fontSize: 'clamp(15px, 2.29vmin, 9999px)', letterSpacing: '1.5px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,170,0,0.05)'
              e.currentTarget.style.borderColor = '#ffaa0066'
              e.currentTarget.style.color = '#ffaa00'
              e.currentTarget.style.boxShadow = `inset 0 0 2.78vmin rgba(0,255,65,0.04)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#070707'
              e.currentTarget.style.borderColor = BORDER
              e.currentTarget.style.color = TEXT2
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ color: ACCENT, minWidth: '3.89vmin', fontSize: 'clamp(14px, 2.08vmin, 9999px)' }}>[{String.fromCharCode(65+i)}]</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}