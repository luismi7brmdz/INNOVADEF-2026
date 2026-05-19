import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { S, ACCENT, AMBER, RED, DIM, BORDER, CARD, TEXT, TEXT2, FONT } from '../theme'

const threats = [
  { id: 'apt', label: 'APT Patrocinada por Estado', desc: 'Amenaza persistente avanzada con objetivos de exfiltración de inteligencia militar a largo plazo.', severity: 'CRÍTICA', icon: '◉', color: '#ff3333' },
  { id: 'ransomware', label: 'Ransomware en GICEN', desc: 'Cifrado de datos del sistema de gestión académica con exigencia de rescate en criptomoneda.', severity: 'ALTA', icon: '⊘', color: '#ff8800' },
  { id: 'insider', label: 'Amenaza Interna', desc: 'Personal con acceso privilegiado filtrando documentos formativos clasificados.', severity: 'ALTA', icon: '◈', color: '#ff8800' },
  { id: 'supply', label: 'Compromiso de Cadena de Suministro', desc: 'Proveedor de software LMS comprometido con backdoor en actualización reciente.', severity: 'ALTA', icon: '◇', color: '#ffaa00' },
  { id: 'phishing', label: 'Spear-Phishing Dirigido', desc: 'Campaña dirigida contra mandos con acceso a sistemas de simulación y datos operativos.', severity: 'MEDIA', icon: '▷', color: '#ffdd00' },
  { id: 'desinf', label: 'Operación de Desinformación', desc: 'Campaña coordinada para socavar la confianza en tecnologías de transformación digital.', severity: 'MEDIA', icon: '◌', color: '#aaaaff' },
]

const resources = [
  { id: 'cert', label: 'Equipo CERT-Defensa', desc: 'Respuesta técnica especializada', capacity: 2 },
  { id: 'intel', label: 'Unidad de Ciberinteligencia', desc: 'Análisis y atribución de amenazas', capacity: 1 },
  { id: 'legal', label: 'Asesoría Legal & Compliance', desc: 'Marco regulatorio y notificaciones', capacity: 2 },
  { id: 'comms', label: 'Comunicación Institucional', desc: 'Gestión de crisis y reputación', capacity: 1 },
]

export default function ThreatClassifier({ onComplete }) {
  const [phase, setPhase] = useState('classify') // classify | allocate | result
  const [priority, setPriority] = useState([])
  const [allocation, setAllocation] = useState({})

  const isSelected = (id) => priority.includes(id)
  const rank = (id) => priority.indexOf(id) + 1

  const toggleThreat = (id) => {
    if (priority.includes(id)) {
      setPriority(priority.filter(p => p !== id))
    } else if (priority.length < 3) {
      setPriority([...priority, id])
    }
  }

  const toggleAlloc = (threatId, resourceId) => {
    setAllocation(prev => {
      const current = prev[threatId] || []
      return {
        ...prev,
        [threatId]: current.includes(resourceId)
          ? current.filter(r => r !== resourceId)
          : [...current, resourceId]
      }
    })
  }

  const calcScore = () => {
    let score = 0
    // Correct prioritization: apt=100, ransomware+insider=high, supply=mid
    const idealOrder = ['apt', 'ransomware', 'insider']
    priority.forEach((id, i) => {
      if (idealOrder[i] === id) score += 33
      else if (idealOrder.includes(id)) score += 15
    })
    // Resource allocation bonus
    const aptAlloc = allocation['apt'] || []
    if (aptAlloc.includes('cert') && aptAlloc.includes('intel')) score += 10
    return Math.min(score, 100)
  }

  return (
    <div style={{ maxWidth: '1920px', width: '100%', margin: '0 auto' }}>

      {phase === 'classify' && (
        <div>
          <div style={{ fontFamily: FONT, fontSize: '19.5px', color: RED, letterSpacing: '4.5px', marginBottom: '18px' }}>// AMENAZAS ACTIVAS DETECTADAS — CLASIFICACIÓN REQUERIDA</div>
          <div style={{ fontFamily: FONT, fontSize: '42px', letterSpacing: '4.5px', color: ACCENT, marginBottom: '27px', textTransform: 'uppercase' }}>CENTRO DE OPERACIONES DE SEGURIDAD</div>
          <div style={{ fontFamily: FONT, fontSize: '22.5px', color: TEXT2, marginBottom: '54px', lineHeight: 1.7, letterSpacing: '0.75px' }}>
            SE HAN DETECTADO 6 AMENAZAS ACTIVAS EN EL ECOSISTEMA DIGITAL DE DEFENSA.<br/>SELECCIONE LAS 3 QUE REQUIEREN RESPUESTA PRIORITARIA SEGÚN SU CRITERIO ESTRATÉGICO.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px', fontFamily: FONT }}>
            <div style={{ padding: '9px 21px', fontSize: '22.5px', letterSpacing: '3px', background: priority.length >= 3 ? 'rgba(0,255,65,0.08)' : 'rgba(0,255,65,0.03)', border: `1.5px solid ${priority.length >= 3 ? `${ACCENT}55` : BORDER}`, color: ACCENT, transition: 'all 0.3s' }}>
              {priority.length}/3 SELECCIONADAS
            </div>
            {priority.length >= 3 && (
              <span style={{ fontSize: '13.5px', color: TEXT2, letterSpacing: '3px' }}>▶ ORDEN DE PRIORIDAD DEFINIDO</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {threats.map(threat => {
              const sel = isSelected(threat.id)
              const r = rank(threat.id)
              return (
                <button key={threat.id} onClick={() => toggleThreat(threat.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '21px', padding: '36px',
                    textAlign: 'left', width: '100%',
                    background: sel ? 'rgba(0,255,65,0.05)' : '#070707',
                    border: `2.25px solid ${sel ? `${ACCENT}55` : BORDER}`,
                    color: TEXT2, cursor: priority.length >= 3 && !sel ? 'not-allowed' : 'pointer',
                    opacity: priority.length >= 3 && !sel ? 0.3 : 1,
                    transition: 'all 0.12s', fontFamily: FONT,
                    boxShadow: sel ? `inset 0 0 30px rgba(0,255,65,0.03)` : 'none'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', flexShrink: 0, border: `1.5px solid ${sel ? ACCENT : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sel ? '18px' : '24px', color: sel ? ACCENT : TEXT2 }}>
                    {sel ? `#${r}` : threat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '24px', letterSpacing: '1.5px', color: sel ? ACCENT : TEXT2 }}>{threat.label.toUpperCase()}</span>
                      <span style={{ fontSize: '18px', padding: '3px 12px', letterSpacing: '1.5px', color: threat.severity === 'CRÍTICA' ? RED : AMBER, border: `1.5px solid ${threat.severity === 'CRÍTICA' ? RED : AMBER}44` }}>{threat.severity}</span>
                    </div>
                    <p style={{ fontSize: '21px', color: 'rgba(0,255,65,0.28)', lineHeight: 1.6, margin: 0, letterSpacing: '0.45px' }}>{threat.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <button onClick={() => setPhase('allocate')} disabled={priority.length < 3}
            style={{ ...S.btnPrimary, opacity: priority.length < 3 ? 0.3 : 1, cursor: priority.length < 3 ? 'not-allowed' : 'pointer' }}>
            ASIGNAR RECURSOS <ChevronRight size={21} />
          </button>
        </div>
      )}

      {phase === 'allocate' && (
        <div>
          <div style={{ fontFamily: FONT, fontSize: '19.5px', color: TEXT2, letterSpacing: '4.5px', marginBottom: '18px' }}>// ASIGNACIÓN DE RECURSOS</div>
          <div style={{ fontFamily: FONT, fontSize: '42px', letterSpacing: '4.5px', color: ACCENT, marginBottom: '45px', textTransform: 'uppercase' }}>DESPLIEGUE DE CAPACIDADES</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {priority.map((id, rankIdx) => {
              const threat = threats.find(t => t.id === id)
              const alloc = allocation[id] || []
              return (
                <div key={id} style={{ ...CARD, borderLeft: `2px solid ${ACCENT}44` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px', fontFamily: FONT }}>
                    <span style={{ fontSize: '19.5px', color: ACCENT, letterSpacing: '3px' }}>PRIORIDAD #{rankIdx + 1}</span>
                    <span style={{ fontSize: '24px', color: TEXT2, letterSpacing: '1.5px' }}>{threat.label.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {resources.map(res => {
                      const sel = alloc.includes(res.id)
                      return (
                        <button key={res.id} onClick={() => toggleAlloc(id, res.id)}
                          style={{ padding: '18px 24px', fontSize: '24px', letterSpacing: '1.5px', background: sel ? 'rgba(0,255,65,0.08)' : '#070707', border: `1.5px solid ${sel ? `${ACCENT}55` : BORDER}`, color: sel ? ACCENT : TEXT2, cursor: 'pointer', transition: 'all 0.12s', fontFamily: FONT }}
                        >
                          {res.label.toUpperCase()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={() => setPhase('result')} style={S.btnPrimary}>
            GENERAR ANÁLISIS <ChevronRight size={21} />
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div>
          <div style={{ fontFamily: FONT, fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '12px' }}>// VISIÓN ESTRATÉGICA DE RIESGOS</div>
          <div style={{ fontFamily: FONT, fontSize: '18px', letterSpacing: '3px', color: ACCENT, marginBottom: '12px', textTransform: 'uppercase' }}>ANÁLISIS DE AMENAZAS</div>
          <div style={{ fontFamily: FONT, fontSize: '15px', color: TEXT2, marginBottom: '36px', letterSpacing: '1px' }}>BASADO EN CRITERIO DE PRIORIZACIÓN Y ASIGNACIÓN DE RECURSOS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {priority.map((id, rankIdx) => {
              const threat = threats.find(t => t.id === id)
              const alloc = allocation[id] || []
              const allocResources = resources.filter(r => alloc.includes(r.id))
              const isOptimal = id === 'apt' && rankIdx === 0
              return (
                <div key={id} style={{ ...CARD, borderLeft: `2px solid ${rankIdx === 0 ? RED : rankIdx === 1 ? AMBER : ACCENT}55`, fontFamily: FONT }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '30px', color: rankIdx === 0 ? RED : rankIdx === 1 ? AMBER : ACCENT, lineHeight: 1, minWidth: '32px' }}>#{rankIdx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', letterSpacing: '1px', color: TEXT2 }}>{threat.label.toUpperCase()}</span>
                        {isOptimal && <span style={{ fontSize: '8px', padding: '2px 6px', border: `1px solid ${ACCENT}44`, color: ACCENT, letterSpacing: '1px' }}>PRIORIZACIÓN ÓPTIMA</span>}
                      </div>
                      <p style={{ fontSize: '11px', color: 'rgba(0,255,65,0.3)', lineHeight: 1.6, margin: '0 0 8px', letterSpacing: '0.3px' }}>{threat.desc}</p>
                      {allocResources.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {allocResources.map(r => (
                            <span key={r.id} style={{ fontSize: '9px', padding: '2px 8px', border: `1px solid ${ACCENT}33`, color: TEXT2, letterSpacing: '1px' }}>{r.label.toUpperCase()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={() => onComplete({ type: 'threats', score: calcScore(), priorities: priority })} style={S.btnPrimary}>
            CONTINUAR AL INFORME <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
