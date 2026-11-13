import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Players who chose the classic (v1) UI land there automatically.
let prefersClassic = false
try { prefersClassic = localStorage.getItem('ui_version') === 'classic' } catch { /* storage unavailable */ }

if (prefersClassic) {
  window.location.replace(`${import.meta.env.BASE_URL}classic/`)
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
