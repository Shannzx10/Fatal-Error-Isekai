// src/engine/components/Stage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { AssetManager } from '../core/assetManager';
import './Stage.css';

export function Stage({ background, video, onVideoEnd, enableTransitions = true, children }) {
  const [currentBg, setCurrentBg] = useState(background);
  const [prevBg, setPrevBg] = useState(null);
  const [currentVid, setCurrentVid] = useState(video);
  const [prevVid, setPrevVid] = useState(null);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Fungsi untuk memulai transisi setelah aset siap
    const startTransition = () => {
      if (enableTransitions) {
        setPrevBg(currentBg);
        setPrevVid(currentVid);
        
        setCurrentBg(background);
        setCurrentVid(video);
        setIsTransitioning(true);
        
        // Selesai transisi (misal durasi 500ms)
        const timeout = setTimeout(() => {
          setIsTransitioning(false);
          setPrevBg(null);
          setPrevVid(null);
        }, 500);
        return () => clearTimeout(timeout);
      } else {
        // Jika transisi mati, langsung ganti tanpa animasi
        setCurrentBg(background);
        setCurrentVid(video);
        setPrevBg(null);
        setPrevVid(null);
        setIsTransitioning(false);
      }
    };

    if (background !== currentBg || video !== currentVid) {
      if (background && !video) {
        // Preload gambar agar transisi tidak termakan oleh waktu download
        const img = new Image();
        img.src = AssetManager.get(background);
        img.onload = startTransition;
        img.onerror = startTransition; // Lanjut saja kalau gagal
      } else {
        // Kalau video atau clear background, langsung transisi
        startTransition();
      }
    }
  }, [background, video, currentBg, currentVid, enableTransitions]);

  // Render elemen media (Bisa berupa Gambar atau Video)
  const renderMedia = (bgSource, vidSource, className) => {
    if (vidSource) {
      const resolvedVid = AssetManager.get(vidSource);
      return (
        <video 
          ref={className.includes('stage-bg-new') || (!isTransitioning) ? videoRef : null}
          className={`stage-background ${className}`} 
          src={resolvedVid}
          autoPlay 
          playsInline
          onEnded={onVideoEnd} // Akan memanggil fungsi lanjut otomatis jika disediakan
          loop={!onVideoEnd} // Jika tidak ada fungsi onVideoEnd, anggap sebagai video background (loop)
          style={{ objectFit: 'cover' }}
        />
      );
    } else if (bgSource) {
      const resolvedBg = AssetManager.get(bgSource);
      return (
        <div 
          className={`stage-background ${className}`}
          style={{ backgroundImage: `url(${resolvedBg})` }}
        />
      );
    } else {
      return (
        <div 
          className={`stage-background ${className}`}
          style={{ backgroundColor: '#000' }}
        />
      );
    }
  };

  return (
    <div className="vn-stage">
      {/* Background/Video Lama (untuk crossfade) */}
      {isTransitioning && (prevBg || prevVid || (!prevBg && !prevVid)) && (
        renderMedia(prevBg, prevVid, 'stage-bg-prev')
      )}
      
      {/* Background/Video Baru */}
      {renderMedia(currentBg, currentVid, isTransitioning ? 'stage-bg-new' : '')}
      
      {/* Elemen UI & Karakter (Tidak ikut fade) */}
      <div className="stage-content">
        {children}
      </div>
    </div>
  );
}
