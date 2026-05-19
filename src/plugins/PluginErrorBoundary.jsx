import { Component } from 'react'
import { ACCENT, RED, BORDER, TEXT2, FONT, S } from '../theme'

export default class PluginErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error(`[PluginErrorBoundary] Plugin "${this.props.pluginId}" crashed:`, error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <div style={{ border: `1.5px solid ${RED}44`, background: '#070707', padding: '54px 48px' }}>
          <div style={{ fontFamily: FONT, fontSize: '13.5px', color: RED, letterSpacing: '4px', marginBottom: '27px' }}>
            // ERROR DE MÓDULO — {(this.props.pluginId ?? 'DESCONOCIDO').toUpperCase()}
          </div>
          <div style={{ fontFamily: FONT, fontSize: '36px', color: TEXT2, letterSpacing: '2px', marginBottom: '18px', lineHeight: 1.4 }}>
            FALLO EN LA CARGA DEL MÓDULO
          </div>
          <div style={{ fontFamily: FONT, fontSize: '18px', color: `${RED}99`, letterSpacing: '1px', marginBottom: '45px', fontFamily: 'monospace' }}>
            {this.state.error?.message ?? 'Error desconocido'}
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ ...S.btnPrimary }}
            >
              REINTENTAR
            </button>
            {this.props.onBack && (
              <button
                onClick={this.props.onBack}
                style={{ ...S.btnDanger }}
              >
                VOLVER AL SELECTOR
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}