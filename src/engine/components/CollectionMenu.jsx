import React, { useState, useEffect, useRef } from 'react';
import { getUnlockedCollections } from '../core/collectionManager';
import { AssetManager } from '../core/assetManager';
import collectionsData from '../../game/collectionsData.json';
import './CollectionMenu.css';

export function CollectionMenu({ inGame, onBack, onNavigate }) {
  const [unlocked, setUnlocked] = useState([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setUnlocked(getUnlockedCollections());
  }, []);

  const openLightbox = (index) => {
    if (unlocked.includes(collectionsData[index].id)) {
      setSelectedImageIdx(index);
    }
  };

  const closeLightbox = () => {
    setSelectedImageIdx(null);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    let nextIdx = selectedImageIdx + 1;
    while (nextIdx < collectionsData.length && !unlocked.includes(collectionsData[nextIdx].id)) {
      nextIdx++;
    }
    if (nextIdx < collectionsData.length) {
      setSelectedImageIdx(nextIdx);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    let prevIdx = selectedImageIdx - 1;
    while (prevIdx >= 0 && !unlocked.includes(collectionsData[prevIdx].id)) {
      prevIdx--;
    }
    if (prevIdx >= 0) {
      setSelectedImageIdx(prevIdx);
    }
  };

  let hasNext = false;
  if (selectedImageIdx !== null) {
    for (let i = selectedImageIdx + 1; i < collectionsData.length; i++) {
      if (unlocked.includes(collectionsData[i].id)) { hasNext = true; break; }
    }
  }

  let hasPrev = false;
  if (selectedImageIdx !== null) {
    for (let i = selectedImageIdx - 1; i >= 0; i--) {
      if (unlocked.includes(collectionsData[i].id)) { hasPrev = true; break; }
    }
  }

  return (
    <div className="collection-menu-container">
      {/* Background Video */}
      <video ref={videoRef} className="menu-bg-video" autoPlay loop muted playsInline>
        <source src={AssetManager.get('home_screen_bg.webm')} type="video/webm" />
      </video>

      {/* Overlay Gelap */}
      <div className="collection-overlay"></div>

      <div className="collection-layout">
        {/* SIDEBAR KIRI */}
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

        {/* KONTEN KANAN */}
        <div className="collection-content-area">
          <h2 className="section-title">Koleksi Terbuka: {unlocked.length}/{collectionsData.length}</h2>
          
          <div className="collection-grid">
            {collectionsData.map((item, index) => {
              const isUnlocked = unlocked.includes(item.id);
              
              return (
                <div 
                  key={item.id} 
                  className={`collection-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  onClick={() => openLightbox(index)}
                  style={{ cursor: isUnlocked ? 'pointer' : 'default' }}
                >
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

      {/* LIGHTBOX / FULL VIEW */}
      {selectedImageIdx !== null && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content-wrapper">
            <button className="lightbox-close" onClick={closeLightbox}>X</button>
            <div 
              className="lightbox-image"
              style={{ backgroundImage: `url(${AssetManager.get(collectionsData[selectedImageIdx].thumbnail)})` }}
            />
            <h2 className="lightbox-title">{collectionsData[selectedImageIdx].title}</h2>
            
            <div className="lightbox-controls">
              {hasPrev ? (
                <button className="lightbox-btn" onClick={prevImage}>&lt; SEBELUMNYA</button>
              ) : (
                <div className="lightbox-btn-placeholder"></div>
              )}
              
              {hasNext ? (
                <button className="lightbox-btn" onClick={nextImage}>SELANJUTNYA &gt;</button>
              ) : (
                <div className="lightbox-btn-placeholder"></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
