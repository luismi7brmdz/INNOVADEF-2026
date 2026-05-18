// ─── INNOVADEF SFX ENGINE — IMF EDITION ───────────────────────────────────────
// Síntesis militar/futurista de alto nivel. Tipo Misión Imposible IMF.
// Software sofisticado, serio, profesional.

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// ── Utilidades avanzadas ────────────────────────────────────────────────────────

function sine(ac, freq, startTime, duration, gain, freqEnd, type = 'sine') {
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
  freqs.forEach((f, i) => sine(ac, f, startTime + i * stagger, duration, gain * (1 - i * 0.1)))
}

// ── SFX CINEMÁTICOS IMF ─────────────────────────────────────────────────────────

// SleepScreen: activación de sistemas — power-up militar sofisticado
export function sfxWakeTouch() {
  const ac = getCtx()
  const now = ac.currentTime
  deepRumble(ac, now, 2.0, 0.22)
  cinematicWhoosh(ac, now, 40, 600, 1.2, 0.15)
  chord(ac, now, [55, 82, 110, 165], 0.8, 0.06, 0.03)
  filteredNoise(ac, now + 0.2, 0.6, 0.04, 2000, 400)
}

// Wake sweep — sistema arrancando, sweep de frecuencia sofisticado
export function sfxWakeSweep() {
  const ac = getCtx()
  const now = ac.currentTime
  const o = ac.createOscillator()
  const g = ac.createGain()
  const lfo = ac.createOscillator()
  const lfoG = ac.createGain()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(30, now)
  o.frequency.exponentialRampToValueAtTime(280, now + 1.6)
  lfo.type = 'sine'
  lfo.frequency.value = 4
  lfoG.gain.value = 15
  lfo.connect(lfoG); lfoG.connect(o.frequency)
  g.gain.setValueAtTime(0.0001, now)
  g.gain.linearRampToValueAtTime(0.12, now + 0.4)
  g.gain.linearRampToValueAtTime(0.06, now + 1.2)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
  o.connect(g); g.connect(ac.destination)
  o.start(now); o.stop(now + 1.7)
  lfo.start(now); lfo.stop(now + 1.7)
  filteredNoise(ac, now, 1.6, 0.05, 400, 80)
  metallicPing(ac, now + 0.8, 880, 0.4, 0.03)
}

// Explosión energética wake→intro — impacto imponente y respetable
export function sfxWakeExplosion() {
  const ac = getCtx()
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
  
  // Metallic resonance — eco largo
  metallicPing(ac, now + 0.12, 1200, 1.4, 0.06)
  metallicPing(ac, now + 0.18, 1800, 1.2, 0.04)
  metallicPing(ac, now + 0.24, 2400, 1.0, 0.03)

  // Shimmer high-frequency
  filteredNoise(ac, now + 0.15, 0.8, 0.04, 12000, 6000)
}

// Línea de boot — escritura de terminal clasificado
export function sfxBootLine() {
  const ac = getCtx()
  const now = ac.currentTime
  filteredNoise(ac, now, 0.03, 0.03, 5000, 2000)
  metallicPing(ac, now, 2400, 0.02, 0.012)
  sine(ac, 1200, now, 0.025, 0.015, 800, 'triangle')
}

// Botón de sistema listo — chord de confirmación profesional
export function sfxBootReady() {
  const ac = getCtx()
  const now = ac.currentTime
  chord(ac, now, [130, 164, 196, 261, 329], 1.4, 0.07, 0.04)
  filteredNoise(ac, now + 0.15, 0.6, 0.025, 8000, 3000)
  metallicPing(ac, now + 0.3, 1568, 0.8, 0.03)
}

// Cursor — click de sistema HUD táctico
export function sfxShot() {
  const ac = getCtx()
  const now = ac.currentTime
  filteredNoise(ac, now, 0.04, 0.05, 4000, 1500)
  metallicPing(ac, now, 1200, 0.03, 0.03)
  sine(ac, 800, now, 0.04, 0.025, 400, 'square')
}

// Botón INICIAR SISTEMA — power-up cinematográfico sofisticado
export function sfxEnterFiring() {
  const ac = getCtx()
  const now = ac.currentTime
  deepRumble(ac, now, 1.8, 0.25)
  cinematicWhoosh(ac, now, 60, 1500, 1.0, 0.18)
  chord(ac, now, [65, 98, 130, 196, 260], 1.2, 0.08, 0.05)
  filteredNoise(ac, now + 0.2, 0.7, 0.08, 1500, 300)
  metallicPing(ac, now + 0.5, 2093, 0.6, 0.04)
}

// Transición intro → dashboard — wipe cinematográfico
export function sfxIntroWipe() {
  const ac = getCtx()
  const now = ac.currentTime
  cinematicWhoosh(ac, now, 2500, 60, 0.8, 0.18)
  deepRumble(ac, now, 1.0, 0.18)
  filteredNoise(ac, now, 0.5, 0.12, 800, 100)
  sine(ac, 200, now, 0.6, 0.06, 80)
}

// Dashboard: header materializa
export function sfxBootHeader() {
  const ac = getCtx()
  const now = ac.currentTime
  cinematicWhoosh(ac, now, 150, 1000, 0.3, 0.09)
  chord(ac, now, [320, 400, 480], 0.25, 0.035, 0.02)
  metallicPing(ac, now + 0.1, 640, 0.15, 0.02)
}

// HUD scan line — barrido de sonar militar
export function sfxHudScan() {
  const ac = getCtx()
  const now = ac.currentTime
  sine(ac, 1500, now, 0.8, 0.07, 120)
  sine(ac, 750, now + 0.1, 0.6, 0.04, 80)
  filteredNoise(ac, now, 0.5, 0.04, 600, 150)
  metallicPing(ac, now + 0.2, 3000, 0.2, 0.015)
}

// Card de módulo aparece
export function sfxCardAppear() {
  const ac = getCtx()
  const now = ac.currentTime
  filteredNoise(ac, now, 0.06, 0.03, 1500, 600)
  metallicPing(ac, now, 320 + Math.random() * 120, 0.08, 0.018)
  sine(ac, 200, now, 0.05, 0.02, 160, 'triangle')
}

// Módulo seleccionado — lock-on táctico sofisticado
export function sfxModuleSelect() {
  const ac = getCtx()
  const now = ac.currentTime
  deepRumble(ac, now, 0.8, 0.14)
  cinematicWhoosh(ac, now, 300, 2200, 0.6, 0.15)
  chord(ac, now, [220, 277, 330, 440, 554], 0.5, 0.08, 0.03)
  filteredNoise(ac, now, 0.2, 0.09, 1000, 200)
  metallicPing(ac, now + 0.15, 1760, 0.3, 0.04)
}

// RADAR PING — sonar real de submarino (archivo WAV)
export function sfxRadarPing() {
  const ac = getCtx()
  const now = ac.currentTime

  const audio = new Audio('/submarine_sonar.wav')
  audio.currentTime = 0
  audio.play().catch(() => {})
}

// Hover — activación de objetivo
export function sfxHover() {
  const ac = getCtx()
  const now = ac.currentTime
  filteredNoise(ac, now, 0.04, 0.02, 2500, 1200)
  metallicPing(ac, now, 800, 0.04, 0.012)
  sine(ac, 500, now, 0.03, 0.018, 400, 'sawtooth')
}

// Reset / volver al selector — powering down
export function sfxReset() {
  const ac = getCtx()
  const now = ac.currentTime
  cinematicWhoosh(ac, now, 1000, 40, 0.7, 0.12)
  chord(ac, now, [180, 135, 90], 0.6, 0.08, 0.03)
  deepRumble(ac, now + 0.1, 0.6, 0.1)
  filteredNoise(ac, now, 0.4, 0.06, 500, 80)
}
