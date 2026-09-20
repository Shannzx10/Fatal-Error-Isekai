import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { getSettings, applyGlobalCSSVariables } from './engine/core/settingsManager'
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar } from '@capacitor/status-bar';

// Terapkan tema/CSS variables sejak awal sebelum React nge-render!
applyGlobalCSSVariables(getSettings());

// Konfigurasi Capacitor (Mobile Only)
if (Capacitor.isNativePlatform()) {
  // Paksa orientasi Landscape
  ScreenOrientation.lock({ orientation: 'landscape' }).catch(err => console.log('Screen orientation lock failed', err));
  
  // Sembunyikan Status Bar (Immersive Mode)
  StatusBar.hide().catch(err => console.log('Status bar hide failed', err));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
