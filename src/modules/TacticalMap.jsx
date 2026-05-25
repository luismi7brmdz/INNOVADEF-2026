import { useState, useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { ACCENT, AMBER, RED, BORDER, CARD, TEXT2, FONT, S } from '../theme'

// ─── SCENARIO DATA ────────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 1, code: 'INCIDENTE ALFA',
    title: 'CONTACTO AÉREO NO IDENTIFICADO',
    sitrep: [
      '09:47Z — RADAR DETECTA CONTACTO NO IDENTIFICADO EN SECTOR NW',
      'GRID 4423-N · ALTITUD 50m · VELOCIDAD 65 KM/H',
      'PERFIL: POSIBLE UAV ENEMIGO · NO RESPONDE A INTERROGACIÓN IFF',
      'DISTANCIA AL PC: 42 KM · ETA ESTIMADO: 38 MIN',
    ],
    threat: { x: 15, y: 18, label: 'UAV-NI', col: AMBER, shape: 'aerial' },
    order: 'CONTACTO NO IDENTIFICADO EN SECTOR NW — ORDENE SU RESPUESTA:',
    opts: [
      { id: 'a', label: 'ALERTAR MANDO REGIONAL', desc: 'Escalar inmediatamente al mando superior para gestión estratégica', pts: 60, level: 'good' },
      { id: 'b', label: 'IDENTIFICAR Y CLASIFICAR', desc: 'Activar protocolos IFF y solicitar identificación visual antes de escalar', pts: 100, level: 'optimal' },
      { id: 'c', label: 'INTERCEPTACIÓN INMEDIATA', desc: 'Lanzar medios aéreos sin completar los protocolos de identificación', pts: 20, level: 'risky' },
      { id: 'd', label: 'CONTINUAR SIN ACCIÓN', desc: 'Mantener la misión asumiendo que es aeronave amiga no declarada', pts: 0, level: 'wrong' },
    ],
    fb: {
      a: 'Correcto elevar a cadena de mando. La doctrina establece identificación previa para una decisión informada y evitar falsos positivos en el escenario.',
      b: 'DECISIÓN ÓPTIMA — Identificación previa conforme STANAG 3614. Evita incidentes con aeronave amiga y facilita una escalada informada al mando superior.',
      c: 'Respuesta desproporcionada sin identificación. Solo justificable ante amenaza confirmada e inminente. Riesgo de incidente con aeronave amiga.',
      d: 'INCORRECTO — Todo contacto no identificado exige verificación. Ignorarlo viola las normas de enfrentamiento vigentes en el ejercicio.',
    },
    correct: 'b',
  },
  {
    id: 2, code: 'INCIDENTE BRAVO',
    title: 'DEGRADACIÓN DE COMUNICACIONES',
    sitrep: [
      '10:23Z — INTERFERENCIA ACTIVA EN FRECUENCIAS OPERATIVAS',
      'AFECTADOS: GPS · RADIO TÁCTICA · RED C2 INTEGRADA',
      'ANÁLISIS ESPECTRAL: JAMMING CONFIRMADO — ORIGEN DESCONOCIDO',
      'UNIDADES FORWARD SIN CONTACTO CON PC DESDE 08 MINUTOS',
    ],
    threat: { x: 62, y: 68, label: 'JAMMING', col: RED, shape: 'cyber' },
    order: 'INTERFERENCIA ACTIVA EN COMUNICACIONES TÁCTICAS — ORDENE SU RESPUESTA:',
    opts: [
      { id: 'a', label: 'ACTIVAR PLAN PACE', desc: 'Conmutar a sistema alternativo: Primary · Alternate · Contingency · Emergency', pts: 100, level: 'optimal' },
      { id: 'b', label: 'CONTINUAR DEGRADADO', desc: 'Mantener la misión con capacidades reducidas hasta restaurar las comunicaciones', pts: 20, level: 'risky' },
      { id: 'c', label: 'SOLICITAR APOYO CYBER', desc: 'Contactar al Mando de Ciberdefensa para análisis técnico y contramedidas', pts: 70, level: 'good' },
      { id: 'd', label: 'SILENCIO RADIO TOTAL', desc: 'Ordenar silencio radio completo a todas las unidades del teatro', pts: 0, level: 'wrong' },
    ],
    fb: {
      a: 'DECISIÓN ÓPTIMA — El Plan PACE está diseñado exactamente para esta contingencia. Respuesta inmediata, conforme a doctrina y sin comprometer el mando.',
      b: 'Aceptar la degradación sin respuesta activa expone las fuerzas forward y compromete la cadena de mando y control en el momento crítico.',
      c: 'Correcto involucrar ciberdefensa para el análisis. En paralelo, el Plan PACE debe activarse para no interrumpir el C2 mientras se investiga.',
      d: 'INCORRECTO — El silencio radio corta el mando y control, agravando exactamente el efecto que el jamming enemigo busca provocar.',
    },
    correct: 'a',
  },
  {
    id: 3, code: 'INCIDENTE CHARLIE',
    title: 'ACTIVIDAD ISR ENEMIGA PRÓXIMA AL PC',
    sitrep: [
      '11:15Z — CONTRAINTELIGENCIA CONFIRMA ACTIVIDAD ISR EN PERÍMETRO',
      'VEHÍCULO SIN IDENTIFICAR EN SECTOR ESTE · 22 MIN EN POSICIÓN',
      'PERFIL: EQUIPO DE RECONOCIMIENTO EN ADQUISICIÓN DE OBJETIVOS',
      'ESTIMACIÓN: POSICIÓN DEL PC PUEDE ESTAR COMPROMETIDA',
    ],
    threat: { x: 74, y: 42, label: 'ISR-ENE', col: RED, shape: 'ground' },
    order: 'RECONOCIMIENTO ENEMIGO ACTIVO PRÓXIMO AL PUESTO DE MANDO — ORDENE SU RESPUESTA:',
    opts: [
      { id: 'a', label: 'REFORZAR SEGURIDAD PC', desc: 'Incrementar guardia perimetral y elevar el nivel de alerta de las instalaciones', pts: 60, level: 'good' },
      { id: 'b', label: 'ESPERAR CONFIRMACIÓN', desc: 'Mantener observación y aguardar inteligencia adicional antes de actuar', pts: 0, level: 'wrong' },
      { id: 'c', label: 'PATRULLA + CONTRAINTELIGENCIA', desc: 'Enviar patrulla activa y activar protocolos de contrainteligencia simultáneamente', pts: 100, level: 'optimal' },
      { id: 'd', label: 'EVACUACIÓN PREVENTIVA DEL PC', desc: 'Trasladar el PC a posición alternativa e interrumpir la actividad actual', pts: 30, level: 'risky' },
    ],
    fb: {
      a: 'Medida necesaria pero insuficiente. La defensa pasiva permite al elemento ISR enemigo continuar la adquisición de objetivos sobre el PC.',
      b: 'INCORRECTO — Con 22 min de adquisición activa, la demora permite al enemigo completar su misión. La ventana de acción se cierra con cada minuto.',
      c: 'DECISIÓN ÓPTIMA — La patrulla neutraliza la amenaza inmediata mientras contrainteligencia evalúa el alcance real de la exposición del PC.',
      d: 'Evacuación prematura que interrumpe el C2 en un momento crítico. Solo justificada si la amenaza fuera inminente e irresistible.',
    },
    correct: 'c',
  },
  {
    id: 4, code: 'VALORACIÓN FINAL',
    title: 'DECISIÓN ESTRATÉGICA CONSOLIDADA',
    sitrep: [
      '11:52Z — TEATRO CONSOLIDADO: TRES INCIDENTES SIMULTÁNEOS',
      'ALFA: RESUELTO · BRAVO: COMUNICACIONES AL 80% · CHARLIE: EN CURSO',
      'POSICIÓN PC POTENCIALMENTE COMPROMETIDA POR ACTIVIDAD ISR',
      'MANDO SUPERIOR SOLICITA RECOMENDACIÓN ESTRATÉGICA INMEDIATA',
    ],
    threat: null,
    order: 'EVALÚE EL TEATRO COMPLETO Y DETERMINE SU POSTURA ESTRATÉGICA:',
    opts: [
      { id: 'a', label: 'ABORTAR Y REPLEGARSE A BASE', desc: 'Suspender el ejercicio y ordenar repliegue total de todas las unidades', pts: 20, level: 'risky' },
      { id: 'b', label: 'CONTINUAR CON POSTURA REFORZADA', desc: 'Mantener la misión ajustando la postura de seguridad y reportando al escalón superior', pts: 100, level: 'optimal' },
      { id: 'c', label: 'SOLICITAR REFUERZOS AL MANDO DE RESERVA', desc: 'Pedir apoyo inmediato e incrementar la presencia de fuerzas en el teatro', pts: 60, level: 'good' },
      { id: 'd', label: 'MÁXIMA ALERTA DE EMERGENCIA', desc: 'Escalar al nivel máximo y activar todos los protocolos de emergencia disponibles', pts: 10, level: 'wrong' },
    ],
    fb: {
      a: 'Respuesta desproporcionada. Los incidentes, aunque serios, no justifican el abandono del teatro ni la pérdida del objetivo de instrucción.',
      b: 'DECISIÓN ÓPTIMA — Respuesta madura y proporcionada. Resiliencia operativa: adaptar la postura sin ceder el terreno ante la adversidad del enemigo.',
      c: 'Solicitar refuerzos es prudente como medida paralela. Como respuesta única refleja una valoración excesiva de la situación real del teatro.',
      d: 'INCORRECTO — La activación máxima de emergencia se reserva para amenazas existenciales confirmadas. Genera alarma y consume recursos críticos.',
    },
    correct: 'b',
  },
]

const LEVEL_COLOR = { optimal: ACCENT, good: AMBER, risky: AMBER, wrong: RED }
const LEVEL_LABEL = { optimal: 'DECISIÓN ÓPTIMA', good: 'DECISIÓN CORRECTA', risky: 'DECISIÓN DE RIESGO', wrong: 'ERROR DE MANDO' }

// ─── TACTICAL MAP SVG ─────────────────────────────────────────────────────────
function TheaterMap({ phaseIdx, answers, pulse }) {
  const visibleThreats = PHASES.slice(0, phaseIdx + 1)
    .filter(p => p.threat)
    .map((p, i) => ({ ...p.threat, resolved: i < phaseIdx || answers[i] !== undefined }))

  return (
    <div style={{ position: 'relative', width: '100%', background: '#050505', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1200 520"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%' }}
      >
        {/* Base background */}
        <rect width="1200" height="520" fill="#050505" />

        {/* Terrain zones */}
        <rect x="0" y="0" width="1200" height="130" fill="rgba(40,35,20,0.18)" />
        <path d="M960 0 Q1000 130 940 260 Q1010 370 960 520 L1200 520 L1200 0 Z" fill="rgba(0,30,70,0.14)" />
        <rect x="250" y="390" width="480" height="130" fill="rgba(15,15,35,0.22)" />
        <path d="M0 260 Q80 240 0 220 Z" fill="rgba(30,50,20,0.2)" />

        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y * 520} x2="1200" y2={y * 520} stroke="rgba(0,255,65,0.05)" strokeWidth="1" />
        ))}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((x, i) => (
          <line key={`v${i}`} x1={x * 1200} y1="0" x2={x * 1200} y2="520" stroke="rgba(0,255,65,0.05)" strokeWidth="1" />
        ))}

        {/* Coordinate columns A–J */}
        {['A','B','C','D','E','F','G','H','I','J'].map((l, i) => (
          <text key={l} x={(i + 0.5) * 120} y="15" fill="rgba(0,255,65,0.2)" fontSize="10" fontFamily="Share Tech Mono,monospace" textAnchor="middle">{l}</text>
        ))}
        {/* Coordinate rows 1–5 */}
        {[1, 2, 3, 4, 5].map((n, i) => (
          <text key={n} x="8" y={(i + 0.5) * 104 + 5} fill="rgba(0,255,65,0.2)" fontSize="10" fontFamily="Share Tech Mono,monospace">{n}</text>
        ))}

        {/* Mountain marks (north) */}
        {[[75,52],[195,62],[330,44],[470,66],[145,78],[295,78],[410,52],[545,66],[680,58],[820,48],[940,72]].map(([x,y],i) => (
          <text key={i} x={x} y={y} fill="rgba(90,70,50,0.35)" fontSize="13" fontFamily="serif">∧</text>
        ))}

        {/* Contour rings around center */}
        <ellipse cx="600" cy="260" rx="220" ry="140" fill="none" stroke="rgba(0,255,65,0.025)" strokeWidth="1" />
        <ellipse cx="600" cy="260" rx="380" ry="210" fill="none" stroke="rgba(0,255,65,0.02)" strokeWidth="1" />

        {/* Road network */}
        {[
          [288,156,600,260], [600,260,912,156],
          [288,364,600,260], [600,260,912,364],
          [288,156,288,364], [912,156,912,364],
        ].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,170,0,0.12)" strokeWidth="2" strokeDasharray="6,5" />
        ))}

        {/* Phase line (LOA) */}
        <line x1="20" y1="260" x2="1180" y2="260" stroke="rgba(0,170,255,0.07)" strokeWidth="1" strokeDasharray="18,8" />
        <text x="28" y="253" fill="rgba(0,170,255,0.22)" fontSize="8" fontFamily="Share Tech Mono,monospace">LC-AMARILLA</text>

        {/* Scale bar */}
        <line x1="40" y1="500" x2="160" y2="500" stroke="rgba(0,255,65,0.35)" strokeWidth="1.5" />
        <line x1="40" y1="495" x2="40" y2="505" stroke="rgba(0,255,65,0.35)" strokeWidth="1.5" />
        <line x1="160" y1="495" x2="160" y2="505" stroke="rgba(0,255,65,0.35)" strokeWidth="1.5" />
        <text x="100" y="513" fill="rgba(0,255,65,0.35)" fontSize="8" textAnchor="middle" fontFamily="Share Tech Mono,monospace">20 KM</text>

        {/* Compass */}
        <text x="1170" y="46" fill="rgba(0,255,65,0.5)" fontSize="13" textAnchor="middle" fontFamily="Share Tech Mono,monospace">N</text>
        <line x1="1170" y1="22" x2="1170" y2="50" stroke="rgba(0,255,65,0.4)" strokeWidth="1.5" />
        <line x1="1156" y1="36" x2="1184" y2="36" stroke="rgba(0,255,65,0.25)" strokeWidth="1" />
        <polygon points="1170,22 1165,36 1170,32 1175,36" fill="rgba(0,255,65,0.4)" />

        {/* ── HQ ── */}
        <circle cx="600" cy="260" r="22" fill="rgba(0,255,65,0.06)" stroke="#00FF41" strokeWidth="2" />
        <circle cx="600" cy="260" r="7" fill="#00FF41" />
        <line x1="578" y1="260" x2="622" y2="260" stroke="#00FF41" strokeWidth="1.5" opacity="0.35" />
        <line x1="600" y1="238" x2="600" y2="282" stroke="#00FF41" strokeWidth="1.5" opacity="0.35" />
        <text x="600" y="292" fill="#00FF41" fontSize="10" textAnchor="middle" fontFamily="Share Tech Mono,monospace" letterSpacing="1">PC-SIERRA</text>

        {/* Radar rings */}
        {[65,130,195].map((r, i) => (
          <circle key={i} cx="600" cy="260" r={r} fill="none" stroke="rgba(0,255,65,0.035)" strokeWidth="1" />
        ))}

        {/* Battalion positions (triangles) */}
        {[
          { x: 288, y: 156, label: 'BN-1' }, { x: 912, y: 156, label: 'BN-2' },
          { x: 288, y: 364, label: 'BN-3' }, { x: 912, y: 364, label: 'BN-4' },
        ].map(({ x, y, label }) => (
          <g key={label}>
            <polygon points={`${x},${y - 15} ${x - 13},${y + 8} ${x + 13},${y + 8}`} fill="rgba(0,170,255,0.09)" stroke="#00AAFF" strokeWidth="1.5" />
            <text x={x} y={y + 24} fill="#00AAFF" fontSize="9" textAnchor="middle" fontFamily="Share Tech Mono,monospace">{label}</text>
          </g>
        ))}

        {/* Objectives */}
        {[{ x: 444, y: 112, label: 'OBJ-ALFA' }, { x: 756, y: 408, label: 'OBJ-BRAVO' }].map(({ x, y, label }) => (
          <g key={label}>
            <rect x={x - 18} y={y - 18} width="36" height="36" fill="rgba(255,170,0,0.05)" stroke="rgba(255,170,0,0.45)" strokeWidth="1.5" strokeDasharray="4,2" />
            <text x={x} y={y + 5} fill="rgba(255,170,0,0.65)" fontSize="11" textAnchor="middle" fontFamily="Share Tech Mono,monospace">★</text>
            <text x={x} y={y + 28} fill="rgba(255,170,0,0.5)" fontSize="8" textAnchor="middle" fontFamily="Share Tech Mono,monospace">{label}</text>
          </g>
        ))}

        {/* ── Threat markers (progressive) ── */}
        {visibleThreats.map((threat, i) => {
          const px = (threat.x / 100) * 1200
          const py = (threat.y / 100) * 520
          const isActive = !threat.resolved
          const col = threat.resolved ? 'rgba(0,255,65,0.45)' : threat.col
          const pulseBig = pulse && isActive

          return (
            <g key={i}>
              {/* Threat track to HQ */}
              {isActive && (
                <line x1={px} y1={py} x2="600" y2="260" stroke={`${threat.col}15`} strokeWidth="1" strokeDasharray="5,9" />
              )}
              {/* Pulse rings */}
              {isActive && (
                <>
                  <circle cx={px} cy={py} r={pulseBig ? 32 : 26} fill="none" stroke={`${threat.col}22`} strokeWidth="1.5" />
                  <circle cx={px} cy={py} r={pulseBig ? 20 : 16} fill="none" stroke={`${threat.col}44`} strokeWidth="1" />
                </>
              )}
              {/* Icon circle */}
              <circle cx={px} cy={py} r="12" fill={isActive ? `${threat.col}15` : 'rgba(0,255,65,0.1)'} stroke={col} strokeWidth="2" />
              <text x={px} y={py + 5} fill={col} fontSize="11" textAnchor="middle" fontFamily="Share Tech Mono,monospace">
                {threat.resolved ? '✓' : (threat.shape === 'aerial' ? '△' : threat.shape === 'cyber' ? '⊡' : '◈')}
              </text>
              {/* Label */}
              {threat.label && (
                <text x={px} y={py - 16} fill={col} fontSize="9" textAnchor="middle" fontFamily="Share Tech Mono,monospace" letterSpacing="1">
                  {threat.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Phase 4 crisis tint */}
        {phaseIdx === 3 && (
          <rect width="1200" height="520" fill="rgba(255,30,30,0.025)" />
        )}

        {/* Theater label */}
        <text x="600" y="516" fill="rgba(0,255,65,0.18)" fontSize="8" textAnchor="middle" fontFamily="Share Tech Mono,monospace" letterSpacing="5">
          TEATRO DE OPERACIONES — EJERCICIO SIERRA-26 — CLASIFICADO
        </text>
      </svg>
    </div>
  )
}

// ─── OPTION CARD ─────────────────────────────────────────────────────────────
function OptionCard({ opt, onSelect, disabled, selectedId, correct, showResult }) {
  const isSelected = selectedId === opt.id
  const isCorrect  = opt.id === correct
  const letter     = opt.id.toUpperCase()

  let borderCol = BORDER
  let bgCol     = '#080808'
  let textCol   = TEXT2

  if (showResult) {
    if (isCorrect)      { borderCol = `${ACCENT}77`; bgCol = 'rgba(0,255,65,0.06)'; textCol = ACCENT }
    else if (isSelected){ borderCol = `${LEVEL_COLOR[opt.level]}55`; bgCol = `${LEVEL_COLOR[opt.level]}08` }
    else                { borderCol = 'rgba(0,255,65,0.08)'; textCol = 'rgba(0,255,65,0.25)' }
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{
        display: 'flex', gap: '1.67vmin', alignItems: 'flex-start',
        padding: '2.04vmin 2.22vmin', textAlign: 'left', width: '100%',
        background: bgCol,
        border: `2px solid ${borderCol}`,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s', fontFamily: FONT,
        opacity: showResult && !isSelected && !isCorrect ? 0.45 : 1,
      }}
    >
      {/* Letter badge */}
      <div style={{
        width: '3.33vmin', height: '3.33vmin', flexShrink: 0,
        border: `1.5px solid ${showResult && isCorrect ? ACCENT : BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'clamp(11px, 1.67vmin, 9999px)', color: showResult && isCorrect ? ACCENT : TEXT2,
        fontFamily: FONT,
      }}>
        {showResult && isCorrect ? '✓' : letter}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'clamp(12px, 1.85vmin, 9999px)', color: textCol, letterSpacing: '0.19vmin', marginBottom: '0.56vmin' }}>
          {opt.label}
        </div>
        <div style={{ fontSize: 'clamp(10px, 1.39vmin, 9999px)', color: 'rgba(0,255,65,0.38)', lineHeight: 1.6 }}>
          {opt.desc}
        </div>
      </div>
    </button>
  )
}

// ─── FEEDBACK BAR ────────────────────────────────────────────────────────────
function FeedbackBar({ phase, selectedId }) {
  const opt = phase.opts.find(o => o.id === selectedId)
  const isOptimal = selectedId === phase.correct
  const col   = LEVEL_COLOR[opt.level]
  const badge = LEVEL_LABEL[opt.level]

  return (
    <div style={{
      padding: '1.67vmin 2.04vmin', marginBottom: '1.3vmin',
      border: `1.5px solid ${col}55`,
      background: `${col}07`,
      display: 'flex', gap: '1.67vmin', alignItems: 'flex-start', fontFamily: FONT,
    }}>
      <div style={{ fontSize: 'clamp(17px, 2.59vmin, 9999px)', color: col, lineHeight: 1, flexShrink: 0 }}>
        {isOptimal ? '◉' : opt.level === 'wrong' ? '✗' : '◎'}
      </div>
      <div>
        <div style={{ fontSize: 'clamp(10px, 1.3vmin, 9999px)', color: col, letterSpacing: '0.28vmin', marginBottom: '0.56vmin' }}>{badge}</div>
        <div style={{ fontSize: 'clamp(10px, 1.57vmin, 9999px)', color: TEXT2, lineHeight: 1.7 }}>{phase.fb[selectedId]}</div>
      </div>
    </div>
  )
}

// ─── PHASE BAR ───────────────────────────────────────────────────────────────
function PhaseBar({ phaseIdx, answers }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', fontFamily: FONT }}>
      {PHASES.map((p, i) => {
        const done   = i < phaseIdx
        const active = i === phaseIdx
        const col    = done || active ? ACCENT : 'rgba(0,255,65,0.22)'
        const ans    = answers[i]
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < PHASES.length - 1 ? '1' : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.56vmin' }}>
              <div style={{
                width: '4.07vmin', height: '4.07vmin',
                border: `2px solid ${col}`,
                background: active ? `${ACCENT}11` : done ? `${ACCENT}1a` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(10px, 1.48vmin, 9999px)', color: col,
              }}>
                {done
                  ? <span style={{ color: LEVEL_COLOR[answers[i]?.level] || ACCENT }}>✓</span>
                  : `${i + 1}`
                }
              </div>
              <div style={{ fontSize: 'clamp(10px, 1.02vmin, 9999px)', color: col, letterSpacing: '0.09vmin', textAlign: 'center', maxWidth: '90px', lineHeight: 1.3 }}>
                {p.code}
              </div>
            </div>
            {i < PHASES.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: i < phaseIdx ? `${ACCENT}44` : BORDER, margin: '0 0.74vmin', marginBottom: '2.04vmin' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function TacticalMap({ onComplete }) {
  const [screen, setScreen]         = useState('intro')    // intro | game | result
  const [phaseIdx, setPhaseIdx]     = useState(0)
  const [answers, setAnswers]       = useState([])         // [{ opt, pts, level }]
  const [selected, setSelected]     = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [sitrepLine, setSitrepLine] = useState(0)
  const [pulse, setPulse]           = useState(false)
  const timerRef = useRef(null)

  const phase = PHASES[phaseIdx]

  // SITREP typewriter
  useEffect(() => {
    if (screen !== 'game') return
    setSitrepLine(0)
    let i = 0
    const id = setInterval(() => {
      i++
      setSitrepLine(i)
      if (i >= phase.sitrep.length) clearInterval(id)
    }, 480)
    return () => clearInterval(id)
  }, [phaseIdx, screen])

  // Pulse animation for threat markers
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 900)
    return () => clearInterval(id)
  }, [])

  const handleSelect = (optId) => {
    if (showFeedback || selected) return
    const opt = phase.opts.find(o => o.id === optId)
    setSelected(optId)
    setShowFeedback(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const newAnswers = [...answers, { opt: optId, pts: opt.pts, level: opt.level }]
      setAnswers(newAnswers)
      if (phaseIdx < PHASES.length - 1) {
        setPhaseIdx(i => i + 1)
        setSelected(null)
        setShowFeedback(false)
      } else {
        setScreen('result')
      }
    }, 2800)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const totalPts   = answers.reduce((s, a) => s + a.pts, 0)
  const maxPts     = PHASES.length * 100
  const pct        = Math.round((totalPts / maxPts) * 100)
  const clasif     = totalPts >= 350 ? 'GENERAL DE BRIGADA' : totalPts >= 260 ? 'CORONEL' : totalPts >= 160 ? 'TENIENTE CORONEL' : 'COMANDANTE'
  const clasifCol  = totalPts >= 350 ? ACCENT : totalPts >= 260 ? AMBER : totalPts >= 160 ? '#00AAFF' : RED

  /* ══════════════════════════════ INTRO ══════════════════════════════════════ */
  if (screen === 'intro') return (
    <div style={{ maxWidth: '1920px', width: '100%', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ fontSize: 'clamp(10px, 1.39vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '1.3vmin' }}>// MOD-07 — EJERCICIO DE MANDO TÁCTICO</div>
      <div style={{ fontSize: 'clamp(28px, 3.5vw, 54px)', letterSpacing: '0.46vmin', color: ACCENT, marginBottom: '0.74vmin' }}>SALA DE CRISIS</div>
      <div style={{ fontSize: 'clamp(14px, 1.8vw, 22px)', color: TEXT2, letterSpacing: '0.28vmin', marginBottom: '3.33vmin' }}>EJERCICIO SIERRA-26 — SIMULACRO DE DECISIÓN DE MANDO</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.48vmin', marginBottom: '2.59vmin' }}>
        {/* Situation */}
        <div style={{ ...CARD, borderLeft: `2px solid ${ACCENT}44` }}>
          <div style={{ fontSize: 'clamp(10px, 1.11vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '1.3vmin' }}>// ESCENARIO</div>
          <p style={{ fontSize: 'clamp(11px, 1.67vmin, 9999px)', color: TEXT2, lineHeight: 1.9, margin: '0 0 1.3vmin' }}>
            Durante el Ejercicio SIERRA-26, una serie de incidentes de diversa naturaleza se desarrollan de forma progresiva en el teatro de operaciones.
          </p>
          <p style={{ fontSize: 'clamp(11px, 1.67vmin, 9999px)', color: TEXT2, lineHeight: 1.9, margin: 0 }}>
            Como oficial al mando, deberá valorar cada situación y emitir sus órdenes. Sus decisiones serán evaluadas conforme a la doctrina OTAN y los procedimientos normalizados vigentes.
          </p>
        </div>

        {/* Structure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.93vmin' }}>
          <div style={{ ...CARD, borderLeft: `2px solid ${AMBER}44`, padding: '1.48vmin 1.85vmin' }}>
            <div style={{ fontSize: 'clamp(10px, 1.11vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '0.93vmin' }}>// ESTRUCTURA DEL EJERCICIO</div>
            {[
              ['4 FASES', 'Incidentes de naturaleza diversa con escalada progresiva'],
              ['DECISIÓN AUTÓNOMA', '4 líneas de acción posibles por incidente'],
              ['EVALUACIÓN DOCTRINAL', 'Cada decisión se analiza conforme a los procedimientos vigentes'],
              ['CLASIFICACIÓN FINAL', 'Resultado expresado en escala de mando operacional'],
            ].map(([label, desc]) => (
              <div key={label} style={{ display: 'flex', gap: '1.3vmin', marginBottom: '0.83vmin', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 'clamp(10px, 1.3vmin, 9999px)', color: ACCENT, minWidth: '190px', letterSpacing: '0.09vmin' }}>{label}</div>
                <div style={{ fontSize: 'clamp(10px, 1.3vmin, 9999px)', color: TEXT2 }}>{desc}</div>
              </div>
            ))}
          </div>
          {/* Classification scale */}
          <div style={{ ...CARD, padding: '1.3vmin 1.85vmin' }}>
            <div style={{ fontSize: 'clamp(10px, 1.11vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '0.93vmin' }}>// ESCALA DE CLASIFICACIÓN DE MANDO</div>
            {[
              ['350–400', 'GENERAL DE BRIGADA', ACCENT],
              ['260–349', 'CORONEL', AMBER],
              ['160–259', 'TENIENTE CORONEL', '#00AAFF'],
              ['0–159',   'COMANDANTE', RED],
            ].map(([range, label, col]) => (
              <div key={label} style={{ display: 'flex', gap: '1.48vmin', alignItems: 'center', marginBottom: '0.56vmin' }}>
                <span style={{ fontSize: 'clamp(10px, 1.2vmin, 9999px)', color: 'rgba(0,255,65,0.35)', minWidth: '72px', fontFamily: FONT }}>{range}</span>
                <span style={{ fontSize: 'clamp(10px, 1.39vmin, 9999px)', color: col, letterSpacing: '0.19vmin' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={() => setScreen('game')} style={{ ...S.btnPrimary, fontSize: 'clamp(12px, 1.85vmin, 9999px)', padding: '1.67vmin 3.89vmin', gap: '1.11vmin' }}>
        ASUMIR EL MANDO <ChevronRight size={20} />
      </button>
    </div>
  )

  /* ══════════════════════════════ RESULT ═════════════════════════════════════ */
  if (screen === 'result') return (
    <div style={{ maxWidth: '1920px', width: '100%', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ fontSize: 'clamp(10px, 1.3vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '1.67vmin' }}>// EVALUACIÓN FINAL — EJERCICIO SIERRA-26</div>

      {/* Classification header */}
      <div style={{ ...CARD, borderLeft: `3px solid ${clasifCol}`, padding: '2.59vmin 2.96vmin', marginBottom: '1.85vmin', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2.22vmin' }}>
        <div>
          <div style={{ fontSize: 'clamp(10px, 1.2vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '0.74vmin' }}>CLASIFICACIÓN DE MANDO OPERACIONAL</div>
          <div style={{ fontSize: 'clamp(28px, 3vw, 46px)', color: clasifCol, letterSpacing: '0.46vmin', textShadow: `0 0 30px ${clasifCol}33` }}>{clasif}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'clamp(10px, 1.2vmin, 9999px)', color: TEXT2, letterSpacing: '0.28vmin', marginBottom: '0.56vmin' }}>PUNTUACIÓN GLOBAL</div>
          <div style={{ fontSize: 'clamp(38px, 5.93vmin, 9999px)', color: clasifCol, lineHeight: 1, letterSpacing: '0.19vmin' }}>{totalPts}</div>
          <div style={{ fontSize: 'clamp(10px, 1.2vmin, 9999px)', color: 'rgba(0,255,65,0.3)', marginTop: '0.37vmin' }}>DE {maxPts} PUNTOS POSIBLES ({pct}%)</div>
        </div>
      </div>

      {/* Phase breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.93vmin', marginBottom: '1.85vmin' }}>
        {PHASES.map((p, i) => {
          const ans = answers[i]
          if (!ans) return null
          const col = LEVEL_COLOR[ans.level]
          const selOpt = p.opts.find(o => o.id === ans.opt)
          return (
            <div key={i} style={{ ...CARD, borderTop: `2px solid ${col}55`, padding: '1.48vmin' }}>
              <div style={{ fontSize: 'clamp(10px, 1.02vmin, 9999px)', color: TEXT2, letterSpacing: '0.28vmin', marginBottom: '0.37vmin' }}>{p.code}</div>
              <div style={{ fontSize: 'clamp(10px, 1.2vmin, 9999px)', color: TEXT2, marginBottom: '0.93vmin', lineHeight: 1.4 }}>{p.title}</div>
              <div style={{ fontSize: 'clamp(11px, 1.67vmin, 9999px)', color: col, letterSpacing: '0.19vmin', marginBottom: '0.37vmin' }}>
                {selOpt?.label}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.74vmin' }}>
                <span style={{ fontSize: 'clamp(10px, 1.02vmin, 9999px)', color: col, letterSpacing: '0.19vmin' }}>{LEVEL_LABEL[ans.level]}</span>
                <span style={{ fontSize: 'clamp(12px, 1.85vmin, 9999px)', color: col, letterSpacing: '0.09vmin' }}>{ans.pts}/100</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Doctrinal note */}
      <div style={{ ...CARD, borderLeft: `2px solid ${ACCENT}33`, padding: '1.67vmin 2.04vmin', marginBottom: '1.85vmin' }}>
        <div style={{ fontSize: 'clamp(10px, 1.11vmin, 9999px)', color: TEXT2, letterSpacing: '0.37vmin', marginBottom: '0.93vmin' }}>// ANÁLISIS DOCTRINAL</div>
        <p style={{ fontSize: 'clamp(10px, 1.48vmin, 9999px)', color: TEXT2, lineHeight: 1.8, margin: 0 }}>
          {totalPts >= 350
            ? 'Ejercicio completado con criterio de mando sobresaliente. Las decisiones adoptadas demuestran dominio de la doctrina OTAN, sentido de la proporcionalidad y capacidad de liderazgo en entornos de crisis compleja.'
            : totalPts >= 260
            ? 'Ejercicio completado con criterio sólido. La mayoría de las decisiones se ajustan a doctrina. Se identifican áreas de mejora en procedimientos específicos que conviene reforzar en futuras sesiones de instrucción.'
            : totalPts >= 160
            ? 'Ejercicio completado. Algunas decisiones se alejan de los procedimientos normativos. Se recomienda revisar los protocolos de respuesta ante amenazas híbridas y los planes de contingencia de comunicaciones.'
            : 'Ejercicio completado. Las decisiones adoptadas presentan divergencias significativas respecto a la doctrina vigente. Se recomienda formación específica en toma de decisiones bajo presión y procedimientos OTAN.'
          }
        </p>
      </div>

      <button onClick={() => onComplete({ type: 'tactical-map', score: totalPts, clasif })} style={{ ...S.btnPrimary, fontSize: 'clamp(12px, 1.85vmin, 9999px)', padding: '1.67vmin 3.89vmin', gap: '1.11vmin' }}>
        CONTINUAR AL INFORME <ChevronRight size={20} />
      </button>
    </div>
  )

  /* ══════════════════════════════ GAME ════════════════════════════════════ */
  return (
    <div style={{ maxWidth: '1920px', width: '100%', margin: '0 auto', fontFamily: FONT }}>

      {/* Phase bar */}
      <div style={{ ...CARD, padding: '1.67vmin 2.59vmin', marginBottom: '1.3vmin' }}>
        <PhaseBar phaseIdx={phaseIdx} answers={answers} />
      </div>

      {/* Map */}
      <div style={{ position: 'relative', marginBottom: '1.3vmin' }}>
        <TheaterMap phaseIdx={phaseIdx} answers={answers} pulse={pulse} />

        {/* SITREP overlay */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(4,4,4,0.90)',
          border: `1px solid ${AMBER}44`,
          padding: '1.3vmin 1.85vmin', maxWidth: '440px',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{ fontSize: 'clamp(10px, 1.02vmin, 9999px)', color: AMBER, letterSpacing: '0.28vmin', marginBottom: '0.93vmin' }}>
            {phase.code} — {phase.title}
          </div>
          {phase.sitrep.slice(0, sitrepLine).map((line, i) => (
            <div key={i} style={{
              fontSize: 'clamp(10px, 1.2vmin, 9999px)', color: i === 0 ? TEXT2 : 'rgba(0,255,65,0.55)',
              letterSpacing: '0.05vmin', lineHeight: 1.75,
              borderLeft: i === 0 ? `2px solid ${AMBER}55` : 'none',
              paddingLeft: i === 0 ? '0.74vmin' : '0.93vmin',
            }}>
              {line}
            </div>
          ))}
          {sitrepLine < phase.sitrep.length && (
            <span style={{ color: ACCENT, fontSize: 'clamp(10px, 1.11vmin, 9999px)' }}>█</span>
          )}
        </div>

        {/* Phase progress badge */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(4,4,4,0.88)', border: `1px solid ${BORDER}`,
          padding: '0.93vmin 1.48vmin', textAlign: 'center',
        }}>
          <div style={{ fontSize: 'clamp(10px, 0.93vmin, 9999px)', color: TEXT2, letterSpacing: '0.28vmin' }}>FASE</div>
          <div style={{ fontSize: 'clamp(14px, 2.22vmin, 9999px)', color: ACCENT }}>{phaseIdx + 1}/{PHASES.length}</div>
        </div>
      </div>

      {/* Order of the day */}
      <div style={{ fontSize: 'clamp(10px, 1.39vmin, 9999px)', color: TEXT2, letterSpacing: '0.19vmin', marginBottom: '1.3vmin', padding: '0 2px' }}>
        ▸ {phase.order}
      </div>

      {/* Feedback */}
      {showFeedback && selected && (
        <FeedbackBar phase={phase} selectedId={selected} />
      )}

      {/* Option cards 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.93vmin' }}>
        {phase.opts.map(opt => (
          <OptionCard
            key={opt.id}
            opt={opt}
            onSelect={() => handleSelect(opt.id)}
            disabled={!!showFeedback}
            selectedId={selected}
            correct={phase.correct}
            showResult={showFeedback}
          />
        ))}
      </div>
    </div>
  )
}
