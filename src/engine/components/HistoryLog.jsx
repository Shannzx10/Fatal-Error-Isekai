// src/engine/components/HistoryLog.jsx
import React, { useEffect, useRef } from 'react';
import './HistoryLog.css';

export function HistoryLog({ history, onClose }) {
  const endOfLogRef = useRef(null);

  // Otomatis scroll ke paling bawah saat pertama kali dibuka
  useEffect(() => {
    if (endOfLogRef.current) {
      endOfLogRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  return (
    <div className="history-overlay">
      <div className="history-container">
        <div className="history-header">
          <h2 className="history-title">RIWAYAT PERCAKAPAN</h2>
          <button className="history-close-btn" onClick={onClose}>TUTUP [X]</button>
        </div>
        
        <div className="history-content">
          {history.length === 0 ? (
            <div className="history-empty">Belum ada percakapan.</div>
          ) : (
            history.map((item, index) => (
              <div key={index} className={`history-item ${item.isChoice ? 'history-choice' : ''}`}>
                {item.speaker && <div className="history-speaker">{item.speaker}</div>}
                <div className="history-text">{item.text}</div>
              </div>
            ))
          )}
          {/* Elemen kosong untuk target autoscroll */}
          <div ref={endOfLogRef} style={{ float:"left", clear: "both" }}></div>
        </div>
      </div>
    </div>
  );
}
