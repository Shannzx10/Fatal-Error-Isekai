// src/engine/components/DialogBox.jsx
import React, { useState, useEffect } from 'react';
import { playTypingSFX } from '../core/audioManager';
import './DialogBox.css';

export function DialogBox({ speaker, text, onClick, settings, isAuto, isSkip }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Menerapkan ukuran font berdasarkan setting
  const fontSizeClass = settings?.fontSize ? `font-${settings.fontSize}` : 'font-medium';
  // Jika sedang mode skip, paksa text speed jadi 0 (instan)
  const textSpeed = isSkip ? 0 : (settings?.textSpeed !== undefined ? settings.textSpeed : 30);

  // Efek Pengetikan
  useEffect(() => {
    if (!text) return;

    if (textSpeed === 0) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    
    let i = 0;
    
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      
      if (text[i] !== ' ') {
        playTypingSFX();
      }
      
      i++;
      
      if (i >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, textSpeed);

    return () => clearInterval(timer);
  }, [text, textSpeed]);

  // Efek Mode Auto
  useEffect(() => {
    let autoTimer;
    // Jika mode auto menyala DAN sedang tidak mengetik teks
    if (isAuto && !isTyping && text) {
      // Tunggu beberapa detik (bergantung panjang teks) sebelum lanjut otomatis
      const delay = Math.max(1500, text.length * 50); 
      autoTimer = setTimeout(() => {
        onClick();
      }, delay);
    }
    
    return () => clearTimeout(autoTimer);
  }, [isAuto, isTyping, text, onClick]);

  const handleClick = () => {
    // Jangan izinkan klik manual jika sedang mode Skip
    if (isSkip) return; 

    if (isTyping) {
      // Jika sedang ngetik, klik akan memunculkan semua teks instan
      setDisplayedText(text);
      setIsTyping(false);
    } else {
      // Jika sudah selesai ngetik, klik lanjut ke baris berikutnya
      onClick();
    }
  };

  if (!text) return null;

  return (
    <div className={`dialog-box-container ${fontSizeClass}`} onClick={handleClick}>
      {speaker && <div className="speaker-name">{speaker}</div>}
      <div className="dialog-text">{displayedText}</div>
    </div>
  );
}
