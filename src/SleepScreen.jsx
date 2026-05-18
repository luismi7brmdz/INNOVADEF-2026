import { useEffect, useRef, useState, useCallback } from 'react'
import { ACCENT, FONT, TEXT2 } from './theme'
import { sfxWakeTouch, sfxWakeSweep, sfxWakeExplosion } from './sfx'

const G = 'rgba(0,255,65,'

// ─── FONDO SLEEP (sin radar) ───────────────────────────────────────────────────
function SleepBackground({ wakeProgress }) {
  const canvasRef = useRef(null)
  const wakeRef = useRef(0)

  useEffect(() => { wakeRef.current = wakeProgress }, [wakeProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf, t = 0

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    function randChar() {
      return Math.random() > 0.5
        ? String.fromCharCode(48 + Math.floor(Math.random() * 10))
        : String.fromCharCode(65 + Math.floor(Math.random() * 26))
    }

    // ── Particles — neural network web
    const NUM = 240
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 0.9 + Math.random() * 2.1,
      alpha: 0.08 + Math.random() * 0.22,
      pulse: Math.random() * Math.PI * 2,
    }))

    // ── Vertical data columns (slow, dim)
    const cols = Math.ceil(window.innerWidth / 78) + 1
    const streams = Array.from({ length: cols }, (_, i) => ({
      x: i * 78,
      y: -Math.random() * window.innerHeight,
      chars: Array.from({ length: 42 }, randChar),
      speed: 0.12 + Math.random() * 0.18,
      active: Math.random() > 0.55,
    }))

    // ── DNA strands (4, two pairs)
    const dnaStrands = [
      { yFrac: 0.18, amp: 33, freq: 0.014, phaseOff: 0 },
      { yFrac: 0.82, amp: 33, freq: 0.014, phaseOff: Math.PI },
    ]

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      t += 0.007
      const wp = wakeRef.current // 0→1 wake progress

      // ── BG gradient (brightens on wake)
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H))
      bg.addColorStop(0, `rgba(0,${Math.round(18 + wp * 45)},${Math.round(4.5 + wp * 7.5)},1)`)
      bg.addColorStop(1, 'rgba(2,2,2,1)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ── Grid (brightens on wake)
      const gridAlpha = 0.03 + wp * 0.1
      ctx.strokeStyle = `${G}${gridAlpha.toFixed(3)})`
      ctx.lineWidth = 0.6
      for (let x = 0; x < W; x += 78) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 78) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // ── DNA strands
      dnaStrands.forEach(s => {
        const yBase = H * s.yFrac
        const amp = s.amp * (1 + wp * 2)
        const a1 = (0.14 + wp * 0.5)
        const a2 = (0.08 + wp * 0.3)
        ;[0, Math.PI].forEach((phAdd, pi) => {
          ctx.beginPath()
          for (let x = -60; x <= W + 60; x += 3) {
            const y = yBase + Math.sin(x * s.freq + t + s.phaseOff + phAdd) * amp
            x === -60 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `${G}${pi === 0 ? a1.toFixed(3) : a2.toFixed(3)})`
          ctx.lineWidth = pi === 0 ? 1.8 : 1.2
          ctx.stroke()
        })
        // rungs
        const spacing = 42
        for (let x = -60; x <= W + 60; x += spacing) {
          const y1 = yBase + Math.sin(x * s.freq + t + s.phaseOff) * amp
          const y2 = yBase + Math.sin(x * s.freq + t + s.phaseOff + Math.PI) * amp
          ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2)
          ctx.strokeStyle = `${G}${(0.05 + wp * 0.1).toFixed(3)})`
          ctx.lineWidth = 0.9; ctx.stroke()
          ctx.beginPath(); ctx.arc(x, y1, 2.25, 0, Math.PI * 2)
          ctx.fillStyle = `${G}${(0.3 + wp * 0.5).toFixed(3)})`; ctx.fill()
          ctx.beginPath(); ctx.arc(x, y2, 2.25, 0, Math.PI * 2)
          ctx.fillStyle = `${G}${(0.3 + wp * 0.5).toFixed(3)})`; ctx.fill()
        }
      })

      // ── Vertical data streams (brighter on wake)
      ctx.font = `15px "Share Tech Mono", monospace`
      streams.forEach(s => {
        if (!s.active) return
        s.y += s.speed
        if (s.y > H + s.chars.length * 21) {
          s.y = -s.chars.length * 21
          if (Math.random() > 0.4) s.chars = s.chars.map(randChar)
        }
        s.chars.forEach((c, i) => {
          const fy = s.y + i * 21
          if (fy < -21 || fy > H + 21) return
          const fade = 1 - i / s.chars.length
          ctx.fillStyle = `${G}${(fade * (0.06 + wp * 0.12)).toFixed(3)})`
          ctx.fillText(c, s.x + 3, fy)
        })
      })

      // ── Neural particles (speed up on wake)
      const speedMult = 1 + wp * 3
      particles.forEach(p => {
        p.x = (p.x + p.vx * speedMult + W) % W
        p.y = (p.y + p.vy * speedMult + H) % H
        p.pulse += 0.02 + wp * 0.05
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse)) * (1 + wp)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + wp * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `${G}${Math.min(a, 0.9).toFixed(3)})`; ctx.fill()
      })

      // ── Connection lines (appear more on wake)
      const connDist = 120 + wp * 90
      const connAlpha = 0.05 + wp * 0.12
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connDist) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `${G}${(connAlpha * (1 - dist / connDist)).toFixed(3)})`
            ctx.lineWidth = 0.45 + wp * 0.6; ctx.stroke()
          }
        }
      }

      // ── On full wake: expanding energy rings from center
      if (wp > 0.3) {
        const rings = Math.floor((wp - 0.3) / 0.15)
        for (let r = 0; r <= rings; r++) {
          const rp = ((wp - 0.3 - r * 0.15) / 0.15) % 1
          const radius = rp * Math.max(W, H) * 0.8
          ctx.beginPath()
          ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2)
          ctx.strokeStyle = `${G}${(0.4 * (1 - rp)).toFixed(3)})`
          ctx.lineWidth = 2.25 * (1 - rp); ctx.stroke()
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// ─── SLEEP SCREEN ──────────────────────────────────────────────────────────────
export default function SleepScreen({ onWake }) {
  const [phase, setPhase] = useState('idle') // idle | waking | exploding | done
  const [wakeProgress, setWakeProgress] = useState(0)
  const [touchOrigin, setTouchOrigin] = useState({ x: 0, y: 0 })
  const [ripples, setRipples] = useState([])
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)

  const wake = useCallback((e) => {
    if (phase !== 'idle') return
    const x = e?.clientX ?? e?.touches?.[0]?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? e?.touches?.[0]?.clientY ?? window.innerHeight / 2
    setTouchOrigin({ x, y })

    // Spawn ripples cascade
    const id = Date.now()
    setRipples([{ id, x, y }])
    sfxWakeTouch()
    sfxWakeSweep()

    setPhase('waking')
    startTimeRef.current = performance.now()

    // Animate wakeProgress 0→1 over 1.4s
    const animWake = (now) => {
      const elapsed = now - startTimeRef.current
      const p = Math.min(elapsed / 1400, 1)
      setWakeProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animWake)
      } else {
        setPhase('exploding')
        sfxWakeExplosion()
        setTimeout(() => onWake(), 180)
      }
    }
    rafRef.current = requestAnimationFrame(animWake)
  }, [phase, onWake])

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), [])

  const isWaking = phase === 'waking' || phase === 'exploding'
  const isExploding = phase === 'exploding'

  return (
    <div
      onClick={wake}
      onTouchStart={wake}
      style={{ position: 'fixed', inset: 0, zIndex: 300, overflow: 'hidden', cursor: 'none' }}
    >
      <SleepBackground wakeProgress={wakeProgress} />

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 6px)',
        opacity: 1 - wakeProgress * 0.7 }} />

      {/* Vignette (fades out on wake) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.85) 100%)',
        opacity: 1 - wakeProgress * 0.8,
        transition: 'opacity 0.1s' }} />

      {/* ── UI layer ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '42px', pointerEvents: 'none' }}>

        {/* Logo */}
        <div style={{
          animation: isWaking ? 'none' : 'sleepFloat 4s ease-in-out infinite',
          opacity: isWaking ? Math.max(0, 1 - wakeProgress * 2) : 1,
          transform: isWaking ? `scale(${1 + wakeProgress * 0.3}) translateY(${-wakeProgress * 30}px)` : undefined,
          filter: isWaking ? `drop-shadow(0 0 ${wakeProgress * 60}px ${ACCENT}) brightness(${1 + wakeProgress})` : undefined,
          transition: 'filter 0.05s',
        }}>
          <img src="/logoinnovadef.png" alt="INNOVADEF"
            style={{ height: 'clamp(78px, 13.5vw, 150px)',
              filter: `brightness(0) saturate(100%) invert(74%) sepia(47%) saturate(539%) hue-rotate(86deg) brightness(107%) contrast(103%)`,
              opacity: 0.55 + wakeProgress * 0.45 }} />
        </div>

        {/* Touch button — collapses inward on wake */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isWaking ? Math.max(0, 1 - wakeProgress * 3) : 1,
          transform: isWaking ? `scale(${1 - wakeProgress * 0.5})` : undefined,
          transition: 'opacity 0.1s, transform 0.1s',
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: `${165 + i * 82.5}px`, height: `${165 + i * 82.5}px`,
              border: `1.5px solid rgba(0,255,65,${0.3 - i * 0.05})`,
              borderRadius: '112.5px',
              animation: `sleepRing 2.6s ease-out ${i * 0.35}s infinite`,
            }} />
          ))}
          <div style={{
            width: '165px', height: '165px', borderRadius: '112.5px',
            border: `1.5px solid rgba(0,255,65,0.55)`,
            background: 'radial-gradient(circle, rgba(0,255,65,0.09) 0%, transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '9px',
            boxShadow: `0 0 60px rgba(0,255,65,0.14), 0 0 135px rgba(0,255,65,0.06)`,
            animation: 'sleepBtnPulse 3s ease-in-out infinite',
          }}>
            <div style={{ fontFamily: FONT, fontSize: '27px', color: ACCENT, letterSpacing: '4.5px' }}>TOQUE</div>
            <div style={{ fontFamily: FONT, fontSize: '10.5px', color: TEXT2, letterSpacing: '3px' }}>PARA INICIAR</div>
          </div>
        </div>

        {/* Status label */}
        <div style={{ fontFamily: FONT, fontSize: '13.5px', color: `${ACCENT}44`, letterSpacing: '6px',
          opacity: isWaking ? 0 : 1, transition: 'opacity 0.2s',
          animation: 'sleepBlink 3.5s ease-in-out infinite' }}>
          SISTEMA EN ESPERA // INNOVADEF FOCO 2026
        </div>
      </div>

      {/* ── Ripples from touch origin ── */}
      {ripples.map(r => (
        <div key={r.id} style={{ position: 'absolute', left: r.x, top: r.y, zIndex: 5, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '112.5px',
              border: `${i < 3 ? 3 : 1.5}px solid rgba(0,255,65,${0.9 - i * 0.12})`,
              left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              animation: `wakeRipple 1.4s cubic-bezier(0.1,0.8,0.3,1) ${i * 0.07}s forwards`,
            }} />
          ))}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: '9px', height: '9px', borderRadius: '112.5px', background: ACCENT,
            boxShadow: `0 0 45px ${ACCENT}, 0 0 90px ${ACCENT}66`,
            animation: 'wakeCore 1.2s ease-out forwards' }} />
        </div>
      ))}

      {/* ── HUD scan lines sweep during wake ── */}
      {isWaking && !isExploding && (
        <>
          <div style={{ position: 'fixed', left: 0, right: 0, height: '2.25px', zIndex: 6, pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT}cc 40%, ${ACCENT} 50%, ${ACCENT}cc 60%, transparent 100%)`,
            boxShadow: `0 0 30px ${ACCENT}88`,
            top: `${wakeProgress * 100}%`, opacity: Math.sin(wakeProgress * Math.PI) }} />
          <div style={{ position: 'fixed', left: 0, right: 0, height: '2.25px', zIndex: 6, pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT}99 40%, ${ACCENT}cc 50%, ${ACCENT}99 60%, transparent 100%)`,
            boxShadow: `0 0 18px ${ACCENT}66`,
            bottom: `${wakeProgress * 100}%`, opacity: Math.sin(wakeProgress * Math.PI) * 0.7 }} />
        </>
      )}

      {/* ── Explosion: dramatic burst glow with multiple cinematic layers ── */}
      {isExploding && (
        <div style={{ position: 'absolute', left: touchOrigin.x, top: touchOrigin.y, zIndex: 10, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}>
          {/* Core burst */}
          <div style={{
            width: '30px', height: '30px', borderRadius: '112.5px',
            background: `radial-gradient(circle, white 0%, ${ACCENT} 40%, transparent 70%)`,
            animation: 'burstExpand 0.6s cubic-bezier(0.1,0.7,0.3,1) forwards',
            boxShadow: `0 0 150px ${ACCENT}, 0 0 300px ${ACCENT}88`,
          }} />
          
          {/* Concentric energy rings */}
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              width: '0', height: '0', borderRadius: '112.5px',
              border: `${3 - i * 0.4}px solid ${ACCENT}`,
              animation: `energyRing 0.5s ease-out ${i * 0.06}s forwards`,
              opacity: 1 - i * 0.15,
            }} />
          ))}
          
          {/* Diagonal energy sweep */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: '0', height: '0',
            background: `linear-gradient(45deg, transparent, ${ACCENT}cc, transparent)`,
            animation: 'diagSweep 0.4s ease-out forwards',
          }} />
          
          {/* Particle burst */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: '10px', height: '10px', borderRadius: '50%',
            background: ACCENT,
            boxShadow: `
              0 0 20px ${ACCENT}, 0 0 40px ${ACCENT}88,
              60px 0 15px ${ACCENT}66, -60px 0 15px ${ACCENT}66,
              0 60px 15px ${ACCENT}66, 0 -60px 15px ${ACCENT}66,
              42px 42px 12px ${ACCENT}55, -42px 42px 12px ${ACCENT}55,
              42px -42px 12px ${ACCENT}55, -42px -42px 12px ${ACCENT}55
            `,
            animation: 'particleBurst 0.5s ease-out forwards',
          }} />
          
          {/* Glitch overlay */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: '200vmax', height: '200vmax',
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${ACCENT}22 2px, ${ACCENT}22 4px)`,
            animation: 'glitchFlash 0.15s ease-out forwards',
          }} />
        </div>
      )}

      <style>{`
        @keyframes sleepFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes sleepRing     { 0%{transform:translate(-50%,-50%) scale(0.82);opacity:0.6} 100%{transform:translate(-50%,-50%) scale(1.35);opacity:0} }
        @keyframes sleepBtnPulse { 0%,100%{box-shadow:0 0 40px rgba(0,255,65,0.14),0 0 90px rgba(0,255,65,0.06)} 50%{box-shadow:0 0 70px rgba(0,255,65,0.28),0 0 140px rgba(0,255,65,0.12)} }
        @keyframes sleepBlink    { 0%,100%{opacity:0.35} 50%{opacity:0.85} }
        @keyframes wakeRipple    { 0%{width:0;height:0;opacity:1} 100%{width:200vmax;height:200vmax;opacity:0} }
        @keyframes wakeCore      { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(30);opacity:0} }
        @keyframes burstExpand   { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(200);opacity:0} }
        @keyframes energyRing    { 0%{width:0;height:0;opacity:1} 100%{width:120vmax;height:120vmax;opacity:0} }
        @keyframes diagSweep     { 0%{width:0;height:0;transform:translate(-50%,-50%) rotate(45deg)} 100%{width:300vmax;height:300vmax;transform:translate(-50%,-50%) rotate(45deg);opacity:0} }
        @keyframes particleBurst { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(15);opacity:0} }
        @keyframes glitchFlash   { 0%{opacity:0.8} 20%{opacity:0.4} 40%{opacity:0.6} 60%{opacity:0.3} 80%{opacity:0.5} 100%{opacity:0} }
      `}</style>
    </div>
  )
}
