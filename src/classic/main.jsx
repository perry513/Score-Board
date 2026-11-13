import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Classic (v1) UI, kept for players who prefer the original layout.
// It shares localStorage with the new UI, so games carry over both ways.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
