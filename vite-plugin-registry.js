/**
 * vite-plugin-registry.js
 *
 * Auto-discovers external plugins from sibling directories in innovadef-demos
 * (any sibling with a plugin.json at its root, regardless of the directory name).
 * Each external plugin must have:
 *   - plugin.json  at the repo root (see PLUGIN_GUIDE.md for fields)
 *   - src/plugin.jsx  exporting a default React component
 *
 * Provides:
 *   - pluginRegistryPlugin()   — Vite plugin that exposes virtual:external-plugins
 *   - getExternalAliases(root) — generates @{id} → ../{dir}/src aliases for vite.config.js
 *   - getExternalSourceGlobs(root) — globs over each plugin's src/ for optimizeDeps.entries
 */

import fs from 'fs'
import path from 'path'

const VIRTUAL_ID = 'virtual:external-plugins'
const RESOLVED_ID = '\0' + VIRTUAL_ID

// discoverPlugins() runs several times per build — warn about each duplicate only once
const warnedDuplicates = new Set()

/** Read all plugin.json files from sibling directories (except this app itself) */
function discoverPlugins(root) {
  const parent = path.resolve(root, '..')
  const results = []

  let dirs
  try {
    dirs = fs.readdirSync(parent)
  } catch {
    return results
  }

  const seenIds = new Map()  // id → dir that registered it first

  // Sorted so the winner of a duplicate id is deterministic across filesystems
  for (const dir of dirs.sort()) {
    if (dir.startsWith('.') || dir === 'node_modules') continue
    if (path.join(parent, dir) === path.resolve(root)) continue
    const manifestPath = path.join(parent, dir, 'plugin.json')
    if (!fs.existsSync(manifestPath)) continue
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      if (!manifest.id) {
        console.warn(`[plugin-registry] ${dir}/plugin.json missing "id" field — skipped`)
        continue
      }
      if (seenIds.has(manifest.id)) {
        const key = `${manifest.id}:${dir}`
        if (!warnedDuplicates.has(key)) {
          warnedDuplicates.add(key)
          console.warn(
            `[plugin-registry] Duplicate plugin id "${manifest.id}" in ${dir}/plugin.json ` +
            `(already registered by ${seenIds.get(manifest.id)}) — skipped`
          )
        }
        continue
      }
      seenIds.set(manifest.id, dir)
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

/**
 * Call this in vite.config.js optimizeDeps.entries so Vite scans plugin sources.
 *
 * Usage:
 *   entries: [...getExternalSourceGlobs(import.meta.dirname)]
 */
export function getExternalSourceGlobs(root) {
  return discoverPlugins(root).map(({ dir }) => `../${dir}/src/**/*.{js,jsx}`)
}
