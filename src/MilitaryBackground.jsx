import { useEffect, useRef } from 'react'

// CRT Military Background — phosphor green, orthogonal grid, tactical data streams
export default function MilitaryBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStreams()
    }

    const GRID = 52
    const G = 'rgba(0,255,65,'

    // ── Scrolling telemetry rows ─────────────────────────────────────────────
    let streams = []
    const initStreams = () => {
      const cols = Math.ceil(window.innerWidth / GRID) + 2
      streams = Array.from({ length: cols * 2 }, (_, i) => ({
        x: (i % cols) * GRID + (i >= cols ? GRID / 2 : 0),
        chars: Array.from({ length: Math.ceil(window.innerHeight / 21) + 6 }, () => randChar()),
        y: -(Math.random() * window.innerHeight),
        speed: 0.25 + Math.random() * 0.4,
        active: Math.random() > 0.25
      }))
    }

    const randChar = () =>
      Math.random() > 0.6
        ? String.fromCharCode(48 + Math.floor(Math.random() * 10))
        : String.fromCharCode(65 + Math.floor(Math.random() * 26))

    // ── Tactical coord labels ────────────────────────────────────────────────
    const coordLabels = Array.from({ length: 8 }, () => ({
      x: 120 + Math.random() * (window.innerWidth - 240),
      y: 120 + Math.random() * (window.innerHeight - 240),
      text: `${Math.floor(30 + Math.random() * 15)}°${Math.floor(Math.random() * 60)}'${Math.floor(Math.random() * 60)}"N  ${Math.floor(Math.random() * 10)}°${Math.floor(Math.random() * 60)}'${Math.floor(Math.random() * 60)}"W`,
      alpha: 0.06 + Math.random() * 0.06,
      size: 13.5 + Math.random() * 4.5
    }))

    // ── Tactical lines (route overlays) ─────────────────────────────────────
    const tacLines = Array.from({ length: 5 }, () => ({
      x1: Math.random() * window.innerWidth,
      y1: Math.random() * window.innerHeight,
      x2: Math.random() * window.innerWidth,
      y2: Math.random() * window.innerHeight,
      prog: Math.random(),
      spd: 0.0004 + Math.random() * 0.0006,
      alpha: 0.05 + Math.random() * 0.04
    }))

    // ── Radar circles ────────────────────────────────────────────────────────
    const radars = [
      { x: window.innerWidth / 2, y: window.innerHeight / 2, r: Math.min(window.innerWidth, window.innerHeight) * 0.48, angle: 0, spd: 0.005 },
    ]

    resize()
    window.addEventListener('resize', resize)

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.012

      // ── Orthogonal grid ──────────────────────────────────────────────────
      ctx.strokeStyle = `${G}0.12)`
      ctx.lineWidth = 0.9
      ctx.setLineDash([])
      for (let x = 0; x < canvas.width; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }

      // ── Grid intersection dots ───────────────────────────────────────────
      // Removed per user request

      // ── Tactical route lines ─────────────────────────────────────────────
      tacLines.forEach(l => {
        l.prog = (l.prog + l.spd) % 1.4
        const p = Math.min(l.prog, 1)
        const ex = l.x1 + (l.x2 - l.x1) * p
        const ey = l.y1 + (l.y2 - l.y1) * p
        ctx.setLineDash([9, 15])
        ctx.strokeStyle = `${G}${l.alpha + 0.04})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(ex, ey); ctx.stroke()
        ctx.setLineDash([])
        // arrowhead dot
        if (p < 1) {
          ctx.fillStyle = `${G}${l.alpha * 6})`
          ctx.fillRect(ex - 3, ey - 3, 6, 6)
        }
      })

      // ── Radars ───────────────────────────────────────────────────────────
      radars.forEach(r => {
        r.angle = (r.angle + r.spd + Math.PI * 2) % (Math.PI * 2)
        // circles
        for (let i = 1; i <= 3; i++) {
          const ri = (r.r / 3) * i
          ctx.beginPath(); ctx.arc(r.x, r.y, ri, 0, Math.PI * 2)
          ctx.strokeStyle = `${G}0.12)`
          ctx.lineWidth = 0.9
          ctx.stroke()
        }
        // crosshair
        ctx.strokeStyle = `${G}0.1)`
        ctx.lineWidth = 0.75
        ctx.beginPath(); ctx.moveTo(r.x - r.r, r.y); ctx.lineTo(r.x + r.r, r.y); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(r.x, r.y - r.r); ctx.lineTo(r.x, r.y + r.r); ctx.stroke()
        // sweep gradient
        const sweep = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r)
        sweep.addColorStop(0, `${G}0.15)`)
        sweep.addColorStop(1, `${G}0)`)
        ctx.beginPath(); ctx.moveTo(r.x, r.y)
        ctx.arc(r.x, r.y, r.r, r.angle - 0.7, r.angle)
        ctx.closePath(); ctx.fillStyle = sweep; ctx.fill()
        // sweep line
        ctx.strokeStyle = `${G}0.35)`
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(r.x, r.y)
        ctx.lineTo(r.x + Math.cos(r.angle) * r.r, r.y + Math.sin(r.angle) * r.r)
        ctx.stroke()
      })

      // ── Scrolling data columns (vertical char streams) ───────────────────
      ctx.font = `11px "Share Tech Mono", monospace`
      streams.forEach(s => {
        if (!s.active) return
        s.y += s.speed
        if (s.y > canvas.height + s.chars.length * 21) {
          s.y = -s.chars.length * 21
          if (Math.random() > 0.5) s.chars = s.chars.map(randChar)
        }
        s.chars.forEach((c, i) => {
          const fy = s.y + i * 21
          if (fy < -21 || fy > canvas.height + 21) return
          const fade = (1 - i / s.chars.length)
          ctx.fillStyle = `${G}${(fade * 0.12).toFixed(3)})`
          ctx.fillText(typeof c === 'string' ? c : c.char, s.x + 3, fy)
        })
        // Mutate occasionally
        if (Math.random() < 0.008) {
          const idx = Math.floor(Math.random() * s.chars.length)
          s.chars[idx] = randChar()
        }
      })

      // ── Coordinate labels ─────────────────────────────────────────────────
      ctx.font = `10px "Share Tech Mono", monospace`
      coordLabels.forEach((cl, i) => {
        const flicker = 0.6 + 0.4 * Math.sin(t * 0.4 + i * 1.7)
        ctx.fillStyle = `${G}${(cl.alpha * flicker * 1.5).toFixed(3)})`
        ctx.fillText(cl.text, cl.x, cl.y)
        // crosshair marker
        ctx.strokeStyle = `${G}${(cl.alpha * flicker * 2.5).toFixed(3)})`
        ctx.lineWidth = 0.9
        const mx = cl.x - 18, my = cl.y - 6
        ctx.beginPath(); ctx.moveTo(mx - 9, my); ctx.lineTo(mx + 9, my); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(mx, my - 9); ctx.lineTo(mx, my + 9); ctx.stroke()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      {/* Canvas layer */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* CRT Scanlines overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)'
      }} />

      {/* CRT vignette */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.65) 100%)'
      }} />

      {/* Phosphor glow ambient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,40,10,0.25) 0%, transparent 70%)'
      }} />
    </>
  )
}
