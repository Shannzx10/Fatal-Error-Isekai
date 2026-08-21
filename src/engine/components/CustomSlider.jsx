// src/engine/components/CustomSlider.jsx
import React, { useRef, useState, useEffect } from 'react';
import './CustomSlider.css';

export function CustomSlider({ min, max, step = 1, value, onChange, onRelease }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Menghitung persentase untuk posisi thumb dan warna track
  const percentage = ((value - min) / (max - min)) * 100;

  const handlePointerDown = (e) => {
    setIsDragging(true);
    
    // Deteksi sentuhan (touch) vs mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    updateValue(clientX, clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    updateValue(clientX, clientY);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (onRelease) onRelease(); // Panggil fungsi saat dilepas (misal: memunculkan "Tersimpan")
    }
  };

  const updateValue = (clientX, clientY) => {
    if (!trackRef.current) return;
    
    // Ambil koordinat aslinya (BoundingClient) dari kotak Slider tersebut di layar
    const rect = trackRef.current.getBoundingClientRect();
    
    // Karena Anda merotasi layar memakai transform: rotate(90deg) di HP Portrait, 
    // sistem koordinat 'clientX' dan 'rect.left' bawaan browser akan rusak/tidak selaras.
    // Kita harus mendeteksi apakah layar sedang dirotasi via CSS (trik di App.css).
    
    let newPercentage = 0;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    
    if (isPortrait) {
      // Jika diputar 90 derajat, lebar visual menjadi tinggi aslinya (rect.height)
      // dan pergerakan jari mendatar (X) di layar asli menjadi pergerakan vertikal (Y) bagi elemen
      // Karena rotasinya searah jarum jam (90deg), sumbu X menjadi Y.
      newPercentage = ((clientY - rect.top) / rect.height) * 100;
    } else {
      // Perilaku Normal Desktop / HP Landscape sungguhan
      newPercentage = ((clientX - rect.left) / rect.width) * 100;
    }
    
    // Batasi antara 0% - 100%
    newPercentage = Math.max(0, Math.min(100, newPercentage));
    
    // Hitung nilai asli berdasarkan persentase
    let newValue = (newPercentage / 100) * (max - min) + min;
    
    // Terapkan 'step' (loncatan) jika ada
    newValue = Math.round(newValue / step) * step;
    
    onChange(newValue);
  };

  // Event listener global agar saat jari keluar dari slider tetap bisa digeser
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchend', handlePointerUp);
    } else {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="custom-slider-container"
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      <div className="custom-slider-track" ref={trackRef}>
        {/* Fill color dari kiri ke posisi thumb */}
        <div className="custom-slider-fill" style={{ width: `${percentage}%` }}></div>
        {/* Thumb (Bantalan Bulat) */}
        <div 
          className={`custom-slider-thumb ${isDragging ? 'active' : ''}`}
          style={{ left: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
