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
          padding: '0.46vmin 2.22vmin',
          background: '#070707',
          borderBottom: `1.5px solid ${BORDER}`,
          borderRight: `1.5px solid ${BORDER}`,
          fontSize: 'clamp(11px, 1.85vmin, 9999px)', letterSpacing: '0.37vmin', color: TEXT2,
          fontFamily: FONT, textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}
      <div style={{ paddingTop: label ? 'clamp(20px, 4.81vmin, 9999px)' : '0' }}>
        {children}
      </div>
    </div>
  )
}
