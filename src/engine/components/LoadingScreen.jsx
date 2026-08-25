// src/engine/components/LoadingScreen.jsx
import React, { useRef } from 'react';
import { AssetManager } from '../core/assetManager';
import './LoadingScreen.css';

export function LoadingScreen({ text = "Menyiapkan Dunia..." }) {
  const videoRef = useRef(null);

  return (
    <div className="loading-screen-container">
      {/* Background Video seperti di Main Menu */}
      <video ref={videoRef} className="menu-bg-video" autoPlay loop muted playsInline>
        <source src={AssetManager.get('home_screen_bg.webm')} type="video/webm" />
      </video>

      {/* Overlay Gelap */}
      <div className="loading-overlay"></div>

      {/* Konten Loading di Bawah */}
      <div className="loading-content">
        <div className="loading-text-container">
          <h2 className="loading-title">NOW LOADING</h2>
          <p className="loading-subtitle">{text}</p>
        </div>
        <div className="loading-progress-bar">
          <div className="loading-progress-fill"></div>
        </div>
      </div>
    </div>
  );
}
