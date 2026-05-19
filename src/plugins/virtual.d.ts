declare module 'virtual:external-plugins' {
  import type { ComponentType, LazyExoticComponent } from 'react'

  export interface ExternalPlugin {
    id: string
    code: string
    label: string
    desc: string
    icon: ComponentType | null
    color: string
    duration: string
    tag: string
    category: string
    status: 'ACTIVO' | 'PRÓXIMO' | 'MANTENIMIENTO'
    component: LazyExoticComponent<ComponentType<{ onComplete: (result: unknown) => void }>>
  }

  export const EXTERNAL_PLUGINS: ExternalPlugin[]
}
