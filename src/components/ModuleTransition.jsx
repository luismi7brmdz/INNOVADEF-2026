import { useEffect } from 'react'
import { ACCENT } from '../theme'
import { sfxIntroWipe } from '../sfx'

export default function ModuleTransition({ active, onDone }) {
  useEffect(() => {
    if (!active) return
    sfxIntroWipe()
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [active, onDone])

  if (!active) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
      {/* Base flash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: ACCENT,
        animation: 'modFlash 1.8s ease-out forwards'
      }} />

      {/* Diagonal sweep */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 501, pointerEvents: 'none',
        background: `linear-gradient(135deg, transparent 40%, ${ACCENT}cc 50%, transparent 60%)`,
        animation: 'diagSweep 0.9s ease-in-out forwards'
      }} />

      {/* Concentric rings */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 0, height: 0, borderRadius: '50%',
          border: `3px solid ${ACCENT}`,
          animation: `ringExpand 0.9s ease-out ${i * 0.12}s forwards`
        }} />
      ))}

      {/* Horizontal scan lines */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '0.4vh',
        zIndex: 502, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT}cc, transparent)`,
        boxShadow: `0 0 45px ${ACCENT}88`,
        animation: 'hudScan 0.75s ease-in-out forwards'
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '0.4vh',
        zIndex: 502, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT}cc, transparent)`,
        boxShadow: `0 0 45px ${ACCENT}88`,
        animation: 'hudScanUp 0.75s ease-in-out forwards'
      }} />

      {/* Glitch overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 503, pointerEvents: 'none',
        background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${ACCENT}22 3px, ${ACCENT}22 6px)`,
        animation: 'glitchFlicker 0.3s ease-in-out forwards'
      }} />
    </div>
  )
}
