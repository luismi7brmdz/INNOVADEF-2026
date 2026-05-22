import LiveClock from './LiveClock'
import { ACCENT, AMBER, BORDER, TEXT2, FONT } from '../theme'

const STATUS_ITEMS = [
  { label: 'SYS', value: 'NOMINAL',   color: ACCENT },
  { label: 'NET', value: 'ENS-CAT-A', color: ACCENT },
  { label: 'ENC', value: 'AES-256',   color: ACCENT },
  { label: 'SESS', value: 'FOCO-2026', color: AMBER },
]

export default function StatusBar({ module, bootStage = 4 }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 'clamp(32px, 4vw, 48px)',
      background: '#050505',
      borderTop: `1.5px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
      padding: '0 clamp(18px, 3vw, 36px)',
      fontFamily: FONT, fontSize: 'clamp(11px, 1.3vw, 15px)',
      transform: bootStage < 2 ? 'translateY(100%)' : 'translateY(0)',
      opacity: bootStage < 2 ? 0 : 1,
      transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease',
    }}>
      {STATUS_ITEMS.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(5px, 1vw, 10px)',
          paddingRight: 'clamp(10px, 2vw, 22px)', marginRight: 'clamp(10px, 2vw, 22px)',
          borderRight: `1.5px solid ${BORDER}`
        }}>
          <span style={{ color: TEXT2 }}>{item.label}:</span>
          <span style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 20px)' }}>
        {module && (
          <span style={{ color: TEXT2 }}>
            MÓDULO ACTIVO: <span style={{ color: ACCENT }}>{module}</span>
          </span>
        )}
        <LiveClock />
        <div style={{
          width: 'clamp(6px, 0.8vw, 8px)', height: 'clamp(6px, 0.8vw, 8px)',
          background: ACCENT, boxShadow: `0 0 9px ${ACCENT}44`,
          animation: 'blink 1.5s infinite'
        }} />
      </div>
    </div>
  )
}
