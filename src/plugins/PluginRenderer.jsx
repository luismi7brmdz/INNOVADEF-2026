import { Suspense } from 'react'
import { ACCENT, BORDER, TEXT2, FONT } from '../theme'
import { PluginSDKProvider } from './PluginSDK'
import PluginErrorBoundary from './PluginErrorBoundary'

function HudLoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '27px' }}>
      <div style={{ width: '48px', height: '48px', border: `2px solid ${BORDER}`, borderTop: `2px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <div style={{ fontFamily: FONT, fontSize: '18px', color: TEXT2, letterSpacing: '4px' }}>CARGANDO MÓDULO...</div>
    </div>
  )
}

/**
 * Renders a plugin from the registry with:
 *   - Suspense (lazy loading)
 *   - PluginErrorBoundary (isolated crash handling)
 *   - PluginSDKProvider (injects theme, sfx, callApi)
 *
 * Props:
 *   plugin     — registry entry ({ id, component, ... })
 *   onComplete — forwarded to plugin and SDK context
 */
export default function PluginRenderer({ plugin, onComplete }) {
  if (!plugin) return null
  const { component: Component } = plugin

  return (
    <PluginSDKProvider onComplete={onComplete}>
      <PluginErrorBoundary pluginId={plugin.id} onBack={() => onComplete?.(null)}>
        <Suspense fallback={<HudLoadingScreen />}>
          <Component onComplete={onComplete} />
        </Suspense>
      </PluginErrorBoundary>
    </PluginSDKProvider>
  )
}