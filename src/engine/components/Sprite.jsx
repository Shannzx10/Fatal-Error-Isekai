// src/engine/components/Sprite.jsx
import React from 'react';
import './Sprite.css';

export function Sprite({ src, position = 'center', animation = 'none' }) {
  if (!src) return null;

  return (
    <div className={`sprite-container pos-${position} anim-${animation}`}>
      <img src={src} alt="character" className="sprite-image" />
    </div>
  );
}
