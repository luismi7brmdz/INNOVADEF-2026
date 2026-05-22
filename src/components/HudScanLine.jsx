import { ACCENT } from '../theme'

export default function HudScanLine({ active }) {
  if (!active) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '0.4vh', zIndex: 200, pointerEvents: 'none',
      background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT}cc, transparent)`,
      boxShadow: `0 0 36px ${ACCENT}88, 0 0 12px ${ACCENT}`,
      animation: 'hudScan 1.35s ease-in-out forwards'
    }} />
  )
}
