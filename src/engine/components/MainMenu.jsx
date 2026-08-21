// src/engine/components/MainMenu.jsx
import React, { useRef, useEffect } from 'react';
import './MainMenu.css';

export function MainMenu({ onStart, onLoad, onSettings, onExit }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8; // Sedikit dilambatkan jika perlu
    }
  }, []);

  return (
    <div className="main-menu-container">
      {/* Background Video */}
      <video 
        ref={videoRef}
        className="menu-bg-video"
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/home_screen_bg.webm" type="video/webm" />
        {/* Fallback color/image jika video gagal load diurus oleh CSS */}
      </video>

      {/* Overlay Gelap agar teks terbaca */}
      <div className="menu-overlay"></div>

      <div className="menu-content">
        <h1 className="game-title">
          <span className="title-fatal">Fatal Error:</span>
          <span className="title-isekai">Isekai</span>
        </h1>
        
        <nav className="menu-nav">
          <button className="menu-btn" onClick={onStart}>
            <span className="btn-text">Mulai Game</span>
          </button>
          <button className="menu-btn" onClick={onLoad}>
            <span className="btn-text">Load/Save Game</span>
          </button>
          <button className="menu-btn" onClick={onSettings}>
            <span className="btn-text">Setting</span>
          </button>
          <button className="menu-btn" onClick={onExit}>
            <span className="btn-text">Exit</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
