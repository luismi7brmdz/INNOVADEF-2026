import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Terminal } from 'lucide-react'
import { ACCENT, AMBER, RED, BORDER, CARD, TEXT2, FONT, S } from '../theme'

// ─── MISSION DATA ─────────────────────────────────────────────────────────────
const MISSION = {
  code: 'OP-SOMBRA-7',
  briefing: [
    { t: 60,  text: 'CONEXIÓN SEGURA ESTABLECIDA — CIFRADO AES-256 ACTIVO' },
    { t: 120, text: 'IDENTIDAD VERIFICADA — BIENVENIDO, OPERATIVO' },
    { t: 200, text: 'CARGANDO MISIÓN: OP-SOMBRA-7 — CLASIFICADO ALTO' },
    { t: 300, text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
    { t: 420, text: 'INTELIGENCIA DETECTA EXFILTRACIÓN DE DATOS DESDE RED INTRADEF' },
    { t: 560, text: 'ORIGEN: DESCONOCIDO — MÉTODO: STEGANOGRAFÍA EN ARCHIVOS DE FORMACIÓN' },
    { t: 700, text: 'SU MISIÓN: INFILTRAR EL SISTEMA, LOCALIZAR AL AGENTE, EXFILTRAR PRUEBAS' },
    { t: 860, text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
    { t: 1000, text: 'INGRESE COMANDO PARA COMENZAR: [CONECTAR]' },
  ]
}

// Cipher key for decoding puzzles (simple substitution)
const CIPHER = {
  A:'M', B:'X', C:'R', D:'K', E:'Z', F:'Q', G:'P', H:'N', I:'S', J:'V',
  K:'D', L:'F', M:'A', N:'H', O:'L', P:'G', Q:'J', R:'C', S:'I', T:'O',
  U:'B', V:'E', W:'Y', X:'U', Y:'W', Z:'T',
}
const DECIPHER = Object.fromEntries(Object.entries(CIPHER).map(([k,v]) => [v, k]))

function encodeMsg(msg) {
  return msg.toUpperCase().split('').map(c => CIPHER[c] || c).join('')
}

// Intercept messages to decode (player must find 3 keywords)
const INTERCEPTS = [
  {
    id: 1,
    label: 'TRANSMISIÓN INTERCEPTADA #1',
    encoded: encodeMsg('OPERACION AURORA ACTIVA NODO NORTE'),
    hint: 'DECODIFIQUE PARA IDENTIFICAR EL NOMBRE DE LA OPERACIÓN ENEMIGA',
    keyword: 'AURORA',
    keywordPos: 10,
  },
  {
    id: 2,
    label: 'TRANSMISIÓN INTERCEPTADA #2',
    encoded: encodeMsg('AGENTE FALCON COORDINA TRANSFER ARCHIVO'),
    hint: 'IDENTIFIQUE EL NOMBRE EN CLAVE DEL AGENTE INFILTRADO',
    keyword: 'FALCON',
    keywordPos: 7,
  },
  {
    id: 3,
    label: 'TRANSMISIÓN INTERCEPTADA #3',
    encoded: encodeMsg('EXFILTRACION MARTES VEINTITRES CERO TRES'),
    hint: 'DETERMINE LA FECHA Y HORA DE LA EXFILTRACIÓN PLANIFICADA',
    keyword: 'MARTES',
    keywordPos: 13,
  },
]

// Commands the player can type
const VALID_COMMANDS = [
  'CONECTAR', 'SCAN', 'ACCEDER', 'ANALIZAR', 'EXFILTRAR', 'SALIR', 'AYUDA',
  'LS', 'DIR', 'STATUS', 'DECODE', 'TRANSMISION 1', 'TRANSMISION 2', 'TRANSMISION 3',
]

const CMD_RESPONSES = {
  'AYUDA': [
    '> COMANDOS DISPONIBLES:',
    '  SCAN      — Escanear red en busca de nodos activos',
    '  ACCEDER   — Acceder al nodo identificado',
    '  ANALIZAR  — Analizar archivos del sistema',
    '  TRANSMISION 1/2/3 — Ver transmisiones interceptadas',
    '  DECODE    — Activar decodificador de cifrado',
    '  EXFILTRAR — Extraer evidencias (requiere 3 pruebas)',
    '  STATUS    — Estado de la misión',
  ],
  'LS': ['> /INTRADEF/ARCHIVOS/', '  formacion_2026.zip  [CIFRADO]', '  usuarios_red.db     [RESTRINGIDO]', '  logs_acceso.txt    [DISPONIBLE]'],
  'DIR': ['> /INTRADEF/ARCHIVOS/', '  formacion_2026.zip  [CIFRADO]', '  usuarios_red.db     [RESTRINGIDO]', '  logs_acceso.txt    [DISPONIBLE]'],
}

// ─── DECODER PUZZLE ───────────────────────────────────────────────────────────
function DecoderPuzzle({ intercept, onSolved, onClose }) {
  const [revealed, setRevealed] = useState({}) // index -> decoded char
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const encoded = intercept.encoded
  const words = encoded.split(' ')

  const tryDecode = () => {
    const guess = input.trim().toUpperCase()
    if (guess === intercept.keyword) {
      setSolved(true)
      setTimeout(() => onSolved(intercept), 1200)
    } else {
      setAttempts(a => a + 1)
      setError(`INCORRECTO (${attempts + 1}/3 INTENTOS)`)
      setInput('')
      setTimeout(() => setError(''), 1500)
      if (attempts >= 2) {
        // Give hint: reveal first 2 chars
        const hint = {}
        for (let i = 0; i < Math.min(2, intercept.keyword.length); i++) {
          hint[intercept.keywordPos + i] = intercept.keyword[i]
        }
        setRevealed(r => ({ ...r, ...hint }))
      }
    }
  }

  let charIdx = 0
  return (
    <div style={{ ...CARD, borderColor: `${ACCENT}44`, marginTop: '16px' }}>
      <div style={{ fontSize: '19.5px', color: TEXT2, letterSpacing: '4.5px', marginBottom: '18px' }}>
        // {intercept.label} — DECODIFICADOR ACTIVO
      </div>
      <div style={{ fontSize: '29.25px', color: TEXT2, letterSpacing: '2.25px', marginBottom: '36px', lineHeight: 2.7 }}>
        {intercept.hint}
      </div>

      {/* Encoded message display */}
      <div style={{ background: '#030303', border: `1px solid ${BORDER}`, padding: '24px', marginBottom: '24px', fontFamily: FONT }}>
        <div style={{ fontFamily: FONT, fontSize: '40.5px', color: ACCENT, letterSpacing: '6.75px', marginBottom: '60.75px' }}>TRANSMISIÓN CIFRADA:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
          {words.map((word, wi) => (
            <span key={wi} style={{ display: 'inline-flex', gap: '3px', marginRight: '18px' }}>
              {word.split('').map((char, ci) => {
                const idx = charIdx++
                const isRevealed = revealed[idx]
                const isKeyword = idx >= intercept.keywordPos && idx < intercept.keywordPos + intercept.keyword.length
                return (
                  <span key={ci} style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                  }}>
                    <span style={{
                      fontSize: '27px', fontFamily: FONT, letterSpacing: '1.5px',
                      color: isRevealed ? ACCENT : isKeyword && solved ? ACCENT : TEXT2,
                      borderBottom: isKeyword ? `1px solid ${ACCENT}55` : '1px solid transparent',
                      minWidth: '12px', textAlign: 'center',
                    }}>
                      {isRevealed ? revealed[idx] : (solved && isKeyword ? intercept.keyword[idx - intercept.keywordPos] : char)}
                    </span>
                    <span style={{ fontSize: '15px', color: 'rgba(0,255,65,0.2)', fontFamily: FONT }}>{idx}</span>
                  </span>
                )
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Cipher reference */}
      <div style={{ background: '#030303', border: `1px solid ${BORDER}`, padding: '10px', marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', color: TEXT2, letterSpacing: '3px', marginBottom: '12px' }}>TABLA DE CIFRADO PARCIAL:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(DECIPHER).slice(0, 16).map(([enc, dec]) => (
            <span key={enc} style={{ fontSize: '19.5px', fontFamily: FONT, color: TEXT2 }}>
              <span style={{ color: ACCENT }}>{enc}</span>→<span style={{ color: AMBER }}>{dec}</span>
            </span>
          ))}
          <span style={{ fontSize: '19.5px', color: TEXT2, opacity: 0.4 }}>... [CLASIFICADO]</span>
        </div>
      </div>

      {/* Input */}
      {!solved ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: ACCENT, fontSize: '16px', fontFamily: FONT }}>{'>'}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && input.trim() && tryDecode()}
            placeholder={`INGRESE PALABRA CLAVE (POS. ${intercept.keywordPos}-${intercept.keywordPos + intercept.keyword.length - 1})`}
            style={{
              flex: 1, padding: '12px', background: '#030303', border: `1px solid ${error ? RED : BORDER}`,
              color: ACCENT, fontFamily: FONT, fontSize: '21px', letterSpacing: '3px', outline: 'none',
            }}
          />
          <button onClick={tryDecode} disabled={!input.trim()}
            style={{ ...S.btnPrimary, padding: '12px 24px', opacity: input.trim() ? 1 : 0.4 }}>
            VERIFICAR
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'rgba(0,255,65,0.06)', border: `1px solid ${ACCENT}44`, textAlign: 'center' }}>
          <div style={{ color: ACCENT, fontSize: '22.5px', letterSpacing: '4.5px' }}>✓ TRANSMISIÓN DECODIFICADA — PALABRA CLAVE: {intercept.keyword}</div>
        </div>
      )}
      {error && <div style={{ marginTop: '12px', fontSize: '19.5px', color: RED, letterSpacing: '3px' }}>{error}</div>}
      {!solved && (
        <button onClick={onClose} style={{ marginTop: '18px', background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', fontFamily: FONT, fontSize: '18px', letterSpacing: '3px' }}>
          [ CERRAR ]
        </button>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CovertMission({ onComplete }) {
  const [phase, setPhase] = useState('intro')
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [briefingDone, setBriefingDone] = useState(false)
  const [solvedIntercepts, setSolvedIntercepts] = useState([]) // [1,2,3]
  const [activeDecoder, setActiveDecoder] = useState(null) // intercept id
  const [missionPhase, setMissionPhase] = useState('boot') // boot | ops | exfil | done
  const [networkMap, setNetworkMap] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const terminalRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [lines])

  // Briefing typewriter
  useEffect(() => {
    if (phase !== 'game') return
    setBriefingDone(false)
    setLines([])
    let done = false
    MISSION.briefing.forEach(({ t, text }) => {
      timerRef.current = setTimeout(() => {
        setLines(l => [...l, { text, type: 'system' }])
        if (t === MISSION.briefing[MISSION.briefing.length - 1].t) {
          setBriefingDone(true)
          setMissionPhase('boot')
        }
      }, t)
    })
    return () => { done = true; clearTimeout(timerRef.current) }
  }, [phase])

  const addLine = (text, type = 'output') => {
    setLines(l => [...l, { text, type }])
  }

  const handleCommand = (cmd) => {
    const c = cmd.trim().toUpperCase()
    if (!c) return
    addLine(`> ${c}`, 'input')
    setInput('')

    if (!briefingDone && c !== 'CONECTAR') {
      addLine('SISTEMA NO LISTO — ESPERE...', 'error'); return
    }

    if (c === 'CONECTAR') {
      if (missionPhase === 'boot') {
        addLine('AUTENTICANDO...', 'system')
        setTimeout(() => {
          addLine('ACCESO CONCEDIDO — RED INTRADEF INFILTRADA', 'success')
          addLine('ESCRIBE "AYUDA" PARA VER COMANDOS DISPONIBLES', 'system')
          setMissionPhase('ops')
        }, 800)
      } else addLine('YA ESTÁ CONECTADO', 'error')
      return
    }

    if (missionPhase === 'boot') { addLine('PRIMERO DEBE CONECTARSE: ESCRIBA "CONECTAR"', 'error'); return }

    if (CMD_RESPONSES[c]) {
      CMD_RESPONSES[c].forEach(l => addLine(l, 'output'))
      return
    }

    if (c === 'SCAN') {
      addLine('ESCANEANDO RED INTRADEF...', 'system')
      setTimeout(() => {
        addLine('NODOS DETECTADOS:', 'output')
        addLine('  [192.168.1.10] SERVIDOR-FORMACION  — ACTIVO', 'output')
        addLine('  [192.168.1.44] ESTACION-DESCONOCIDA — ⚠ SOSPECHOSO', 'error')
        addLine('  [192.168.1.77] ARCHIVO-CENTRAL      — ACTIVO', 'output')
        addLine('NODO SOSPECHOSO IDENTIFICADO EN 192.168.1.44', 'success')
        setNetworkMap(true)
      }, 900)
      return
    }

    if (c === 'ACCEDER') {
      if (!networkMap) { addLine('ERROR: PRIMERO EJECUTE "SCAN"', 'error'); return }
      addLine('ACCEDIENDO A 192.168.1.44...', 'system')
      setTimeout(() => {
        addLine('ACCESO OBTENIDO — SISTEMA COMPROMETIDO DETECTADO', 'success')
        addLine('3 TRANSMISIONES CIFRADAS ENCONTRADAS', 'output')
        addLine('USE "TRANSMISION 1/2/3" PARA VER CADA UNA', 'system')
        setMissionPhase('intercepts')
      }, 800)
      return
    }

    if (c === 'ANALIZAR') {
      addLine('ANALIZANDO LOGS DE ACCESO...', 'system')
      setTimeout(() => {
        addLine('ACCESOS ANÓMALOS DETECTADOS: 47 TRANSFERENCIAS NO AUTORIZADAS', 'error')
        addLine('VOLUMEN TOTAL EXFILTRADO: 4.7 GB', 'error')
        addLine('PROTOCOLO UTILIZADO: ESTEGANOGRAFÍA EN ARCHIVOS PDF', 'output')
      }, 700)
      return
    }

    if (c.startsWith('TRANSMISION')) {
      if (missionPhase !== 'intercepts' && missionPhase !== 'ops') {
        addLine('ERROR: PRIMERO ACCEDA AL NODO SOSPECHOSO — EJECUTE "ACCEDER"', 'error'); return
      }
      const num = parseInt(c.split(' ')[1])
      if (num >= 1 && num <= 3) {
        if (solvedIntercepts.includes(num)) {
          addLine(`TRANSMISIÓN ${num} YA DECODIFICADA ✓`, 'success')
        } else {
          addLine(`CARGANDO TRANSMISIÓN CIFRADA #${num}...`, 'system')
          setActiveDecoder(num)
        }
      } else addLine('ESPECIFIQUE: TRANSMISION 1, 2 O 3', 'error')
      return
    }

    if (c === 'STATUS') {
      addLine('━━━ ESTADO DE MISIÓN ━━━', 'system')
      addLine(`FASE: ${missionPhase.toUpperCase()}`, 'output')
      addLine(`TRANSMISIONES DECODIFICADAS: ${solvedIntercepts.length}/3`, solvedIntercepts.length === 3 ? 'success' : 'output')
      addLine(`RED INFILTRADA: ${networkMap ? 'SÍ' : 'NO'}`, networkMap ? 'success' : 'output')
      if (solvedIntercepts.length === 3) addLine('LISTO PARA EXFILTRAR — EJECUTE "EXFILTRAR"', 'success')
      return
    }

    if (c === 'EXFILTRAR') {
      if (solvedIntercepts.length < 3) {
        addLine(`ERROR: FALTAN ${3 - solvedIntercepts.length} TRANSMISIONES POR DECODIFICAR`, 'error')
        addLine('DECODIFIQUE TODAS LAS TRANSMISIONES ANTES DE EXFILTRAR', 'error')
        return
      }
      addLine('INICIANDO EXFILTRACIÓN DE EVIDENCIAS...', 'system')
      setMissionPhase('exfil')
      const steps = [
        { t: 400,  text: 'COMPRIMIENDO EVIDENCIAS... [████░░░░] 45%' },
        { t: 900,  text: 'CIFRANDO PAQUETE... [████████░░] 80%' },
        { t: 1400, text: 'TRANSMITIENDO VÍA CANAL SEGURO... [██████████] 100%' },
        { t: 1900, text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
        { t: 2100, text: 'MISIÓN COMPLETADA — EVIDENCIAS EXFILTRADAS' },
        { t: 2300, text: `OPERATIVO: AURORA=${solvedIntercepts.includes(1)?'✓':'✗'} FALCON=${solvedIntercepts.includes(2)?'✓':'✗'} FECHA=${solvedIntercepts.includes(3)?'✓':'✗'}` },
      ]
      steps.forEach(({ t, text }) => setTimeout(() => addLine(text, t === 2100 ? 'success' : 'system'), t))
      const score = 500 + solvedIntercepts.length * 200
      setTimeout(() => {
        setFinalScore(score)
        setMissionPhase('done')
        setPhase('result')
      }, 2800)
      return
    }

    if (c === 'DECODE') {
      addLine('DECODIFICADOR DISPONIBLE VÍA "TRANSMISION 1/2/3"', 'system'); return
    }

    addLine(`COMANDO NO RECONOCIDO: "${c}" — ESCRIBA "AYUDA"`, 'error')
  }

  const handleSolved = (intercept) => {
    setActiveDecoder(null)
    setSolvedIntercepts(prev => {
      const next = [...new Set([...prev, intercept.id])]
      setTimeout(() => {
        addLine(`✓ TRANSMISIÓN ${intercept.id} DECODIFICADA — PALABRA CLAVE: ${intercept.keyword}`, 'success')
        if (next.length === 3) {
          setTimeout(() => {
            addLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system')
            addLine('TODAS LAS TRANSMISIONES DECODIFICADAS', 'success')
            addLine('EJECUTE "EXFILTRAR" PARA COMPLETAR LA MISIÓN', 'success')
          }, 400)
        }
      }, 100)
      return next
    })
  }

  const lineColor = (type) => {
    if (type === 'input') return ACCENT
    if (type === 'success') return '#00FF41'
    if (type === 'error') return RED
    if (type === 'system') return AMBER
    return 'rgba(0,255,65,0.55)'
  }

  const rank = finalScore >= 1000 ? 'AGENTE FANTASMA' : finalScore >= 700 ? 'OPERATIVO ÉLITE' : 'AGENTE EN CAMPO'

  return (
    <div style={{ maxWidth: '1920px', width: '100%', margin: '0 auto', fontFamily: FONT }}>

      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <div>
          <div style={{ fontSize: '19.5px', letterSpacing: '4.5px', color: TEXT2, marginBottom: '18px' }}>// MOD-08 — OPERACIÓN ENCUBIERTA</div>
          <div style={{ fontSize: 'clamp(39px, 4.5vw, 66px)', letterSpacing: '6px', color: ACCENT, marginBottom: '48px' }}>
            MISIÓN SOMBRA — TERMINAL CLASIFICADO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ ...CARD, borderLeft: `2px solid ${ACCENT}44` }}>
              <div style={{ fontSize: '13.5px', color: TEXT2, letterSpacing: '4.5px', marginBottom: '15px' }}>// OBJETIVO</div>
              <p style={{ fontSize: '22.5px', color: TEXT2, lineHeight: 1.8, margin: 0 }}>
                INFILTRE UNA RED COMPROMETIDA, INTERCEPTE TRANSMISIONES CIFRADAS Y DECODIFÍQUELAS PARA IDENTIFICAR AL AGENTE INFILTRADO Y NEUTRALIZAR LA AMENAZA.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'TIPO', val: 'TERMINAL DE COMANDOS INTERACTIVO' },
                { label: 'PUZZLES', val: '3 TRANSMISIONES CIFRADAS A DECODIFICAR' },
                { label: 'MECÁNICA', val: 'COMANDOS DE TEXTO + DECODIFICACIÓN' },
                { label: 'DURACIÓN', val: '~5 MIN' },
              ].map(r => (
                <div key={r.label} style={{ ...CARD, padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '19.5px', color: TEXT2, letterSpacing: '3px', minWidth: '150px' }}>{r.label}:</span>
                  <span style={{ fontSize: '21px', color: ACCENT }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setPhase('game')} style={{ ...S.btnPrimary, gap: '12px' }}>
            <Terminal size={14} /> INICIAR MISIÓN <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── GAME TERMINAL ── */}
      {phase === 'game' && (
        <div>
          {/* Status bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'MISIÓN', val: MISSION.code, color: AMBER },
              { label: 'TRANSMISIONES', val: `${solvedIntercepts.length}/3 DECODIFICADAS`, color: solvedIntercepts.length === 3 ? ACCENT : TEXT2 },
              { label: 'FASE', val: missionPhase.toUpperCase(), color: ACCENT },
            ].map(h => (
              <div key={h.label} style={{ ...CARD, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', color: TEXT2, letterSpacing: '3px', marginBottom: '7.5px' }}>{h.label}</div>
                <div style={{ fontSize: '24px', color: h.color, letterSpacing: '3px' }}>{h.val}</div>
              </div>
            ))}
          </div>

          {/* Terminal */}
          <div style={{ border: `1px solid ${BORDER}`, background: '#030303' }}>
            {/* Terminal header */}
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, background: '#050505', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['#FF5F57', '#FFBD2E', '#28C840'].map((c, i) => (
                  <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: '15px', color: TEXT2, letterSpacing: '4.5px', flex: 1, textAlign: 'center' }}>
                TERMINAL SEGURO — OP-SOMBRA-7 — ENS-CAT-A
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: solvedIntercepts.includes(n) ? ACCENT : BORDER,
                    boxShadow: solvedIntercepts.includes(n) ? `0 0 6px ${ACCENT}` : 'none',
                  }} />
                ))}
              </div>
            </div>

            {/* Output */}
            <div ref={terminalRef} style={{ height: '480px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {lines.map((line, i) => (
                <div key={i} style={{ fontSize: '21px', color: lineColor(line.type), fontFamily: FONT, letterSpacing: '0.75px', lineHeight: 1.7 }}>
                  {line.text}
                </div>
              ))}
              {!briefingDone && (
                <div style={{ fontSize: '21px', color: ACCENT, animation: 'blink 1s infinite' }}>█</div>
              )}
            </div>

            {/* Decoder panel */}
            {activeDecoder && (
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: '0 16px 16px' }}>
                <DecoderPuzzle
                  intercept={INTERCEPTS[activeDecoder - 1]}
                  onSolved={handleSolved}
                  onClose={() => setActiveDecoder(null)}
                />
              </div>
            )}

            {/* Input */}
            {briefingDone && !activeDecoder && missionPhase !== 'exfil' && missionPhase !== 'done' && (
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', background: '#030303' }}>
                <span style={{ color: ACCENT, fontSize: '24px', fontFamily: FONT }}>{'>'}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleCommand(input)}
                  placeholder='INGRESE COMANDO...'
                  autoFocus
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: ACCENT, fontFamily: FONT, fontSize: '22.5px', letterSpacing: '3px',
                  }}
                />
                <button onClick={() => handleCommand(input)} style={{ ...S.btnPrimary, padding: '15px 30px', fontSize: '19.5px' }}>
                  EJECUTAR
                </button>
              </div>
            )}
          </div>

          {/* Quick commands */}
          {briefingDone && missionPhase !== 'exfil' && missionPhase !== 'done' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {['CONECTAR', 'SCAN', 'ACCEDER', 'ANALIZAR', 'TRANSMISION 1', 'TRANSMISION 2', 'TRANSMISION 3', 'EXFILTRAR'].map(cmd => (
                <button key={cmd} onClick={() => handleCommand(cmd)}
                  style={{ ...S.btnPrimary, padding: '12px 24px', fontSize: '18px', opacity: 0.8 }}>
                  {cmd}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && (
        <div>
          <div style={{ fontSize: '19.5px', letterSpacing: '4.5px', color: TEXT2, marginBottom: '24px' }}>// MISIÓN COMPLETADA — INFORME DE OPERACIONES</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ ...CARD, borderLeft: `2px solid ${ACCENT}66`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13.5px', color: TEXT2, letterSpacing: '4.5px' }}>PUNTUACIÓN OPERATIVA</div>
              <div style={{ fontSize: '84px', color: ACCENT, lineHeight: 1, textShadow: `0 0 45px ${ACCENT}44` }}>{finalScore}</div>
              <div style={{ fontSize: '13.5px', color: TEXT2, letterSpacing: '3px' }}>CLASIFICACIÓN</div>
              <div style={{ fontSize: '27px', letterSpacing: '4.5px', color: ACCENT }}>{rank}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'TRANSMISIONES DECODIFICADAS', val: `${solvedIntercepts.length}/3` },
                { label: 'OPERACIÓN IDENTIFICADA', val: solvedIntercepts.includes(1) ? 'AURORA ✓' : 'NO IDENTIFICADA' },
                { label: 'AGENTE NEUTRALIZADO', val: solvedIntercepts.includes(2) ? 'FALCON ✓' : 'EN FUGA' },
                { label: 'EXFILTRACIÓN PLANIFICADA', val: solvedIntercepts.includes(3) ? 'MARTES ✓' : 'DESCONOCIDA' },
              ].map(r => (
                <div key={r.label} style={{ ...CARD, padding: '21px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', color: TEXT2, letterSpacing: '1.5px' }}>{r.label}</span>
                  <span style={{ fontSize: '16.5px', color: r.val.includes('✓') ? ACCENT : RED }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => onComplete({ type: 'covert-mission', score: finalScore, rank })} style={S.btnPrimary}>
            CONTINUAR AL INFORME <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
