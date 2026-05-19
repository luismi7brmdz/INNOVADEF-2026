import { lazy } from 'react'
import { FileText, Target, BarChart2, AlertTriangle, Activity, Brain } from 'lucide-react'
import { ACCENT, AMBER, RED } from '../theme'

/**
 * PLUGIN REGISTRY
 *
 * Añadir un nuevo plugin = 1 entrada aquí. No tocar App.jsx.
 *
 * Campos:
 *   id        — identificador único (usado en la URL /module/:id)
 *   code      — código visible en el HUD (MOD-XX)
 *   label     — título del módulo
 *   desc      — descripción corta
 *   icon      — componente Lucide React
 *   color     — color de acento del módulo
 *   duration  — duración estimada
 *   tag       — etiqueta de categoría visible en la card
 *   category  — categoría para agrupación en el selector (lowercase)
 *   status    — 'ACTIVO' | 'PRÓXIMO' | 'MANTENIMIENTO'
 *   component — React.lazy import del componente del módulo
 */
export const PLUGIN_REGISTRY = [
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
    id: 'aerocognitio',
    code: 'MOD-06',
    label: 'AEROCOGNITIO',
    desc: 'BATERÍA PSICOTÉCNICA RPAS — EVALUACIÓN COGNITIVO-ESPACIAL — INFORME IA PERSONALIZADO',
    icon: Brain,
    color: '#ffb547',
    duration: '~6 MIN',
    tag: 'PSICOTÉCNICA',
    category: 'psicotécnica',
    status: 'ACTIVO',
    component: lazy(() => import('@aerocognitio/plugin')),
  },
]