import { useEffect, useRef, useState, useCallback } from 'react'
import { ACCENT, FONT, TEXT2 } from './theme'
import { sfxWakeTouch, sfxWakeSweep, markUserInteracted } from './sfx'

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
    const onBeforeUnload = () => cancelAnimationFrame(raf)
    window.addEventListener('beforeunload', onBeforeUnload)

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
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('beforeunload', onBeforeUnload) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// ─── PLASMA SPHERE (Siri-like interactive orb) ───────────────────────────────────────
let globalRenderer = null
let globalScene = null
let globalCamera = null
let globalMat = null
let globalHalo1 = null
let globalHalo2 = null
let globalRafId = null
let globalMouse = { x: 9999, y: 9999 }
let globalMouseVel = { x: 0, y: 0 }
let globalLastMouse = { x: 9999, y: 9999 }
let globalRawStr = 0
let globalRotX = 0, globalRotY = 0, globalRotVX = 0.0003, globalRotVY = 0.0006
let globalSmoothStr = 0, globalSmoothVelX = 0, globalSmoothVelY = 0
let globalLagMouseX = 9999, globalLagMouseY = 9999
let globalProximityStr = 0
let globalT0 = Date.now()
let globalExploding = false
let globalWakeProgress = 0

function cleanupWebGL() {
  if (globalRafId) cancelAnimationFrame(globalRafId)
  globalRafId = null
  if (globalRenderer) {
    if (globalScene) {
      globalScene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      globalScene.clear()
    }
    try { globalRenderer.forceContextLoss() } catch (_) {}
    globalRenderer.dispose()
    globalRenderer = null
  }
  globalScene = null
  globalCamera = null
  globalMat = null
  globalHalo1 = null
  globalHalo2 = null
  globalRafId = null
}

function initWebGL(THREE, canvas) {
  if (globalRenderer && globalRenderer.domElement === canvas) {
    return globalRenderer
  }
  cleanupWebGL()

  globalRenderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
  globalRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  globalRenderer.setClearColor(0x000000, 0)

  globalScene = new THREE.Scene()
  globalCamera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  globalCamera.position.z = 5.5

  globalT0 = Date.now()
  globalRotX = 0
  globalRotY = 0
  globalRotVX = 0.0003
  globalRotVY = 0.0006

  return globalRenderer
}

function PlasmaSphere({ exploding = false, wakeProgress = 0 }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    globalExploding = exploding
  }, [exploding])

  useEffect(() => {
    globalWakeProgress = wakeProgress
  }, [wakeProgress])

  // Limpia el contexto WebGL antes de que el navegador descargue la página
  // (botón atrás sin historial previo). Sin esto, Firefox y Chrome se cuelgan
  // porque el RAF loop sigue activo durante el unload.
  useEffect(() => {
    const onBeforeUnload = () => cleanupWebGL()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let cancelled = false
    let ro = null
    let onMouseMove = null

    import('three').then(THREE => {
      if (cancelled) return

      initWebGL(THREE, canvas)

      const getSide = () => Math.min(container.clientWidth, container.clientHeight)

      const resize = () => {
        const s = getSide()
        canvas.style.width = s + 'px'
        canvas.style.height = s + 'px'
        globalRenderer.setSize(s, s, false)
        globalCamera.aspect = 1
        globalCamera.updateProjectionMatrix()
      }

      const onMove = (cx, cy) => {
        const r = canvas.getBoundingClientRect()
        const nx = ((cx - r.left) / r.width) * 2 - 1
        const ny = -((cy - r.top) / r.height) * 2 + 1
        const dvx = nx - globalLastMouse.x
        const dvy = ny - globalLastMouse.y
        globalLastMouse.x = nx; globalLastMouse.y = ny
        globalMouse.x = nx; globalMouse.y = ny
        globalMouseVel.x = dvx; globalMouseVel.y = dvy
        globalRawStr = Math.min(1, Math.sqrt(dvx * dvx + dvy * dvy) * 22)
      }

      onMouseMove = e => onMove(e.clientX, e.clientY)
      const onMouseLeave = () => { globalMouse.x = 9999; globalMouse.y = 9999; globalRawStr = 0 }
      window.addEventListener('mousemove', onMouseMove)
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
      uniform float u_exploding;
      uniform float u_wakeProgress;
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
        float baseDisp = n1*0.28+n2*0.13+n3*0.05;

        float ripple = 0.0;
        float dent   = 0.0;
        if(u_mouse.x < 9.0){
          vec4 mvp = projectionMatrix*modelViewMatrix*vec4(position,1.0);
          vec2 screenPos = mvp.xy/mvp.w;
          vec2 toMouse = screenPos - u_mouse;
          float dist = length(toMouse);

          // Liquid push/pull wave
          float wave = exp(-dist*2.2)*u_mouseStr;
          float velMag = length(u_mouseVel);
          vec2 velDir = velMag>0.001 ? normalize(u_mouseVel) : vec2(0.);
          float directional = dot(normalize(toMouse+0.001),velDir);
          ripple = wave*(0.6+directional*0.4)*0.6;
          float rippleWave = sin(dist*10.0-u_time*3.0)*exp(-dist*1.5)*u_mouseStr*0.18;
          ripple += rippleWave;

          // Deep dent when cursor is close (absorption)
          float proximity = exp(-dist*4.5);
          dent = -proximity * u_mouseStr * 0.55;

          // Secondary liquid bulge around dent
          float bulge = exp(-dist*1.8) * (1.0-proximity) * u_mouseStr * 0.25;
          ripple += bulge;
        }

        // Explosion effect - expand and disintegrate
        float explosion = 0.0;
        if(u_exploding > 0.5){
          float explNoise = snoise(position*3.0+vec3(t*2.0,t*1.5,t*1.8));
          explosion = u_wakeProgress * 2.5 * (1.0 + explNoise);
        }

        float totalDisp = baseDisp + ripple + dent + explosion;
        vDisp   = totalDisp;
        vRipple = ripple + abs(dent) + explosion;
        vNormal = normalize(normalMatrix*normal);
        gl_Position = projectionMatrix*modelViewMatrix*vec4(position+normal*totalDisp,1.0);
      }
    `

    // Fragment shader
    const fs = `
      uniform float u_mouseStr;
      uniform float u_exploding;
      uniform float u_wakeProgress;
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

        float rh = clamp(vRipple*5.0, 0., 1.);
        col = mix(col, vec3(0.15, 1.0, 0.35), rh*0.6*u_mouseStr);

        // Dark cavity effect at dent points
        float cavity = clamp(-vDisp*4.0, 0., 1.);
        col = mix(col, vec3(0.01, 0.15, 0.05), cavity*0.7);

        // Explosion effect - bright white/cyan flash
        if(u_exploding > 0.5){
          float explFlash = u_wakeProgress * 2.0;
          vec3 cExpl = mix(vec3(0.2, 1.0, 0.8), vec3(1.0, 1.0, 1.0), explFlash);
          col = mix(col, cExpl, explFlash * 0.8);
        }

        float alpha = clamp(0.55+fresnel*0.40+glow*0.30, 0., 1.);
        alpha = mix(alpha, alpha*0.5, cavity*0.5);
        
        // Fade out during explosion
        if(u_exploding > 0.5){
          alpha *= (1.0 - u_wakeProgress * 0.8);
        }
        
        gl_FragColor = vec4(col*(0.78+glow*0.60), alpha);
      }
    `

    globalMat = new THREE.ShaderMaterial({
      vertexShader: vs, fragmentShader: fs,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(9999, 9999) },
        u_mouseStr: { value: 0 },
        u_mouseVel: { value: new THREE.Vector2(0, 0) },
        u_exploding: { value: 0 },
        u_wakeProgress: { value: 0 }
      },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    })
    globalScene.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 80), globalMat))

    // Halo effects
    const mkHalo = (r, falloff, a) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 vN;uniform float u_ms;void main(){float i=pow(${falloff.toFixed(1)}-dot(vN,vec3(0.,0.,1.)),3.8);gl_FragColor=vec4(0.08,0.78,0.22,i*(${a.toFixed(2)}+u_ms*0.3));}`,
        uniforms: { u_ms: { value: 0 } },
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
      })
      globalScene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), m))
      return m
    }
    globalHalo1 = mkHalo(1.16, 0.72, 0.55)
    globalHalo2 = mkHalo(1.35, 0.62, 0.25)

    const animate = () => {
      globalRafId = requestAnimationFrame(animate)
      const elapsed = (Date.now() - globalT0) * 0.001

      const INERTIA = 0.03
      const VEL_INERTIA = 0.06

      globalSmoothStr += (globalRawStr - globalSmoothStr) * VEL_INERTIA
      globalSmoothVelX += (globalMouseVel.x - globalSmoothVelX) * VEL_INERTIA
      globalSmoothVelY += (globalMouseVel.y - globalSmoothVelY) * VEL_INERTIA
      globalRawStr *= 0.94

      if (globalMouse.x < 9.0) {
        globalLagMouseX += (globalMouse.x - globalLagMouseX) * INERTIA
        globalLagMouseY += (globalMouse.y - globalLagMouseY) * INERTIA

        // Proximity = how close cursor is to center of orb
        const px = globalLagMouseX * globalLagMouseX + globalLagMouseY * globalLagMouseY
        const targetProximity = Math.max(0, 1.0 - Math.sqrt(px) * 1.5)
        globalProximityStr += (targetProximity - globalProximityStr) * 0.04
      } else {
        globalLagMouseX = 9999; globalLagMouseY = 9999
        globalProximityStr += (0 - globalProximityStr) * 0.03
      }

      // Combined str includes proximity (cursor near center = max effect)
      const combinedStr = Math.min(1, globalSmoothStr + globalProximityStr * 0.7)

      globalMat.uniforms.u_time.value = elapsed
      globalMat.uniforms.u_mouse.value.set(globalLagMouseX, globalLagMouseY)
      globalMat.uniforms.u_mouseStr.value = combinedStr
      globalMat.uniforms.u_mouseVel.value.set(globalSmoothVelX, globalSmoothVelY)
      globalMat.uniforms.u_exploding.value = globalExploding ? 1 : 0
      globalMat.uniforms.u_wakeProgress.value = globalWakeProgress
      globalHalo1.uniforms.u_ms.value = combinedStr
      globalHalo2.uniforms.u_ms.value = combinedStr

      globalRotVX += (Math.random() - 0.5) * 0.000012
      globalRotVY += (Math.random() - 0.5) * 0.000012
      globalRotVX *= 0.999; globalRotVY *= 0.999

      const drag = 1.0 - combinedStr * 0.3
      globalRotX += globalRotVX * drag
      globalRotY += globalRotVY * drag + globalSmoothVelX * 0.006

      globalScene.children.forEach(c => { c.rotation.x = globalRotX; c.rotation.y = globalRotY })
      globalRenderer.render(globalScene, globalCamera)
    }

      resize()
      animate()

      ro = new ResizeObserver(resize)
      ro.observe(container)
    })

    return () => {
      cancelled = true
      cleanupWebGL()
      if (ro) ro.disconnect()
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── SLEEP SCREEN ──────────────────────────────────────────────────────────────
export default function SleepScreen({ onWake }) {
  const [phase, setPhase]           = useState('idle')
  const [wakeProgress, setWakeProgress] = useState(0)
  const [touchOrigin, setTouchOrigin]   = useState({ x: 0, y: 0 })
  const rafRef       = useRef(null)
  const startTimeRef = useRef(null)

  const wake = useCallback((e) => {
    if (phase !== 'idle') return
    markUserInteracted()
    const x = e?.clientX ?? e?.touches?.[0]?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? e?.touches?.[0]?.clientY ?? window.innerHeight / 2
    setTouchOrigin({ x, y })
    sfxWakeTouch()
    sfxWakeSweep()
    setPhase('waking')
    startTimeRef.current = performance.now()
    const animWake = (now) => {
      const p = Math.min((now - startTimeRef.current) / 1400, 1)
      setWakeProgress(p)
      if (p < 1) { rafRef.current = requestAnimationFrame(animWake) }
      else { setPhase('done'); setTimeout(() => onWake(), 180) }
    }
    rafRef.current = requestAnimationFrame(animWake)
  }, [phase, onWake])

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), [])

  const isWaking    = phase === 'waking'
  const isExploding = false

  return (
    <div
      onClick={wake}
      onTouchStart={wake}
      className="sleep-screen"
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Fondos absolutos ── */}
      <SleepBackground wakeProgress={wakeProgress} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.14) 3px,rgba(0,0,0,0.14) 6px)',
        opacity: 1 - wakeProgress * 0.7 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,0.85) 100%)',
        opacity: 1 - wakeProgress * 0.8, transition: 'opacity 0.1s' }} />

      {/* ── 1. Logo ── */}
      <div style={{
        position: 'relative', zIndex: 3, flexShrink: 0,
        padding: '3vh 0 0',
        animation: isWaking ? 'none' : 'sleepFloat 4s ease-in-out infinite',
        opacity: isWaking ? Math.max(0, 1 - wakeProgress * 2) : 1,
        transform: isWaking ? `scale(${1 + wakeProgress * 0.3}) translateY(${-wakeProgress * 30}px)` : undefined,
      }}>
        <img src="/logoinnovadef.png" alt="INNOVADEF"
          style={{ height: '14vh', opacity: 0.85 }} />
      </div>

      {/* ── 2. Orbe — ocupa todo el espacio sobrante ── */}
      <PlasmaSphere key="plasma-sphere" exploding={isExploding} wakeProgress={wakeProgress} />

      {/* ── 3. Botón táctil — siempre en el layout, invisible al despertar ── */}
      <div style={{
          visibility: phase === 'idle' ? 'visible' : 'hidden',
          position: 'relative', zIndex: 3, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '1.5vh',
          padding: '0 0 3vh',
        }}>
          {/* Círculo con anillos */}
          <div style={{ position: 'relative', width: '18vh', height: '18vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute', left: '50%', top: '50%',
                width: `${100 + i * 40}%`, height: `${100 + i * 40}%`,
                border: `1.5px solid rgba(0,255,65,${0.5 - i * 0.15})`,
                borderRadius: '50%',
                transform: 'translate(-50%,-50%)',
                animation: `sleepRing 2.6s ease-out ${i * 0.45}s infinite`,
              }} />
            ))}
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              border: '1.5px solid rgba(0,255,65,0.45)',
              background: 'radial-gradient(circle,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.4) 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.5vh',
              animation: 'sleepBtnPulse 3s ease-in-out infinite',
            }}>
              <div style={{ fontFamily: FONT, fontSize: '2vh',
                color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em' }}>TOQUE</div>
              <div style={{ fontFamily: FONT, fontSize: '1vh',
                color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em' }}>PARA INICIAR</div>
            </div>
          </div>

          {/* Label footer */}
          <div style={{ fontFamily: FONT, fontSize: '1.2vh',
            color: 'rgba(255,255,255,0.25)', letterSpacing: '0.35em',
            animation: 'sleepBlink 3.5s ease-in-out infinite' }}>
            INNOVADEF FOCO 2026
          </div>
        </div>

      {/* ── HUD sweep durante el wake ── */}
      {isWaking && (
        <>
          <div style={{ position: 'fixed', left: 0, right: 0, height: '2px', zIndex: 6, pointerEvents: 'none',
            background: `linear-gradient(90deg,transparent,${ACCENT}cc 40%,${ACCENT} 50%,${ACCENT}cc 60%,transparent)`,
            boxShadow: `0 0 30px ${ACCENT}88`,
            top: `${wakeProgress * 100}%`, opacity: Math.sin(wakeProgress * Math.PI) }} />
          <div style={{ position: 'fixed', left: 0, right: 0, height: '2px', zIndex: 6, pointerEvents: 'none',
            background: `linear-gradient(90deg,transparent,${ACCENT}99 40%,${ACCENT}cc 50%,${ACCENT}99 60%,transparent)`,
            boxShadow: `0 0 18px ${ACCENT}66`,
            bottom: `${wakeProgress * 100}%`, opacity: Math.sin(wakeProgress * Math.PI) * 0.7 }} />
        </>
      )}

      {/* ── Flash al despertar ── */}
      {phase === 'done' && (
        <div style={{ position: 'absolute', left: touchOrigin.x, top: touchOrigin.y,
          zIndex: 10, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%',
            background: `radial-gradient(circle,white 0%,${ACCENT} 30%,transparent 70%)`,
            animation: 'pointerFlash 0.4s ease-out forwards',
            boxShadow: `0 0 100px ${ACCENT},0 0 200px ${ACCENT}88` }} />
        </div>
      )}

      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .sleep-screen { cursor: none !important; }
        }
        @keyframes sleepFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes sleepRing     { 0%{opacity:0.6;transform:translate(-50%,-50%) scale(0.85)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.3)} }
        @keyframes sleepBtnPulse { 0%,100%{box-shadow:0 0 30px rgba(0,255,65,0.1)} 50%{box-shadow:0 0 60px rgba(0,255,65,0.25)} }
        @keyframes sleepBlink    { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        @keyframes pointerFlash  { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
      `}</style>
    </div>
  )
}
