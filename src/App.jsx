import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MilitaryBackground from './MilitaryBackground'
import IntroScreen, { MilitaryCursor } from './IntroScreen'
import SleepScreen from './SleepScreen'
import PluginRenderer from './plugins/PluginRenderer'
import { PLUGIN_REGISTRY } from './plugins/registry'
import { ACCENT, BORDER, TEXT2, FONT, FS } from './theme'
import { sfxIntroWipe, sfxReset, sfxBootReady, markUserInteracted } from './sfx'
import LiveClock from './components/LiveClock'
import StatusBar from './components/StatusBar'
import ModuleTransition from './components/ModuleTransition'

// Lazy: solo cargan cuando el usuario llega a esas pantallas
const ModuleSelector = lazy(() => import('./screens/ModuleSelector'))
const EmailScreen    = lazy(() => import('./screens/EmailScreen'))

const MODULES = PLUGIN_REGISTRY

// ─── SCREEN TRANSITION HOOK ───────────────────────────────────────────────────

function useScreenTransition(duration = 630) {
  const [overlay, setOverlay] = useState(false)

  const go = useCallback((fn) => {
    setOverlay(true)
    setTimeout(() => {
      fn()
      setTimeout(() => setOverlay(false), 90)
    }, duration * 0.45)
  }, [duration])

  return { overlay, go }
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // URL is the single source of truth — screen and activeModule are derived, not state
  const screen = (() => {
    const p = location.pathname
    if (p === '/')                    return 'sleep'
    if (p === '/intro')               return 'intro'
    if (p === '/selector')            return 'selector'
    if (p === '/email')               return 'email'
    if (p.startsWith('/module/'))     return 'module'
    return 'sleep'
  })()

  const activeModule = location.pathname.startsWith('/module/')
    ? location.pathname.split('/')[2] || null
    : null

  const [moduleResult, setModuleResult] = useState(null)
  const [sessionId]                     = useState(() => `FOCO-${Date.now().toString(36).toUpperCase()}`)
  const [bootStage, setBootStage]       = useState(() => ['selector', 'module', 'email'].includes(screen) ? 4 : 0)
  const [qrToken, setQrToken]           = useState(null)
  const [emailToken, setEmailToken]     = useState(null)
  const [reportId, setReportId]         = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingModule, setPendingModule] = useState(null)
  const { overlay, go }                 = useScreenTransition(750)

  // Guard: /email is only valid when we have a moduleResult
  useEffect(() => {
    if (location.pathname === '/email' && !moduleResult) {
      navigate('/selector', { replace: true })
    }
  }, [location.pathname, moduleResult, navigate])

  // Inactivity timeout — return to sleep after 60s
  useEffect(() => {
    let timeoutId
    const reset = () => {
      clearTimeout(timeoutId)
      if (screen !== 'sleep') {
        timeoutId = setTimeout(() => {
          setModuleResult(null)
          setQrToken(null)
          setEmailToken(null)
          setReportId(null)
          navigate('/', { replace: true })
        }, 60000)
      }
    }
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    window.addEventListener('click', reset)
    window.addEventListener('touchstart', reset)
    window.addEventListener('popstate', reset)
    reset()
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('click', reset)
      window.removeEventListener('touchstart', reset)
      window.removeEventListener('popstate', reset)
    }
  }, [screen, navigate])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const enterDashboard = () => {
    markUserInteracted()
    sfxIntroWipe()
    go(() => {
      navigate('/selector')
      setBootStage(0)
      setTimeout(() => setBootStage(1), 120)
      setTimeout(() => setBootStage(2), 570)
      setTimeout(() => setBootStage(3), 975)
      setTimeout(() => setBootStage(4), 2700)
    })
  }

  const selectModule = (id) => {
    setPendingModule(id)
    setTransitioning(true)
  }

  const commitModule = () => {
    setReportId(`FOCO-${Date.now().toString(36).toUpperCase()}`)
    setQrToken(null)
    setEmailToken(null)
    navigate(`/module/${pendingModule}`)
    setTransitioning(false)
    setPendingModule(null)
    sfxBootReady()
  }

  const handleComplete = async (result) => {
    if (!result) {
      go(() => { navigate('/selector'); setModuleResult(null) })
      return
    }
    const mod = MODULES.find(m => m.id === activeModule)
    const fullResult = { ...result, _moduleId: activeModule, _moduleTitle: mod?.label || activeModule }
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reportId, moduleId: activeModule, moduleTitle: mod?.label, result: fullResult }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.qrToken)    setQrToken(data.qrToken)
        if (data?.emailToken) setEmailToken(data.emailToken)
      })
      .catch(() => {})
    go(() => { setModuleResult(fullResult); navigate('/email') })
  }

  const reset = () => {
    markUserInteracted()
    sfxReset()
    go(() => {
      setModuleResult(null)
      setQrToken(null)
      setEmailToken(null)
      setReportId(null)
      navigate('/selector')
    })
  }

  const activeModCode = MODULES.find(m => m.id === activeModule)?.code

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: FONT, background: '#070707', minHeight: '100vh', color: ACCENT, fontSize: FS.sm }}>
      <MilitaryCursor />

      {screen === 'sleep' && <SleepScreen onWake={() => go(() => navigate('/intro'))} />}
      {screen === 'intro' && <IntroScreen onEnter={enterDashboard} />}

      <ModuleTransition active={transitioning} onDone={commitModule} />
      <MilitaryBackground />

      {/* Universal transition overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400, pointerEvents: 'none',
        background: '#000',
        opacity: overlay ? 1 : 0,
        transition: overlay ? 'opacity 0.33s ease-in' : 'opacity 0.67s ease-out',
      }} />

      {/* Header */}
      <header className="app-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 'clamp(48px, 8vw, 90px)',
        background: 'rgba(5,5,5,0.96)',
        borderBottom: `1.5px solid ${BORDER}`,
        display: 'flex', alignItems: 'stretch',
        transform: bootStage < 1 ? 'translateY(-150%)' : 'translateY(0)',
        opacity: bootStage < 1 ? 0 : 1,
        transition: 'transform 0.67s cubic-bezier(0.22,1,0.36,1), opacity 0.52s ease',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <button onClick={reset} className="header-logo" style={{
          background: 'none', border: 'none', borderRight: `1.5px solid ${BORDER}`,
          padding: '0 clamp(10px, 2vw, 32px)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 18px)',
        }}>
          <img src="/logoinnovadef.png" alt="INNOVADEF" style={{ height: 'clamp(32px, 6vw, 80px)' }} />
        </button>

        {/* Nav items */}
        <div className="header-nav" style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
          {[
            { label: 'CENTRO OPS', shortLabel: 'OPS', active: screen === 'selector', action: reset },
            { label: activeModCode || '—', shortLabel: activeModCode || '—', active: screen === 'module', action: null },
          ].map((nav, i) => (
            <div key={i} className="header-nav-item" style={{
              padding: '0 clamp(8px, 1.5vw, 24px)', height: '100%', display: 'flex', alignItems: 'center',
              borderRight: `1.5px solid ${BORDER}`,
              fontFamily: FONT, fontSize: 'clamp(10px, 1.8vw, 18px)', letterSpacing: 'clamp(1px, 0.3vw, 3px)',
              color: nav.active ? ACCENT : TEXT2,
              borderBottom: nav.active ? `2px solid ${ACCENT}` : '2px solid transparent',
              cursor: nav.action ? 'pointer' : 'default',
              background: nav.active ? 'rgba(0,255,65,0.04)' : 'transparent',
              whiteSpace: 'nowrap',
            }} onClick={nav.action}>
              <span className="nav-full">{nav.label}</span>
              <span className="nav-short">{nav.shortLabel}</span>
            </div>
          ))}

          {screen === 'module' && (
            <button
              onClick={reset}
              className="header-back-btn"
              onMouseEnter={e => { e.currentTarget.style.color = '#ffaa00'; e.currentTarget.style.borderColor = '#ffaa0066' }}
              onMouseLeave={e => { e.currentTarget.style.color = TEXT2; e.currentTarget.style.borderColor = BORDER }}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.8vw, 14px)',
                padding: '0 clamp(8px, 1.5vw, 20px)', height: '100%',
                background: 'none', border: 'none', borderLeft: `1.5px solid ${BORDER}`,
                color: TEXT2, cursor: 'pointer',
                fontFamily: FONT, fontSize: 'clamp(9px, 1.5vw, 18px)', letterSpacing: 'clamp(1px, 0.3vw, 3px)',
                transition: 'color 0.27s, border-color 0.27s',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="back-full">← MENÚ PRINCIPAL</span>
              <span className="back-short">← MENÚ</span>
            </button>
          )}
        </div>

        {/* Right indicators — stacked label/value */}
        <div className="header-indicators" style={{ display: 'flex', alignItems: 'center', borderLeft: `1.5px solid ${BORDER}` }}>
          {[
            { label: 'SYS', val: 'OK',  c: ACCENT },
            { label: 'NET', val: 'ENS', c: ACCENT },
            { label: 'SEC', val: 'A',   c: ACCENT },
          ].map((ind, i) => (
            <div key={i} className="header-indicator" style={{
              padding: '0 clamp(6px, 1.2vw, 24px)', borderRight: `1.5px solid ${BORDER}`,
              height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              gap: 'clamp(1px, 0.3vw, 5px)',
            }}>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(8px, 1vw, 14px)', color: TEXT2, letterSpacing: '1px' }}>{ind.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 'clamp(10px, 1.4vw, 18px)', color: ind.c, letterSpacing: '1px' }}>{ind.val}</div>
            </div>
          ))}
          <div className="header-clock" style={{ padding: '0 clamp(8px, 1.5vw, 24px)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(1px, 0.3vw, 5px)' }}>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(8px, 1vw, 14px)', color: TEXT2, letterSpacing: '1px' }}>HORA</div>
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Selector & Email content */}
      <div style={{
        position: 'relative', zIndex: 2, minHeight: '100vh',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 'clamp(64px, 10vw, 160px) clamp(16px, 4vw, 60px) clamp(40px, 6vw, 80px)',
      }}>
        <Suspense fallback={null}>
          {screen === 'selector' && (
            <div key="selector" style={{
              width: '100%',
              animation: transitioning ? 'contentFadeOut 0.75s ease-in 0.67s forwards' : 'contentFadeIn 0.9s ease-out both',
            }}>
              <ModuleSelector onSelect={selectModule} bootStage={bootStage} />
            </div>
          )}
          {screen === 'email' && moduleResult && (
            <div key="email" style={{ width: '100%', animation: 'contentFadeIn 0.6s ease-out both' }}>
              <EmailScreen
                sessionId={reportId || sessionId}
                moduleResult={moduleResult}
                onReset={reset}
                qrToken={qrToken}
                emailToken={emailToken}
              />
            </div>
          )}
        </Suspense>
      </div>

      {/* Module screen — fills space between header and status bar */}
      {screen === 'module' && (
        <div key={`mod-${activeModule}`} style={{
          position: 'fixed', top: 'clamp(54px, 6.5vw, 90px)', left: 0, right: 0, bottom: 'clamp(32px, 4vw, 48px)',
          zIndex: 2, overflowY: 'auto', overflowX: 'hidden',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,255,65,0.3) transparent',
          padding: 'clamp(10px, 2vw, 30px)',
          animation: 'contentFadeIn 0.6s ease-out both',
        }}>
          <PluginRenderer
            plugin={MODULES.find(m => m.id === activeModule)}
            onComplete={handleComplete}
            sessionId={reportId}
          />
        </div>
      )}

      <StatusBar module={activeModCode} bootStage={bootStage} />

      <style>{`
        @font-face {
          font-family: 'Share Tech Mono';
          src: url('/ShareTechMono-Regular.ttf') format('truetype');
          font-weight: 400; font-style: normal; font-display: swap;
        }
        * { box-sizing: border-box; }
        ::selection { background: rgba(0,255,65,0.2); color: #00FF41; }
        ::-webkit-scrollbar { width: 4px; background: #070707; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,65,0.2); }
        html { scrollbar-width: thin; scrollbar-color: rgba(0,255,65,0.2) #070707; }
        @keyframes blink          { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn         { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes contentFadeIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes contentFadeOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-14px) scale(0.97)} }
        @keyframes spin           { to{transform:rotate(360deg)} }
        @keyframes hudScan        { 0%{top:0;opacity:1} 85%{opacity:0.7} 100%{top:100vh;opacity:0} }
        @keyframes hudScanUp      { 0%{bottom:0;opacity:1} 85%{opacity:0.7} 100%{bottom:100vh;opacity:0} }
        @keyframes modFlash       { 0%{opacity:0.55} 20%{opacity:0.3} 100%{opacity:0} }
        @keyframes diagSweep      { 0%{transform:translateX(-100%) rotate(135deg)} 100%{transform:translateX(100%) rotate(135deg)} }
        @keyframes ringExpand     { 0%{width:0;height:0;opacity:0.8} 100%{width:150vmax;height:150vmax;opacity:0} }
        @keyframes glitchFlicker  { 0%,100%{opacity:0} 10%{opacity:0.4} 20%{opacity:0} 30%{opacity:0.3} 40%{opacity:0} 50%{opacity:0.5} 60%{opacity:0} 70%{opacity:0.2} 80%{opacity:0} 90%{opacity:0.1} }
        button:focus { outline: 1.5px solid rgba(0,255,65,0.3); outline-offset: 3px; }

        /* Responsive header - default: show full labels */
        .nav-short, .back-short { display: none; }
        .nav-full, .back-full { display: inline; }

        /* Tablet landscape and smaller laptops (< 1024px) */
        @media (max-width: 1024px) {
          .header-indicator:nth-child(3) { display: none; }
        }

        /* Tablet portrait (< 768px) */
        @media (max-width: 768px) {
          .nav-short, .back-short { display: inline; }
          .nav-full, .back-full { display: none; }
          .header-indicator:nth-child(2),
          .header-indicator:nth-child(3) { display: none; }
        }

        /* Mobile (< 480px) */
        @media (max-width: 480px) {
          .header-indicators { display: none !important; }
          .header-clock { display: none !important; }
        }
      `}</style>
    </div>
  )
}
