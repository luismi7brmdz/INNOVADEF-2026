import { createElement, createContext, useContext } from 'react'
import * as theme from '../theme'
import * as sfx from '../sfx'

export const PluginSDKContext = createContext(null)

/**
 * Provides the plugin SDK context to any plugin rendered inside it.
 *
 * Available via usePluginSDK():
 *   - theme       — INNOVADEF color/style constants
 *   - sfx         — audio functions (sfxHover, sfxModuleSelect, etc.)
 *   - onComplete  — call this when the plugin finishes (passes result upstream)
 *   - callApi     — stub for future backend integration
 */
export function PluginSDKProvider({ children, onComplete }) {
  const sdk = {
    theme,
    sfx,
    onComplete,
    /**
     * Future backend hook. Usage inside a plugin:
     *   const { callApi } = usePluginSDK()
     *   await callApi('results/save', { sessionId, score })
     *
     * When the backend is ready, implement the fetch here once.
     */
    callApi: async (_endpoint, _data) => {
      throw new Error('Backend API not yet configured')
    },
  }

  return createElement(PluginSDKContext.Provider, { value: sdk }, children)
}

export const usePluginSDK = () => useContext(PluginSDKContext)