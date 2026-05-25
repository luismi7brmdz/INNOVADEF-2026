import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Prefetch en idle: vendor-r3f (Three.js ecosystem) se necesita en SleepScreen,
// ModuleSelector y EmailScreen se necesitan tras autenticarse.
// requestIdleCallback evita competir con el render inicial.
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => {
    import('three')
    import('./screens/ModuleSelector')
    import('./screens/EmailScreen')
  })
} else {
  setTimeout(() => {
    import('three')
    import('./screens/ModuleSelector')
    import('./screens/EmailScreen')
  }, 1500)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
