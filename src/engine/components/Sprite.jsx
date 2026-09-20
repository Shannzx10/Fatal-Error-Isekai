// src/engine/components/Sprite.jsx
import React, { useState, useEffect } from 'react';
import { AssetManager } from '../core/assetManager';
import './Sprite.css';

export function Sprite({ src, position = 'center', enableTransitions = true, isActive = true }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [prevSrc, setPrevSrc] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const startTransition = () => {
      if (enableTransitions) {
        setPrevSrc(currentSrc);
        setCurrentSrc(src);
        setIsTransitioning(true);
        
        const timeout = setTimeout(() => {
          setIsTransitioning(false);
          setPrevSrc(null);
        }, 300); // 300ms fade duration
        return () => clearTimeout(timeout);
      } else {
        setCurrentSrc(src);
        setPrevSrc(null);
        setIsTransitioning(false);
      }
    };

    if (src !== currentSrc) {
      if (src) {
        // Preload gambar agar transisi tidak terpotong waktu download
        const img = new Image();
        img.src = AssetManager.get(src);
        img.onload = startTransition;
        img.onerror = startTransition;
      } else {
        startTransition();
      }
    }
  }, [src, currentSrc, enableTransitions]);

  return (
    <div className={`sprite-container pos-${position} ${isActive ? 'active' : 'inactive'}`}>
      
      {/* Sprite Lama (Fade Out) */}
      {isTransitioning && prevSrc && (
        <img 
          src={AssetManager.get(prevSrc)} 
          alt="character-prev" 
          className="sprite-image sprite-fade-out" 
        />
      )}
      
      {/* Sprite Baru (Fade In) */}
      {currentSrc && (
        <img 
          src={AssetManager.get(currentSrc)} 
          alt="character" 
          className={`sprite-image ${isTransitioning ? 'sprite-fade-in' : ''}`} 
        />
      )}
      
    </div>
  );
}
