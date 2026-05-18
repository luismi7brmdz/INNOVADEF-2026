import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { ACCENT, FONT, TEXT2 } from './theme'
import { sfxWakeTouch, sfxWakeSweep, sfxWakeExplosion } from './sfx'

// ─── SLEEP BACKGROUND (DNA STRANDS) ───────────────────────────────────────────────────
function SleepBackground({ wakeProgress }) {
  const canvasRef = useRef(null)
  const wakeRef = useRef(0)

  useEffect(() => { wakeRef.current = wakeProgress }, [wakeProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const G = 'rgba(0,255,65,'
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

// ─── PLASMA SPHERE (Siri-like interactive orb) ───────────────────────────────────────
function PlasmaSphere() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    // Setup Three.js
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.z = 3.2

    const mouse = new THREE.Vector2(9999, 9999)
    const mouseVel = new THREE.Vector2(0, 0)
    let lastMouse = new THREE.Vector2(9999, 9999)
    let rawStr = 0

    const getSide = () => {
      const w = container.clientWidth * 0.7
      const h = container.clientHeight * 0.7
      return Math.min(w, h)
    }

    const resize = () => {
      const s = getSide()
      canvas.style.width = s + 'px'
      canvas.style.height = s + 'px'
      renderer.setSize(s, s, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }

    const onMove = (cx, cy) => {
      const r = canvas.getBoundingClientRect()
      const nx = ((cx - r.left) / r.width) * 2 - 1
      const ny = -((cy - r.top) / r.height) * 2 + 1
      const dvx = nx - lastMouse.x
      const dvy = ny - lastMouse.y
      lastMouse.set(nx, ny)
      mouse.set(nx, ny)
      mouseVel.set(dvx, dvy)
      rawStr = Math.min(1, Math.sqrt(dvx * dvx + dvy * dvy) * 22)
    }

    canvas.addEventListener('mousemove', e => onMove(e.clientX, e.clientY))
    canvas.addEventListener('mouseleave', () => { mouse.set(9999, 9999); rawStr = 0 })
    canvas.addEventListener('touchmove', e => {
      e.preventDefault()
      onMove(e.touches[0].clientX, e.touches[0].clientY)
    }, { passive: false })

    // Vertex shader
    const vs = `
      uniform float u_time;
      uniform vec2  u_mouse;
      uniform float u_mouseStr;
      uniform vec2  u_mouseVel;
      varying vec3  vNormal;
      varying float vDisp;
      varying float vRipple;

      vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
      vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
      vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
        vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
        vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
        float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
        vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
        vec4 h=1.-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
        vec4 sh=-step(h,vec4(0.));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
        vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
        m=m*m;
        return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }

      void main(){
        float t = u_time * 0.18;
        float n1 = snoise(position*1.8+vec3(t,t*0.6,t*0.4));
        float n2 = snoise(position*3.2+vec3(-t*0.5,t*0.8,-t*0.3));
        float n3 = snoise(position*5.5+vec3(t*0.3,-t*0.4,t*0.7));
        float baseDisp = n1*0.22+n2*0.10+n3*0.04;

        float ripple = 0.0;
        if(u_mouse.x < 9.0){
          vec4 mvp = projectionMatrix*modelViewMatrix*vec4(position,1.0);
          vec2 screenPos = mvp.xy/mvp.w;
          vec2 toMouse = screenPos - u_mouse;
          float dist = length(toMouse);
          float wave = exp(-dist*2.8)*u_mouseStr;
          float velMag = length(u_mouseVel);
          vec2 velDir = velMag>0.001 ? normalize(u_mouseVel) : vec2(0.);
          float directional = dot(normalize(toMouse+0.001),velDir);
          ripple = wave*(0.5+directional*0.5)*0.45;
          float rippleWave = sin(dist*12.0-u_time*2.5)*exp(-dist*1.8)*u_mouseStr*0.12;
          ripple += rippleWave;
        }

        vDisp   = baseDisp + ripple;
        vRipple = ripple;
        vNormal = normalize(normalMatrix*normal);
        gl_Position = projectionMatrix*modelViewMatrix*vec4(position+normal*(baseDisp+ripple),1.0);
      }
    `

    // Fragment shader
    const fs = `
      uniform float u_mouseStr;
      varying vec3  vNormal;
      varying float vDisp;
      varying float vRipple;

      void main(){
        float fresnel = pow(1.0-abs(dot(vNormal,vec3(0.,0.,1.))),3.2);
        float glow    = clamp(vDisp*2.2+0.25, 0., 1.);

        // Verde INNOVADEF
        vec3 cBase   = vec3(0.08, 0.72, 0.22);
        vec3 cMid    = vec3(0.12, 0.86, 0.32);
        vec3 cEdge   = vec3(0.06, 0.55, 0.18);

        vec3 col = mix(cEdge, cBase, glow);
        col = mix(col, cMid, clamp(vDisp*3.5,0.,1.)*0.55);
        col += fresnel * vec3(0.10, 0.68, 0.25) * 0.9;

        float rh = clamp(vRipple*4.5, 0., 1.);
        col = mix(col, vec3(0.15, 1.0, 0.35), rh*0.5*u_mouseStr);

        float alpha = clamp(0.50+fresnel*0.38+glow*0.28, 0., 1.);
        gl_FragColor = vec4(col*(0.72+glow*0.55), alpha);
      }
    `

    const geo = new THREE.IcosahedronGeometry(1, 80)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vs, fragmentShader: fs,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(9999, 9999) },
        u_mouseStr: { value: 0 },
        u_mouseVel: { value: new THREE.Vector2(0, 0) }
      },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    })
    scene.add(new THREE.Mesh(geo, mat))

    // Halo effects
    const mkHalo = (r, falloff, a) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 vN;uniform float u_ms;void main(){float i=pow(${falloff.toFixed(1)}-dot(vN,vec3(0.,0.,1.)),3.8);gl_FragColor=vec4(0.08,0.78,0.22,i*(${a.toFixed(2)}+u_ms*0.3));}`,
        uniforms: { u_ms: { value: 0 } },
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
      })
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), m))
      return m
    }
    const h1 = mkHalo(1.16, 0.72, 0.55)
    const h2 = mkHalo(1.35, 0.62, 0.25)

    let t0 = Date.now()
    let rotX = 0, rotY = 0, rotVX = 0.0003, rotVY = 0.0006
    let smoothStr = 0, smoothVelX = 0, smoothVelY = 0
    let lagMouseX = 9999, lagMouseY = 9999

    const animate = () => {
      requestAnimationFrame(animate)
      const elapsed = (Date.now() - t0) * 0.001

      const INERTIA = 0.025
      const VEL_INERTIA = 0.04

      smoothStr += (rawStr - smoothStr) * VEL_INERTIA
      smoothVelX += (mouseVel.x - smoothVelX) * VEL_INERTIA
      smoothVelY += (mouseVel.y - smoothVelY) * VEL_INERTIA
      rawStr *= 0.96

      if (mouse.x < 9.0) {
        lagMouseX += (mouse.x - lagMouseX) * INERTIA
        lagMouseY += (mouse.y - lagMouseY) * INERTIA
      } else {
        lagMouseX = 9999; lagMouseY = 9999
      }

      mat.uniforms.u_time.value = elapsed
      mat.uniforms.u_mouse.value.set(lagMouseX, lagMouseY)
      mat.uniforms.u_mouseStr.value = smoothStr
      mat.uniforms.u_mouseVel.value.set(smoothVelX, smoothVelY)
      h1.uniforms.u_ms.value = smoothStr
      h2.uniforms.u_ms.value = smoothStr

      rotVX += (Math.random() - 0.5) * 0.000012
      rotVY += (Math.random() - 0.5) * 0.000012
      rotVX *= 0.999; rotVY *= 0.999

      const drag = 1.0 - smoothStr * 0.2
      rotX += rotVX * drag
      rotY += rotVY * drag + smoothVelX * 0.003

      scene.children.forEach(c => { c.rotation.x = rotX; c.rotation.y = rotY })
      renderer.render(scene, camera)
    }

    resize()
    animate()

    const ro = new ResizeObserver(resize)
    ro.observe(container)

    return () => {
      ro.disconnect()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
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

      {/* ── Plasma Sphere (Siri-like interactive orb) ── */}
      <PlasmaSphere />

      {/* ── UI layer ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '60px 0', pointerEvents: 'auto' }}>

        {/* Logo */}
        <div style={{
          animation: isWaking ? 'none' : 'sleepFloat 4s ease-in-out infinite',
          opacity: isWaking ? Math.max(0, 1 - wakeProgress * 2) : 1,
          transform: isWaking ? `scale(${1 + wakeProgress * 0.3}) translateY(${-wakeProgress * 30}px)` : undefined,
          filter: isWaking ? `drop-shadow(0 0 ${wakeProgress * 60}px ${ACCENT}) brightness(${1 + wakeProgress})` : undefined,
          transition: 'filter 0.05s',
        }}>
          <img src="/logoinnovadef.png" alt="INNOVADEF"
            style={{ height: 'clamp(120px, 20vw, 200px)',
              filter: `brightness(0) saturate(100%) invert(74%) sepia(47%) saturate(539%) hue-rotate(86deg) brightness(107%) contrast(103%)`,
              opacity: 0.8 + wakeProgress * 0.2 }} />
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
              border: `1.5px solid rgba(0,0,0,1)`,
              borderRadius: '112.5px',
              animation: `sleepRing 2.6s ease-out ${i * 0.35}s infinite`,
            }} />
          ))}
          <div style={{
            width: '165px', height: '165px', borderRadius: '112.5px',
            border: `1.5px solid rgba(0,0,0,1)`,
            background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '9px',
            boxShadow: `0 0 60px rgba(0,0,0,0.5), 0 0 135px rgba(0,0,0,0.3)`,
            animation: 'sleepBtnPulse 3s ease-in-out infinite',
          }}>
            <div style={{ fontFamily: FONT, fontSize: '27px', color: 'rgba(255,255,255,0.9)', letterSpacing: '4.5px' }}>TOQUE</div>
            <div style={{ fontFamily: FONT, fontSize: '10.5px', color: 'rgba(255,255,255,0.7)', letterSpacing: '3px' }}>PARA INICIAR</div>
          </div>
        </div>

        {/* Status label */}
        <div style={{ fontFamily: FONT, fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', letterSpacing: '6px',
          opacity: isWaking ? 0 : 1, transition: 'opacity 0.2s',
          animation: 'sleepBlink 3.5s ease-in-out infinite' }}>
          SISTEMA EN ESPERA // INNOVADEF FOCO 2026
        </div>
      </div>

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
