// src/engine/core/settingsManager.js

const SETTINGS_KEY = 'fei_settings';

export const defaultSettings = {
  // Appearance (Penampilan)
  fontSize: 'medium', // 'small', 'medium', 'large'
  accentColor: '#ff3366', // Hex color (Default: Cyberpunk Pink)
  dialogOpacity: 85, // 0 - 100 (Default: 85%)
  
  // Teks & Dialog
  textSpeed: 30, // milliseconds per character. 0 = instant
  
  // Audio
  masterVolume: 100, // 0 - 100
  bgmVolume: 80, // 0 - 100
  sfxVolume: 80, // 0 - 100
};

export const getSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return defaultSettings;
};

export const saveSettings = (newSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    
    // Langsung terapkan variabel CSS global agar perubahan warna aksen terlihat instan di mana-mana
    applyGlobalCSSVariables(newSettings);
    
    return true;
  } catch (e) {
    console.error("Failed to save settings", e);
    return false;
  }
};

// Fungsi helper untuk menyuntikkan settingan ke CSS Variables (:root)
export const applyGlobalCSSVariables = (settings) => {
  const root = document.documentElement;
  
  if (settings.accentColor) {
    root.style.setProperty('--accent-color', settings.accentColor);
    
    // Menghitung versi redup (transparan) dari hex color untuk shadow/hover
    // (Asumsi input selalu berupa hex 7 karakter seperti #ff3366)
    try {
      const hex = settings.accentColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      root.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
      root.style.setProperty('--accent-color-glow', `rgba(${r}, ${g}, ${b}, 0.5)`);
      root.style.setProperty('--accent-color-faint', `rgba(${r}, ${g}, ${b}, 0.2)`);
    } catch (e) {
      console.error("Gagal mengonversi warna aksen", e);
    }
  }
  
  if (settings.dialogOpacity !== undefined) {
    root.style.setProperty('--dialog-opacity', settings.dialogOpacity / 100);
  }
};

