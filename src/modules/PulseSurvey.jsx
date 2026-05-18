import { useState, useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { S, ACCENT, AMBER, DIM, BORDER, CARD, TEXT, TEXT2, FONT } from '../theme'

// Simulated aggregate results (would come from backend in production)
const mockAggregates = {
  q1: [12, 28, 35, 25],
  q2: [8, 22, 42, 28],
  q3: [5, 18, 38, 39],
  q4: [15, 30, 32, 23],
  q5: [6, 24, 44, 26],
  q6: [11, 19, 37, 33],
  q7: [20, 35, 28, 17],
  q8: [9, 27, 40, 24],
  q9: [7, 21, 43, 29],
  q10: [14, 32, 34, 20],
}

const pulseQuestions = [
  {
    id: 'q1', text: '¿Cómo valora la relevancia de los temas abordados en INNOVADEF FOCO 2026?',
    options: ['Poco relevante', 'Relevante', 'Muy relevante', 'Imprescindible para mi organización']
  },
  {
    id: 'q2', text: '¿En qué medida la IA generativa será adoptada en su organización en los próximos 2 años?',
    options: ['Sin planes', 'En estudio', 'Proyectos planificados', 'Ya en implementación']
  },
  {
    id: 'q3', text: '¿Considera que la certificación ENS Categoría Alta es una barrera o un habilitador?',
    options: ['Barrera burocrática', 'Barrera pero necesaria', 'Habilitador con complejidad', 'Habilitador estratégico']
  },
  {
    id: 'q4', text: '¿Cuál es el mayor reto de la transformación digital en Defensa?',
    options: ['Presupuesto', 'Talento y capacitación', 'Marco regulatorio', 'Cultura organizacional']
  },
  {
    id: 'q5', text: '¿En qué plazo su organización estará en cloud certificado?',
    options: ['Ya está', 'Menos de 1 año', '1-3 años', 'Más de 3 años']
  },
  {
    id: 'q6', text: '¿Cómo califica el nivel de madurez actual de la enseñanza militar en transformación digital?',
    options: ['Inicial', 'En desarrollo', 'Avanzado', 'Referente nacional']
  },
  {
    id: 'q7', text: '¿Invertiría más presupuesto en simulación avanzada para formación?',
    options: ['No es prioritario', 'A largo plazo', 'En los próximos 2 años', 'Es una prioridad inmediata']
  },
  {
    id: 'q8', text: '¿La soberanía del dato es una prioridad estratégica en su organización?',
    options: ['No aún', 'Estamos tomando conciencia', 'Sí, tenemos proyectos', 'Sí, es una línea roja']
  },
  {
    id: 'q9', text: '¿Recomendaría INNOVADEF a otros responsables de Defensa?',
    options: ['No especialmente', 'Con reservas', 'Sí, de valor', 'Absolutamente, imprescindible']
  },
  {
    id: 'q10', text: '¿Cuál de las 4 mesas de trabajo de hoy ha sido más útil para usted?',
    options: ['Mesa 1 · Transformación Digital', 'Mesa 2 · IA aplicada', 'Mesa 3 · GICEN', 'Mesa 4 · Cloud & Infraestructura']
  },
]

function ResultBar({ label, count, total, isUser }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const [width, setWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 100); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ marginBottom: '12px', fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '15px', color: isUser ? ACCENT : TEXT2, letterSpacing: '0.5px' }}>{isUser ? '[YOU] ' : '[     ] '}{label.toUpperCase()}</span>
        <span style={{ fontSize: '15px', color: isUser ? ACCENT : TEXT2 }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(0,255,65,0.06)', border: `1px solid rgba(0,255,65,0.08)` }}>
        <div style={{ height: '100%', background: isUser ? ACCENT : 'rgba(0,255,65,0.25)', width: `${width}%`, transition: 'width 0.8s ease', boxShadow: isUser ? `0 0 4px ${ACCENT}66` : 'none' }} />
      </div>
    </div>
  )
}

export default function PulseSurvey({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('survey') // survey | results
  const [totalRespondents] = useState(47 + Math.floor(Math.random() * 12))
  const [transitioning, setTransitioning] = useState(false)

  const q = pulseQuestions[step]

  const handleAnswer = (optionIndex) => {
    const updated = { ...answers, [q.id]: optionIndex }
    setAnswers(updated)
    if (step < pulseQuestions.length - 1) {
      setTransitioning(true)
      setTimeout(() => {
        setStep(s => s + 1)
        setTransitioning(false)
      }, 400)
    } else {
      setPhase('results')
    }
  }

  const getAggregate = (qId, optionIndex) => {
    const base = mockAggregates[qId][optionIndex]
    const isUserChoice = answers[qId] === optionIndex
    return isUserChoice ? base + 1 : base
  }

  const getTotal = (qId) => {
    const userAnswer = answers[qId]
    const base = mockAggregates[qId].reduce((a, b) => a + b, 0)
    return userAnswer !== undefined ? base + 1 : base
  }

  return (
    <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto' }}>

      {phase === 'survey' && (
        <div style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: FONT }}>
              <span style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px' }}>PULSO FOCO 2026 — PREGUNTA {step + 1}/{pulseQuestions.length}</span>
              <span style={{ fontSize: '9px', color: ACCENT, letterSpacing: '2px' }}>{Math.round((step / pulseQuestions.length) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {pulseQuestions.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '3px', background: i < step ? ACCENT : i === step ? `${ACCENT}88` : `${ACCENT}12`, boxShadow: i === step ? `0 0 4px ${ACCENT}` : 'none' }} />
              ))}
            </div>
          </div>

          <div style={{ ...CARD, marginBottom: '30px', borderLeft: `2px solid ${ACCENT}44` }}>
            <div style={{ fontFamily: FONT, fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '10px' }}>// CONSULTA</div>
            <p style={{ fontFamily: FONT, fontSize: '15px', lineHeight: 1.7, color: ACCENT, margin: 0, letterSpacing: '0.3px' }}>{q.text.toUpperCase()}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {q.options.map((option, i) => (
              <button key={i} onClick={() => handleAnswer(i)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', textAlign: 'left', width: '100%', background: '#070707', border: `1px solid ${BORDER}`, color: TEXT2, cursor: 'pointer', transition: 'all 0.12s', fontFamily: FONT, fontSize: '11px', letterSpacing: '0.5px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffaa0055'; e.currentTarget.style.background = 'rgba(255,170,0,0.04)'; e.currentTarget.style.color = '#ffaa00' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#070707'; e.currentTarget.style.color = TEXT2 }}
              >
                <span style={{ color: ACCENT, minWidth: '24px', fontSize: '15px' }}>[{String.fromCharCode(65+i)}]</span>
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div>
          <div style={{ fontFamily: FONT, fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '12px' }}>// RESULTADOS EN TIEMPO REAL — {totalRespondents + 1} RESPUESTAS REGISTRADAS</div>
          <div style={{ fontFamily: FONT, fontSize: 'clamp(18px, 3.75vw, 26px)', letterSpacing: '3px', color: ACCENT, marginBottom: '12px', textTransform: 'uppercase' }}>PULSO DEL EVENTO</div>
          <div style={{ fontFamily: FONT, fontSize: '15px', color: TEXT2, marginBottom: '28px', letterSpacing: '1px', lineHeight: 1.7 }}>
            SUS RESPUESTAS HAN SIDO INCORPORADAS AL AGREGADO DE {totalRespondents} ASISTENTES.<br/>
            SU POSICIÓN APARECE MARCADA CON [YOU].
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
            {pulseQuestions.slice(0, 6).map(q => {
              const total = getTotal(q.id)
              return (
                <div key={q.id} style={{ ...CARD }}>
                  <div style={{ fontFamily: FONT, fontSize: '15px', color: TEXT2, marginBottom: '18px', lineHeight: 1.6, letterSpacing: '0.5px' }}>{q.text.toUpperCase()}</div>
                  {q.options.map((opt, i) => (
                    <ResultBar key={i} label={opt} count={getAggregate(q.id, i)} total={total} isUser={answers[q.id] === i} />
                  ))}
                </div>
              )
            })}
          </div>

          <button onClick={() => onComplete({ type: 'pulse', answers, respondents: totalRespondents + 1 })} style={S.btnPrimary}>
            CONTINUAR AL INFORME <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
