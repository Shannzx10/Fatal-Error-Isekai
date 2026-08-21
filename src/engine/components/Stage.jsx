// src/engine/components/Stage.jsx
import React from 'react';
import './Stage.css';

export function Stage({ background, children }) {
  const bgStyle = background
    ? { backgroundImage: `url(${background})` }
    : { backgroundColor: '#000' };

  return (
    <div className="vn-stage" style={bgStyle}>
      {children}
    </div>
  );
}
