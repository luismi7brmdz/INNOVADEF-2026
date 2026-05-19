/**
 * vite-plugin-registry.js
 *
 * Auto-discovers external plugins from sibling demo-* directories in innovadef-demos.
 * Each external plugin must have:
 *   - plugin.json  at the repo root (see PLUGIN_GUIDE.md for fields)
 *   - src/plugin.jsx  exporting a default React component
 *
 * Provides:
 *   - pluginRegistryPlugin()   — Vite plugin that exposes virtual:external-plugins
 *   - getExternalAliases(root) — generates @{id} → ../demo-{dir}/src aliases for vite.config.js
 */

import fs from 'fs'
import path from 'path'

const VIRTUAL_ID = 'virtual:external-plugins'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** Read all plugin.json files from sibling demo-* directories */
function discoverPlugins(root) {
  const parent = path.resolve(root, '..')
  const results = []

  let dirs
  try {
    dirs = fs.readdirSync(parent)
  } catch {
    return results
  }

  for (const dir of dirs) {
    if (!dir.startsWith('demo-')) continue
    const manifestPath = path.join(parent, dir, 'plugin.json')
    if (!fs.existsSync(manifestPath)) continue
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      if (!manifest.id) {
        console.warn(`[plugin-registry] ${dir}/plugin.json missing "id" field — skipped`)
        continue
      }
      results.push({ dir, manifest })
    } catch (e) {
      console.warn(`[plugin-registry] Failed to parse ${manifestPath}:`, e.message)
    }
  }

  return results
}

/**
 * Generates the JS code for the virtual:external-plugins module.
 *
 * Output looks like:
 *   import { lazy } from 'react'
 *   import { Brain } from 'lucide-react'
 *   export const EXTERNAL_PLUGINS = [
 *     { id: 'aerocognitio', ..., icon: Brain, component: lazy(() => import('@aerocognitio/plugin')) }
 *   ]
 */
function generateVirtualModule(plugins) {
  if (plugins.length === 0) {
    return `export const EXTERNAL_PLUGINS = []`
  }

  // Collect unique Lucide icon names
  const iconNames = [...new Set(plugins.map(p => p.manifest.icon).filter(Boolean))]
  const lucideImport = iconNames.length
    ? `import { ${iconNames.join(', ')} } from 'lucide-react'`
    : ''

  const entries = plugins.map(({ manifest }) => {
    // Separate fields that need special handling (not serializable as-is)
    const { icon, component: _c, entry: _e, ...rest } = manifest

    // Generate one "key: value" line per metadata field
    const props = Object.entries(rest)
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`)
      .join(',\n')

    return `  {\n${props},\n    icon: ${icon || 'null'},\n    component: lazy(() => import('@${manifest.id}/plugin')),\n  }`
  }).join(',\n')

  return `import { lazy } from 'react'
${lucideImport}

export const EXTERNAL_PLUGINS = [
${entries}
]`
}

/** Vite plugin — exposes virtual:external-plugins */
export default function pluginRegistryPlugin() {
  let root = process.cwd()

  return {
    name: 'innovadef-plugin-registry',

    configResolved(config) {
      root = config.root
      const plugins = discoverPlugins(root)
      if (plugins.length > 0) {
        console.log(
          `[plugin-registry] Auto-registered ${plugins.length} external plugin(s): ` +
          plugins.map(p => p.manifest.id).join(', ')
        )
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      const plugins = discoverPlugins(root)
      return generateVirtualModule(plugins)
    },
  }
}

/**
 * Call this in vite.config.js resolve.alias to auto-generate @{id} aliases.
 *
 * Usage:
 *   import { getExternalAliases } from './vite-plugin-registry.js'
 *   alias: { ...getExternalAliases(import.meta.dirname) }
 */
export function getExternalAliases(root) {
  const aliases = {}
  for (const { dir, manifest } of discoverPlugins(root)) {
    aliases[`@${manifest.id}`] = path.resolve(root, '..', dir, 'src')
  }
  return aliases
}