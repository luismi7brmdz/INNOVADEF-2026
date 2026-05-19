import { useEffect, useRef, useState } from 'react'
import { ACCENT, FONT, TEXT2, BORDER } from './theme'
import { sfxBootLine, sfxBootReady, sfxShot, sfxEnterFiring, markUserInteracted, hasUserInteracted } from './sfx'

// ─── CURSOR DE MIRA ────────────────────────────────────────────────────────────
function MilitaryCursor() {
  const [pos, setPos]     = useState({ x: -100, y: -100 })
  const [fired, setFired] = useState(false)
  const [shots, setShots] = useState([])

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY })
    const click = (e) => {
      const id = Date.now()
      setFired(true)
      setShots(s => [...s, { id, x: e.clientX, y: e.clientY }])
      sfxShot()
      setTimeout(() => setFired(false), 180)
      setTimeout(() => setShots(s => s.filter(sh => sh.id !== id)), 700)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('click', click)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('click', click) }
  }, [])

  const s = fired ? 48 : 39 // size when fired

  return (
    <>
      {/* Cursor pointer de mira */}
      <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, pointerEvents: 'none', transform: 'translate(-50%,-50%)', transition: 'width 0.08s, height 0.08s' }}>
        {/* Círculo exterior */}
        <svg width={s * 2} height={s * 2} style={{ display: 'block', filter: fired ? `drop-shadow(0 0 8px ${ACCENT})` : `drop-shadow(0 0 3px ${ACCENT})` }}>
          <circle cx={s} cy={s} r={s - 3} fill="none" stroke={ACCENT} strokeWidth={fired ? 2.25 : 1.5} strokeDasharray="6 9" opacity={fired ? 1 : 0.85} />
          {/* Cruces */}
          <line x1={s} y1={3} x2={s} y2={s - 9} stroke={ACCENT} strokeWidth={fired ? 2.25 : 1.5} />
          <line x1={s} y1={s + 9} x2={s} y2={s * 2 - 3} stroke={ACCENT} strokeWidth={fired ? 2.25 : 1.5} />
          <line x1={3} y1={s} x2={s - 9} y2={s} stroke={ACCENT} strokeWidth={fired ? 2.25 : 1.5} />
          <line x1={s + 9} y1={s} x2={s * 2 - 3} y2={s} stroke={ACCENT} strokeWidth={fired ? 2.25 : 1.5} />
          {/* Punto central */}
          <circle cx={s} cy={s} r={fired ? 4.5 : 3} fill={ACCENT} opacity={fired ? 1 : 0.7} />
          {/* Círculo interior */}
          <circle cx={s} cy={s} r={9} fill="none" stroke={ACCENT} strokeWidth={1.2} opacity={fired ? 0.9 : 0.5} />
        </svg>
      </div>

      {/* Efecto de disparo / impacto */}
      {shots.map(sh => (
        <div key={sh.id} style={{ position: 'fixed', left: sh.x, top: sh.y, zIndex: 9998, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}>
          <svg width="120" height="120" style={{ animation: 'shotFade 0.65s ease-out forwards' }}>
            {/* Ondas de impacto */}
            <circle cx="60" cy="60" r="12"  fill="none" stroke={ACCENT} strokeWidth="2.25" style={{ animation: 'ripple1 0.65s ease-out forwards' }} />
            <circle cx="60" cy="60" r="24" fill="none" stroke={ACCENT} strokeWidth="1.5"   style={{ animation: 'ripple2 0.65s ease-out forwards' }} />
            <circle cx="60" cy="60" r="42" fill="none" stroke={ACCENT} strokeWidth="0.9" style={{ animation: 'ripple3 0.65s ease-out forwards' }} />
            {/* Rayos de impacto */}
            {[0,45,90,135,180,225,270,315].map(angle => {
              const rad = angle * Math.PI / 180
              const x1 = 60 + Math.cos(rad) * 15
              const y1 = 60 + Math.sin(rad) * 15
              const x2 = 60 + Math.cos(rad) * 45
              const y2 = 60 + Math.sin(rad) * 45
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ACCENT} strokeWidth="1.2" style={{ animation: `rayFade 0.5s ease-out forwards` }} />
            })}
            <circle cx="60" cy="60" r="4.5" fill={ACCENT} style={{ animation: 'coreFade 0.4s ease-out forwards' }} />
          </svg>
        </div>
      ))}

      <style>{`
        * { cursor: none !important; }
        @keyframes shotFade { 0%{opacity:1} 100%{opacity:0} }
        @keyframes ripple1 { 0%{r:6;opacity:1} 100%{r:27;opacity:0} }
        @keyframes ripple2 { 0%{r:12;opacity:0.8} 100%{r:42;opacity:0} }
        @keyframes ripple3 { 0%{r:21;opacity:0.5} 100%{r:60;opacity:0} }
        @keyframes rayFade  { 0%{opacity:1;stroke-width:2.25} 100%{opacity:0;stroke-width:0.45} }
        @keyframes coreFade { 0%{r:6;opacity:1} 100%{r:1.5;opacity:0} }
      `}</style>
    </>
  )
}

// ─── RADAR DE FONDO GIGANTE ────────────────────────────────────────────────────
function GiantRadar() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let angle = 0, raf
    const G = 'rgba(0,255,65,'
    const blips = Array.from({ length: 12 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.45 + Math.random() * 0.975,
      fade: 0,
      life: 0,
    }))

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width: W, height: H } = canvas
      const cx = W / 2, cy = H / 2
      const R = Math.max(W, H) * 1.08

      ctx.clearRect(0, 0, W, H)
      angle = (angle + 0.006) % (Math.PI * 2)

      // Circles
      for (let i = 1; i <= 5; i++) {
        const ri = (R / 5) * i
        ctx.beginPath(); ctx.arc(cx, cy, ri, 0, Math.PI * 2)
        ctx.strokeStyle = `${G}${0.06 + i * 0.0225})`
        ctx.lineWidth = i === 5 ? 1.5 : 0.9
        ctx.stroke()
      }

      // Cross lines
      ctx.strokeStyle = `${G}0.09)`; ctx.lineWidth = 0.75
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - R * 0.85, cy - R * 0.85); ctx.lineTo(cx + R * 0.85, cy + R * 0.85); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + R * 0.85, cy - R * 0.85); ctx.lineTo(cx - R * 0.85, cy + R * 0.85); ctx.stroke()

      // Sweep glow
      const sweep = ctx.createConicalGradient ? null : null // fallback below
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
      grad.addColorStop(0, `${G}0.27)`)
      grad.addColorStop(1, `${G}0)`)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R, -0.825, 0)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
      // Sweep leading edge
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(R, 0)
      ctx.strokeStyle = `${G}0.9)`
      ctx.lineWidth = 2.25
      ctx.stroke()
      ctx.restore()

      // Blips
      blips.forEach(b => {
        // activate blip when sweep passes over it
        const da = ((angle - b.a) + Math.PI * 2) % (Math.PI * 2)
        if (da < 0.075) { b.fade = 1; b.life = 0 }
        if (b.fade > 0) {
          b.fade -= 0.012
          b.life++
          const bx = cx + Math.cos(b.a) * b.r * R
          const by = cy + Math.sin(b.a) * b.r * R
          ctx.beginPath()
          ctx.arc(bx, by, 6, 0, Math.PI * 2)
          ctx.fillStyle = `${G}${Math.max(0, b.fade).toFixed(3)})`
          ctx.fill()
          ctx.beginPath()
          ctx.arc(bx, by, 12 + b.life * 0.45, 0, Math.PI * 2)
          ctx.strokeStyle = `${G}${Math.max(0, b.fade * 0.4).toFixed(3)})`
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
      })

      // UTM labels around rings
      ctx.font = `9px "Share Tech Mono", monospace`
      ctx.fillStyle = `${G}0.3)`
      const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
      labels.forEach((l, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2
        ctx.fillText(l, cx + Math.cos(a) * (R + 18) - 7.5, cy + Math.sin(a) * (R + 18) + 6)
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
  )
}

// ─── HEBRAS DE ADN / PARTÍCULAS HORIZONTALES ──────────────────────────────────
function DNAStrand() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    const G = 'rgba(0,255,65,'
    let t = 0

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    // Two pairs of double-helix strands — same as SleepScreen
    const dnaStrands = [
      { yFrac: 0.18, amp: 33, freq: 0.014, phaseOff: 0 },
      { yFrac: 0.82, amp: 33, freq: 0.014, phaseOff: Math.PI },
    ]

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      t += 0.007

      dnaStrands.forEach(s => {
        const yBase = H * s.yFrac
        const amp = s.amp
        ;[0, Math.PI].forEach((phAdd, pi) => {
          ctx.beginPath()
          for (let x = -60; x <= W + 60; x += 3) {
            const y = yBase + Math.sin(x * s.freq + t + s.phaseOff + phAdd) * amp
            x === -60 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `${G}${pi === 0 ? '0.55' : '0.28'})`
          ctx.lineWidth = pi === 0 ? 1.8 : 1.2
          ctx.stroke()
        })
        // Rungs
        const spacing = 42
        for (let x = -60; x <= W + 60; x += spacing) {
          const y1 = yBase + Math.sin(x * s.freq + t + s.phaseOff) * amp
          const y2 = yBase + Math.sin(x * s.freq + t + s.phaseOff + Math.PI) * amp
          ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2)
          ctx.strokeStyle = `${G}0.12)`
          ctx.lineWidth = 0.9; ctx.stroke()
          ctx.beginPath(); ctx.arc(x, y1, 2.25, 0, Math.PI * 2)
          ctx.fillStyle = `${G}0.75)`; ctx.fill()
          ctx.beginPath(); ctx.arc(x, y2, 2.25, 0, Math.PI * 2)
          ctx.fillStyle = `${G}0.75)`; ctx.fill()
        }
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
  )
}

// ─── PANTALLA DE INTRO PRINCIPAL ───────────────────────────────────────────────
export default function IntroScreen({ onEnter }) {
  const [phase, setPhase]     = useState('idle')   // idle | firing | transition
  const [bootLines, setBoot]  = useState([])
  const [showBtn, setShowBtn] = useState(false)
  // Boot sequence text
  useEffect(() => {
    const lines = [
      '> INICIANDO SISTEMA INNOVADEF...',
      '> CARGANDO MÓDULOS OPERACIONALES...',
      '> VERIFICANDO CERTIFICACIÓN ENS CAT-A...',
      '> CONECTANDO CON INFRAESTRUCTURA CLOUD...',
      '> TODOS LOS SISTEMAS OPERATIVOS.',
      '> BIENVENIDO, OPERADOR.',
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBoot(b => [...b, lines[i]])
        if (hasUserInteracted()) sfxBootLine()
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => { 
          setShowBtn(true) 
          if (hasUserInteracted()) sfxBootReady()
        }, 480)
      }
    }, 480)
    return () => clearInterval(interval)
  }, [])

  const handleEnter = () => {
    markUserInteracted()
    sfxEnterFiring()
    setPhase('firing')
    setTimeout(() => setPhase('transition'), 450)
    setTimeout(() => onEnter(), 2100)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#020a02',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      // wipe-out animation
      ...(phase === 'transition' ? {
        animation: 'introWipe 1.65s ease-in forwards'
      } : {})
    }}>
      {/* Giant Radar behind everything */}
      <GiantRadar />

      {/* DNA Strand across full width */}
      <DNAStrand />

      {/* Scanlines overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.27) 2px, rgba(0,0,0,0.27) 4px)' }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.9) 100%)' }} />

      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

        {/* Logo flotante */}
        <div style={{ animation: 'floatLogo 4.2s ease-in-out infinite', marginBottom: '30px' }}>
          <img
            src="/logoinnovadef.png"
            alt="INNOVADEF"
            style={{
              height: 'clamp(90px, 21vw, 180px)',
              filter: `drop-shadow(0 0 24px ${ACCENT}) drop-shadow(0 0 60px ${ACCENT}44)`
            }}
          />
          {/* Líneas de escáner debajo del logo */}
          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '360px', height: '3px', background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, animation: 'scanPulse 3s ease-in-out infinite' }} />
            <div style={{ width: '420px', height: '3px', background: `linear-gradient(90deg, transparent, ${ACCENT}66, transparent)`, animation: 'scanPulse 3s ease-in-out infinite 0.45s' }} />
          </div>
        </div>

        {/* Nombre del sistema */}
        <div style={{ fontFamily: FONT, fontSize: 'clamp(15px, 2.1vw, 21px)', letterSpacing: '6px', color: TEXT2, marginBottom: '12px', animation: 'fadeInUp 0.9s ease 0.3s both' }}>
          SISTEMA DE EVALUACIÓN TÁCTICA
        </div>
        <div style={{ fontFamily: FONT, fontSize: 'clamp(33px, 6vw, 78px)', letterSpacing: '9px', color: ACCENT, marginBottom: '6px', animation: 'fadeInUp 0.9s ease 0.6s both', textShadow: `0 0 30px ${ACCENT}66` }}>
          FOCO 2026
        </div>
        <div style={{ fontFamily: FONT, fontSize: 'clamp(12px, 1.5vw, 16.5px)', letterSpacing: '5px', color: TEXT2, opacity: 0.75, marginBottom: '18px', animation: 'fadeInUp 0.9s ease 0.9s both' }}>
          23.06.2026 · MADRID · ENS CAT-A CERTIFICADO
        </div>

        {/* Boot sequence */}
        <div style={{ fontFamily: FONT, fontSize: '21px', color: `${ACCENT}55`, letterSpacing: '1px', lineHeight: 3, textAlign: 'left', minHeight: '120px', marginBottom: '30px', width: 'clamp(280px, 75vw, 520px)', animation: 'fadeInUp 0.75s ease 1.2s both' }}>
          {bootLines.map((line, i) => (
            <div key={i} style={{ color: i === bootLines.length - 1 ? ACCENT : `${ACCENT}55`, animation: 'lineIn 0.3s ease' }}>
              {line}{i === bootLines.length - 1 ? <span style={{ animation: 'blink 1.2s infinite' }}>_</span> : ''}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {showBtn && (
          <button
            onClick={handleEnter}
            style={{
              fontFamily: FONT, fontSize: '27px', letterSpacing: '9px',
              padding: '18px 48px',
              background: 'transparent',
              border: `1.5px solid #ffaa0055`,
              color: '#ffaa00',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeInUp 0.75s ease both, btnPulse 3.75s ease-in-out infinite',
              transition: 'all 0.225s',
              boxShadow: phase === 'firing' ? `0 0 0 1.5px #ffaa0022, 0 0 40px #ffaa0044, inset 0 0 40px #ffaa0022` : `0 0 0 1.5px #ffaa0022, 0 0 24px #ffaa0018`,
              transform: phase === 'firing' ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            {/* Corner brackets */}
            <span style={{ position: 'absolute', top: 4.5, left: 4.5, width: 15, height: 15, borderTop: `1px solid ${ACCENT}`, borderLeft: `1px solid ${ACCENT}` }} />
            <span style={{ position: 'absolute', top: 4.5, right: 4.5, width: 15, height: 15, borderTop: `1px solid ${ACCENT}`, borderRight: `1px solid ${ACCENT}` }} />
            <span style={{ position: 'absolute', bottom: 4.5, left: 4.5, width: 15, height: 15, borderBottom: `1px solid ${ACCENT}`, borderLeft: `1px solid ${ACCENT}` }} />
            <span style={{ position: 'absolute', bottom: 4.5, right: 4.5, width: 15, height: 15, borderBottom: `1px solid ${ACCENT}`, borderRight: `1px solid ${ACCENT}` }} />
            INICIAR SISTEMA
          </button>
        )}

        {/* Session ID */}
        <div style={{ fontFamily: FONT, fontSize: '13.5px', color: `${ACCENT}30`, letterSpacing: '3px', marginTop: '36px' }}>
          ID: FOCO-{Date.now().toString(36).toUpperCase().slice(-6)} · v2.6.0
        </div>
      </div>

      {/* Transition overlay (flash on enter) */}
      {phase === 'transition' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: ACCENT, animation: 'flashOut 1.65s ease-out forwards', pointerEvents: 'none' }} />
      )}

      <style>{`
        @keyframes floatLogo {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes scanPulse {
          0%,100% { opacity: 0.45; transform: scaleX(0.84); }
          50%      { opacity: 1;   transform: scaleX(1.2); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes btnPulse {
          0%,100% { box-shadow: 0 0 12px rgba(0,255,65,0.225); }
          50%      { box-shadow: 0 0 28px rgba(0,255,65,0.525), 0 0 60px rgba(0,255,65,0.15); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes flashOut {
          0%   { opacity: 0.9; }
          22.5%  { opacity: 0.675; }
          100% { opacity: 0; }
        }
        @keyframes introWipe {
          0%   { opacity: 1; transform: scale(1); }
          45%  { opacity: 1; transform: scale(1.045); }
          100% { opacity: 0; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

export { MilitaryCursor }
