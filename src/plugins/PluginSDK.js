import { createElement, createContext, useContext } from 'react'
import * as theme from '../theme'
import * as sfx from '../sfx'

export const PluginSDKContext = createContext(null)

/**
 * Provides the plugin SDK context to any plugin rendered inside it.
 *
 * Available via usePluginSDK():
 *   - theme      — INNOVADEF color/style constants
 *   - sfx        — audio functions
 *   - sessionId  — unique ID for this module run (use it when calling callApi)
 *   - onComplete — call this when the plugin finishes (passes result upstream)
 *   - callApi    — fetch wrapper for the INNOVADEF backend
 *
 * callApi usage inside a plugin:
 *   const { callApi, sessionId } = usePluginSDK()
 *
 *   // Save intermediate answers as the user progresses:
 *   await callApi('answers', {
 *     sessionId,
 *     moduleId: 'my-module',
 *     steps: [{ stepId: 'q1', answer: 2 }, ...]
 *   })
 *
 *   // The final result is sent automatically by the host app via onComplete —
 *   // plugins don't need to call /api/session themselves.
 */
export function PluginSDKProvider({ children, onComplete, sessionId }) {
  const sdk = {
    theme,
    sfx,
    sessionId,
    onComplete,
    callApi: async (endpoint, data, method = 'POST') => {
      const res = await fetch(`/api/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(data) : undefined,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || `API ${method} /api/${endpoint} → ${res.status}`)
      }
      return res.json()
    },
  }

  return createElement(PluginSDKContext.Provider, { value: sdk }, children)
}

export const usePluginSDK = () => useContext(PluginSDKContext)