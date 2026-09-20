// src/engine/components/ChoiceMenu.jsx
import React from 'react';
import { resumePendingAudio } from '../core/audioManager';
import './ChoiceMenu.css';

export function ChoiceMenu({ choices, onSelect }) {
  if (!choices || choices.length === 0) return null;

  return (
    <div className="choice-menu-overlay">
      <div className="choice-list">
        {choices.map((choice, index) => (
          <button
            key={index}
            className="choice-button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent advancing the dialog
              resumePendingAudio();
              onSelect(choice.target);
            }}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
