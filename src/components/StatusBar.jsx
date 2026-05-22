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
    <>
      <style>{`
        .status-item { display: flex; }
        .status-item-full { display: inline; }
        .status-item-short { display: none; }
        .status-module-label { display: inline; }
        
        @media (max-width: 900px) {
          .status-item:nth-child(3),
          .status-item:nth-child(4) { display: none; }
        }
        
        @media (max-width: 600px) {
          .status-item:nth-child(2),
          .status-item:nth-child(3),
          .status-item:nth-child(4) { display: none; }
          .status-module-label { display: none; }
          .status-item-full { display: none; }
          .status-item-short { display: inline; }
        }
        
        @media (max-width: 400px) {
          .status-items-container { display: none !important; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        height: 'clamp(28px, 4vw, 48px)',
        background: '#050505',
        borderTop: `1.5px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(10px, 2vw, 36px)',
        fontFamily: FONT, fontSize: 'clamp(9px, 1.2vw, 14px)',
        transform: bootStage < 2 ? 'translateY(100%)' : 'translateY(0)',
        opacity: bootStage < 2 ? 0 : 1,
        transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease',
      }}>
        <div className="status-items-container" style={{ display: 'flex', alignItems: 'center' }}>
          {STATUS_ITEMS.map((item, i) => (
            <div key={i} className="status-item" style={{
              alignItems: 'center', gap: 'clamp(3px, 0.6vw, 8px)',
              paddingRight: 'clamp(6px, 1.2vw, 18px)', marginRight: 'clamp(6px, 1.2vw, 18px)',
              borderRight: `1.5px solid ${BORDER}`
            }}>
              <span style={{ color: TEXT2 }}>{item.label}:</span>
              <span style={{ color: item.color }}>
                <span className="status-item-full">{item.value}</span>
                <span className="status-item-short">OK</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.2vw, 16px)' }}>
          {module && (
            <span style={{ color: TEXT2, whiteSpace: 'nowrap' }}>
              <span className="status-module-label">MÓDULO: </span>
              <span style={{ color: ACCENT }}>{module}</span>
            </span>
          )}
          <LiveClock />
          <div style={{
            width: 'clamp(5px, 0.7vw, 8px)', height: 'clamp(5px, 0.7vw, 8px)',
            background: ACCENT, boxShadow: `0 0 9px ${ACCENT}44`,
            animation: 'blink 1.5s infinite'
          }} />
        </div>
      </div>
    </>
  )
}
