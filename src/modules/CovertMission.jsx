import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Terminal } from 'lucide-react'
import { ACCENT, AMBER, RED, BORDER, CARD, TEXT2, FONT, S } from '../theme'

// ─── CIPHER ───────────────────────────────────────────────────────────────────
const CIPHER = {
  A:'M',B:'X',C:'R',D:'K',E:'Z',F:'Q',G:'P',H:'N',I:'S',J:'V',
  K:'D',L:'F',M:'A',N:'H',O:'L',P:'G',Q:'J',R:'C',S:'I',T:'O',
  U:'B',V:'E',W:'Y',X:'U',Y:'W',Z:'T',
}
const DECIPHER = Object.fromEntries(Object.entries(CIPHER).map(([k,v])=>[v,k]))
function encode(s){ return s.toUpperCase().split('').map(c=>CIPHER[c]||c).join('') }

// ─── INTERCEPTS ───────────────────────────────────────────────────────────────
const INTERCEPTS = [
  { id:1, label:'TRANSMISIÓN #1 — NODO NORTE',   plain:'OPERACION AURORA ACTIVA NODO NORTE',         keyword:'AURORA', objective:'¿Cuál es el nombre de la OPERACIÓN ENEMIGA? (2ª palabra)' },
  { id:2, label:'TRANSMISIÓN #2 — CANAL SEGURO', plain:'AGENTE FALCON COORDINA TRANSFER ARCHIVO',    keyword:'FALCON', objective:'¿Cuál es el NOMBRE EN CLAVE del agente infiltrado? (2ª palabra)' },
  { id:3, label:'TRANSMISIÓN #3 — PROTOCOLO',    plain:'EXFILTRACION MARTES VEINTITRES CERO TRES',   keyword:'MARTES', objective:'¿En qué DÍA está planificada la exfiltración? (2ª palabra)' },
].map(ic=>({ ...ic, encoded:encode(ic.plain), encodedKeyword:encode(ic.keyword) }))

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
function StepBar({ stepIdx, decodeIdx }) {
  const steps = ['CONECTAR','ESCANEAR','DESCIFRAR','EXFILTRAR']
  const icons  = ['⬡','⊛','◈','↑']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0', fontFamily:FONT }}>
      {steps.map((label,i)=>{
        const done   = i < stepIdx
        const active = i === stepIdx
        const col    = done||active ? ACCENT : 'rgba(0,255,65,0.25)'
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i<steps.length-1 ? '1' : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.56vmin' }}>
              <div style={{
                width:'4.07vmin', height:'4.07vmin',
                border:`2px solid ${col}`,
                background: active ? `${ACCENT}11` : done ? `${ACCENT}18` : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'clamp(12px, 1.85vmin, 9999px)', color:col,
              }}>
                {done ? '✓' : icons[i]}
              </div>
              <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:col, letterSpacing:'0.19vmin', textAlign:'center', whiteSpace:'nowrap' }}>
                {label}
                {i===2 && active && <div style={{ fontSize:'clamp(10px, 1.02vmin, 9999px)', color:TEXT2, letterSpacing:'0.09vmin' }}>({decodeIdx+1}/3)</div>}
              </div>
            </div>
            {i < steps.length-1 && (
              <div style={{ flex:1, height:'1px', background: i<stepIdx ? `${ACCENT}55` : BORDER, margin:'0 0.74vmin', marginBottom:'2.59vmin' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── DECODER ─────────────────────────────────────────────────────────────────
function Decoder({ intercept, onSolved }) {
  const [input, setInput]     = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const inputRef = useRef(null)

  useEffect(()=>{ inputRef.current?.focus() }, [intercept])

  const enc = intercept.encoded
  const kw  = intercept.encodedKeyword
  const kwIdx = enc.indexOf(kw)
  const before = kwIdx > 0 ? enc.slice(0, kwIdx) : ''
  const after  = kwIdx >= 0 ? enc.slice(kwIdx + kw.length) : ''

  const verify = () => {
    const g = input.trim().toUpperCase()
    if (g === intercept.keyword) {
      setSuccess(true)
      setError('')
      setTimeout(onSolved, 1100)
    } else {
      setAttempts(a=>a+1)
      setError('INCORRECTO — CONSULTE LA TABLA DE DESCIFRADO')
      setInput('')
      setTimeout(()=>setError(''), 2500)
    }
  }

  const useHint = () => setHintsUsed(h=>Math.min(h+2, intercept.keyword.length-1))

  return (
    <div>
      {/* Header */}
      <div style={{ fontFamily:FONT, marginBottom:'1.85vmin' }}>
        <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'6px' }}>{intercept.label}</div>
        <div style={{ fontSize:'clamp(13px, 2.04vmin, 9999px)', color:AMBER, letterSpacing:'0.19vmin' }}>OBJETIVO: {intercept.objective}</div>
      </div>

      {/* Encoded message with keyword highlighted */}
      <div style={{ background:'#030303', border:`1px solid ${BORDER}`, padding:'1.85vmin', marginBottom:'1.3vmin' }}>
        <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.28vmin', marginBottom:'1.11vmin' }}>MENSAJE CIFRADO INTERCEPTADO:</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.56vmin', alignItems:'flex-end' }}>
          {before && <span style={{ fontSize:'clamp(12px, 1.85vmin, 9999px)', color:'rgba(0,255,65,0.3)', letterSpacing:'0.37vmin', alignSelf:'center', fontFamily:FONT }}>{before}</span>}
          <div style={{ display:'flex', gap:'3px' }}>
            {kw.split('').map((ch,i)=>(
              <div key={i} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                border:`1.5px solid ${success ? ACCENT : AMBER}77`,
                background: success ? 'rgba(0,255,65,0.08)' : 'rgba(255,170,0,0.06)',
                padding:'0.74vmin 0.93vmin', minWidth:'2.96vmin',
              }}>
                <div style={{ fontSize:'clamp(14px, 2.22vmin, 9999px)', color:success ? ACCENT : AMBER, fontFamily:FONT }}>
                  {success ? intercept.keyword[i] : ch}
                </div>
                <div style={{ fontSize:'clamp(10px, 0.83vmin, 9999px)', color:'rgba(0,255,65,0.3)', marginTop:'3px' }}>{success?'✓':'?'}</div>
              </div>
            ))}
          </div>
          {after && <span style={{ fontSize:'clamp(12px, 1.85vmin, 9999px)', color:'rgba(0,255,65,0.3)', letterSpacing:'0.37vmin', alignSelf:'center', fontFamily:FONT }}>{after}</span>}
        </div>
        <div style={{ fontSize:'clamp(10px, 1.02vmin, 9999px)', color:'rgba(255,170,0,0.5)', letterSpacing:'0.19vmin', marginTop:'0.93vmin' }}>
          ↑ DESCIFRE LOS {kw.length} CARACTERES RESALTADOS EN NARANJA
        </div>
      </div>

      {/* Full cipher table — highlight chars that appear in keyword */}
      <div style={{ background:'#030303', border:`1px solid ${BORDER}`, padding:'1.48vmin', marginBottom:'1.3vmin' }}>
        <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.28vmin', marginBottom:'0.93vmin' }}>
          TABLA DE DESCIFRADO — CÓDIGO CIFRADO <span style={{ color:AMBER }}>▶</span> TEXTO REAL:
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(13,1fr)', gap:'5px' }}>
          {Object.entries(DECIPHER).map(([enc,dec])=>{
            const relevant = kw.includes(enc)
            return (
              <div key={enc} style={{
                textAlign:'center', fontFamily:FONT, padding:'5px 2px',
                border:`1px solid ${relevant ? `${AMBER}55` : 'transparent'}`,
                background: relevant ? 'rgba(255,170,0,0.05)' : 'transparent',
              }}>
                <span style={{ fontSize:'clamp(10px, 1.57vmin, 9999px)', color:relevant ? AMBER : 'rgba(255,170,0,0.4)' }}>{enc}</span>
                <span style={{ fontSize:'clamp(10px, 1.02vmin, 9999px)', color:'rgba(0,255,65,0.3)' }}>›</span>
                <span style={{ fontSize:'clamp(10px, 1.57vmin, 9999px)', color:relevant ? ACCENT : 'rgba(0,255,65,0.35)' }}>{dec}</span>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize:'clamp(10px, 0.93vmin, 9999px)', color:'rgba(255,170,0,0.4)', letterSpacing:'0.19vmin', marginTop:'8px' }}>
          ★ LAS ENTRADAS CON BORDE CORRESPONDEN A LOS CARACTERES DEL MENSAJE CIFRADO
        </div>
      </div>

      {/* Hint */}
      {hintsUsed > 0 && !success && (
        <div style={{ ...CARD, borderColor:`${AMBER}44`, marginBottom:'1.11vmin', padding:'1.11vmin 1.67vmin' }}>
          <span style={{ fontSize:'clamp(10px, 1.57vmin, 9999px)', color:AMBER, letterSpacing:'0.28vmin', fontFamily:FONT }}>
            PISTA: <span style={{ color:ACCENT }}>{intercept.keyword.slice(0,hintsUsed)}</span>
            <span style={{ opacity:0.35 }}>{'_'.repeat(intercept.keyword.length-hintsUsed)}</span>
          </span>
        </div>
      )}

      {/* Input / success */}
      {!success ? (
        <div>
          <div style={{ display:'flex', gap:'0.93vmin', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ color:ACCENT, fontSize:'clamp(12px, 1.85vmin, 9999px)', fontFamily:FONT }}>{'>'}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,''))}
              onKeyDown={e=>e.key==='Enter'&&input&&verify()}
              placeholder={`ESCRIBA LA PALABRA CLAVE (${intercept.keyword.length} LETRAS)`}
              maxLength={intercept.keyword.length}
              style={{
                flex:1, padding:'1.3vmin 1.48vmin', background:'#030303',
                border:`1.5px solid ${error?RED:BORDER}`,
                color:ACCENT, fontFamily:FONT, fontSize:'clamp(14px, 2.22vmin, 9999px)', letterSpacing:'0.56vmin', outline:'none', minWidth:'16.67vmin',
              }}
            />
            <button onClick={verify} disabled={!input}
              style={{ ...S.btnPrimary, opacity:input?1:0.4, padding:'1.3vmin 2.22vmin', fontSize:'clamp(11px, 1.67vmin, 9999px)' }}>
              VERIFICAR <ChevronRight size={18}/>
            </button>
          </div>
          <div style={{ display:'flex', gap:'1.11vmin', marginTop:'0.93vmin', alignItems:'center', flexWrap:'wrap' }}>
            {attempts >= 1 && hintsUsed < intercept.keyword.length-1 && (
              <button onClick={useHint} style={{ padding:'0.93vmin 1.85vmin', background:'none', border:`1px solid ${AMBER}44`, color:AMBER, fontFamily:FONT, fontSize:'clamp(10px, 1.39vmin, 9999px)', letterSpacing:'0.19vmin', cursor:'pointer' }}>
                💡 PISTA (+2 LETRAS)
              </button>
            )}
            {error && <div style={{ fontSize:'clamp(10px, 1.39vmin, 9999px)', color:RED, letterSpacing:'0.19vmin', fontFamily:FONT }}>{error}</div>}
          </div>
        </div>
      ) : (
        <div style={{ padding:'1.85vmin', background:'rgba(0,255,65,0.06)', border:`1px solid ${ACCENT}44`, textAlign:'center', fontFamily:FONT }}>
          <div style={{ fontSize:'clamp(13px, 2.04vmin, 9999px)', color:ACCENT, letterSpacing:'0.37vmin' }}>
            ✓ DECODIFICADO — PALABRA CLAVE: <span style={{ fontSize:'clamp(18px, 2.78vmin, 9999px)', textShadow:`0 0 20px ${ACCENT}66` }}>{intercept.keyword}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function CovertMission({ onComplete }) {
  const [phase, setPhase] = useState('intro')
  const [step, setStep]   = useState('connect')
  const [decodeIdx, setDecodeIdx] = useState(0)
  const [decoded, setDecoded]     = useState([])
  const [log, setLog]             = useState([])
  const [busy, setBusy]           = useState(false)
  const [exfilPct, setExfilPct]   = useState(0)
  const logRef  = useRef(null)
  const exfilTimer = useRef(null)

  const stepIdx = ['connect','scan','decode','exfil'].indexOf(step)

  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight },[log])
  useEffect(()=>()=>{ clearInterval(exfilTimer.current) },[])

  const addLog = (text, type='info') => {
    const t = new Date().toLocaleTimeString('es-ES',{hour12:false})
    setLog(l=>[...l,{text,type,t}])
  }

  /* ── Steps ── */
  const doConnect = () => {
    setBusy(true)
    addLog('Iniciando protocolo de autenticación ENS-CAT-A...')
    setTimeout(()=>addLog('Verificando certificado digital...'), 700)
    setTimeout(()=>{ addLog('ACCESO CONCEDIDO — Red INTRADEF infiltrada','success'); setBusy(false); setStep('scan') }, 1500)
  }

  const doScan = () => {
    setBusy(true)
    addLog('Escaneando segmento 192.168.1.0/24...')
    setTimeout(()=>{
      addLog('[192.168.1.10] SERVIDOR-FORMACION — ACTIVO')
      addLog('[192.168.1.44] ESTACION-ALFA — ⚠ ACTIVIDAD SOSPECHOSA','warn')
      addLog('[192.168.1.77] ARCHIVO-CENTRAL — ACTIVO')
    },900)
    setTimeout(()=>{ addLog('3 transmisiones cifradas encontradas en 192.168.1.44','success'); setBusy(false); setStep('decode') },2200)
  }

  const handleDecoded = (keyword) => {
    addLog(`Transmisión #${decodeIdx+1} decodificada — "${keyword}"`, 'success')
    setDecoded(d=>[...d, keyword])
    if (decodeIdx === 2) {
      setTimeout(()=>{ addLog('Todas las transmisiones decodificadas. Listo para exfiltrar.','success'); setStep('exfil') }, 700)
    } else {
      setDecodeIdx(i=>i+1)
    }
  }

  const doExfil = () => {
    addLog('Iniciando exfiltración segura de evidencias...')
    let p=0
    exfilTimer.current = setInterval(()=>{
      p = Math.min(p + Math.random()*12+4, 100)
      setExfilPct(p)
      if (p>=100) {
        clearInterval(exfilTimer.current)
        addLog(`Datos exfiltrados: OP ${decoded[0]||'?'} | AGT ${decoded[1]||'?'} | ${decoded[2]||'?'}`, 'success')
        setTimeout(()=>setPhase('result'), 700)
      }
    },200)
  }

  const score = 200 + decoded.length*167 + (decoded.length===3?99:0)
  const rank  = score>=900?'AGENTE FANTASMA':score>=700?'OPERATIVO ÉLITE':'AGENTE EN CAMPO'

  /* ═══════════════════════════════ INTRO ═══════════════════════════════════ */
  if (phase==='intro') return (
    <div style={{ maxWidth:'1920px', width:'100%', margin:'0 auto', fontFamily:FONT }}>
      <div style={{ fontSize:'clamp(10px, 1.39vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'1.3vmin' }}>// MOD-08 — OPERACIÓN ENCUBIERTA</div>
      <div style={{ fontSize:'clamp(30px,4vw,58px)', letterSpacing:'0.46vmin', color:ACCENT, marginBottom:'3.33vmin' }}>MISIÓN SOMBRA</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.48vmin', marginBottom:'2.59vmin' }}>
        {/* Mission brief */}
        <div style={{ ...CARD, borderLeft:`2px solid ${ACCENT}44` }}>
          <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'1.11vmin' }}>// SITUACIÓN</div>
          <p style={{ fontSize:'clamp(11px, 1.76vmin, 9999px)', color:TEXT2, lineHeight:1.9, margin:0 }}>
            Se ha detectado una exfiltración de inteligencia desde la red INTRADEF.
            Usted debe infiltrarse en el sistema, interceptar transmisiones cifradas del enemigo
            y decodificarlas para identificar al agente infiltrado y su plan.
          </p>
        </div>

        {/* 4 steps */}
        <div style={{ ...CARD, borderLeft:`2px solid ${AMBER}44` }}>
          <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'1.3vmin' }}>// CÓMO JUGAR — 4 PASOS</div>
          {[
            ['1','⬡','CONECTAR','Acceda a la red INTRADEF con sus credenciales'],
            ['2','⊛','ESCANEAR','Localice el nodo con actividad sospechosa'],
            ['3','◈','DESCIFRAR','Decodifique 3 transmisiones cifradas usando la tabla'],
            ['4','↑','EXFILTRAR','Extraiga las evidencias y complete la misión'],
          ].map(([n,icon,label,desc])=>(
            <div key={n} style={{ display:'flex', gap:'1.3vmin', alignItems:'flex-start', marginBottom:'1.2vmin' }}>
              <div style={{ width:'2.96vmin', height:'2.96vmin', border:`1px solid ${ACCENT}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(11px, 1.67vmin, 9999px)', color:ACCENT, flexShrink:0 }}>{icon}</div>
              <div>
                <div style={{ fontSize:'clamp(10px, 1.57vmin, 9999px)', color:ACCENT, letterSpacing:'0.19vmin' }}>{label}</div>
                <div style={{ fontSize:'clamp(10px, 1.3vmin, 9999px)', color:TEXT2, marginTop:'2px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cipher example */}
      <div style={{ ...CARD, borderLeft:`2px solid ${AMBER}44`, marginBottom:'2.96vmin' }}>
        <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'1.3vmin' }}>// CÓMO FUNCIONA EL DESCIFRADO</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2.22vmin', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:'clamp(11px, 1.67vmin, 9999px)', color:TEXT2, lineHeight:1.9, margin:'0 0 1.11vmin' }}>
              Las transmisiones están cifradas con un <span style={{ color:ACCENT }}>código de sustitución</span>:
              cada letra ha sido reemplazada por otra diferente.
            </p>
            <p style={{ fontSize:'clamp(11px, 1.67vmin, 9999px)', color:TEXT2, lineHeight:1.9, margin:0 }}>
              Use la <span style={{ color:AMBER }}>tabla de descifrado</span> para convertir
              cada letra cifrada (naranja) a su letra real (verde). Luego escriba la palabra que forman.
            </p>
          </div>
          <div style={{ background:'#030303', border:`1px solid ${BORDER}`, padding:'1.67vmin' }}>
            <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.28vmin', marginBottom:'1.11vmin' }}>EJEMPLO — descifrar "MBCLCM":</div>
            <div style={{ display:'flex', gap:'0.56vmin', alignItems:'center', flexWrap:'wrap', marginBottom:'1.11vmin' }}>
              {['M','B','C','L','C','M'].map((ch,i)=>(
                <div key={i} style={{ border:`1px solid ${AMBER}66`, padding:'0.74vmin 0.93vmin', textAlign:'center', minWidth:'3.33vmin' }}>
                  <div style={{ fontSize:'clamp(12px, 1.85vmin, 9999px)', color:AMBER, fontFamily:FONT }}>{ch}</div>
                  <div style={{ fontSize:'clamp(10px, 0.93vmin, 9999px)', color:'rgba(0,255,65,0.3)' }}>↓</div>
                  <div style={{ fontSize:'clamp(12px, 1.85vmin, 9999px)', color:ACCENT, fontFamily:FONT }}>{DECIPHER[ch]}</div>
                </div>
              ))}
              <div style={{ fontSize:'clamp(11px, 1.67vmin, 9999px)', color:TEXT2, marginLeft:'6px' }}>
                = <span style={{ color:ACCENT, letterSpacing:'0.28vmin', fontSize:'clamp(13px, 2.04vmin, 9999px)' }}>AURORA</span>
              </div>
            </div>
            <div style={{ fontSize:'clamp(10px, 1.02vmin, 9999px)', color:'rgba(0,255,65,0.35)', letterSpacing:'0.19vmin' }}>
              M→A, B→U, C→R, L→O, C→R, M→A = AURORA
            </div>
          </div>
        </div>
      </div>

      <button onClick={()=>setPhase('game')} style={{ ...S.btnPrimary, fontSize:'clamp(12px, 1.85vmin, 9999px)', padding:'1.67vmin 3.7vmin', gap:'1.11vmin' }}>
        <Terminal size={20}/> INICIAR MISIÓN <ChevronRight size={20}/>
      </button>
    </div>
  )

  /* ═══════════════════════════════ RESULT ══════════════════════════════════ */
  if (phase==='result') return (
    <div style={{ maxWidth:'1920px', width:'100%', margin:'0 auto', fontFamily:FONT }}>
      <div style={{ fontSize:'clamp(10px, 1.39vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'1.85vmin' }}>// MISIÓN COMPLETADA — INFORME OPERATIVO</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.48vmin', marginBottom:'2.22vmin' }}>
        <div style={{ ...CARD, borderLeft:`2px solid ${ACCENT}66`, padding:'2.59vmin', display:'flex', flexDirection:'column', gap:'1.11vmin' }}>
          <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin' }}>PUNTUACIÓN OPERATIVA</div>
          <div style={{ fontSize:'clamp(52px, 7.96vmin, 9999px)', color:ACCENT, lineHeight:1, textShadow:`0 0 40px ${ACCENT}44` }}>{score}</div>
          <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.28vmin' }}>CLASIFICACIÓN</div>
          <div style={{ fontSize:'clamp(17px, 2.59vmin, 9999px)', letterSpacing:'0.37vmin', color:ACCENT }}>{rank}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.93vmin' }}>
          {[
            { label:'OPERACIÓN ENEMIGA IDENTIFICADA', val:decoded[0]||'NO IDENTIFICADA', ok:!!decoded[0] },
            { label:'AGENTE INFILTRADO NEUTRALIZADO',  val:decoded[1]||'EN FUGA',          ok:!!decoded[1] },
            { label:'FECHA DE EXFILTRACIÓN CONOCIDA',  val:decoded[2]||'DESCONOCIDA',       ok:!!decoded[2] },
            { label:'TRANSMISIONES DECODIFICADAS',     val:`${decoded.length}/3`,           ok:decoded.length===3 },
          ].map(r=>(
            <div key={r.label} style={{ ...CARD, padding:'1.67vmin 1.85vmin', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'clamp(10px, 1.39vmin, 9999px)', color:TEXT2, letterSpacing:'0.09vmin' }}>{r.label}</span>
              <span style={{ fontSize:'clamp(11px, 1.67vmin, 9999px)', color:r.ok?ACCENT:RED, letterSpacing:'0.19vmin' }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={()=>onComplete({type:'covert-mission',score,rank,decoded})} style={{ ...S.btnPrimary, fontSize:'clamp(12px, 1.85vmin, 9999px)', padding:'1.67vmin 3.7vmin', gap:'1.11vmin' }}>
        CONTINUAR AL INFORME <ChevronRight size={20}/>
      </button>
    </div>
  )

  /* ═══════════════════════════════ GAME ════════════════════════════════════ */
  return (
    <div style={{ maxWidth:'1920px', width:'100%', margin:'0 auto', fontFamily:FONT }}>
      {/* Step bar */}
      <div style={{ ...CARD, padding:'1.85vmin 2.96vmin', marginBottom:'1.48vmin' }}>
        <StepBar stepIdx={stepIdx} decodeIdx={decodeIdx}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 26.85vmin', gap:'1.48vmin' }}>
        {/* Main panel */}
        <div style={{ ...CARD, padding:'2.59vmin' }}>

          {/* ── CONNECT ── */}
          {step==='connect' && (
            <div>
              <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'0.93vmin' }}>// PASO 1 DE 4</div>
              <div style={{ fontSize:'clamp(20px, 3.15vmin, 9999px)', color:ACCENT, letterSpacing:'0.37vmin', marginBottom:'1.67vmin' }}>CONECTAR A LA RED</div>
              <p style={{ fontSize:'clamp(11px, 1.76vmin, 9999px)', color:TEXT2, lineHeight:1.9, marginBottom:'2.59vmin' }}>
                Establezca una conexión segura con la red INTRADEF usando sus credenciales de operativo clasificado ENS-CAT-A.
              </p>
              <button onClick={doConnect} disabled={busy}
                style={{ ...S.btnPrimary, fontSize:'clamp(13px, 2.04vmin, 9999px)', padding:'1.67vmin 3.7vmin', opacity:busy?0.6:1, gap:'1.11vmin' }}>
                {busy ? '● AUTENTICANDO...' : '⬡ CONECTAR A LA RED'}
                {!busy && <ChevronRight size={20}/>}
              </button>
            </div>
          )}

          {/* ── SCAN ── */}
          {step==='scan' && (
            <div>
              <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'0.93vmin' }}>// PASO 2 DE 4</div>
              <div style={{ fontSize:'clamp(20px, 3.15vmin, 9999px)', color:ACCENT, letterSpacing:'0.37vmin', marginBottom:'1.67vmin' }}>ESCANEAR LA RED</div>
              <p style={{ fontSize:'clamp(11px, 1.76vmin, 9999px)', color:TEXT2, lineHeight:1.9, marginBottom:'2.04vmin' }}>
                Escanee los nodos de la red para localizar la estación con actividad sospechosa. El nodo comprometido contiene las transmisiones cifradas.
              </p>
              {/* Network nodes */}
              <div style={{ display:'flex', gap:'0.93vmin', marginBottom:'2.59vmin', flexWrap:'wrap' }}>
                {[
                  { ip:'192.168.1.10', name:'SERVIDOR-FORMACION', status:'ACTIVO', susp:false },
                  { ip:'192.168.1.44', name:'ESTACION-ALFA',       status:'⚠ SOSPECHOSO', susp:true },
                  { ip:'192.168.1.77', name:'ARCHIVO-CENTRAL',     status:'ACTIVO', susp:false },
                ].map(n=>(
                  <div key={n.ip} style={{ ...CARD, flex:1, minWidth:'13.89vmin', padding:'1.48vmin', borderColor:n.susp?`${AMBER}66`:BORDER, background:n.susp?'rgba(255,170,0,0.04)':'#0a0a0a' }}>
                    <div style={{ fontSize:'clamp(10px, 1.02vmin, 9999px)', color:n.susp?AMBER:TEXT2, letterSpacing:'0.19vmin', marginBottom:'5px' }}>{n.ip}</div>
                    <div style={{ fontSize:'clamp(10px, 1.39vmin, 9999px)', color:n.susp?AMBER:TEXT2, letterSpacing:'0.09vmin', marginBottom:'4px' }}>{n.name}</div>
                    <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:n.susp?AMBER:`${ACCENT}55` }}>{n.status}</div>
                  </div>
                ))}
              </div>
              <button onClick={doScan} disabled={busy}
                style={{ ...S.btnPrimary, fontSize:'clamp(13px, 2.04vmin, 9999px)', padding:'1.67vmin 3.7vmin', opacity:busy?0.6:1, gap:'1.11vmin' }}>
                {busy ? '⊛ ESCANEANDO...' : '⊛ INICIAR ESCANEO'}
                {!busy && <ChevronRight size={20}/>}
              </button>
            </div>
          )}

          {/* ── DECODE ── */}
          {step==='decode' && (
            <div>
              <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'0.93vmin' }}>// PASO 3 DE 4 — DESCIFRAR TRANSMISIONES</div>
              {/* Pills */}
              <div style={{ display:'flex', gap:'8px', marginBottom:'1.85vmin' }}>
                {INTERCEPTS.map((ic,i)=>{
                  const done   = i < decodeIdx || decoded.length > i
                  const active = i === decodeIdx && decoded.length <= i
                  return (
                    <div key={i} style={{
                      padding:'0.65vmin 1.3vmin', fontSize:'clamp(10px, 1.2vmin, 9999px)', letterSpacing:'0.19vmin', fontFamily:FONT,
                      border:`1px solid ${done?ACCENT:active?`${ACCENT}66`:BORDER}`,
                      color:done?ACCENT:active?ACCENT:'rgba(0,255,65,0.3)',
                      background:done?'rgba(0,255,65,0.06)':'transparent',
                    }}>
                      {done?`✓ TRX #${i+1}`:active?`▶ TRX #${i+1}`:`○ TRX #${i+1}`}
                    </div>
                  )
                })}
              </div>
              <Decoder key={decodeIdx} intercept={INTERCEPTS[decodeIdx]} onSolved={()=>handleDecoded(INTERCEPTS[decodeIdx].keyword)}/>
            </div>
          )}

          {/* ── EXFIL ── */}
          {step==='exfil' && (
            <div>
              <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:TEXT2, letterSpacing:'0.37vmin', marginBottom:'0.93vmin' }}>// PASO 4 DE 4</div>
              <div style={{ fontSize:'clamp(20px, 3.15vmin, 9999px)', color:ACCENT, letterSpacing:'0.37vmin', marginBottom:'1.67vmin' }}>EXFILTRAR EVIDENCIAS</div>
              <div style={{ display:'flex', gap:'1.11vmin', marginBottom:'2.59vmin', flexWrap:'wrap' }}>
                {[
                  { label:'OPERACIÓN ENEMIGA', val:decoded[0]||'?' },
                  { label:'AGENTE INFILTRADO', val:decoded[1]||'?' },
                  { label:'FECHA EXFILTRACIÓN', val:decoded[2]||'?' },
                ].map(r=>(
                  <div key={r.label} style={{ ...CARD, flex:1, minWidth:'12.96vmin', padding:'1.48vmin', borderLeft:`2px solid ${ACCENT}44` }}>
                    <div style={{ fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.28vmin', marginBottom:'8px' }}>{r.label}</div>
                    <div style={{ fontSize:'clamp(14px, 2.22vmin, 9999px)', color:ACCENT, letterSpacing:'0.37vmin' }}>{r.val}</div>
                  </div>
                ))}
              </div>
              {exfilPct===0 ? (
                <button onClick={doExfil} style={{ ...S.btnPrimary, fontSize:'clamp(13px, 2.04vmin, 9999px)', padding:'1.67vmin 3.7vmin', gap:'1.11vmin' }}>
                  ↑ EXFILTRAR EVIDENCIAS <ChevronRight size={20}/>
                </button>
              ) : (
                <div>
                  <div style={{ marginBottom:'8px', fontSize:'clamp(10px, 1.48vmin, 9999px)', color:ACCENT, letterSpacing:'0.28vmin', fontFamily:FONT }}>
                    EXFILTRANDO... {Math.round(exfilPct)}%
                  </div>
                  <div style={{ height:'0.93vmin', background:'#1a1a1a', border:`1px solid ${BORDER}` }}>
                    <div style={{ height:'100%', width:`${exfilPct}%`, background:ACCENT, transition:'width 0.2s', boxShadow:`0 0 10px ${ACCENT}66` }}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terminal log */}
        <div style={{ ...CARD, padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'1.11vmin 1.48vmin', borderBottom:`1px solid ${BORDER}`, fontSize:'clamp(10px, 1.11vmin, 9999px)', color:TEXT2, letterSpacing:'0.28vmin', flexShrink:0 }}>
            ▸ REGISTRO OPERATIVO
          </div>
          <div ref={logRef} style={{ flex:1, overflowY:'auto', padding:'1.3vmin', display:'flex', flexDirection:'column', gap:'5px', minHeight:'32.41vmin' }}>
            {log.length===0 && (
              <div style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', color:'rgba(0,255,65,0.2)', fontFamily:FONT }}>Esperando operación...</div>
            )}
            {log.map((entry,i)=>(
              <div key={i} style={{ fontSize:'clamp(10px, 1.2vmin, 9999px)', fontFamily:FONT, lineHeight:1.6, color:entry.type==='success'?ACCENT:entry.type==='warn'?AMBER:TEXT2 }}>
                <span style={{ opacity:0.35 }}>[{entry.t}]</span> {entry.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
