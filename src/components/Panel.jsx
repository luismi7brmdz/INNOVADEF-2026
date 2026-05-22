import { BORDER, TEXT2, FONT } from '../theme'

export default function Panel({ label, children, style = {} }) {
  return (
    <div style={{
      border: `1.5px solid ${BORDER}`,
      background: '#070707',
      position: 'relative',
      ...style
    }}>
      {label && (
        <div style={{
          position: 'absolute', top: -1.5, left: 0,
          padding: 'clamp(5px, 1vw, 9px) clamp(12px, 2.5vw, 24px)',
          background: '#070707',
          borderBottom: `1.5px solid ${BORDER}`,
          borderRight: `1.5px solid ${BORDER}`,
          fontSize: 'clamp(13px, 1.6vw, 20px)', letterSpacing: 'clamp(2px, 0.4vw, 4px)', color: TEXT2,
          fontFamily: FONT, textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}
      <div style={{ paddingTop: label ? 'clamp(32px, 4.5vw, 52px)' : '0' }}>
        {children}
      </div>
    </div>
  )
}
