import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { S, ACCENT, ACCENT2, AMBER, RED, DIM, BORDER, CARD, TEXT, TEXT2, FONT } from '../theme'

const axes = [
  { key: 'ia', label: 'IA & Machine Learning', angle: -90, color: '#00c853' },
  { key: 'cloud', label: 'Cloud Soberano', angle: -30, color: '#0099ff' },
  { key: 'sim', label: 'Simulación & XR', angle: 30, color: '#aa44ff' },
  { key: 'cyber', label: 'Ciberseguridad', angle: 90, color: '#ff4444' },
  { key: 'talento', label: 'Talento Digital', angle: 150, color: '#ffaa00' },
  { key: 'dato', label: 'Soberanía del Dato', angle: 210, color: '#00ddbb' },
]

const questions = [
  { axis: 'ia', text: '¿En qué nivel sitúa a su organización en el uso de Inteligencia Artificial aplicada a la formación y operaciones?', labels: ['Sin iniciativas', 'Explorando', 'Pilotos activos', 'En producción', 'Liderazgo sectorial'] },
  { axis: 'cloud', text: '¿Cómo describiría su madurez en infraestructuras cloud con certificación ENS?', labels: ['Sin adopción', 'Evaluando opciones', 'Proyecto en curso', 'ENS operativo', 'Multi-cloud soberano'] },
  { axis: 'sim', text: '¿Qué nivel de integración tiene la simulación y realidad extendida en su modelo formativo?', labels: ['Sin uso', 'Equipamiento básico', 'Casos de uso aislados', 'Integración parcial', 'Ecosistema completo'] },
  { axis: 'cyber', text: '¿Cómo valora la madurez en ciberseguridad y resiliencia digital de su organización?', labels: ['Reactiva', 'Básica', 'Definida', 'Gestionada', 'Optimizada'] },
  { axis: 'talento', text: '¿Cuál es el nivel de capacitación digital del personal en tecnologías emergentes?', labels: ['Sin formación', 'Formación básica', 'Programas en curso', 'Alta capacitación', 'Centro de excelencia'] },
  { axis: 'dato', text: '¿Qué nivel de control ejerce sobre la soberanía y gobernanza del dato institucional?', labels: ['Sin estrategia', 'En análisis', 'Parcial', 'Controlado', 'Soberanía total'] },
]

function RadarChart({ values, size = 320 }) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.38
  const levels = 5

  const toXY = (angle, r) => {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const bgPolygons = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1)
    return axes.map(a => {
      const p = toXY(a.angle, r)
      return `${p.x},${p.y}`
    }).join(' ')
  })

  const dataPolygon = axes.map(a => {
    const val = values[a.key] ?? 0
    const r = (val / 4) * maxR
    const p = toXY(a.angle, r)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg width={size} height={size}>
      {/* Grid polygons */}
      {bgPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(0,255,65,0.08)" strokeWidth="0.5" />
      ))}

      {/* Axis lines */}
      {axes.map(a => {
        const p = toXY(a.angle, maxR)
        return <line key={a.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,255,65,0.1)" strokeWidth="0.5" />
      })}

      {/* Data area */}
      <polygon
        points={dataPolygon}
        fill="rgba(0,255,65,0.06)"
        stroke={ACCENT}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {axes.map(a => {
        const val = values[a.key] ?? 0
        const r = (val / 4) * maxR
        const p = toXY(a.angle, r)
        return (
          <g key={a.key}>
            <circle cx={p.x} cy={p.y} r="4" fill={a.color} opacity="0.9" />
            <circle cx={p.x} cy={p.y} r="8" fill={a.color} opacity="0.15" />
          </g>
        )
      })}

      {/* Labels */}
      {axes.map(a => {
        const p = toXY(a.angle, maxR + 28)
        return (
          <text key={a.key} x={p.x} y={p.y} textAnchor="middle" fontSize="9" fill={a.color} fontFamily="'Share Tech Mono', monospace" letterSpacing="1" opacity="0.7">
            {a.label.toUpperCase()}
          </text>
        )
      })}
    </svg>
  )
}

export default function MaturityRadar({ onComplete }) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({})
  const [phase, setPhase] = useState('questions') // questions | result
  const [transitioning, setTransitioning] = useState(false)

  const q = questions[step]

  const handleSelect = (val) => {
    const updated = { ...values, [q.axis]: val }
    setValues(updated)
    if (step < questions.length - 1) {
      setTransitioning(true)
      setTimeout(() => {
        setStep(s => s + 1)
        setTransitioning(false)
      }, 400)
    } else {
      setPhase('result')
    }
  }

  const overallScore = Object.keys(values).length
    ? Math.round((Object.values(values).reduce((a, b) => a + b, 0) / (Object.keys(values).length * 4)) * 100)
    : 0

  return (
    <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
      {phase === 'questions' && (
        <div style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}>
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontFamily: FONT }}>
              <span style={{ fontSize: '13px', color: TEXT2, letterSpacing: '3px' }}>EJE {step + 1}/{questions.length} — {axes.find(a => a.key === q.axis)?.label.toUpperCase()}</span>
              <span style={{ fontSize: '13px', color: ACCENT, letterSpacing: '2px' }}>{Math.round((step / questions.length) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {questions.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '3px', background: i < step ? ACCENT : i === step ? `${ACCENT}88` : `${ACCENT}12`, boxShadow: i === step ? `0 0 4px ${ACCENT}` : 'none' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
            {/* Radar live */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart values={values} size={450} />
            </div>

            {/* Question */}
            <div>
              <div style={{ fontFamily: FONT, fontSize: '13px', color: TEXT2, letterSpacing: '3px', marginBottom: '10px' }}>// {axes.find(a => a.key === q.axis)?.label.toUpperCase()}</div>
              <p style={{ fontFamily: FONT, fontSize: '24px', lineHeight: 1.7, color: ACCENT, marginBottom: '30px', letterSpacing: '0.3px' }}>{q.text.toUpperCase()}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {q.labels.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '36px',
                      padding: '20px 18px', textAlign: 'left', width: '100%',
                      background: '#070707', border: `1px solid ${BORDER}`,
                      color: TEXT2, cursor: 'pointer', transition: 'all 0.18s',
                      fontFamily: FONT, fontSize: '15px', letterSpacing: '0.5px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffaa0055'; e.currentTarget.style.background = 'rgba(255,170,0,0.04)'; e.currentTarget.style.color = '#ffaa00' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#070707'; e.currentTarget.style.color = TEXT2 }}
                  >
                    <span style={{ color: ACCENT, minWidth: '28px', fontSize: '18px' }}>[{i}]</span>
                    {label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div>
          <div style={{ fontFamily: FONT, fontSize: '13px', color: TEXT2, letterSpacing: '3px', marginBottom: '18px' }}>// RADAR DE MADUREZ — RESULTADO</div>
          <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 2.5vw, 17.33px)', letterSpacing: '3px', color: ACCENT, marginBottom: '18px', textTransform: 'uppercase' }}>MAPA DE CAPACIDAD DIGITAL</div>
          <div style={{ fontFamily: FONT, fontSize: '15px', color: TEXT2, marginBottom: '72px', letterSpacing: '1px' }}>ÍNDICE GLOBAL DE MADUREZ: <span style={{ color: ACCENT }}>{overallScore}%</span></div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
            <RadarChart values={values} size={570} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '36px' }}>
            {axes.map(a => {
              const val = values[a.key] ?? 0
              const pct = Math.round((val / 4) * 100)
              return (
                <div key={a.key} style={{ ...CARD, padding: '12px 18px', fontFamily: FONT }}>
                  <div style={{ fontSize: '13px', color: TEXT2, letterSpacing: '2px', marginBottom: '12px' }}>{a.label.toUpperCase()}</div>
                  <div style={{ height: '3px', background: `${ACCENT}0d`, border: `1px solid ${ACCENT}18`, marginBottom: '6px' }}>
                    <div style={{ height: '100%', background: ACCENT, width: `${pct}%`, transition: 'width 1.5s ease', boxShadow: `0 0 4px ${ACCENT}44` }} />
                  </div>
                  <div style={{ fontSize: '27px', color: ACCENT }}>{pct}%</div>
                </div>
              )
            })}
          </div>

          <button onClick={() => onComplete({ type: 'radar', score: overallScore, values })} style={S.btnPrimary}>
            CONTINUAR AL INFORME <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
