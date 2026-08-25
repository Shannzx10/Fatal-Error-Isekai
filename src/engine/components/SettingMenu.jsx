// src/engine/components/SettingMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getSettings, saveSettings } from '../core/settingsManager';
import { CustomSlider } from './CustomSlider';
import './SettingMenu.css';

export function SettingMenu({ inGame, onBack, onNavigate }) {
  const [settings, setSettings] = useState(getSettings());
  const [isSaved, setIsSaved] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  const handleChange = (key, value) => {
    // Segera update state untuk UI
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Langsung simpan ke localStorage tapi TANPA memicu state isSaved
    saveSettings(newSettings);
  };

  const handleSaveIndicator = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <div className="setting-menu-container">
      {/* Background Video */}
      <video ref={videoRef} className="menu-bg-video" autoPlay loop muted playsInline>
        <source src="/home_screen_bg.webm" type="video/webm" />
      </video>

      <div className="setting-overlay"></div>
      
      <div className="setting-layout">
        {/* Navigasi Samping Kiri */}
        <div className="setting-sidebar">
          <div className="setting-sidebar-top">
            <nav className="setting-sidebar-nav">
              {inGame && (
                <button className="setting-sidebar-btn" onClick={() => onNavigate('playing')}>
                  <span className="btn-text">Lanjutkan</span>
                </button>
              )}
              {!inGame && (
                <button className="setting-sidebar-btn" onClick={() => onNavigate('playing')}>
                  <span className="btn-text">Mulai Game</span>
                </button>
              )}

              <button className="setting-sidebar-btn" onClick={() => onNavigate('data')}>
                <span className="btn-text">Load/Save Game</span>
              </button>

              <button className="setting-sidebar-btn" onClick={() => onNavigate('collection')}>
                <span className="btn-text">Gallery & Ending</span>
              </button>

              <button className="setting-sidebar-btn active">
                <span className="btn-text">Setting</span>
              </button>
              
              {inGame && (
                <button className="setting-sidebar-btn" onClick={() => onNavigate('menu')}>
                  <span className="btn-text">Main Menu</span>
                </button>
              )}
            </nav>
          </div>

          {!inGame && (
            <button className="setting-sidebar-btn back-btn" onClick={onBack}>
              <span className="btn-text">Kembali</span>
            </button>
          )}
        </div>
        
        {/* Konten Kanan */}
        <div className="setting-content-area">
          <div className="setting-header">
            <h2 className="setting-section-title">PENGATURAN</h2>
            {isSaved && <span className="save-indicator">Tersimpan!</span>}
          </div>
          
          <div className="setting-options">
            
            {/* --- KELOMPOK PENAMPILAN (APPEARANCE) --- */}
            <div className="setting-group">
              <h3 className="group-title">Penampilan (Appearance)</h3>
              
              <div className="setting-item">
                <label>Warna Aksen</label>
                <div className="setting-controls" style={{ gap: '15px' }}>
                  {/* Preset Warna-warni Cyberpunk/Modern */}
                  <button 
                    className={`color-btn ${settings.accentColor === '#ff3366' ? 'active' : ''}`}
                    style={{ backgroundColor: '#ff3366' }}
                    onClick={() => { handleChange('accentColor', '#ff3366'); handleSaveIndicator(); }}
                    title="Pink"
                  ></button>
                  <button 
                    className={`color-btn ${settings.accentColor === '#00ffcc' ? 'active' : ''}`}
                    style={{ backgroundColor: '#00ffcc' }}
                    onClick={() => { handleChange('accentColor', '#00ffcc'); handleSaveIndicator(); }}
                    title="Cyan"
                  ></button>
                  <button 
                    className={`color-btn ${settings.accentColor === '#bf00ff' ? 'active' : ''}`}
                    style={{ backgroundColor: '#bf00ff' }}
                    onClick={() => { handleChange('accentColor', '#bf00ff'); handleSaveIndicator(); }}
                    title="Purple"
                  ></button>
                  <button 
                    className={`color-btn ${settings.accentColor === '#ffcc00' ? 'active' : ''}`}
                    style={{ backgroundColor: '#ffcc00' }}
                    onClick={() => { handleChange('accentColor', '#ffcc00'); handleSaveIndicator(); }}
                    title="Yellow"
                  ></button>
                  <button 
                    className={`color-btn ${settings.accentColor === '#ff3300' ? 'active' : ''}`}
                    style={{ backgroundColor: '#ff3300' }}
                    onClick={() => { handleChange('accentColor', '#ff3300'); handleSaveIndicator(); }}
                    title="Orange"
                  ></button>
                </div>
              </div>

              <div className="setting-item">
                <label>Transparansi Kotak Dialog</label>
                <div className="setting-controls slider-container">
                  <CustomSlider 
                    min={20} max={100} step={5}
                    value={settings.dialogOpacity}
                    onChange={(val) => handleChange('dialogOpacity', val)}
                    onRelease={handleSaveIndicator}
                  />
                  <span className="slider-value">{settings.dialogOpacity}%</span>
                </div>
              </div>
            </div>

            {/* --- KELOMPOK TEKS --- */}
            <div className="setting-group">
              <h3 className="group-title">Teks & Dialog</h3>
              
              <div className="setting-item">
                <label>Ukuran Font</label>
                <div className="setting-controls">
                  <button 
                    className={`setting-opt-btn ${settings.fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => { handleChange('fontSize', 'small'); handleSaveIndicator(); }}
                  >Kecil</button>
                  <button 
                    className={`setting-opt-btn ${settings.fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => { handleChange('fontSize', 'medium'); handleSaveIndicator(); }}
                  >Sedang</button>
                  <button 
                    className={`setting-opt-btn ${settings.fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => { handleChange('fontSize', 'large'); handleSaveIndicator(); }}
                  >Besar</button>
                </div>
              </div>

              <div className="setting-item">
                <label>Transisi & Efek</label>
                <div className="setting-controls">
                  <button 
                    className={`setting-opt-btn ${settings.enableTransitions === true ? 'active' : ''}`}
                    onClick={() => { handleChange('enableTransitions', true); handleSaveIndicator(); }}
                  >Aktif</button>
                  <button 
                    className={`setting-opt-btn ${settings.enableTransitions === false ? 'active' : ''}`}
                    onClick={() => { handleChange('enableTransitions', false); handleSaveIndicator(); }}
                  >Mati</button>
                </div>
              </div>

              <div className="setting-item">
                <label>Kecepatan Teks (ms)</label>
                <div className="setting-controls slider-container">
                  <CustomSlider 
                    min={0} max={100} step={10}
                    value={settings.textSpeed}
                    onChange={(val) => handleChange('textSpeed', val)}
                    onRelease={handleSaveIndicator}
                  />
                  <span className="slider-value">{settings.textSpeed === 0 ? 'Instan' : settings.textSpeed}</span>
                </div>
              </div>
            </div>

            {/* --- KELOMPOK AUDIO --- */}
            <div className="setting-group">
              <h3 className="group-title">Audio</h3>
              
              <div className="setting-item">
                <label>Master Volume</label>
                <div className="setting-controls slider-container">
                  <CustomSlider 
                    min={0} max={100} step={1}
                    value={settings.masterVolume}
                    onChange={(val) => handleChange('masterVolume', val)}
                    onRelease={handleSaveIndicator}
                  />
                  <span className="slider-value">{settings.masterVolume}%</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Musik Latar (BGM)</label>
                <div className="setting-controls slider-container">
                  <CustomSlider 
                    min={0} max={100} step={1}
                    value={settings.bgmVolume}
                    onChange={(val) => handleChange('bgmVolume', val)}
                    onRelease={handleSaveIndicator}
                  />
                  <span className="slider-value">{settings.bgmVolume}%</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Efek Suara (SFX)</label>
                <div className="setting-controls slider-container">
                  <CustomSlider 
                    min={0} max={100} step={1}
                    value={settings.sfxVolume}
                    onChange={(val) => handleChange('sfxVolume', val)}
                    onRelease={handleSaveIndicator}
                  />
                  <span className="slider-value">{settings.sfxVolume}%</span>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Suara Karakter (Voice)</label>
                <div className="setting-controls slider-container">
                  <CustomSlider 
                    min={0} max={100} step={1}
                    value={settings.voiceVolume !== undefined ? settings.voiceVolume : 100}
                    onChange={(val) => handleChange('voiceVolume', val)}
                    onRelease={handleSaveIndicator}
                  />
                  <span className="slider-value">{settings.voiceVolume !== undefined ? settings.voiceVolume : 100}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

