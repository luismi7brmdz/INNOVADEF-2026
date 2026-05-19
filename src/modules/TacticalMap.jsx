import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronRight, Crosshair } from 'lucide-react'
import { ACCENT, AMBER, RED, BORDER, CARD, TEXT2, FONT, S } from '../theme'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const W = 1200, H = 640
const GRN = '#00FF41', RD = '#FF2B2B', AM = '#FFAA00', BL = '#00AAFF', PU = '#CC44FF'

// Base targets on the map (to protect)
const BASES = [
  { id: 'HQ',   x: 600, y: 320, r: 26, label: 'HQ',      color: GRN },
  { id: 'COM',  x: 280, y: 190, r: 20, label: 'COM-W',   color: BL  },
  { id: 'COM2', x: 920, y: 190, r: 20, label: 'COM-E',   color: BL  },
  { id: 'LOG',  x: 280, y: 450, r: 20, label: 'LOG-SW',  color: AM  },
  { id: 'LOG2', x: 920, y: 450, r: 20, label: 'LOG-SE',  color: AM  },
]

// Spawn zones (edges of map)
const SPAWN_ZONES = [
  { x: 80,  y: 80  }, { x: 1120, y: 80  },
  { x: 80,  y: 560 }, { x: 1120, y: 560 },
  { x: 80,  y: 320 }, { x: 1120, y: 320 },
  { x: 600, y: 40  }, { x: 600,  y: 600 },
]

// Interceptor unit (player controlled)
const UNIT_COLORS = [GRN, BL, AM, PU]

function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) }
function lerp(a, b, t) { return a + (b - a) * t }

function buildWave(waveNum) {
  const threats = []
  const count = 3 + waveNum * 2
  for (let i = 0; i < count; i++) {
    const spawnIdx = Math.floor(Math.random() * SPAWN_ZONES.length)
    const targetIdx = Math.floor(Math.random() * BASES.length)
    const spd = 40 + waveNum * 8 + Math.random() * 12
    const sz = SPAWN_ZONES[spawnIdx]
    threats.push({
      id: Math.random(),
      x: sz.x + (Math.random() - 0.5) * 20,
      y: sz.y + (Math.random() - 0.5) * 20,
      target: BASES[targetIdx],
      spd, hp: waveNum >= 3 && Math.random() < 0.3 ? 2 : 1,
      mhp: waveNum >= 3 && Math.random() < 0.3 ? 2 : 1,
      alive: true, r: 10, flashT: 0,
      delay: i * Math.max(0.4, 1.2 - waveNum * 0.1),
      spawned: false,
    })
  }
  return threats
}

function initUnits(count) {
  const positions = [
    { x: 600, y: 320 }, { x: 450, y: 260 }, { x: 750, y: 260 }, { x: 600, y: 430 }
  ]
  return positions.slice(0, count).map((p, i) => ({
    id: i, x: p.x, y: p.y, tx: p.x, ty: p.y,
    color: UNIT_COLORS[i], label: `U-0${i + 1}`,
    r: 13, moving: false, intercepting: false,
  }))
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function TacticalMap({ onComplete }) {
  const [phase, setPhase] = useState('intro')
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const rafRef = useRef(null)
  const lastRef = useRef(null)
  const dragRef = useRef(null) // { unitId }
  const [display, setDisplay] = useState({ score: 0, lives: 5, wave: 1, intercepted: 0 })
  const [finalScore, setFinalScore] = useState(0)
  const [finalStats, setFinalStats] = useState({ intercepted: 0, wave: 1 })

  const initState = useCallback(() => ({
    score: 0, lives: 5, wave: 1, intercepted: 0,
    threats: buildWave(1),
    units: initUnits(4),
    particles: [],
    waveOver: false, waveOT: 0,
    phase: 'playing',
    scanA: 0, elapsed: 0,
    explosions: [],
  }), [])

  const burst = (particles, x, y, col, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n + Math.random() * 0.5
      const s = 45 + Math.random() * 70
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2.5 + Math.random() * 3, col, life: 0.7 + Math.random() * 0.3 })
    }
  }

  useEffect(() => {
    if (phase !== 'game') return
    const canvas = canvasRef.current
    if (!canvas) return
    const st = initState()
    stateRef.current = st
    lastRef.current = null
    dragRef.current = null

    // Mouse events for drag
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) * (W / rect.width),
        y: (e.clientY - rect.top) * (H / rect.height),
      }
    }

    const onDown = (e) => {
      const { x, y } = getPos(e)
      const st = stateRef.current
      if (!st || st.phase !== 'playing') return
      // Find closest unit
      let closest = null, minD = 30
      st.units.forEach(u => {
        const d = dist({ x, y }, u)
        if (d < minD) { minD = d; closest = u }
      })
      if (closest) dragRef.current = { unitId: closest.id, ox: x - closest.x, oy: y - closest.y }
    }

    const onMove = (e) => {
      if (!dragRef.current) return
      const { x, y } = getPos(e)
      const st = stateRef.current
      if (!st) return
      const unit = st.units.find(u => u.id === dragRef.current.unitId)
      if (unit) {
        unit.tx = Math.max(unit.r, Math.min(W - unit.r, x))
        unit.ty = Math.max(unit.r, Math.min(H - unit.r, y))
        unit.moving = true
      }
    }

    const onUp = () => { dragRef.current = null }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onUp)

    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05)
      lastRef.current = ts
      const st = stateRef.current
      if (!st) return

      if (st.phase === 'playing') {
        st.scanA += dt * 0.5
        st.elapsed += dt

        // Move units toward target
        st.units.forEach(u => {
          const dx = u.tx - u.x, dy = u.ty - u.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d > 2) {
            const spd = 180
            u.x += (dx / d) * spd * dt
            u.y += (dy / d) * spd * dt
            u.moving = true
          } else { u.x = u.tx; u.y = u.ty; u.moving = false }
        })

        // Spawn threats
        st.threats.forEach(t => {
          if (!t.spawned) { t.delay -= dt; if (t.delay <= 0) t.spawned = true }
          if (!t.spawned || !t.alive) return
          if (t.flashT > 0) t.flashT -= dt
          const dx = t.target.x - t.x, dy = t.target.y - t.y
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          t.x += (dx / d) * t.spd * dt
          t.y += (dy / d) * t.spd * dt

          // Check intercept with units
          st.units.forEach(u => {
            if (!t.alive) return
            if (dist(u, t) < u.r + t.r - 2) {
              t.hp--; t.flashT = 0.2
              if (t.hp <= 0) {
                t.alive = false
                st.intercepted++
                st.score += 15 * t.mhp
                burst(st.particles, t.x, t.y, AM, 10)
                st.explosions.push({ x: t.x, y: t.y, r: 0, maxR: 35, life: 0.5 })
              }
            }
          })

          // Reached target?
          if (dist(t, t.target) < t.target.r + t.r) {
            t.alive = false; st.lives--
            burst(st.particles, t.target.x, t.target.y, RD, 16)
            st.explosions.push({ x: t.target.x, y: t.target.y, r: 0, maxR: 55, life: 0.7, col: RD })
            if (st.lives <= 0) st.phase = 'over'
          }
        })

        // Explosions
        st.explosions.forEach(ex => {
          ex.r = lerp(ex.r, ex.maxR, 0.15)
          ex.life -= dt
        })
        st.explosions = st.explosions.filter(ex => ex.life > 0)

        // Particles
        st.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.r *= 0.94 })
        st.particles = st.particles.filter(p => p.life > 0)

        // Wave check
        const allDone = st.threats.every(t => !t.alive || (t.spawned === false && t.delay > 0))
        const allSpawned = st.threats.every(t => t.spawned || t.delay <= 0)
        if (!st.waveOver && allSpawned && st.threats.filter(t => t.alive).length === 0) {
          st.waveOver = true; st.waveOT = 2.2
        }
        if (st.waveOver) {
          st.waveOT -= dt
          if (st.waveOT <= 0) {
            st.wave++; st.score += st.wave * 100
            if (st.wave <= 6) { st.threats = buildWave(st.wave); st.waveOver = false }
            else st.phase = 'win'
          }
        }
      }

      setDisplay({ score: st.score, lives: st.lives, wave: st.wave, intercepted: st.intercepted })
      drawMap(st, canvas)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp)
      cancelAnimationFrame(rafRef.current)
    }
  }, [phase, initState])

  // Watch for end
  useEffect(() => {
    if (phase !== 'game') return
    const interval = setInterval(() => {
      const st = stateRef.current
      if (st && (st.phase === 'over' || st.phase === 'win')) {
        setFinalScore(st.score)
        setFinalStats({ intercepted: st.intercepted, wave: Math.min(st.wave, 6) })
        cancelAnimationFrame(rafRef.current)
        setPhase('result')
      }
    }, 200)
    return () => clearInterval(interval)
  }, [phase])

  const rank = finalScore >= 1500 ? 'MANDO ÉLITE' : finalScore >= 800 ? 'OFICIAL DE OPERACIONES' : finalScore >= 350 ? 'SUBOFICIAL' : 'CADETE'
  const rankColor = finalScore >= 1500 ? GRN : finalScore >= 800 ? AM : finalScore >= 350 ? BL : RD

  return (
    <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', fontFamily: FONT }}>

      {phase === 'intro' && (
        <div>
          <div style={{ fontSize: '15px', letterSpacing: '3px', color: TEXT2, marginBottom: '12px' }}>// MOD-07 — SIMULADOR DE MANDO</div>
          <div style={{ fontSize: 'clamp(30px, 3vw, 50px)', letterSpacing: '4px', color: ACCENT, marginBottom: '32px' }}>
            SALA DE GUERRA — MANDO TÁCTICO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ ...CARD, borderLeft: `2px solid ${ACCENT}44` }}>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '10px' }}>// MISIÓN</div>
              <p style={{ fontSize: '15px', color: TEXT2, lineHeight: 1.8, margin: 0 }}>
                FUERZAS HOSTILES AVANZAN HACIA INSTALACIONES CRÍTICAS. DESPLIEGUE SUS UNIDADES DE INTERCEPTACIÓN. ARRASTRE LAS UNIDADES AZULES PARA BLOQUEAR LAS AMENAZAS ANTES DE QUE ALCANCEN LOS OBJETIVOS.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'MECÁNICA', val: 'ARRASTRA UNIDADES PARA INTERCEPTAR' },
                { label: 'OBJETIVOS', val: 'HQ + 4 INSTALACIONES CRÍTICAS' },
                { label: 'OLEADAS', val: '6 OLEADAS CON ESCALADA PROGRESIVA' },
                { label: 'VIDAS', val: '5 IMPACTOS PERMITIDOS EN INSTALACIONES' },
              ].map(r => (
                <div key={r.label} style={{ ...CARD, padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: TEXT2, letterSpacing: '2px', minWidth: '110px' }}>{r.label}:</span>
                  <span style={{ fontSize: '14px', color: ACCENT }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setPhase('game')} style={{ ...S.btnPrimary, gap: '12px' }}>
            <Crosshair size={14} /> ASUMIR EL MANDO <ChevronRight size={14} />
          </button>
        </div>
      )}

      {phase === 'game' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: 'OLEADA', val: `${display.wave}/6`, color: AM },
              { label: 'PUNTOS', val: display.score, color: ACCENT },
              { label: 'IMPACTOS', val: '■'.repeat(display.lives) + '□'.repeat(Math.max(0, 5 - display.lives)), color: display.lives <= 2 ? RD : ACCENT },
              { label: 'INTERCEPTADOS', val: display.intercepted, color: BL },
            ].map(h => (
              <div key={h.label} style={{ ...CARD, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: TEXT2, letterSpacing: '2px', marginBottom: '5px' }}>{h.label}</div>
                <div style={{ fontSize: '20px', color: h.color, letterSpacing: '2px' }}>{h.val}</div>
              </div>
            ))}
          </div>
          <canvas ref={canvasRef} width={W} height={H}
            style={{ display: 'block', width: '100%', cursor: 'grab', border: `1px solid ${BORDER}`, background: '#050505' }} />
          <div style={{ fontSize: '14px', color: TEXT2, letterSpacing: '2px', textAlign: 'center', marginTop: '10px', opacity: 0.7 }}>
            ARRASTRA LAS UNIDADES VERDES/AZULES PARA INTERCEPTAR LAS AMENAZAS ROJAS
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '3px', color: TEXT2, marginBottom: '16px' }}>// DEBRIEFING — EVALUACIÓN DE MANDO</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ ...CARD, borderLeft: `2px solid ${rankColor}66`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px' }}>PUNTUACIÓN FINAL</div>
              <div style={{ fontSize: '56px', color: rankColor, lineHeight: 1, textShadow: `0 0 30px ${rankColor}44` }}>{finalScore}</div>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px' }}>RANGO ASIGNADO</div>
              <div style={{ fontSize: '18px', letterSpacing: '3px', color: rankColor }}>{rank}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'AMENAZAS INTERCEPTADAS', val: finalStats.intercepted },
                { label: 'OLEADAS COMPLETADAS', val: `${finalStats.wave}/6` },
                { label: 'INSTALACIONES PROTEGIDAS', val: `${Math.max(0, display.lives)}/5` },
                { label: 'ÍNDICE DE MANDO', val: `${Math.min(100, Math.round(finalScore / 25))}%` },
              ].map(r => (
                <div key={r.label} style={{ ...CARD, padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px' }}>{r.label}</span>
                  <span style={{ fontSize: '14px', color: ACCENT }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => onComplete({ type: 'tactical-map', score: finalScore, rank })} style={S.btnPrimary}>
            CONTINUAR AL INFORME <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function drawMap(st, canvas) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H)

  // Grid / terrain
  ctx.strokeStyle = 'rgba(0,255,65,0.03)'; ctx.lineWidth = 1
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  // Threat path predictions (faint lines)
  st.threats.forEach(t => {
    if (!t.alive || !t.spawned) return
    ctx.strokeStyle = 'rgba(255,43,43,0.08)'; ctx.lineWidth = 1; ctx.setLineDash([4, 8])
    ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.target.x, t.target.y); ctx.stroke()
  })
  ctx.setLineDash([])

  // Radar from HQ
  const hq = BASES[0]
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400)
  ;[80, 160, 240].forEach(r => {
    ctx.beginPath(); ctx.arc(hq.x, hq.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,255,65,0.03)'; ctx.lineWidth = 1; ctx.stroke()
  })
  ctx.save(); ctx.translate(hq.x, hq.y); ctx.rotate(st.scanA)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 240, -0.4, 0.4)
  ctx.fillStyle = 'rgba(0,255,65,0.04)'; ctx.fill(); ctx.restore()

  // Bases
  BASES.forEach(b => {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 6 + pulse * 3, 0, Math.PI * 2)
    ctx.strokeStyle = `${b.color}22`; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fillStyle = `${b.color}12`; ctx.fill()
    ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = b.color; ctx.font = `bold 9px "Share Tech Mono", monospace`; ctx.textAlign = 'center'
    ctx.fillText(b.label, b.x, b.y + 3)
  })

  // Explosions
  st.explosions.forEach(ex => {
    const col = ex.col || AM
    ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2)
    ctx.strokeStyle = `${col}${Math.floor(ex.life * 200).toString(16).padStart(2, '0')}`
    ctx.lineWidth = 2; ctx.stroke()
  })

  // Threats
  st.threats.forEach(t => {
    if (!t.alive || !t.spawned) return
    const fl = t.flashT > 0 && Math.sin(t.flashT * 35) > 0
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2)
    ctx.fillStyle = fl ? '#fff' : (t.hp > 1 ? '#FF6600' : RD); ctx.fill()
    ctx.strokeStyle = t.hp > 1 ? AM : 'rgba(255,80,80,0.8)'; ctx.lineWidth = 1.5; ctx.stroke()
    if (t.mhp > 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(t.x - t.r, t.y - t.r - 7, t.r * 2, 4)
      ctx.fillStyle = '#FF6600'; ctx.fillRect(t.x - t.r, t.y - t.r - 7, t.r * 2 * (t.hp / t.mhp), 4)
    }
    ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    // Direction arrow
    const dx = t.target.x - t.x, dy = t.target.y - t.y, dd = Math.sqrt(dx * dx + dy * dy) || 1
    ctx.strokeStyle = 'rgba(255,43,43,0.4)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(t.x + dx / dd * (t.r + 2), t.y + dy / dd * (t.r + 2))
    ctx.lineTo(t.x + dx / dd * (t.r + 10), t.y + dy / dd * (t.r + 10)); ctx.stroke()
  })

  // Particles
  st.particles.forEach(p => {
    const alpha = Math.floor(Math.max(0, p.life) * 220).toString(16).padStart(2, '0')
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2)
    ctx.fillStyle = p.col + alpha; ctx.fill()
  })

  // Units
  st.units.forEach(u => {
    // Intercept radius ring
    ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 14, 0, Math.PI * 2)
    ctx.strokeStyle = `${u.color}22`; ctx.lineWidth = 1; ctx.stroke()
    // Body
    ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2)
    ctx.fillStyle = `${u.color}18`; ctx.fill()
    ctx.strokeStyle = u.color; ctx.lineWidth = 2; ctx.stroke()
    // Target line when moving
    if (u.moving || dist(u, { x: u.tx, y: u.ty }) > 4) {
      ctx.strokeStyle = `${u.color}33`; ctx.lineWidth = 1; ctx.setLineDash([4, 6])
      ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(u.tx, u.ty); ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.fillStyle = u.color; ctx.font = `bold 9px "Share Tech Mono", monospace`; ctx.textAlign = 'center'
    ctx.fillText(u.label, u.x, u.y + 3)
  })

  // Wave messages
  if (st.waveOver && st.waveOT > 0) {
    const a = Math.min(1, st.waveOT * 1.5)
    ctx.fillStyle = `rgba(0,255,65,${a})`; ctx.font = `bold 22px "Share Tech Mono", monospace`; ctx.textAlign = 'center'
    ctx.fillText(`■ ZONA ASEGURADA — OLEADA ${st.wave - 1} ■`, W / 2, H / 2 - 12)
    ctx.fillStyle = `rgba(255,170,0,${a})`; ctx.font = `13px "Share Tech Mono", monospace`
    ctx.fillText(`+${st.wave * 100} PTS DE MANDO`, W / 2, H / 2 + 16)
  }
  if (st.phase === 'over') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = RD; ctx.font = `bold 26px "Share Tech Mono", monospace`; ctx.textAlign = 'center'
    ctx.fillText('// INSTALACIONES COMPROMETIDAS //', W / 2, H / 2 - 18)
    ctx.fillStyle = 'rgba(255,43,43,0.6)'; ctx.font = `12px "Share Tech Mono", monospace`
    ctx.fillText('COMPILANDO INFORME DE MANDO...', W / 2, H / 2 + 18)
  }
  if (st.phase === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = GRN; ctx.font = `bold 24px "Share Tech Mono", monospace`; ctx.textAlign = 'center'
    ctx.fillText('// OPERACIÓN COMPLETADA — MANDO ÉLITE //', W / 2, H / 2 - 18)
    ctx.fillStyle = 'rgba(0,255,65,0.6)'; ctx.font = `12px "Share Tech Mono", monospace`
    ctx.fillText('COMPILANDO INFORME DE MANDO...', W / 2, H / 2 + 18)
  }
}
