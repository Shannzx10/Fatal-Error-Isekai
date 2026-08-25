// src/engine/components/Sprite.jsx
import React from 'react';
import { AssetManager } from '../core/assetManager';
import './Sprite.css';

export function Sprite({ src, position = 'center', animation = 'none', isActive = true }) {
  if (!src) return null;

  return (
    <div className={`sprite-container pos-${position} anim-${animation} ${isActive ? 'active' : 'inactive'}`}>
      <img src={AssetManager.get(src)} alt="character" className="sprite-image" />
    </div>
  );
}
