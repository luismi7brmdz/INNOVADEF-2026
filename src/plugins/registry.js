import { lazy } from 'react'
import { FileText, Target, BarChart2, AlertTriangle, Activity, Shield, Crosshair, Terminal } from 'lucide-react'
import { ACCENT, AMBER, RED } from '../theme'
import { EXTERNAL_PLUGINS } from 'virtual:external-plugins'

/**
 * PLUGIN REGISTRY
 *
 * Internal modules live in src/modules/ and are registered here.
 * External plugins (separate repos) are auto-discovered from sibling
 * demo-* directories via vite-plugin-registry.js — no changes needed here.
 *
 * To add an internal module:
 *   1. Create src/modules/MiModulo.jsx (export default, receives onComplete prop)
 *   2. Add an entry below
 *
 * To add an external plugin:
 *   1. git submodule add <url> demo-<name>  (in innovadef-demos root)
 *   2. Ensure the repo has plugin.json + src/plugin.jsx
 *   Done — it appears automatically on next build/dev restart.
 *
 * Fields:
 *   id        — unique identifier (used in URL /module/:id)
 *   code      — HUD label (MOD-XX)
 *   label     — module title
 *   desc      — short description shown on the card
 *   icon      — Lucide React component
 *   color     — card accent color
 *   duration  — estimated duration
 *   tag       — badge text on card (uppercase)
 *   category  — groups cards in selector (lowercase)
 *   status    — 'ACTIVO' | 'PRÓXIMO' | 'MANTENIMIENTO'
 *   component — React.lazy import
 */
const INTERNAL_MODULES = [
  {
    id: 'capacity',
    code: 'MOD-01',
    label: 'TEST DE CAPACIDAD DIGITAL',
    desc: '5 VECTORES DE MADUREZ TECNOLÓGICA — GENERA INFORME CLASIFICADO PERSONALIZADO',
    icon: FileText,
    color: ACCENT,
    duration: '~3 MIN',
    tag: 'EVALUACIÓN',
    category: 'evaluación',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/Capacity')),
  },
  {
    id: 'tactical',
    code: 'MOD-02',
    label: 'SIMULADOR DE DECISIÓN TÁCTICA',
    desc: 'ESCENARIO DE CRISIS DIGITAL EN TIEMPO REAL — PERFIL DE LIDERAZGO OPERACIONAL',
    icon: Target,
    color: '#FF6644',
    duration: '~4 MIN',
    tag: 'SIMULACRO',
    category: 'simulación',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/TacticalSimulator')),
  },
  {
    id: 'radar',
    code: 'MOD-03',
    label: 'RADAR DE MADUREZ ORGANIZACIONAL',
    desc: '6 VECTORES ESTRATÉGICOS — VISUALIZACIÓN RADAR EN TIEMPO REAL',
    icon: BarChart2,
    color: '#0099FF',
    duration: '~3 MIN',
    tag: 'DIAGNÓSTICO',
    category: 'evaluación',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/MaturityRadar')),
  },
  {
    id: 'threats',
    code: 'MOD-04',
    label: 'CLASIFICADOR DE AMENAZAS',
    desc: 'PRIORIZACIÓN DE AMENAZAS ACTIVAS — ASIGNACIÓN DE RECURSOS — ANÁLISIS DE RIESGOS',
    icon: AlertTriangle,
    color: RED,
    duration: '~4 MIN',
    tag: 'INTELIGENCIA',
    category: 'inteligencia',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/ThreatClassifier')),
  },
  {
    id: 'pulse',
    code: 'MOD-05',
    label: 'ENCUESTA DE PULSO FOCO 2026',
    desc: '10 PREGUNTAS — RESULTADOS AGREGADOS EN TIEMPO REAL CON OTROS ASISTENTES',
    icon: Activity,
    color: AMBER,
    duration: '~2 MIN',
    tag: 'COMUNIDAD',
    category: 'comunidad',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/PulseSurvey')),
  },
  {
    id: 'cyberdefense',
    code: 'MOD-07',
    label: 'OPERACIÓN ESCUDO DIGITAL',
    desc: 'DEFENSA DE RED EN TIEMPO REAL — NEUTRALIZA AMENAZAS ANTES DE QUE LLEGUEN AL SERVIDOR',
    icon: Shield,
    color: '#00FF41',
    duration: '~4 MIN',
    tag: 'SIMULADOR',
    category: 'simulación',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/CyberDefense')),
  },
  {
    id: 'tacticalmap',
    code: 'MOD-08',
    label: 'SALA DE GUERRA — MANDO TÁCTICO',
    desc: 'ARRASTRA UNIDADES PARA INTERCEPTAR AMENAZAS — 6 OLEADAS — MANDO EN TIEMPO REAL',
    icon: Crosshair,
    color: '#00AAFF',
    duration: '~4 MIN',
    tag: 'SIMULADOR',
    category: 'simulación',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/TacticalMap')),
  },
  {
    id: 'covertmission',
    code: 'MOD-09',
    label: 'MISIÓN SOMBRA — TERMINAL CLASIFICADO',
    desc: 'INFILTRA LA RED — DECODIFICA TRANSMISIONES CIFRADAS — NEUTRALIZA AL AGENTE',
    icon: Terminal,
    color: '#CC44FF',
    duration: '~5 MIN',
    tag: 'OPERACIÓN',
    category: 'operaciones',
    status: 'ACTIVO',
    component: lazy(() => import('../modules/CovertMission')),
  },
]

// Internal modules first, then auto-discovered external plugins
export const PLUGIN_REGISTRY = [...INTERNAL_MODULES, ...EXTERNAL_PLUGINS]
