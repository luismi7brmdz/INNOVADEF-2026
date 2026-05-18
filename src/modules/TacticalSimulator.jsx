import { useState, useEffect } from 'react'
import { ChevronRight, CheckCircle, Clock } from 'lucide-react'
import { S, ACCENT, AMBER, RED, DIM, DIMLO, BORDER, CARD, TEXT, TEXT2, FONT } from '../theme'

const scenarios = [
  {
    id: 'cyber',
    code: 'INC-2026-001',
    title: 'Intrusión en Red Clasificada',
    icon: '⚠',
    briefing: 'Se detecta actividad anómala en la red INTRADEF a las 03:42h. Tráfico cifrado no autorizado hacia IPs externas. Posible exfiltración de datos formativos clasificados. Sistema LMS comprometido. Tiempo de respuesta crítico: 8 minutos.',
    urgency: 'CRÍTICA',
    decisions: [
      {
        step: 1,
        situation: 'El IDS detecta 847 paquetes salientes a destinos desconocidos. El sistema LMS sigue operativo. ¿Cuál es su primera acción?',
        options: [
          { text: 'Aislamiento inmediato del segmento de red comprometido', score: 100, impact: 'Contención efectiva. Daño limitado.' },
          { text: 'Notificar al CERT-Defensa y esperar instrucciones', score: 60, impact: 'Correcta escalada pero pérdida de tiempo crítico.' },
          { text: 'Monitorizar sin intervenir para identificar el vector', score: 40, impact: 'Riesgo alto de exfiltración continuada.' },
          { text: 'Reiniciar los sistemas afectados', score: 20, impact: 'Destrucción de evidencias forenses.' }
        ]
      },
      {
        step: 2,
        situation: 'Red aislada. El análisis forense indica un zero-day en el módulo de autenticación del LMS. 3 cuentas de administrador comprometidas. ¿Siguiente paso?',
        options: [
          { text: 'Revocar credenciales comprometidas y activar MFA de emergencia', score: 100, impact: 'Respuesta técnica óptima.' },
          { text: 'Cambiar contraseñas de las 3 cuentas afectadas', score: 50, impact: 'Insuficiente si el vector de acceso persiste.' },
          { text: 'Apagar el sistema LMS completamente', score: 70, impact: 'Seguro pero con impacto operacional alto.' },
          { text: 'Esperar análisis forense completo antes de actuar', score: 30, impact: 'El atacante mantiene acceso activo.' }
        ]
      },
      {
        step: 3,
        situation: 'Incidente contenido. Debe elaborar el informe de impacto para el Mando. ¿Qué prioriza en la comunicación?',
        options: [
          { text: 'Alcance del incidente, datos afectados y lecciones aprendidas', score: 100, impact: 'Comunicación institucional madura.' },
          { text: 'Minimizar el impacto en el informe para evitar alarma', score: 10, impact: 'Falta de transparencia institucional.' },
          { text: 'Datos técnicos detallados del ataque sin contexto estratégico', score: 50, impact: 'Útil para técnicos, no para el Mando.' },
          { text: 'Informe completo con plan de acción y plazos', score: 95, impact: 'Gestión de crisis ejemplar.' }
        ]
      }
    ]
  },
  {
    id: 'cloud',
    code: 'OPS-2026-042',
    title: 'Migración Cloud Crítica',
    icon: '◈',
    briefing: 'La plataforma de gestión académica GICEN debe migrar a infraestructura cloud en 72 horas por caducidad del datacenter actual. Certificación ENS pendiente. 12.000 expedientes activos en juego. Decisiones de arquitectura con impacto en soberanía del dato.',
    urgency: 'ALTA',
    decisions: [
      {
        step: 1,
        situation: 'El proveedor cloud propone migración express a infraestructura pública internacional. Más rápido y 40% más barato. ¿Su posición?',
        options: [
          { text: 'Rechazar. Exigir cloud soberano certificado ENS aunque implique retraso', score: 100, impact: 'Correcto. Soberanía del dato innegociable en Defensa.' },
          { text: 'Aceptar temporalmente con cláusulas de seguridad', score: 40, impact: 'Riesgo regulatorio y de seguridad inaceptable.' },
          { text: 'Consultar al DPO y al CISO antes de decidir', score: 80, impact: 'Correcta gobernanza aunque con presión temporal.' },
          { text: 'Aceptar para cumplir el plazo y migrar después', score: 20, impact: 'Exposición de datos clasificados.' }
        ]
      },
      {
        step: 2,
        situation: 'Se identifica un proveedor nacional con ENS Categoría Alta pero con capacidad limitada. ¿Arquitectura de solución?',
        options: [
          { text: 'Nube híbrida: datos clasificados en cloud soberano, servicios no críticos en cloud privado', score: 100, impact: 'Arquitectura óptima para Defensa.' },
          { text: 'Todo en cloud soberano aunque sea más lento', score: 75, impact: 'Seguro pero puede comprometer operatividad.' },
          { text: 'Negociar ampliación del datacenter actual', score: 60, impact: 'Evita el problema sin resolverlo.' },
          { text: 'Fragmentar por centros docentes para distribuir el riesgo', score: 45, impact: 'Complejidad operacional alta.' }
        ]
      },
      {
        step: 3,
        situation: 'La migración se completa pero el rendimiento cae un 35%. Los centros docentes presionan. ¿Cómo gestiona el cambio?',
        options: [
          { text: 'Plan de comunicación proactivo + soporte técnico reforzado + SLA comprometidos', score: 100, impact: 'Gestión del cambio profesional.' },
          { text: 'Esperar a que el sistema se estabilice solo', score: 20, impact: 'Deterioro de confianza institucional.' },
          { text: 'Ofrecer vuelta al sistema anterior', score: 35, impact: 'Regresión tecnológica.' },
          { text: 'Escalar al proveedor y comunicar plazos de resolución', score: 85, impact: 'Correcto pero falta el componente humano.' }
        ]
      }
    ]
  }
]

const profileMap = {
  high: { label: 'Líder Digital Estratégico', desc: 'Toma de decisiones segura, visión estratégica clara y gestión de crisis madura.' },
  mid: { label: 'Gestor en Transición', desc: 'Buen instinto técnico con oportunidades de mejora en comunicación institucional.' },
  low: { label: 'Perfil en Desarrollo', desc: 'Se recomienda refuerzo en protocolos de respuesta y marco regulatorio ENS.' }
}

export default function TacticalSimulator({ onComplete }) {
  const [phase, setPhase] = useState('briefing') // briefing | decision | result
  const [scenarioIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState([])
  const [selected, setSelected] = useState(null)
  const [showImpact, setShowImpact] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [timerActive, setTimerActive] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const scenario = scenarios[scenarioIdx]
  const currentDecision = scenario.decisions[step]

  useEffect(() => {
    if (!timerActive) return
    if (timeLeft <= 0) {
      handleSelect(scenario.decisions[step].options[3], true)
      return
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timerActive, timeLeft])

  const startScenario = () => {
    setPhase('decision')
    setTimerActive(true)
    setTimeLeft(45)
  }

  const handleSelect = (option, forced = false) => {
    if (selected) return
    setTimerActive(false)
    setSelected(option)
    setScores(s => [...s, option.score])
    setShowImpact(true)
  }

  const nextStep = () => {
    if (step < scenario.decisions.length - 1) {
      setTransitioning(true)
      setTimeout(() => {
        setStep(s => s + 1)
        setSelected(null)
        setShowImpact(false)
        setTimeLeft(45)
        setTimerActive(true)
        setTransitioning(false)
      }, 400)
    } else {
      setPhase('result')
    }
  }

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const profile = avgScore >= 80 ? 'high' : avgScore >= 50 ? 'mid' : 'low'

  const F = FONT

  return (
    <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto', fontFamily: F }}>

      {phase === 'briefing' && (
        <div>
          <div style={{ display: 'flex', gap: '18px', marginBottom: '30px', alignItems: 'center' }}>
            <div style={{ padding: '3px 10px', fontSize: '15px', letterSpacing: '2px', background: scenario.urgency === 'CRÍTICA' ? 'rgba(255,43,43,0.08)' : 'rgba(255,170,0,0.08)', border: `1px solid ${scenario.urgency === 'CRÍTICA' ? 'rgba(255,43,43,0.4)' : 'rgba(255,170,0,0.4)'}`, color: scenario.urgency === 'CRÍTICA' ? '#FF2B2B' : '#FFAA00' }}>
              URGENCIA: {scenario.urgency}
            </div>
            <span style={{ fontSize: '15px', color: TEXT2, letterSpacing: '2px' }}>{scenario.code}</span>
          </div>

          <div style={{ fontSize: '9px', letterSpacing: '2px', color: TEXT2, marginBottom: '12px' }}>// ESCENARIO ACTIVO</div>
          <div style={{ fontSize: 'clamp(20px, 3.75vw, 30px)', letterSpacing: '2px', color: ACCENT, marginBottom: '36px', textShadow: `0 0 20px ${ACCENT}33`, textTransform: 'uppercase' }}>
            {scenario.title}
          </div>

          <div style={{ ...CARD, marginBottom: '36px', borderLeft: `2px solid ${ACCENT}44` }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: TEXT2, marginBottom: '10px' }}>// BRIEFING OPERACIONAL</div>
            <p style={{ fontSize: '13px', lineHeight: 1.8, color: TEXT2, margin: 0, letterSpacing: '0.5px' }}>{scenario.briefing}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'DECISIONES', value: `${scenario.decisions.length} PUNTOS CRÍTICOS` },
              { label: 'T/DECISIÓN', value: '45 SEGUNDOS' },
              { label: 'EVALUACIÓN', value: 'PERFIL LIDERAZGO' }
            ].map(item => (
              <div key={item.label} style={{ ...CARD, padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: ACCENT, letterSpacing: '1px' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <button onClick={startScenario} style={S.btnPrimary}>INICIAR SIMULACRO <ChevronRight size={21} /></button>
        </div>
      )}

      {phase === 'decision' && (
        <div style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {scenario.decisions.map((_, i) => (
                <div key={i} style={{ width: '40px', height: '3px', background: i <= step ? ACCENT : `${ACCENT}18`, boxShadow: i === step ? `0 0 6px ${ACCENT}` : 'none' }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: timeLeft <= 10 ? '#FF2B2B' : TEXT2, fontSize: '11px', letterSpacing: '2px' }}>
              <Clock size={18} />
              T-{String(timeLeft).padStart(2, '0')}S
              <div style={{ width: '80px', height: '3px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}22` }}>
                <div style={{ height: '100%', background: timeLeft <= 10 ? '#FF2B2B' : ACCENT, width: `${(timeLeft / 45) * 100}%`, transition: 'width 1s linear', boxShadow: `0 0 4px ${ACCENT}` }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '9px', letterSpacing: '2px', color: TEXT2, marginBottom: '10px' }}>// DECISIÓN {step + 1}/{scenario.decisions.length} — {scenario.code}</div>

          <div style={{ ...CARD, marginBottom: '30px', borderLeft: `2px solid ${ACCENT}44` }}>
            <p style={{ fontSize: '21px', lineHeight: 1.7, color: ACCENT, margin: 0, letterSpacing: '0.5px' }}>{currentDecision.situation}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '30px' }}>
            {currentDecision.options.map((option, i) => {
              const isSelected = selected?.text === option.text
              const isWrong = showImpact && isSelected && option.score < 70
              const isBest = showImpact && option.score === 100
              return (
                <button key={i} onClick={() => !selected && handleSelect(option)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '36px', padding: '14px 16px', textAlign: 'left', width: '100%',
                    background: isBest && showImpact ? 'rgba(0,255,65,0.06)' : isWrong ? 'rgba(255,43,43,0.06)' : '#070707',
                    border: `1px solid ${isBest && showImpact ? `${ACCENT}55` : isWrong ? 'rgba(255,43,43,0.4)' : BORDER}`,
                    color: TEXT2, cursor: selected ? 'default' : 'pointer', transition: 'all 0.12s', fontFamily: F,
                    boxShadow: isBest && showImpact ? `inset 0 0 20px rgba(0,255,65,0.03)` : 'none'
                  }}
                  onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = '#ffaa0055'; e.currentTarget.style.background = 'rgba(255,170,0,0.04)'; e.currentTarget.style.color = '#ffaa00' } }}
                  onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#070707'; e.currentTarget.style.color = TEXT2 } }}
                >
                  <span style={{ color: ACCENT, fontSize: '24px', minWidth: '24px', marginTop: '1px' }}>[{String.fromCharCode(65+i)}]</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '24px', letterSpacing: '0.5px', lineHeight: 1.6 }}>{option.text}</span>
                    {showImpact && (isSelected || isBest) && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: isBest ? ACCENT : '#FF2B2B', letterSpacing: '0.5px' }}>
                        {'>'} {option.impact}
                      </div>
                    )}
                  </div>
                  {showImpact && isBest && <CheckCircle size={21} color={ACCENT} style={{ flexShrink: 0, marginTop: '2px' }} />}
                </button>
              )
            })}
          </div>

          {showImpact && (
            <button onClick={nextStep} style={S.btnPrimary}>
              {step < scenario.decisions.length - 1 ? 'SIGUIENTE DECISIÓN' : 'VER RESULTADO'} <ChevronRight size={21} />
            </button>
          )}
        </div>
      )}

      {phase === 'result' && (
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: TEXT2, marginBottom: '18px' }}>// EVALUACIÓN COMPLETADA — {scenario.code}</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: TEXT2, marginBottom: '36px' }}>// PERFIL DE LIDERAZGO DIGITAL</div>

          <div style={{ ...CARD, borderColor: `${ACCENT}33`, marginBottom: '24px', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '28px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: ACCENT, lineHeight: 1, textShadow: `0 0 30px ${ACCENT}44` }}>{avgScore}</div>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px' }}>PUNTUACIÓN</div>
            </div>
            <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: '28px' }}>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px', marginBottom: '12px' }}>PERFIL ASIGNADO</div>
              <div style={{ fontSize: '27px', letterSpacing: '2px', color: ACCENT, marginBottom: '12px', textTransform: 'uppercase' }}>{profileMap[profile].label}</div>
              <p style={{ fontSize: '24px', color: TEXT2, lineHeight: 1.7, margin: 0, letterSpacing: '0.5px' }}>{profileMap[profile].desc}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scores.length}, 1fr)`, gap: '12px', marginBottom: '36px' }}>
            {scores.map((s, i) => (
              <div key={i} style={{ ...CARD, textAlign: 'center', padding: '6px' }}>
                <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px', marginBottom: '6px' }}>DEC.{String(i+1).padStart(2,'0')}</div>
                <div style={{ fontSize: '28px', color: s >= 80 ? ACCENT : s >= 50 ? AMBER : RED }}>{s}</div>
              </div>
            ))}
          </div>

          <button onClick={() => onComplete({ type: 'tactical', score: avgScore, profile: profileMap[profile].label })} style={S.btnPrimary}>
            CONTINUAR AL INFORME <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
