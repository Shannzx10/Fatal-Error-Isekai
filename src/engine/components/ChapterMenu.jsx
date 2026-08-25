// src/engine/components/ChapterMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getUnlockedChapters, unlockChapter } from '../core/chapterManager';
import { AssetManager } from '../core/assetManager';
import chaptersData from '../../game/chaptersData.json';
import './ChapterMenu.css';

export function ChapterMenu({ onBack, onPlayChapter }) {
  const [unlocked, setUnlocked] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    setUnlocked(getUnlockedChapters());
  }, []);

  const handleChapterClick = (chapter) => {
    if (chapter.isFree || unlocked.includes(chapter.id)) {
      onPlayChapter(chapter.id, chapter.scriptFile);
    } else {
      // TODO: Implementasi Google Play Billing di sini nanti
      const confirmBuy = window.confirm(`Beli ${chapter.subtitle} seharga ${chapter.price}? (Simulasi In-App Purchase)`);
      if (confirmBuy) {
        unlockChapter(chapter.id);
        setUnlocked([...unlocked, chapter.id]);
        alert("Pembelian Berhasil! Chapter Terbuka.");
      }
    }
  };

  return (
    <div className="chapter-menu-container">
      {/* Background Video */}
      <video ref={videoRef} className="menu-bg-video" autoPlay loop muted playsInline>
        <source src={AssetManager.get('home_screen_bg.webm')} type="video/webm" />
      </video>

      {/* Overlay Gelap */}
      <div className="chapter-overlay"></div>

      <div className="chapter-full-layout">
        <div className="chapter-header">
          <h2 className="section-title">CHAPTER SELECTION</h2>
          <button className="chapter-back-btn" onClick={onBack}>
            Kembali
          </button>
        </div>
        
        <div className="chapter-grid">
          {chaptersData.map((chapter) => {
            const isUnlocked = chapter.isFree || unlocked.includes(chapter.id);
            
            return (
              <div 
                key={chapter.id} 
                className={`chapter-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                onClick={() => handleChapterClick(chapter)}
              >
                <div 
                  className="chapter-thumbnail"
                  style={{ backgroundImage: `url(${AssetManager.get(chapter.thumbnail)})` }}
                >
                  {!isUnlocked && <div className="locked-icon">🔒</div>}
                </div>
                <div className="chapter-info">
                  <h3 className="chapter-subtitle">{chapter.subtitle}</h3>
                  <h2 className="chapter-title">{chapter.title}</h2>
                  <div className="chapter-status">
                    {isUnlocked ? (
                      <span className="status-play">▶ PLAY</span>
                    ) : (
                      <span className="status-buy">UNLOCK - {chapter.price}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
