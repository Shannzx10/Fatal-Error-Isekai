// src/engine/components/CollectionMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getUnlockedCollections } from '../core/collectionManager';
import { AssetManager } from '../core/assetManager';
import collectionsData from '../../game/collectionsData.json';
import './CollectionMenu.css';

export function CollectionMenu({ inGame, onBack, onNavigate }) {
  const [unlocked, setUnlocked] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    setUnlocked(getUnlockedCollections());
  }, []);

  return (
    <div className="collection-menu-container">
      {/* Background Video */}
      <video ref={videoRef} className="menu-bg-video" autoPlay loop muted playsInline>
        <source src={AssetManager.get('home_screen_bg.webm')} type="video/webm" />
      </video>

      {/* Overlay Gelap */}
      <div className="collection-overlay"></div>

      <div className="collection-layout">
        {/* ==================== SIDEBAR KIRI ==================== */}
        <div className="collection-sidebar">
          <div className="sidebar-top">
            <h1 className="collection-main-title">
              <span className="title-fatal">Fatal Error:</span>
              <span className="title-isekai">Isekai</span>
            </h1>
            <nav className="sidebar-nav">
              {inGame && (
                <button className="collection-sidebar-btn" onClick={() => onNavigate('playing')}>
                  <span className="btn-text">Lanjutkan</span>
                </button>
              )}
              {!inGame && (
                <button className="collection-sidebar-btn" onClick={() => onNavigate('playing')}>
                  <span className="btn-text">Mulai Game</span>
                </button>
              )}

              <button className="collection-sidebar-btn" onClick={() => onNavigate('data')}>
                <span className="btn-text">Load/Save Game</span>
              </button>

              <button className="collection-sidebar-btn active">
                <span className="btn-text">Gallery & Ending</span>
              </button>

              <button className="collection-sidebar-btn" onClick={() => onNavigate('setting')}>
                <span className="btn-text">Setting</span>
              </button>
              
              {inGame && (
                <button className="collection-sidebar-btn" onClick={() => onNavigate('menu')}>
                  <span className="btn-text">Main Menu</span>
                </button>
              )}
            </nav>
          </div>

          {!inGame && (
            <button className="collection-sidebar-btn back-btn" onClick={onBack}>
              <span className="btn-text">Kembali</span>
            </button>
          )}
        </div>

        {/* ==================== KONTEN KANAN ==================== */}
        <div className="collection-content-area">
          <h2 className="section-title">Koleksi Terbuka: {unlocked.length}/{collectionsData.length}</h2>
          
          <div className="collection-grid">
            {collectionsData.map((item) => {
              const isUnlocked = unlocked.includes(item.id);
              
              return (
                <div key={item.id} className={`collection-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div 
                    className="collection-thumbnail"
                    style={{ 
                      backgroundImage: isUnlocked ? `url(${AssetManager.get(item.thumbnail)})` : 'none',
                      backgroundColor: isUnlocked ? 'transparent' : '#111'
                    }}
                  >
                    {!isUnlocked && <div className="locked-icon">🔒</div>}
                  </div>
                  <div className="collection-info">
                    <p className="collection-name">
                      {isUnlocked ? item.title : '???'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
