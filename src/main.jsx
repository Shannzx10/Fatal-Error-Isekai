import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { getSettings, applyGlobalCSSVariables } from './engine/core/settingsManager'

// Terapkan tema/CSS variables sejak awal sebelum React nge-render!
applyGlobalCSSVariables(getSettings());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
