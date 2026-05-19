// ─── INNOVADEF SFX ENGINE — IMF EDITION ───────────────────────────────────────
// Síntesis militar/futurista de alto nivel. Tipo Misión Imposible IMF.
// Software sofisticado, serio, profesional.

let ctx = null
let userInteracted = false

// Llamar esto cuando el usuario hace click/touch
export function markUserInteracted() {
  userInteracted = true
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

// Verificar si el usuario ya ha interactuado
export function hasUserInteracted() {
  return userInteracted
}

function getCtx() {
  if (!ctx && userInteracted) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (ctx && ctx.state === 'suspended' && userInteracted) {
    ctx.resume().catch(() => {})
  }
  return ctx
}

// ── Utilidades avanzadas ────────────────────────────────────────────────────────

function sine(ac, freq, startTime, duration, gain, freqEnd, type = 'sine') {
  if (!ac) return
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, startTime)
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration)
  g.gain.setValueAtTime(0.0001, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  o.connect(g); g.connect(ac.destination)
  o.start(startTime); o.stop(startTime + duration + 0.01)
}

function filteredNoise(ac, startTime, duration, gain, lpFreq = 800, hpFreq = null) {
  if (!ac) return
  const bufSize = Math.ceil(ac.sampleRate * duration)
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  const filt = ac.createBiquadFilter()
  const g = ac.createGain()
  filt.type = 'lowpass'
  filt.frequency.value = lpFreq
  if (hpFreq) {
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = hpFreq
    src.connect(hp); hp.connect(filt)
  } else {
    src.connect(filt)
  }
  src.buffer = buf
  g.gain.setValueAtTime(0.0001, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  filt.connect(g); g.connect(ac.destination)
  src.start(startTime); src.stop(startTime + duration + 0.01)
}

function deepRumble(ac, startTime, duration, gain = 0.12) {
  if (!ac) return
  const o = ac.createOscillator()
  const lfo = ac.createOscillator()
  const lfoG = ac.createGain()
  const g = ac.createGain()
  o.type = 'sine'; o.frequency.value = 32
  lfo.type = 'sine'; lfo.frequency.value = 2.5
  lfoG.gain.value = 12
  lfo.connect(lfoG); lfoG.connect(o.frequency)
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.1)
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  o.connect(g); g.connect(ac.destination)
  o.start(startTime); o.stop(startTime + duration + 0.01)
  lfo.start(startTime); lfo.stop(startTime + duration + 0.01)
}

function cinematicWhoosh(ac, startTime, freqFrom, freqTo, duration, gain = 0.1) {
  if (!ac) return
  const bufSize = Math.ceil(ac.sampleRate * duration)
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  const filt = ac.createBiquadFilter()
  const g = ac.createGain()
  filt.type = 'bandpass'
  filt.frequency.setValueAtTime(freqFrom, startTime)
  filt.frequency.exponentialRampToValueAtTime(freqTo, startTime + duration)
  filt.Q.value = 5
  src.buffer = buf
  const peak = duration * 0.3
  g.gain.setValueAtTime(0.001, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + peak)
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  src.connect(filt); filt.connect(g); g.connect(ac.destination)
  src.start(startTime); src.stop(startTime + duration + 0.01)
}

function metallicPing(ac, startTime, freq, duration, gain) {
  if (!ac) return
  const o = ac.createOscillator()
  const g = ac.createGain()
  const filt = ac.createBiquadFilter()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, startTime)
  filt.type = 'highpass'
  filt.frequency.value = freq * 0.8
  filt.Q.value = 6
  g.gain.setValueAtTime(0.0001, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  o.connect(filt); filt.connect(g); g.connect(ac.destination)
  o.start(startTime); o.stop(startTime + duration + 0.01)
}

function chord(ac, startTime, freqs, duration, gain, stagger = 0.02) {
  if (!ac) return
  freqs.forEach((f, i) => sine(ac, f, startTime + i * stagger, duration, gain * (1 - i * 0.1)))
}

// ── SFX CINEMÁTICOS IMF ─────────────────────────────────────────────────────────

// SleepScreen: activación de sistemas — alarma militar de activación
export function sfxWakeTouch() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  // Sub-bass profundo de sistema encendiendo
  deepRumble(ac, now, 2.5, 0.35)
  // Sweep ascendente tipo radar encendiendo
  cinematicWhoosh(ac, now, 30, 800, 2.0, 0.2)
  // Tono grave militar — como sirena de submarino
  sine(ac, 55, now, 2.0, 0.15, 220)
  sine(ac, 110, now + 0.3, 1.5, 0.08, 440)
  // Ruido de estática de radio militar
  filteredNoise(ac, now + 0.1, 1.0, 0.06, 1200, 200)
}

// Wake sweep — barrido sonar militar ascendente
export function sfxWakeSweep() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  // Barrido sonar tipo CIC naval
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(200, now)
  o.frequency.exponentialRampToValueAtTime(2000, now + 1.8)
  g.gain.setValueAtTime(0.0001, now)
  g.gain.linearRampToValueAtTime(0.18, now + 0.2)
  g.gain.linearRampToValueAtTime(0.12, now + 1.2)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
  o.connect(g); g.connect(ac.destination)
  o.start(now); o.stop(now + 1.9)
  // Rumble de maquinaria pesada
  deepRumble(ac, now, 1.8, 0.18)
  // Eco metálico de sala de mando
  metallicPing(ac, now + 1.0, 1200, 0.6, 0.04)
  metallicPing(ac, now + 1.3, 1800, 0.4, 0.03)
}

// Explosión energética wake→intro — impacto imponente y respetable
export function sfxWakeExplosion() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  
  // Sub-bass impact layer 1 — muy grave, largo
  const o1 = ac.createOscillator()
  const g1 = ac.createGain()
  const lfo1 = ac.createOscillator()
  const lfoG1 = ac.createGain()
  o1.type = 'sine'
  o1.frequency.setValueAtTime(24, now)
  o1.frequency.exponentialRampToValueAtTime(12, now + 1.8)
  lfo1.type = 'sine'
  lfo1.frequency.value = 1.5
  lfoG1.gain.value = 8
  lfo1.connect(lfoG1); lfoG1.connect(o1.frequency)
  g1.gain.setValueAtTime(0.0001, now)
  g1.gain.linearRampToValueAtTime(0.5, now + 0.08)
  g1.gain.exponentialRampToValueAtTime(0.0001, now + 2.2)
  o1.connect(g1); g1.connect(ac.destination)
  o1.start(now); o1.stop(now + 2.3)
  lfo1.start(now); lfo1.stop(now + 2.3)

  // Sub-bass impact layer 2 — sawtooth para textura
  const o2 = ac.createOscillator()
  const g2 = ac.createGain()
  o2.type = 'sawtooth'
  o2.frequency.setValueAtTime(36, now)
  o2.frequency.exponentialRampToValueAtTime(18, now + 1.2)
  g2.gain.setValueAtTime(0.0001, now)
  g2.gain.linearRampToValueAtTime(0.25, now + 0.06)
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)
  o2.connect(g2); g2.connect(ac.destination)
  o2.start(now); o2.stop(now + 1.6)

  // Impact noise layer — textura agresiva
  const bufSize = ac.sampleRate * 0.8
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  const filt = ac.createBiquadFilter()
  const g3 = ac.createGain()
  src.buffer = buf
  filt.type = 'bandpass'
  filt.frequency.setValueAtTime(4000, now)
  filt.frequency.exponentialRampToValueAtTime(200, now + 0.6)
  filt.Q.value = 8
  g3.gain.setValueAtTime(0.0001, now)
  g3.gain.linearRampToValueAtTime(0.4, now + 0.04)
  g3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
  src.connect(filt); filt.connect(g3); g3.connect(ac.destination)
  src.start(now); src.stop(now + 0.8)

  // Mid-bass impact — cuerpo del impacto
  chord(ac, now, [40, 60, 80], 1.2, 0.3, 0.015)
  
  // High impact layer — brillo del impacto
  chord(ac, now + 0.08, [160, 240, 320, 400], 0.9, 0.15, 0.02)
  
  // Deep resonance sweep — eco militar largo
  const oRes = ac.createOscillator()
  const gRes = ac.createGain()
  const fRes = ac.createBiquadFilter()
  oRes.type = 'sawtooth'
  oRes.frequency.setValueAtTime(55, now + 0.1)
  oRes.frequency.exponentialRampToValueAtTime(28, now + 2.0)
  fRes.type = 'lowpass'
  fRes.frequency.setValueAtTime(300, now + 0.1)
  fRes.frequency.exponentialRampToValueAtTime(80, now + 2.0)
  gRes.gain.setValueAtTime(0.0001, now + 0.1)
  gRes.gain.linearRampToValueAtTime(0.22, now + 0.2)
  gRes.gain.exponentialRampToValueAtTime(0.0001, now + 2.2)
  oRes.connect(fRes); fRes.connect(gRes); gRes.connect(ac.destination)
  oRes.start(now + 0.1); oRes.stop(now + 2.3)

  // Klaxon alert sweep — tono de alerta militar descendente
  const oKlax = ac.createOscillator()
  const gKlax = ac.createGain()
  oKlax.type = 'square'
  oKlax.frequency.setValueAtTime(320, now + 0.05)
  oKlax.frequency.exponentialRampToValueAtTime(160, now + 0.5)
  gKlax.gain.setValueAtTime(0.0001, now + 0.05)
  gKlax.gain.linearRampToValueAtTime(0.12, now + 0.12)
  gKlax.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
  oKlax.connect(gKlax); gKlax.connect(ac.destination)
  oKlax.start(now + 0.05); oKlax.stop(now + 0.6)

  // Textured noise tail — cola de impacto profesional
  filteredNoise(ac, now + 0.1, 1.2, 0.06, 600, 200)
}

// Línea de boot — escritura de terminal clasificado
export function sfxBootLine() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  filteredNoise(ac, now, 0.03, 0.03, 5000, 2000)
  metallicPing(ac, now, 2400, 0.02, 0.012)
  sine(ac, 1200, now, 0.025, 0.015, 800, 'triangle')
}

// Sistema listo — confirmación de mando táctico
export function sfxBootReady() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  // Tono de confirmación grave — como sistema de armas confirmado
  sine(ac, 220, now, 0.3, 0.12, 220)
  sine(ac, 330, now + 0.15, 0.4, 0.10, 330)
  // Ping de sistema operativo
  metallicPing(ac, now + 0.35, 880, 0.5, 0.04)
  // Estática suave de radio
  filteredNoise(ac, now + 0.1, 0.3, 0.02, 3000, 1000)
}

// Cursor — click de sistema HUD táctico
export function sfxShot() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  filteredNoise(ac, now, 0.04, 0.05, 4000, 1500)
  metallicPing(ac, now, 1200, 0.03, 0.03)
  sine(ac, 800, now, 0.04, 0.025, 400, 'square')
}

// Botón INICIAR — activación de mando con autoridad
export function sfxEnterFiring() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  // Impacto grave de puerta blindada cerrando
  deepRumble(ac, now, 2.2, 0.4)
  // Whoosh de escáner pasando de izquierda a derecha
  cinematicWhoosh(ac, now + 0.05, 100, 3000, 1.5, 0.22)
  // Tono descendente de sirena militar
  sine(ac, 600, now + 0.1, 1.0, 0.10, 150)
  // Estática de comunicaciones
  filteredNoise(ac, now + 0.15, 0.8, 0.06, 2000, 400)
  // Ping de confirmación final
  metallicPing(ac, now + 0.8, 1600, 0.8, 0.05)
}

// Transición intro → dashboard — barrido escáner militar
export function sfxIntroWipe() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  // Barrido descendente tipo CIC — escáner cerrando
  cinematicWhoosh(ac, now, 3000, 40, 1.2, 0.25)
  // Impacto sub-bass de compuerta
  deepRumble(ac, now + 0.1, 1.5, 0.3)
  // Tono grave de sistema cargado
  sine(ac, 80, now + 0.15, 1.0, 0.12, 40)
  // Eco metálico final
  metallicPing(ac, now + 0.4, 600, 0.8, 0.05)
  filteredNoise(ac, now + 0.1, 0.6, 0.08, 500, 80)
}

// Dashboard: header materializa
export function sfxBootHeader() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  cinematicWhoosh(ac, now, 150, 1000, 0.3, 0.09)
  chord(ac, now, [320, 400, 480], 0.25, 0.035, 0.02)
  metallicPing(ac, now + 0.1, 640, 0.15, 0.02)
}

// HUD scan line — barrido de sonar militar
export function sfxHudScan() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  sine(ac, 1500, now, 0.8, 0.07, 120)
  sine(ac, 750, now + 0.1, 0.6, 0.04, 80)
  filteredNoise(ac, now, 0.5, 0.04, 600, 150)
  metallicPing(ac, now + 0.2, 3000, 0.2, 0.015)
}

// Card de módulo aparece
export function sfxCardAppear() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  filteredNoise(ac, now, 0.06, 0.03, 1500, 600)
  metallicPing(ac, now, 320 + Math.random() * 120, 0.08, 0.018)
  sine(ac, 200, now, 0.05, 0.02, 160, 'triangle')
}

// Módulo seleccionado — lock-on táctico sofisticado
export function sfxModuleSelect() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  deepRumble(ac, now, 0.8, 0.14)
  cinematicWhoosh(ac, now, 300, 2200, 0.6, 0.15)
  chord(ac, now, [220, 277, 330, 440, 554], 0.5, 0.08, 0.03)
  filteredNoise(ac, now, 0.2, 0.09, 1000, 200)
  metallicPing(ac, now + 0.15, 1760, 0.3, 0.04)
}

// RADAR PING — sonar real de submarino (archivo WAV)
let radarAudio = null
export function sfxRadarPing() {
  const ac = getCtx()
  const now = ac.currentTime

  // Detener audio anterior si existe
  if (radarAudio) {
    radarAudio.pause()
    radarAudio.currentTime = 0
  }

  radarAudio = new Audio('/submarine_sonar.wav')
  radarAudio.volume = 0.1
  radarAudio.play().catch(() => {})
  
  // Limpiar referencia cuando termine
  radarAudio.onended = () => { radarAudio = null }
}

// Hover — activación de objetivo
export function sfxHover() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  filteredNoise(ac, now, 0.04, 0.02, 2500, 1200)
  metallicPing(ac, now, 800, 0.04, 0.012)
  sine(ac, 500, now, 0.03, 0.018, 400, 'sawtooth')
}

// Reset / volver al selector — powering down
export function sfxReset() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  cinematicWhoosh(ac, now, 1000, 40, 0.7, 0.12)
  chord(ac, now, [180, 135, 90], 0.6, 0.08, 0.03)
  deepRumble(ac, now + 0.1, 0.6, 0.1)
  filteredNoise(ac, now, 0.4, 0.06, 500, 80)
}

// ── RUIDO DE FONDO AMBIENTAL ────────────────────────────────────────────────────────

let ambientAudio = null

// Iniciar ruido de fondo con sonar de submarino en loop
export function startAmbient() {
  if (ambientAudio) stopAmbient() // Detener si ya existe

  ambientAudio = new Audio('/submarine_sonar.wav')
  ambientAudio.loop = true
  ambientAudio.volume = 0.3
  ambientAudio.play().catch(() => {})
}

// Detener ruido de fondo
export function stopAmbient() {
  if (!ambientAudio) return
  const fadeDuration = 500
  const startVolume = ambientAudio.volume
  let elapsed = 0
  
  const fadeInterval = setInterval(() => {
    elapsed += 50
    const newVolume = Math.max(0, startVolume * (1 - elapsed / fadeDuration))
    ambientAudio.volume = newVolume
    
    if (elapsed >= fadeDuration || newVolume <= 0) {
      clearInterval(fadeInterval)
      ambientAudio.pause()
      ambientAudio = null
    }
  }, 50)
}
