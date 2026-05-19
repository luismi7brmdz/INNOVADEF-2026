import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronRight, Shield, Trophy, Zap } from 'lucide-react'
import { ACCENT, AMBER, RED, BORDER, CARD, TEXT2, FONT, S } from '../theme'

// ─── LEADERBOARD (localStorage) ──────────────────────────────────────────────
const STORAGE_KEY = 'innovadef_cyberdefense_v2'

function getLeaderboard() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function saveScore(name, score, wave) {
  const board = getLeaderboard()
  const entry = {
    name: name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 18) || 'OPERATIVO',
    score, wave,
    date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    ts: Date.now(),
  }
  board.push(entry)
  board.sort((a, b) => b.score - a.score)
  const top = board.slice(0, 10)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(top)) } catch {}
  return top
}

// ─── ATTACKER TYPES ───────────────────────────────────────────────────────────
const TYPES = {
  normal:   { hp: 1, spd: 62,  r: 10, col: '#FF2B2B', pts: 10, label: 'NORMAL',   alpha: 1.0 },
  fast:     { hp: 1, spd: 130, r: 8,  col: '#FF00CC', pts: 20, label: 'RÁPIDO',   alpha: 1.0 },
  armored:  { hp: 3, spd: 48,  r: 15, col: '#FF8800', pts: 40, label: 'BLINDADO', alpha: 1.0 },
  splitter: { hp: 1, spd: 72,  r: 11, col: '#FFDD00', pts: 25, label: 'DIVISOR',  alpha: 1.0 },
  phantom:  { hp: 1, spd: 98,  r: 9,  col: '#AA44FF', pts: 35, label: 'FANTASMA', alpha: 0.28 },
}

// ─── WAVE CONFIGS ─────────────────────────────────────────────────────────────
// Each wave: pool of types to pick from (weighted), count spawned, interval between spawns
const WAVE_CFG = [
  { n: 7,  interval: 1.6, pool: ['normal','normal','normal'],                           speedM: 1.0 }, // fácil
  { n: 10, interval: 1.2, pool: ['normal','normal','fast'],                             speedM: 1.1 }, // aparece rápido
  { n: 13, interval: 1.0, pool: ['normal','fast','armored'],                            speedM: 1.2 }, // aparece blindado
  { n: 16, interval: 0.8, pool: ['normal','fast','fast','armored','splitter'],          speedM: 1.35 }, // divisores
  { n: 20, interval: 0.6, pool: ['fast','fast','armored','splitter','phantom'],         speedM: 1.55 }, // fantasmas
  { n: 25, interval: 0.42, pool: ['fast','fast','fast','armored','splitter','phantom'], speedM: 1.8  }, // muy difícil
  { n: 30, interval: 0.28, pool: ['fast','fast','splitter','splitter','phantom','phantom','armored'], speedM: 2.1 }, // casi imposible
  { n: 999, interval: 0.18, pool: ['fast','fast','fast','splitter','phantom','phantom'], speedM: 2.5 }, // imposible
]

// ─── TOPOLOGY ─────────────────────────────────────────────────────────────────
const W = 1200, H = 620
const GRN = '#00FF41', RD = '#FF2B2B', AM = '#FFAA00', BL = '#00AAFF', PU = '#AA44FF'

const SERVER = { x: 600, y: 310, r: 32 }
const GATES = [
  { id: 0, x: 600, y: 110, r: 18, label: 'GW-N'  },
  { id: 1, x: 600, y: 510, r: 18, label: 'GW-S'  },
  { id: 2, x: 980, y: 310, r: 18, label: 'GW-E'  },
  { id: 3, x: 220, y: 310, r: 18, label: 'GW-W'  },
  { id: 4, x: 860, y: 150, r: 15, label: 'RT-NE' },
  { id: 5, x: 340, y: 150, r: 15, label: 'RT-NW' },
  { id: 6, x: 860, y: 470, r: 15, label: 'RT-SE' },
  { id: 7, x: 340, y: 470, r: 15, label: 'RT-SW' },
]
const ENTRIES = [
  { x: 600, y: 2,   g: 0 }, { x: 600, y: 618, g: 1 },
  { x: 1198, y: 310, g: 2 }, { x: 2,   y: 310, g: 3 },
  { x: 1100, y: 20,  g: 4 }, { x: 100,  y: 20,  g: 5 },
  { x: 1100, y: 600, g: 6 }, { x: 100,  y: 600, g: 7 },
  { x: 1100, y: 310, g: 2 }, { x: 600, y: 20,  g: 0 },
]

// fast attackers can skip directly to server (no gateway stop)
const skipGate = (type) => type === 'fast'

function d2(a, b) { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }
function dist(a, b) { return Math.sqrt(d2(a, b)) }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function pickFromPool(pool) { return pool[Math.floor(Math.random() * pool.length)] }

function buildWaveQueue(waveIdx) {
  const cfg = WAVE_CFG[Math.min(waveIdx, WAVE_CFG.length - 1)]
  const q = []
  const count = Math.min(cfg.n, waveIdx >= 7 ? 40 : cfg.n)
  for (let i = 0; i < count; i++) {
    const type = pickFromPool(cfg.pool)
    const td = TYPES[type]
    const eIdx = Math.floor(Math.random() * ENTRIES.length)
    q.push({
      delay: i * cfg.interval,
      eIdx,
      type,
      spd: (td.spd + Math.random() * 12) * cfg.speedM,
      hp: td.hp,
    })
  }
  return q
}

function makeAttacker(cfg, gates) {
  const e = ENTRIES[cfg.eIdx]
  const td = TYPES[cfg.type]
  const gate = gates[e.g]
  return {
    id: Math.random(),
    x: e.x, y: e.y,
    gate,
    // fast enemies go directly to server
    phase: skipGate(cfg.type) ? 1 : 0,
    spd: cfg.spd,
    hp: cfg.hp, mhp: cfg.hp,
    r: td.r, col: td.col,
    type: cfg.type,
    pts: td.pts,
    alpha: td.alpha,
    alive: true, flashT: 0,
    vx: 0, vy: 0,
  }
}

function makeSplitChild(parent) {
  const angle = Math.random() * Math.PI * 2
  const spd = parent.spd * 1.3
  return {
    id: Math.random(),
    x: parent.x + Math.cos(angle) * 12,
    y: parent.y + Math.sin(angle) * 12,
    gate: parent.gate,
    phase: 1, // go straight to server
    spd, hp: 1, mhp: 1,
    r: 6, col: '#FFDD00',
    type: 'split_child',
    pts: 8,
    alpha: 1.0,
    alive: true, flashT: 0,
    vx: 0, vy: 0,
  }
}

function burst(particles, x, y, col, n, scale = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n + Math.random() * 0.7
    const s = (40 + Math.random() * 80) * scale
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: (2 + Math.random() * 3) * scale, col, life: 0.6 + Math.random() * 0.35 })
  }
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function draw(st, canvas) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#040404'; ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = 'rgba(0,255,65,0.03)'; ctx.lineWidth = 1
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  // Radar rings + sweep
  ;[95, 190, 290, 390].forEach(r => {
    ctx.beginPath(); ctx.arc(SERVER.x, SERVER.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,255,65,0.035)'; ctx.lineWidth = 1; ctx.stroke()
  })
  ctx.save(); ctx.translate(SERVER.x, SERVER.y); ctx.rotate(st.scanA)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 390, -0.45, 0.45)
  ctx.fillStyle = 'rgba(0,255,65,0.04)'; ctx.fill(); ctx.restore()

  // Edges
  ENTRIES.forEach(e => {
    const g = st.gates[e.g]
    ctx.strokeStyle = 'rgba(0,255,65,0.07)'; ctx.lineWidth = 1; ctx.setLineDash([3, 9])
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(g.x, g.y); ctx.stroke()
  })
  ctx.setLineDash([])
  st.gates.forEach(g => {
    ctx.strokeStyle = g.fw ? 'rgba(0,170,255,0.55)' : 'rgba(0,255,65,0.14)'
    ctx.lineWidth = g.fw ? 2 : 1
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(SERVER.x, SERVER.y); ctx.stroke()
  })

  // Gates
  st.gates.forEach(g => {
    if (g.fw) {
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r + 9, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,170,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
    }
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2)
    ctx.fillStyle = g.fw ? 'rgba(0,170,255,0.2)' : 'rgba(0,255,65,0.06)'; ctx.fill()
    ctx.strokeStyle = g.fw ? BL : 'rgba(0,255,65,0.38)'; ctx.lineWidth = g.fw ? 2 : 1; ctx.stroke()
    ctx.fillStyle = g.fw ? 'rgba(0,170,255,0.8)' : 'rgba(0,255,65,0.5)'
    ctx.font = '10px "Share Tech Mono",monospace'; ctx.textAlign = 'center'
    ctx.fillText(g.label, g.x, g.y + g.r + 14)
    if (g.fw) { ctx.fillStyle = BL; ctx.font = 'bold 11px "Share Tech Mono",monospace'; ctx.fillText('FW', g.x, g.y + 4) }
  })

  // Server
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 380)
  const serverDanger = st.lives <= 1
  ctx.beginPath(); ctx.arc(SERVER.x, SERVER.y, SERVER.r + 12 + pulse * 5, 0, Math.PI * 2)
  ctx.strokeStyle = serverDanger ? `rgba(255,43,43,${0.1 + pulse * 0.15})` : `rgba(0,255,65,${0.06 + pulse * 0.1})`
  ctx.lineWidth = serverDanger ? 2 : 1.5; ctx.stroke()
  ctx.beginPath(); ctx.arc(SERVER.x, SERVER.y, SERVER.r, 0, Math.PI * 2)
  ctx.fillStyle = serverDanger ? 'rgba(255,43,43,0.12)' : 'rgba(0,255,65,0.1)'; ctx.fill()
  ctx.strokeStyle = serverDanger ? RD : GRN; ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = serverDanger ? RD : GRN
  ctx.font = 'bold 9px "Share Tech Mono",monospace'; ctx.textAlign = 'center'
  ctx.fillText('SERVER', SERVER.x, SERVER.y + 3)

  // Attackers
  st.attackers.forEach(a => {
    if (!a.alive) return
    const fl = a.flashT > 0 && Math.sin(a.flashT * 40) > 0
    ctx.globalAlpha = a.alpha
    // Trail
    ctx.beginPath(); ctx.arc(a.x - a.vx * 0.09, a.y - a.vy * 0.09, a.r * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = a.col + '30'; ctx.fill()
    // Body
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
    ctx.fillStyle = fl ? '#fff' : a.col; ctx.fill()
    ctx.strokeStyle = a.col + 'CC'; ctx.lineWidth = a.mhp > 1 ? 2 : 1.5; ctx.stroke()
    // HP bar for armored
    if (a.mhp > 1) {
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(a.x - a.r, a.y - a.r - 8, a.r * 2, 4)
      ctx.fillStyle = a.col; ctx.fillRect(a.x - a.r, a.y - a.r - 8, a.r * 2 * (a.hp / a.mhp), 4)
    }
    ctx.globalAlpha = Math.min(1, a.alpha * 1.5)
    ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    ctx.globalAlpha = 1
    // Type indicator ring for phantom
    if (a.type === 'phantom') {
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 4, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(170,68,255,0.25)'; ctx.lineWidth = 1; ctx.stroke()
    }
  })

  // Particles
  st.particles.forEach(p => {
    const alpha = Math.floor(Math.max(0, p.life) * 220).toString(16).padStart(2, '0')
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.4, p.r), 0, Math.PI * 2)
    ctx.fillStyle = p.col + alpha; ctx.fill()
  })

  // Combo display
  if (st.combo > 2) {
    const cx = st.comboX || W / 2, cy = st.comboY || 60
    ctx.fillStyle = AM; ctx.font = `bold ${14 + Math.min(st.combo, 8)}px "Share Tech Mono",monospace`; ctx.textAlign = 'center'
    ctx.fillText(`⚡ x${st.combo} COMBO`, cx, cy)
  }

  // Wave banner
  if (st.waveOver && st.waveOT > 0) {
    const a = Math.min(1, st.waveOT * 1.3)
    ctx.fillStyle = `rgba(0,255,65,${a})`; ctx.font = `bold 22px "Share Tech Mono",monospace`; ctx.textAlign = 'center'
    ctx.fillText(`■ OLEADA ${st.wave - 1} NEUTRALIZADA ■`, W / 2, H / 2 - 14)
    ctx.fillStyle = `rgba(255,170,0,${a})`; ctx.font = `13px "Share Tech Mono",monospace`
    ctx.fillText(`+${(st.wave) * 60} PTS BONIFICACIÓN`, W / 2, H / 2 + 14)
  }

  // Danger warning (wave 6+)
  if (st.wave >= 6 && !st.waveOver) {
    const blink = Math.sin(Date.now() / 200) > 0
    if (blink) {
      ctx.fillStyle = 'rgba(255,43,43,0.6)'; ctx.font = `bold 11px "Share Tech Mono",monospace`; ctx.textAlign = 'center'
      ctx.fillText('⚠ NIVEL CRÍTICO — OLEADA IMPOSIBLE', W / 2, 18)
    }
  }

  // Game over / win screens
  if (st.phase === 'over') {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = RD; ctx.font = `bold 28px "Share Tech Mono",monospace`; ctx.textAlign = 'center'
    ctx.fillText('// SERVIDOR COMPROMETIDO //', W / 2, H / 2 - 22)
    ctx.fillStyle = 'rgba(255,43,43,0.65)'; ctx.font = `12px "Share Tech Mono",monospace`
    ctx.fillText(`OLEADA ${st.wave} · PUNTUACIÓN: ${st.score}`, W / 2, H / 2 + 12)
    ctx.fillStyle = 'rgba(0,255,65,0.4)'; ctx.font = `10px "Share Tech Mono",monospace`
    ctx.fillText('[ CARGANDO RESULTADOS... ]', W / 2, H / 2 + 42)
  }
}

// ─── LEADERBOARD COMPONENT ───────────────────────────────────────────────────
function Leaderboard({ entries, highlightName, highlightScore }) {
  return (
    <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trophy size={13} color={AM} />
        <span style={{ fontSize: '9px', color: AM, letterSpacing: '3px', fontFamily: FONT }}>RANKING GLOBAL — TOP 10</span>
      </div>
      {entries.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '10px', color: TEXT2, fontFamily: FONT, letterSpacing: '2px' }}>
          SIN REGISTROS — SÉ EL PRIMERO
        </div>
      )}
      {entries.map((e, i) => {
        const isMe = e.name === (highlightName || '').toUpperCase().trim().slice(0, 18) && e.score === highlightScore
        return (
          <div key={e.ts || i} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr 70px 55px 50px',
            alignItems: 'center', gap: '8px',
            padding: '9px 16px',
            borderBottom: i < entries.length - 1 ? `1px solid ${BORDER}` : 'none',
            background: isMe ? 'rgba(0,255,65,0.07)' : 'transparent',
            borderLeft: isMe ? `2px solid ${ACCENT}` : '2px solid transparent',
          }}>
            <span style={{ fontFamily: FONT, fontSize: '11px', color: i < 3 ? [AM, 'rgba(180,180,180,0.7)', '#CD7F32'][i] : TEXT2, textAlign: 'center' }}>
              {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
            </span>
            <span style={{ fontFamily: FONT, fontSize: '11px', color: isMe ? ACCENT : TEXT2, letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.name}{isMe ? ' ◄' : ''}
            </span>
            <span style={{ fontFamily: FONT, fontSize: '13px', color: isMe ? ACCENT : 'rgba(0,255,65,0.55)', textAlign: 'right', fontWeight: 'bold' }}>
              {e.score.toLocaleString()}
            </span>
            <span style={{ fontFamily: FONT, fontSize: '9px', color: TEXT2, textAlign: 'center', letterSpacing: '1px' }}>
              OL.{e.wave}
            </span>
            <span style={{ fontFamily: FONT, fontSize: '9px', color: TEXT2, textAlign: 'right', opacity: 0.5 }}>
              {e.date}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CyberDefense({ onComplete }) {
  const [phase, setPhase] = useState('intro') // intro | game | nameentry | result
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [leaderboard, setLeaderboard] = useState(() => getLeaderboard())
  const [finalScore, setFinalScore] = useState(0)
  const [finalWave, setFinalWave] = useState(1)
  const [display, setDisplay] = useState({ score: 0, lives: 3, wave: 1, fwUses: 4, combo: 0, remaining: 0 })

  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const rafRef = useRef(null)
  const lastRef = useRef(null)

  // ── Init game state ──
  const initState = useCallback(() => ({
    score: 0, lives: 3, wave: 1,
    combo: 0, comboT: 0, comboX: W / 2, comboY: 60,
    fwUses: 4,
    attackers: [],
    particles: [],
    spawnQ: buildWaveQueue(0),
    waveOver: false, waveOT: 0,
    scanA: 0,
    gates: GATES.map(g => ({ ...g, fw: false, fwT: 0 })),
    phase: 'playing',
  }), [])

  // ── Start game ──
  useEffect(() => {
    if (phase !== 'game') return
    const canvas = canvasRef.current
    if (!canvas) return
    const st = initState()
    stateRef.current = st
    lastRef.current = null

    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) * (W / rect.width),
        y: (e.clientY - rect.top) * (H / rect.height),
      }
    }

    const onClick = (e) => {
      const st = stateRef.current
      if (!st || st.phase !== 'playing') return
      const { x, y } = getCanvasPos(e)

      // Gate click → firewall
      let hit = false
      st.gates.forEach(g => {
        if (hit) return
        if (dist({ x, y }, g) < g.r + 14 && !g.fw && st.fwUses > 0) {
          g.fw = true; g.fwT = 4; st.fwUses--
          burst(st.particles, g.x, g.y, BL, 12)
          hit = true
        }
      })
      if (hit) return

      // Attacker click
      // Sort by dist to click for precise hit detection
      const sorted = [...st.attackers].filter(a => a.alive).sort((a, b) => d2({ x, y }, a) - d2({ x, y }, b))
      for (const a of sorted) {
        if (dist({ x, y }, a) < a.r + 10) {
          a.hp--; a.flashT = 0.15
          if (a.hp <= 0) {
            a.alive = false
            st.combo++; st.comboT = 1.6
            st.comboX = a.x; st.comboY = Math.max(40, a.y - 20)
            const multiplier = 1 + (st.combo > 1 ? (st.combo - 1) * 0.5 : 0)
            const pts = Math.round(a.pts * multiplier)
            st.score += pts
            burst(st.particles, a.x, a.y, a.col, 10)
            // Splitter: spawn 2 children
            if (a.type === 'splitter') {
              st.attackers.push(makeSplitChild(a), makeSplitChild(a))
              burst(st.particles, a.x, a.y, '#FFDD00', 8, 0.7)
            }
          }
          break
        }
      }
    }

    canvas.addEventListener('click', onClick)

    const tick = (ts) => {
      if (!lastRef.current) lastRef.current = ts
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05)
      lastRef.current = ts
      const st = stateRef.current
      if (!st) return

      if (st.phase === 'playing') {
        st.scanA += dt * 0.65

        // Combo timer
        if (st.combo > 0) { st.comboT -= dt; if (st.comboT <= 0) st.combo = 0 }

        // Gate FW timers
        st.gates.forEach(g => { if (g.fw) { g.fwT -= dt; if (g.fwT <= 0) g.fw = false } })

        // Spawn from queue
        if (st.spawnQ.length > 0) {
          st.spawnQ[0].delay -= dt
          if (st.spawnQ[0].delay <= 0) {
            st.attackers.push(makeAttacker(st.spawnQ.shift(), st.gates))
          }
        }

        // Update attackers
        const toAdd = []
        st.attackers.forEach(a => {
          if (!a.alive) return
          if (a.flashT > 0) a.flashT -= dt
          const tgt = a.phase === 0 ? a.gate : SERVER
          const dx = tgt.x - a.x, dy = tgt.y - a.y
          const dd = Math.sqrt(dx * dx + dy * dy) || 1
          a.vx = (dx / dd) * a.spd; a.vy = (dy / dd) * a.spd
          a.x += a.vx * dt; a.y += a.vy * dt

          if (dd < 12) {
            if (a.phase === 0) {
              if (a.gate.fw) {
                // Firewall intercepts
                a.alive = false
                st.combo++; st.comboT = 1.6
                st.comboX = a.gate.x; st.comboY = Math.max(40, a.gate.y - 20)
                st.score += Math.round(a.pts * (1 + st.combo * 0.3))
                burst(st.particles, a.gate.x, a.gate.y, GRN, 14)
                if (a.type === 'splitter') {
                  toAdd.push(makeSplitChild(a), makeSplitChild(a))
                }
              } else {
                a.phase = 1
              }
            } else {
              // Reached server
              a.alive = false; st.lives--
              burst(st.particles, SERVER.x, SERVER.y, RD, 18, 1.2)
              if (st.lives <= 0) st.phase = 'over'
            }
          }
        })
        st.attackers = st.attackers.filter(a => a.alive)
        if (toAdd.length) st.attackers.push(...toAdd)

        // Particles
        st.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.r *= 0.93 })
        st.particles = st.particles.filter(p => p.life > 0)

        // Wave completion check
        const remaining = st.spawnQ.length + st.attackers.length
        if (!st.waveOver && remaining === 0) {
          st.waveOver = true; st.waveOT = 2.2
        }
        if (st.waveOver) {
          st.waveOT -= dt
          if (st.waveOT <= 0) {
            st.wave++
            st.score += st.wave * 60
            st.fwUses = Math.min(st.fwUses + 1, 6)
            st.spawnQ = buildWaveQueue(st.wave - 1)
            st.waveOver = false
          }
        }

        setDisplay({
          score: st.score,
          lives: st.lives,
          wave: st.wave,
          fwUses: st.fwUses,
          combo: st.combo,
          remaining: st.spawnQ.length + st.attackers.length,
        })
      }

      draw(st, canvas)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      canvas.removeEventListener('click', onClick)
      cancelAnimationFrame(rafRef.current)
    }
  }, [phase, initState])

  // ── Watch for game over ──
  useEffect(() => {
    if (phase !== 'game') return
    const id = setInterval(() => {
      const st = stateRef.current
      if (st && st.phase === 'over') {
        cancelAnimationFrame(rafRef.current)
        setFinalScore(st.score)
        setFinalWave(st.wave)
        clearInterval(id)
        setTimeout(() => setPhase('nameentry'), 800)
      }
    }, 250)
    return () => clearInterval(id)
  }, [phase])

  // ── Submit score ──
  const submitScore = () => {
    const name = nameInput.trim() || 'OPERATIVO'
    setPlayerName(name)
    const board = saveScore(name, finalScore, finalWave)
    setLeaderboard(board)
    setPhase('result')
  }

  const rank = finalScore >= 2000 ? 'LEYENDA' : finalScore >= 1200 ? 'ÉLITE' : finalScore >= 600 ? 'VETERANO' : finalScore >= 200 ? 'OPERATIVO' : 'RECLUTA'
  const rankColor = { LEYENDA: AM, ÉLITE: GRN, VETERANO: BL, OPERATIVO: ACCENT, RECLUTA: RED }[rank]
  const myRankPos = leaderboard.findIndex(e => e.name === (playerName || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 18) && e.score === finalScore)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', fontFamily: FONT }}>

      {/* ══ INTRO ══ */}
      {phase === 'intro' && (
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '3px', color: TEXT2, marginBottom: '12px' }}>// MOD-06 — SIMULADOR ARCADE</div>
          <div style={{ fontSize: 'clamp(26px, 3vw, 44px)', letterSpacing: '4px', color: ACCENT, marginBottom: '8px', textShadow: `0 0 30px ${ACCENT}22` }}>
            OPERACIÓN ESCUDO DIGITAL
          </div>
          <div style={{ fontSize: '14px', color: TEXT2, letterSpacing: '2px', marginBottom: '28px' }}>
            8 OLEADAS · 5 TIPOS DE AMENAZA · IMPOSIBLE A PARTIR DE OLEADA 6
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Threat types legend */}
            <div style={{ ...CARD }}>
              <div style={{ fontSize: '13px', color: TEXT2, letterSpacing: '3px', marginBottom: '14px' }}>// TIPOS DE AMENAZA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(TYPES).map(([key, t]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: t.r * 2.4, height: t.r * 2.4, borderRadius: '50%', background: t.col, opacity: t.alpha, flexShrink: 0, border: `1px solid ${t.col}88` }} />
                    <div>
                      <span style={{ fontSize: '14px', color: t.col, letterSpacing: '1px' }}>{t.label}</span>
                      <span style={{ fontSize: '12px', color: TEXT2, marginLeft: '8px' }}>
                        {key === 'normal' && '1 CLICK · VELOCIDAD MEDIA'}
                        {key === 'fast' && '1 CLICK · MUY RÁPIDO · VA DIRECTO AL SERVIDOR'}
                        {key === 'armored' && '3 CLICKS · LENTO · MÁS PUNTOS'}
                        {key === 'splitter' && '1 CLICK · SE DIVIDE EN 2 AL MORIR'}
                        {key === 'phantom' && '1 CLICK · CASI INVISIBLE · CUIDADO'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Name + leaderboard preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ ...CARD }}>
                <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '10px' }}>// TU NOMBRE DE OPERATIVO</div>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value.toUpperCase().slice(0, 18))}
                  onKeyDown={e => e.key === 'Enter' && setPhase('game')}
                  placeholder='INGRESA TU NOMBRE...'
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 12px', background: '#030303',
                    border: `1px solid ${nameInput ? ACCENT : BORDER}`,
                    color: ACCENT, fontFamily: FONT, fontSize: '13px',
                    letterSpacing: '2px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '9px', color: TEXT2, marginTop: '6px', opacity: 0.6 }}>
                  OPCIONAL — SE GUARDARÁ EN EL RANKING LOCAL
                </div>
              </div>

              <Leaderboard entries={leaderboard} />
            </div>
          </div>

          <button onClick={() => setPhase('game')} style={{ ...S.btnPrimary, gap: '12px' }}>
            <Shield size={14} /> INICIAR DEFENSA <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ══ GAME ══ */}
      {phase === 'game' && (
        <div>
          {/* HUD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'OLEADA', val: `${display.wave}`, sub: display.wave >= 6 ? '⚠ CRÍTICA' : `/${WAVE_CFG.length}`, color: display.wave >= 6 ? RD : AM },
              { label: 'PUNTOS', val: display.score.toLocaleString(), color: ACCENT },
              { label: 'ESCUDOS', val: '■'.repeat(display.lives) + '□'.repeat(Math.max(0, 3 - display.lives)), color: display.lives <= 1 ? RD : ACCENT },
              { label: 'CORTAFUEGOS', val: '█'.repeat(display.fwUses) + '░'.repeat(Math.max(0, 6 - display.fwUses)), color: BL },
              { label: 'EN VUELO', val: display.remaining, color: display.remaining > 8 ? RD : TEXT2 },
            ].map(h => (
              <div key={h.label} style={{ ...CARD, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: TEXT2, letterSpacing: '2px', marginBottom: '5px' }}>{h.label}</div>
                <div style={{ fontSize: '18px', color: h.color, letterSpacing: '2px' }}>{h.val}</div>
                {h.sub && <div style={{ fontSize: '11px', color: h.color, marginTop: '3px', letterSpacing: '1px' }}>{h.sub}</div>}
              </div>
            ))}
          </div>

          {display.combo > 2 && (
            <div style={{ textAlign: 'center', fontSize: '20px', color: AM, letterSpacing: '3px', marginBottom: '6px' }}>
              ⚡ x{display.combo} COMBO
            </div>
          )}

          <canvas ref={canvasRef} width={W} height={H}
            style={{ display: 'block', width: '100%', cursor: 'crosshair', border: `1px solid ${BORDER}`, background: '#040404' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: TEXT2, letterSpacing: '2px', opacity: 0.7 }}>
            <span>CLICK EN AMENAZAS PARA NEUTRALIZAR</span>
            <span>CLICK EN NODO GW/RT PARA CORTAFUEGOS (4 SEG)</span>
          </div>
        </div>
      )}

      {/* ══ NAME ENTRY (post-game) ══ */}
      {phase === 'nameentry' && (
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ fontSize: '9px', letterSpacing: '3px', color: RED, marginBottom: '16px' }}>// SERVIDOR COMPROMETIDO — REGISTRA TU PUNTUACIÓN</div>

          <div style={{ ...CARD, borderLeft: `2px solid ${RED}55`, marginBottom: '24px', display: 'grid', gridTemplateColumns: '100px 1fr', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: ACCENT, lineHeight: 1, textShadow: `0 0 30px ${ACCENT}44` }}>{finalScore.toLocaleString()}</div>
              <div style={{ fontSize: '8px', color: TEXT2, letterSpacing: '2px', marginTop: '4px' }}>PUNTOS</div>
            </div>
            <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: '20px' }}>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px', marginBottom: '6px' }}>OLEADA ALCANZADA</div>
              <div style={{ fontSize: '22px', color: AM, letterSpacing: '2px', marginBottom: '12px' }}>{finalWave}</div>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '2px', marginBottom: '6px' }}>RANGO</div>
              <div style={{ fontSize: '16px', letterSpacing: '2px', color: rankColor }}>{rank}</div>
            </div>
          </div>

          <div style={{ ...CARD, marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '10px' }}>// NOMBRE DE OPERATIVO PARA EL RANKING</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value.toUpperCase().slice(0, 18))}
                onKeyDown={e => e.key === 'Enter' && submitScore()}
                placeholder={nameInput || 'OPERATIVO'}
                autoFocus
                style={{
                  flex: 1, padding: '12px', background: '#030303',
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT, fontFamily: FONT, fontSize: '14px',
                  letterSpacing: '2px', outline: 'none',
                }}
              />
              <button onClick={submitScore} style={{ ...S.btnPrimary, padding: '12px 20px', gap: '8px' }}>
                <Trophy size={13} /> GUARDAR
              </button>
            </div>
          </div>

          <button onClick={submitScore} style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: 0.7, fontSize: '10px' }}>
            SALTAR — VER RANKING SIN GUARDAR NOMBRE
          </button>
        </div>
      )}

      {/* ══ RESULT + LEADERBOARD ══ */}
      {phase === 'result' && (
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '3px', color: TEXT2, marginBottom: '16px' }}>// OPERACIÓN COMPLETADA — CLASIFICACIÓN GLOBAL</div>

          {/* Score card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ ...CARD, borderLeft: `2px solid ${rankColor}66`, padding: '20px 24px' }}>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '8px' }}>TU PUNTUACIÓN</div>
              <div style={{ fontSize: '52px', color: rankColor, lineHeight: 1, textShadow: `0 0 30px ${rankColor}44`, marginBottom: '8px' }}>
                {finalScore.toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '8px', color: TEXT2, letterSpacing: '2px' }}>RANGO</div>
                  <div style={{ fontSize: '16px', color: rankColor, letterSpacing: '2px' }}>{rank}</div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: TEXT2, letterSpacing: '2px' }}>OLEADA</div>
                  <div style={{ fontSize: '16px', color: AM, letterSpacing: '2px' }}>{finalWave}</div>
                </div>
                {myRankPos >= 0 && (
                  <div>
                    <div style={{ fontSize: '8px', color: TEXT2, letterSpacing: '2px' }}>POSICIÓN</div>
                    <div style={{ fontSize: '16px', color: ACCENT, letterSpacing: '2px' }}>#{myRankPos + 1}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...CARD, padding: '20px 24px' }}>
              <div style={{ fontSize: '9px', color: TEXT2, letterSpacing: '3px', marginBottom: '12px' }}>GUÍA DE RANGOS</div>
              {[
                { r: 'LEYENDA', pts: '2000+', col: AM },
                { r: 'ÉLITE', pts: '1200+', col: GRN },
                { r: 'VETERANO', pts: '600+', col: BL },
                { r: 'OPERATIVO', pts: '200+', col: ACCENT },
                { r: 'RECLUTA', pts: '<200', col: RED },
              ].map(g => (
                <div key={g.r} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: g.r === rank ? g.col : TEXT2, letterSpacing: '1px', fontWeight: g.r === rank ? 'bold' : 'normal' }}>
                    {g.r === rank ? '▶ ' : '  '}{g.r}
                  </span>
                  <span style={{ fontSize: '9px', color: TEXT2 }}>{g.pts} PTS</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full leaderboard */}
          <div style={{ marginBottom: '20px' }}>
            <Leaderboard entries={leaderboard} highlightName={playerName} highlightScore={finalScore} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => {
              setNameInput(playerName)
              setPhase('intro')
            }} style={{ ...S.btnPrimary, gap: '10px' }}>
              <Zap size={13} /> JUGAR DE NUEVO
            </button>
            <button onClick={() => onComplete({ type: 'cyberdefense', score: finalScore, rank, wave: finalWave })}
              style={{ ...S.btnPrimary, gap: '10px', opacity: 0.7 }}>
              CONTINUAR AL INFORME <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
