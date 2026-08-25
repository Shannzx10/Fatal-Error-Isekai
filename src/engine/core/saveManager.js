// src/engine/core/saveManager.js
const SAVE_PREFIX = 'fei_save_slot_';
const AUTOSAVE_KEY = 'fei_autosave_dev'; // Khusus untuk mencegah hilang progress saat browser refresh

export const getSaveData = (slot) => {
  try {
    const data = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load save data", e);
    return null;
  }
};

export const saveGameData = (slot, sceneId, lineIndex, textPreview) => {
  try {
    const data = {
      sceneId,
      lineIndex,
      textPreview: textPreview.length > 30 ? textPreview.substring(0, 30) + '...' : textPreview,
      date: new Date().toLocaleString('id-ID', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    };
    localStorage.setItem(`${SAVE_PREFIX}${slot}`, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Failed to save game data", e);
    return false;
  }
};

// --- Fungsi Auto-Save untuk Development & Player ---
export const saveAutoSave = (sceneId, lineIndex) => {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ sceneId, lineIndex }));
  } catch(e) {
    // Abaikan jika error (misal storage penuh/private mode)
  }
};

export const getAutoSave = () => {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch(e) {
    return null;
  }
};

export const clearAutoSave = () => {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch(e) {}
};
