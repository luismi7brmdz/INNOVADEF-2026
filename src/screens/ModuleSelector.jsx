import { useState, useEffect, useRef } from 'react'
import { ACCENT, AMBER, BORDER, TEXT2, FONT } from '../theme'
import { sfxBootHeader, sfxHudScan, sfxCardAppear, sfxModuleSelect, sfxHover, sfxRadarPing, hasUserInteracted } from '../sfx'
import { PLUGIN_REGISTRY } from '../plugins/registry'
import Panel from '../components/Panel'
import HudScanLine from '../components/HudScanLine'

const MODULES = PLUGIN_REGISTRY

export default function ModuleSelector({ onSelect, bootStage = 4 }) {
  const [hovered, setHovered] = useState(null)
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

  useEffect(() => {
    const i = setInterval(() => {
      if (hasUserInteracted()) sfxRadarPing()
    }, 15000)
    return () => clearInterval(i)
  }, [])

  const vis = (minStage, delay = 0) => ({
    opacity: bootStage >= minStage ? 1 : 0,
    transform: bootStage >= minStage ? 'translateY(0) scaleY(1)' : 'translateY(-18px) scaleY(0.92)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.67s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    transformOrigin: 'top',
  })

  const byCategory = {}
  MODULES.forEach(mod => {
    if (!byCategory[mod.category]) byCategory[mod.category] = []
    byCategory[mod.category].push(mod)
  })

  let globalIdx = 0

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>

      <HudScanLine active={bootStage === 3} />

      {/* System info panels */}
      <div className="info-panels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(10px, 1.5vw, 16px)', marginBottom: 'clamp(18px, 3vw, 36px)' }}>
        <style>{`
          @media (max-width: 900px) {
            .info-panels-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        {[
          {
            label: '// SISTEMA',
            content: (
              <div style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)', fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', lineHeight: 2.0, color: TEXT2 }}>
                <div>PLATFORM: <span style={{ color: ACCENT }}>INNOVADEF-KIOSK v2.0</span></div>
                <div>OPERATOR: <span style={{ color: ACCENT }}>FOCO-2026-OPERATOR</span></div>
                <div>LOCATION: <span style={{ color: AMBER }}>MADRID // 40°25'N 3°41'W</span></div>
              </div>
            ),
          },
          {
            label: '// SISTEMAS',
            content: (
              <div style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)', fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', lineHeight: 2.0 }}>
                {[
                  { label: 'RED ENS',  val: 'CONECTADA', c: ACCENT },
                  { label: 'CIFRADO',  val: 'AES-256 OK', c: ACCENT },
                  { label: 'SERVIDOR', val: 'NOMINAL',    c: ACCENT },
                ].map(r => (
                  <div key={r.label}>
                    <span style={{ color: TEXT2 }}>{r.label}: </span>
                    <span style={{ color: r.c }}>▮ {r.val}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            label: '// TELEMETRÍA',
            content: (
              <div style={{ padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px)', fontFamily: FONT, fontSize: 'clamp(10px, 1.2vw, 14px)', lineHeight: 2.0, color: TEXT2 }}>
                <div>EVALUACIONES HOY: <span style={{ color: AMBER }}>47</span></div>
                <div>MÓDULO + ACTIVO: <span style={{ color: ACCENT }}>MOD-01</span></div>
                <div>SESIÓN ACTUAL: <span style={{ color: ACCENT }}>FOCO-{Date.now().toString(36).toUpperCase().slice(-6)}</span></div>
              </div>
            ),
          },
        ].map((p, i) => (
          <div key={i} style={{ ...vis(3, i * 180) }}>
            <Panel label={p.label}>{p.content}</Panel>
          </div>
        ))}
      </div>

      {/* Title */}
      <div style={{
        marginBottom: 'clamp(20px, 3vw, 40px)',
        borderBottom: `1.5px solid ${BORDER}`,
        paddingBottom: 'clamp(12px, 2vw, 22px)',
        ...vis(3, 540),
      }}>
        <div style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 27px)', color: TEXT2, letterSpacing: 'clamp(3px, 0.6vw, 5px)', marginBottom: 'clamp(18px, 3vw, 33px)' }}>
          // SISTEMA DE EVALUACIÓN INTERACTIVA — SELECCIONE MÓDULO DE OPERACIÓN
        </div>
        <div style={{ fontFamily: FONT, fontSize: 'clamp(28px, 5vw, 80px)', letterSpacing: 'clamp(3px, 0.8vw, 6px)', color: ACCENT, textShadow: `0 0 60px ${ACCENT}33`, lineHeight: 1.1 }}>
          CENTRO DE OPERACIONES<br />
          <span style={{ color: TEXT2, fontSize: '65%' }}>INNOVADEF FOCO 2026 — MADRID</span>
        </div>
      </div>

      {/* Module groups */}
      {Object.entries(byCategory).map(([cat, mods], catIdx) => (
        <div key={cat} style={{ marginBottom: 'clamp(20px, 3vw, 40px)' }}>

          {/* Category header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)',
            marginBottom: 'clamp(10px, 1.5vw, 16px)',
            ...vis(3, 660 + catIdx * 80),
          }}>
            <div style={{ height: '1px', background: BORDER, flex: 1 }} />
            <span style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2vw, 19px)', color: TEXT2, letterSpacing: 'clamp(3px, 0.6vw, 5px)', textTransform: 'uppercase' }}>
              // {cat.toUpperCase()}
            </span>
            <div style={{ height: '1px', background: BORDER, flex: 1 }} />
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(320px, 42vw, 560px), 1fr))', gap: 'clamp(12px, 1.5vw, 20px)', alignItems: 'stretch' }}>
            {mods.map(mod => {
              const idx = globalIdx++
              const Icon = mod.icon
              const isH = hovered === mod.id
              return (
                <div key={mod.id} style={{ ...vis(3, 720 + idx * 150), height: '100%' }}>
                  <button
                    onClick={() => { sfxModuleSelect(); onSelect(mod.id) }}
                    onMouseEnter={() => { sfxHover(); setHovered(mod.id) }}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      padding: 0, width: '100%', height: '100%',
                      background: isH ? 'rgba(255,170,0,0.03)' : '#070707',
                      border: `1.5px solid ${isH ? '#ffaa0055' : BORDER}`,
                      color: ACCENT, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.18s',
                      boxShadow: isH ? '0 0 0 1.5px #ffaa0022, inset 0 0 45px rgba(255,170,0,0.02)' : 'none',
                    }}
                  >
                    {/* Header bar */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 'clamp(12px, 2vw, 18px) clamp(16px, 3vw, 28px)',
                      borderBottom: `1.5px solid ${isH ? '#ffaa0033' : BORDER}`,
                      background: isH ? 'rgba(255,170,0,0.04)' : '#0a0a0a',
                    }}>
                      <div style={{ display: 'flex', gap: 'clamp(8px, 1.2vw, 14px)', alignItems: 'center' }}>
                        <Icon size={20} color={isH ? '#ffaa00' : TEXT2} />
                        <span style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 26px)', color: TEXT2, letterSpacing: 'clamp(2px, 0.6vw, 3px)' }}>
                          {mod.code}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: FONT, fontSize: 'clamp(15px, 2vw, 22px)', letterSpacing: 'clamp(2px, 0.6vw, 3px)',
                          color: isH ? '#ffaa00' : TEXT2,
                          padding: '2px 8px',
                          border: `1.5px solid ${isH ? '#ffaa0044' : BORDER}`,
                        }}>
                          {mod.tag}
                        </span>
                        <span style={{
                          width: 'clamp(6px, 0.8vw, 9px)', height: 'clamp(6px, 0.8vw, 9px)',
                          background: isH ? '#ffaa00' : ACCENT,
                          display: 'inline-block',
                          boxShadow: isH ? '0 0 12px #ffaa00' : `0 0 12px ${ACCENT}`,
                          animation: 'blink 3s infinite',
                        }} />
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{
                      padding: 'clamp(18px, 3.5vw, 30px) clamp(16px, 3vw, 28px)',
                      flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}>
                      <div style={{
                        fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 25px)', letterSpacing: 'clamp(1px, 0.3vw, 1.5px)',
                        color: isH ? '#ffaa00' : TEXT2,
                        marginBottom: 'clamp(8px, 1.2vw, 14px)', lineHeight: 1.3,
                      }}>
                        {mod.label}
                      </div>
                      <div style={{
                        fontFamily: FONT, fontSize: 'clamp(13px, 1.8vw, 22px)',
                        color: 'rgba(0,255,65,0.3)', lineHeight: 1.7,
                        letterSpacing: '0.75px', marginBottom: 'clamp(15px, 3vw, 27px)',
                      }}>
                        {mod.desc}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: FONT, fontSize: 'clamp(16px, 2.5vw, 25px)', color: 'rgba(0,255,65,0.25)', letterSpacing: 'clamp(1px, 0.3vw, 1.5px)' }}>
                          DURACIÓN: {mod.duration}
                        </span>
                        <span style={{ fontFamily: FONT, fontSize: 'clamp(17px, 2.5vw, 27px)', color: isH ? '#ffaa00' : TEXT2, letterSpacing: 'clamp(1px, 0.3vw, 1.5px)' }}>
                          {isH ? '[EJECUTAR ▶]' : '[──────]'}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        fontFamily: FONT, fontSize: 'clamp(9px, 1vw, 13px)',
        color: 'rgba(0,255,65,0.18)', letterSpacing: 'clamp(2px, 0.4vw, 3px)',
        textAlign: 'center',
        ...vis(3, 1500),
      }}>
        INNOVADEF FOCO 2026 // 23.06.2026 // MADRID // SISTEMA CERTIFICADO ENS-CAT-A
      </div>
    </div>
  )
}
