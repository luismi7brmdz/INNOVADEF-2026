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
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
              <div style={{
                width:'44px', height:'44px',
                border:`2px solid ${col}`,
                background: active ? `${ACCENT}11` : done ? `${ACCENT}18` : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'20px', color:col,
              }}>
                {done ? '✓' : icons[i]}
              </div>
              <div style={{ fontSize:'13px', color:col, letterSpacing:'2px', textAlign:'center', whiteSpace:'nowrap' }}>
                {label}
                {i===2 && active && <div style={{ fontSize:'11px', color:TEXT2, letterSpacing:'1px' }}>({decodeIdx+1}/3)</div>}
              </div>
            </div>
            {i < steps.length-1 && (
              <div style={{ flex:1, height:'1px', background: i<stepIdx ? `${ACCENT}55` : BORDER, margin:'0 8px', marginBottom:'28px' }} />
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
      <div style={{ fontFamily:FONT, marginBottom:'20px' }}>
        <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'4px', marginBottom:'6px' }}>{intercept.label}</div>
        <div style={{ fontSize:'22px', color:AMBER, letterSpacing:'2px' }}>OBJETIVO: {intercept.objective}</div>
      </div>

      {/* Encoded message with keyword highlighted */}
      <div style={{ background:'#030303', border:`1px solid ${BORDER}`, padding:'20px', marginBottom:'14px' }}>
        <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'3px', marginBottom:'12px' }}>MENSAJE CIFRADO INTERCEPTADO:</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', alignItems:'flex-end' }}>
          {before && <span style={{ fontSize:'20px', color:'rgba(0,255,65,0.3)', letterSpacing:'4px', alignSelf:'center', fontFamily:FONT }}>{before}</span>}
          <div style={{ display:'flex', gap:'3px' }}>
            {kw.split('').map((ch,i)=>(
              <div key={i} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                border:`1.5px solid ${success ? ACCENT : AMBER}77`,
                background: success ? 'rgba(0,255,65,0.08)' : 'rgba(255,170,0,0.06)',
                padding:'8px 10px', minWidth:'32px',
              }}>
                <div style={{ fontSize:'24px', color:success ? ACCENT : AMBER, fontFamily:FONT }}>
                  {success ? intercept.keyword[i] : ch}
                </div>
                <div style={{ fontSize:'9px', color:'rgba(0,255,65,0.3)', marginTop:'3px' }}>{success?'✓':'?'}</div>
              </div>
            ))}
          </div>
          {after && <span style={{ fontSize:'20px', color:'rgba(0,255,65,0.3)', letterSpacing:'4px', alignSelf:'center', fontFamily:FONT }}>{after}</span>}
        </div>
        <div style={{ fontSize:'11px', color:'rgba(255,170,0,0.5)', letterSpacing:'2px', marginTop:'10px' }}>
          ↑ DESCIFRE LOS {kw.length} CARACTERES RESALTADOS EN NARANJA
        </div>
      </div>

      {/* Full cipher table — highlight chars that appear in keyword */}
      <div style={{ background:'#030303', border:`1px solid ${BORDER}`, padding:'16px', marginBottom:'14px' }}>
        <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'3px', marginBottom:'10px' }}>
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
                <span style={{ fontSize:'17px', color:relevant ? AMBER : 'rgba(255,170,0,0.4)' }}>{enc}</span>
                <span style={{ fontSize:'11px', color:'rgba(0,255,65,0.3)' }}>›</span>
                <span style={{ fontSize:'17px', color:relevant ? ACCENT : 'rgba(0,255,65,0.35)' }}>{dec}</span>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize:'10px', color:'rgba(255,170,0,0.4)', letterSpacing:'2px', marginTop:'8px' }}>
          ★ LAS ENTRADAS CON BORDE CORRESPONDEN A LOS CARACTERES DEL MENSAJE CIFRADO
        </div>
      </div>

      {/* Hint */}
      {hintsUsed > 0 && !success && (
        <div style={{ ...CARD, borderColor:`${AMBER}44`, marginBottom:'12px', padding:'12px 18px' }}>
          <span style={{ fontSize:'17px', color:AMBER, letterSpacing:'3px', fontFamily:FONT }}>
            PISTA: <span style={{ color:ACCENT }}>{intercept.keyword.slice(0,hintsUsed)}</span>
            <span style={{ opacity:0.35 }}>{'_'.repeat(intercept.keyword.length-hintsUsed)}</span>
          </span>
        </div>
      )}

      {/* Input / success */}
      {!success ? (
        <div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ color:ACCENT, fontSize:'20px', fontFamily:FONT }}>{'>'}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,''))}
              onKeyDown={e=>e.key==='Enter'&&input&&verify()}
              placeholder={`ESCRIBA LA PALABRA CLAVE (${intercept.keyword.length} LETRAS)`}
              maxLength={intercept.keyword.length}
              style={{
                flex:1, padding:'14px 16px', background:'#030303',
                border:`1.5px solid ${error?RED:BORDER}`,
                color:ACCENT, fontFamily:FONT, fontSize:'24px', letterSpacing:'6px', outline:'none', minWidth:'180px',
              }}
            />
            <button onClick={verify} disabled={!input}
              style={{ ...S.btnPrimary, opacity:input?1:0.4, padding:'14px 24px', fontSize:'18px' }}>
              VERIFICAR <ChevronRight size={18}/>
            </button>
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'10px', alignItems:'center', flexWrap:'wrap' }}>
            {attempts >= 1 && hintsUsed < intercept.keyword.length-1 && (
              <button onClick={useHint} style={{ padding:'10px 20px', background:'none', border:`1px solid ${AMBER}44`, color:AMBER, fontFamily:FONT, fontSize:'15px', letterSpacing:'2px', cursor:'pointer' }}>
                💡 PISTA (+2 LETRAS)
              </button>
            )}
            {error && <div style={{ fontSize:'15px', color:RED, letterSpacing:'2px', fontFamily:FONT }}>{error}</div>}
          </div>
        </div>
      ) : (
        <div style={{ padding:'20px', background:'rgba(0,255,65,0.06)', border:`1px solid ${ACCENT}44`, textAlign:'center', fontFamily:FONT }}>
          <div style={{ fontSize:'22px', color:ACCENT, letterSpacing:'4px' }}>
            ✓ DECODIFICADO — PALABRA CLAVE: <span style={{ fontSize:'30px', textShadow:`0 0 20px ${ACCENT}66` }}>{intercept.keyword}</span>
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
      <div style={{ fontSize:'15px', color:TEXT2, letterSpacing:'4px', marginBottom:'14px' }}>// MOD-08 — OPERACIÓN ENCUBIERTA</div>
      <div style={{ fontSize:'clamp(30px,4vw,58px)', letterSpacing:'5px', color:ACCENT, marginBottom:'36px' }}>MISIÓN SOMBRA</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'28px' }}>
        {/* Mission brief */}
        <div style={{ ...CARD, borderLeft:`2px solid ${ACCENT}44` }}>
          <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'4px', marginBottom:'12px' }}>// SITUACIÓN</div>
          <p style={{ fontSize:'19px', color:TEXT2, lineHeight:1.9, margin:0 }}>
            Se ha detectado una exfiltración de inteligencia desde la red INTRADEF.
            Usted debe infiltrarse en el sistema, interceptar transmisiones cifradas del enemigo
            y decodificarlas para identificar al agente infiltrado y su plan.
          </p>
        </div>

        {/* 4 steps */}
        <div style={{ ...CARD, borderLeft:`2px solid ${AMBER}44` }}>
          <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'4px', marginBottom:'14px' }}>// CÓMO JUGAR — 4 PASOS</div>
          {[
            ['1','⬡','CONECTAR','Acceda a la red INTRADEF con sus credenciales'],
            ['2','⊛','ESCANEAR','Localice el nodo con actividad sospechosa'],
            ['3','◈','DESCIFRAR','Decodifique 3 transmisiones cifradas usando la tabla'],
            ['4','↑','EXFILTRAR','Extraiga las evidencias y complete la misión'],
          ].map(([n,icon,label,desc])=>(
            <div key={n} style={{ display:'flex', gap:'14px', alignItems:'flex-start', marginBottom:'13px' }}>
              <div style={{ width:'32px', height:'32px', border:`1px solid ${ACCENT}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:ACCENT, flexShrink:0 }}>{icon}</div>
              <div>
                <div style={{ fontSize:'17px', color:ACCENT, letterSpacing:'2px' }}>{label}</div>
                <div style={{ fontSize:'14px', color:TEXT2, marginTop:'2px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cipher example */}
      <div style={{ ...CARD, borderLeft:`2px solid ${AMBER}44`, marginBottom:'32px' }}>
        <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'4px', marginBottom:'14px' }}>// CÓMO FUNCIONA EL DESCIFRADO</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:'18px', color:TEXT2, lineHeight:1.9, margin:'0 0 12px' }}>
              Las transmisiones están cifradas con un <span style={{ color:ACCENT }}>código de sustitución</span>:
              cada letra ha sido reemplazada por otra diferente.
            </p>
            <p style={{ fontSize:'18px', color:TEXT2, lineHeight:1.9, margin:0 }}>
              Use la <span style={{ color:AMBER }}>tabla de descifrado</span> para convertir
              cada letra cifrada (naranja) a su letra real (verde). Luego escriba la palabra que forman.
            </p>
          </div>
          <div style={{ background:'#030303', border:`1px solid ${BORDER}`, padding:'18px' }}>
            <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'3px', marginBottom:'12px' }}>EJEMPLO — descifrar "MBCLCM":</div>
            <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap', marginBottom:'12px' }}>
              {['M','B','C','L','C','M'].map((ch,i)=>(
                <div key={i} style={{ border:`1px solid ${AMBER}66`, padding:'8px 10px', textAlign:'center', minWidth:'36px' }}>
                  <div style={{ fontSize:'20px', color:AMBER, fontFamily:FONT }}>{ch}</div>
                  <div style={{ fontSize:'10px', color:'rgba(0,255,65,0.3)' }}>↓</div>
                  <div style={{ fontSize:'20px', color:ACCENT, fontFamily:FONT }}>{DECIPHER[ch]}</div>
                </div>
              ))}
              <div style={{ fontSize:'18px', color:TEXT2, marginLeft:'6px' }}>
                = <span style={{ color:ACCENT, letterSpacing:'3px', fontSize:'22px' }}>AURORA</span>
              </div>
            </div>
            <div style={{ fontSize:'11px', color:'rgba(0,255,65,0.35)', letterSpacing:'2px' }}>
              M→A, B→U, C→R, L→O, C→R, M→A = AURORA
            </div>
          </div>
        </div>
      </div>

      <button onClick={()=>setPhase('game')} style={{ ...S.btnPrimary, fontSize:'20px', padding:'18px 40px', gap:'12px' }}>
        <Terminal size={20}/> INICIAR MISIÓN <ChevronRight size={20}/>
      </button>
    </div>
  )

  /* ═══════════════════════════════ RESULT ══════════════════════════════════ */
  if (phase==='result') return (
    <div style={{ maxWidth:'1920px', width:'100%', margin:'0 auto', fontFamily:FONT }}>
      <div style={{ fontSize:'15px', color:TEXT2, letterSpacing:'4px', marginBottom:'20px' }}>// MISIÓN COMPLETADA — INFORME OPERATIVO</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
        <div style={{ ...CARD, borderLeft:`2px solid ${ACCENT}66`, padding:'28px', display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'4px' }}>PUNTUACIÓN OPERATIVA</div>
          <div style={{ fontSize:'86px', color:ACCENT, lineHeight:1, textShadow:`0 0 40px ${ACCENT}44` }}>{score}</div>
          <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'3px' }}>CLASIFICACIÓN</div>
          <div style={{ fontSize:'28px', letterSpacing:'4px', color:ACCENT }}>{rank}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {[
            { label:'OPERACIÓN ENEMIGA IDENTIFICADA', val:decoded[0]||'NO IDENTIFICADA', ok:!!decoded[0] },
            { label:'AGENTE INFILTRADO NEUTRALIZADO',  val:decoded[1]||'EN FUGA',          ok:!!decoded[1] },
            { label:'FECHA DE EXFILTRACIÓN CONOCIDA',  val:decoded[2]||'DESCONOCIDA',       ok:!!decoded[2] },
            { label:'TRANSMISIONES DECODIFICADAS',     val:`${decoded.length}/3`,           ok:decoded.length===3 },
          ].map(r=>(
            <div key={r.label} style={{ ...CARD, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'15px', color:TEXT2, letterSpacing:'1px' }}>{r.label}</span>
              <span style={{ fontSize:'18px', color:r.ok?ACCENT:RED, letterSpacing:'2px' }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={()=>onComplete({type:'covert-mission',score,rank,decoded})} style={{ ...S.btnPrimary, fontSize:'20px', padding:'18px 40px', gap:'12px' }}>
        CONTINUAR AL INFORME <ChevronRight size={20}/>
      </button>
    </div>
  )

  /* ═══════════════════════════════ GAME ════════════════════════════════════ */
  return (
    <div style={{ maxWidth:'1920px', width:'100%', margin:'0 auto', fontFamily:FONT }}>
      {/* Step bar */}
      <div style={{ ...CARD, padding:'20px 32px', marginBottom:'16px' }}>
        <StepBar stepIdx={stepIdx} decodeIdx={decodeIdx}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:'16px' }}>
        {/* Main panel */}
        <div style={{ ...CARD, padding:'28px' }}>

          {/* ── CONNECT ── */}
          {step==='connect' && (
            <div>
              <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'4px', marginBottom:'10px' }}>// PASO 1 DE 4</div>
              <div style={{ fontSize:'34px', color:ACCENT, letterSpacing:'4px', marginBottom:'18px' }}>CONECTAR A LA RED</div>
              <p style={{ fontSize:'19px', color:TEXT2, lineHeight:1.9, marginBottom:'28px' }}>
                Establezca una conexión segura con la red INTRADEF usando sus credenciales de operativo clasificado ENS-CAT-A.
              </p>
              <button onClick={doConnect} disabled={busy}
                style={{ ...S.btnPrimary, fontSize:'22px', padding:'18px 40px', opacity:busy?0.6:1, gap:'12px' }}>
                {busy ? '● AUTENTICANDO...' : '⬡ CONECTAR A LA RED'}
                {!busy && <ChevronRight size={20}/>}
              </button>
            </div>
          )}

          {/* ── SCAN ── */}
          {step==='scan' && (
            <div>
              <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'4px', marginBottom:'10px' }}>// PASO 2 DE 4</div>
              <div style={{ fontSize:'34px', color:ACCENT, letterSpacing:'4px', marginBottom:'18px' }}>ESCANEAR LA RED</div>
              <p style={{ fontSize:'19px', color:TEXT2, lineHeight:1.9, marginBottom:'22px' }}>
                Escanee los nodos de la red para localizar la estación con actividad sospechosa. El nodo comprometido contiene las transmisiones cifradas.
              </p>
              {/* Network nodes */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'28px', flexWrap:'wrap' }}>
                {[
                  { ip:'192.168.1.10', name:'SERVIDOR-FORMACION', status:'ACTIVO', susp:false },
                  { ip:'192.168.1.44', name:'ESTACION-ALFA',       status:'⚠ SOSPECHOSO', susp:true },
                  { ip:'192.168.1.77', name:'ARCHIVO-CENTRAL',     status:'ACTIVO', susp:false },
                ].map(n=>(
                  <div key={n.ip} style={{ ...CARD, flex:1, minWidth:'150px', padding:'16px', borderColor:n.susp?`${AMBER}66`:BORDER, background:n.susp?'rgba(255,170,0,0.04)':'#0a0a0a' }}>
                    <div style={{ fontSize:'11px', color:n.susp?AMBER:TEXT2, letterSpacing:'2px', marginBottom:'5px' }}>{n.ip}</div>
                    <div style={{ fontSize:'15px', color:n.susp?AMBER:TEXT2, letterSpacing:'1px', marginBottom:'4px' }}>{n.name}</div>
                    <div style={{ fontSize:'13px', color:n.susp?AMBER:`${ACCENT}55` }}>{n.status}</div>
                  </div>
                ))}
              </div>
              <button onClick={doScan} disabled={busy}
                style={{ ...S.btnPrimary, fontSize:'22px', padding:'18px 40px', opacity:busy?0.6:1, gap:'12px' }}>
                {busy ? '⊛ ESCANEANDO...' : '⊛ INICIAR ESCANEO'}
                {!busy && <ChevronRight size={20}/>}
              </button>
            </div>
          )}

          {/* ── DECODE ── */}
          {step==='decode' && (
            <div>
              <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'4px', marginBottom:'10px' }}>// PASO 3 DE 4 — DESCIFRAR TRANSMISIONES</div>
              {/* Pills */}
              <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
                {INTERCEPTS.map((ic,i)=>{
                  const done   = i < decodeIdx || decoded.length > i
                  const active = i === decodeIdx && decoded.length <= i
                  return (
                    <div key={i} style={{
                      padding:'7px 14px', fontSize:'13px', letterSpacing:'2px', fontFamily:FONT,
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
              <div style={{ fontSize:'13px', color:TEXT2, letterSpacing:'4px', marginBottom:'10px' }}>// PASO 4 DE 4</div>
              <div style={{ fontSize:'34px', color:ACCENT, letterSpacing:'4px', marginBottom:'18px' }}>EXFILTRAR EVIDENCIAS</div>
              <div style={{ display:'flex', gap:'12px', marginBottom:'28px', flexWrap:'wrap' }}>
                {[
                  { label:'OPERACIÓN ENEMIGA', val:decoded[0]||'?' },
                  { label:'AGENTE INFILTRADO', val:decoded[1]||'?' },
                  { label:'FECHA EXFILTRACIÓN', val:decoded[2]||'?' },
                ].map(r=>(
                  <div key={r.label} style={{ ...CARD, flex:1, minWidth:'140px', padding:'16px', borderLeft:`2px solid ${ACCENT}44` }}>
                    <div style={{ fontSize:'12px', color:TEXT2, letterSpacing:'3px', marginBottom:'8px' }}>{r.label}</div>
                    <div style={{ fontSize:'24px', color:ACCENT, letterSpacing:'4px' }}>{r.val}</div>
                  </div>
                ))}
              </div>
              {exfilPct===0 ? (
                <button onClick={doExfil} style={{ ...S.btnPrimary, fontSize:'22px', padding:'18px 40px', gap:'12px' }}>
                  ↑ EXFILTRAR EVIDENCIAS <ChevronRight size={20}/>
                </button>
              ) : (
                <div>
                  <div style={{ marginBottom:'8px', fontSize:'16px', color:ACCENT, letterSpacing:'3px', fontFamily:FONT }}>
                    EXFILTRANDO... {Math.round(exfilPct)}%
                  </div>
                  <div style={{ height:'10px', background:'#1a1a1a', border:`1px solid ${BORDER}` }}>
                    <div style={{ height:'100%', width:`${exfilPct}%`, background:ACCENT, transition:'width 0.2s', boxShadow:`0 0 10px ${ACCENT}66` }}/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terminal log */}
        <div style={{ ...CARD, padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${BORDER}`, fontSize:'12px', color:TEXT2, letterSpacing:'3px', flexShrink:0 }}>
            ▸ REGISTRO OPERATIVO
          </div>
          <div ref={logRef} style={{ flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:'5px', minHeight:'350px' }}>
            {log.length===0 && (
              <div style={{ fontSize:'13px', color:'rgba(0,255,65,0.2)', fontFamily:FONT }}>Esperando operación...</div>
            )}
            {log.map((entry,i)=>(
              <div key={i} style={{ fontSize:'13px', fontFamily:FONT, lineHeight:1.6, color:entry.type==='success'?ACCENT:entry.type==='warn'?AMBER:TEXT2 }}>
                <span style={{ opacity:0.35 }}>[{entry.t}]</span> {entry.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
