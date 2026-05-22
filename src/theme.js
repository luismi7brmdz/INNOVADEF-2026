// ── MILITARY PHOSPHOR PALETTE ──────────────────────────────────────────────
export const ACCENT  = '#00FF41'      // verde fósforo principal
export const ACCENT2 = '#00CC33'      // verde secundario
export const AMBER   = '#FFAA00'      // ámbar advertencia
export const RED     = '#FF2B2B'      // rojo alerta crítica
export const DIM     = 'rgba(0,255,65,0.35)'
export const DIMLO   = 'rgba(0,255,65,0.15)'
export const BORDER  = 'rgba(0,255,65,0.22)'
export const BG      = '#070707'
export const BG2     = '#0d0d0d'
export const TEXT    = '#00FF41'
export const TEXT2   = 'rgba(0,255,65,0.65)'
export const FONT    = '"Share Tech Mono", "Courier New", monospace'

// ── Fluid font scale (vh-based, works from mobile to 4K) ──────────────────
// At 1080p (1vh=10.8px): xs≈11, sm≈13, base≈15, md≈18, lg≈22, xl≈49
export const FS = {
  xs:   'clamp(10px, 1.0vh, 13px)',   // status bar, tiny labels
  sm:   'clamp(11px, 1.2vh, 15px)',   // indicators, nav
  base: 'clamp(12px, 1.4vh, 17px)',   // panel content, footer
  md:   'clamp(14px, 1.7vh, 21px)',   // category headers, tags
  lg:   'clamp(18px, 2.1vh, 26px)',   // panel labels, card titles
  xl:   'clamp(28px, 4.4vh, 56px)',   // main heading
}

// ── Fluid spacing scale (vh-based) ────────────────────────────────────────
export const SP = {
  xs: 'clamp(6px,  0.7vh, 10px)',
  sm: 'clamp(10px, 1.4vh, 18px)',
  md: 'clamp(16px, 2.4vh, 32px)',
  lg: 'clamp(22px, 3.8vh, 50px)',
}

export const CARD = {
  padding: '18px 20px',
  background: '#0a0a0a',
  border: '1px solid rgba(0,255,65,0.22)',
  borderRadius: '0px'
}

export const S = {
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    padding: '14px 32px', fontSize: '12px', fontWeight: 400,
    letterSpacing: '2px', textTransform: 'uppercase',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    background: 'rgba(0,255,65,0.07)',
    color: '#00FF41',
    border: '1px solid rgba(0,255,65,0.5)',
    borderRadius: '0px', cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'inset 0 0 12px rgba(0,255,65,0.04)'
  },
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    padding: '14px 32px', fontSize: '12px', fontWeight: 400,
    letterSpacing: '2px', textTransform: 'uppercase',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    background: 'rgba(255,43,43,0.07)',
    color: '#FF2B2B',
    border: '1px solid rgba(255,43,43,0.5)',
    borderRadius: '0px', cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  label: {
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    fontSize: '10px', letterSpacing: '3px', color: 'rgba(0,255,65,0.5)',
    fontWeight: 400, textTransform: 'uppercase'
  },
  h1: {
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 400,
    letterSpacing: '4px', color: '#00FF41', lineHeight: 1.1,
    textTransform: 'uppercase'
  },
  h2: {
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: 400,
    letterSpacing: '3px', color: '#00FF41', textTransform: 'uppercase'
  }
}
