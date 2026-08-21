// src/engine/components/DataMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getSaveData } from '../core/saveManager';
import './DataMenu.css';

export function DataMenu({ mode, inGame, onAction, onBack, onNavigate }) {
  const [saveSlots, setSaveSlots] = useState([]);
  const [activeMode, setActiveMode] = useState(mode); // 'load' atau 'save'
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, slotNum: null, data: null });
  const videoRef = useRef(null);

  const refreshSlots = () => {
    const slots = [1, 2, 3, 4].map(slotNum => {
      const data = getSaveData(slotNum);
      return { slot: slotNum, data };
    });
    setSaveSlots(slots);
  };

  useEffect(() => {
    refreshSlots();
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  const handleSlotClick = (slotInfo) => {
    if (activeMode === 'load') {
      if (!slotInfo.data) return; // Tidak bisa load slot kosong
      setConfirmModal({
        show: true,
        action: 'load',
        slotNum: slotInfo.slot,
        data: slotInfo.data
      });
    } else if (activeMode === 'save') {
      if (!inGame) return; // Tidak bisa save jika tidak sedang main
      setConfirmModal({
        show: true,
        action: 'save',
        slotNum: slotInfo.slot,
        data: slotInfo.data // bisa null (kosong) atau isi (akan ditimpa)
      });
    }
  };

  const executeAction = () => {
    onAction(confirmModal.action, confirmModal.slotNum, confirmModal.data);
    setConfirmModal({ show: false, action: null, slotNum: null, data: null });
    // Beri jeda sedikit sebelum refresh agar animasi tidak putus
    setTimeout(refreshSlots, 100);
  };

  const cancelAction = () => {
    setConfirmModal({ show: false, action: null, slotNum: null, data: null });
  };

  return (
    <div className="data-menu-container">
      {/* Background Video */}
      <video ref={videoRef} className="menu-bg-video" autoPlay loop muted playsInline>
        <source src="/home_screen_bg.webm" type="video/webm" />
      </video>

      {/* Overlay Gelap */}
      <div className="data-overlay"></div>
      
      <div className="data-layout">
        {/* Navigasi Samping Kiri */}
        <div className="data-sidebar">
          <div className="sidebar-top">
            <nav className="sidebar-nav">
              {inGame && (
                <button className="sidebar-btn" onClick={() => onNavigate('playing')}>
                  <span className="btn-text">Lanjutkan</span>
                </button>
              )}
              {!inGame && (
                <button className="sidebar-btn" onClick={() => onNavigate('playing')}>
                  <span className="btn-text">Mulai Game</span>
                </button>
              )}

              {/* Satu tombol gabungan untuk Load/Save */}
              <button className="sidebar-btn active">
                <span className="btn-text">Load/Save Game</span>
              </button>

              <button className="sidebar-btn" onClick={() => onNavigate('setting')}>
                <span className="btn-text">Setting</span>
              </button>
              
              {/* Tombol kembali ke Main Menu (hanya jika di dalam game) */}
              {inGame && (
                <button className="sidebar-btn" onClick={() => onNavigate('menu')}>
                  <span className="btn-text">Main Menu</span>
                </button>
              )}
            </nav>
          </div>

          {/* Tombol kembali ke menu utama ini HANYA TAMPIL jika diakses dari Main Menu (bukan In-Game) */}
          {!inGame && (
            <button className="sidebar-btn back-btn" onClick={onBack}>
              <span className="btn-text">« Kembali</span>
            </button>
          )}
        </div>
        
        {/* Konten Slot Kanan */}
        <div className="data-slots-area">
          <h2 className="section-title">LOAD / SAVE GAME</h2>
          
          <div className="slots-container">
            {saveSlots.map((slotInfo) => {
              // Jika inGame, user bisa Save ATAU Load (klik akan memunculkan pilihan)
              // Jika tidak inGame, user HANYA bisa Load (jika ada data)
              const isClickable = inGame ? true : !!slotInfo.data;
              
              return (
                <button 
                  key={slotInfo.slot} 
                  className={`slot-button ${slotInfo.data ? 'has-data' : 'empty'} ${!isClickable ? 'unclickable' : ''}`}
                  onClick={() => {
                    // Jika di Main Menu, langsung anggap Load
                    if (!inGame) {
                      if (slotInfo.data) {
                        setConfirmModal({
                          show: true,
                          action: 'load',
                          slotNum: slotInfo.slot,
                          data: slotInfo.data
                        });
                      }
                      return;
                    }

                    // Jika In-Game, tawarkan Load atau Save
                    setConfirmModal({
                      show: true,
                      action: 'choose', // Mode khusus untuk memilih Load atau Save
                      slotNum: slotInfo.slot,
                      data: slotInfo.data
                    });
                  }}
                  disabled={!isClickable}
                >
                  <div className="slot-number">No. {slotInfo.slot}</div>
                  <div className="slot-details">
                    {slotInfo.data ? (
                      <>
                        <span className="slot-date">{slotInfo.data.date}</span>
                        <span className="slot-text">"{slotInfo.data.textPreview}"</span>
                      </>
                    ) : (
                      <span className="slot-empty-text">
                        {inGame ? '-- DATA KOSONG (KLIK UNTUK SIMPAN) --' : '-- DATA KOSONG --'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            
            {/* JIKA USER HARUS MEMILIH (Saat In-Game dan klik Slot yang ada isinya) */}
            {confirmModal.action === 'choose' ? (
              <>
                <h3 className="modal-title">Pilih Aksi</h3>
                <p className="modal-text">Apa yang ingin Anda lakukan pada Slot {confirmModal.slotNum}?</p>
                <div className="modal-actions" style={{ flexDirection: 'column' }}>
                  {confirmModal.data && (
                    <button className="modal-btn confirm" onClick={() => setConfirmModal({...confirmModal, action: 'load'})}>
                      MUAT DATA (LOAD)
                    </button>
                  )}
                  <button className="modal-btn confirm" onClick={() => setConfirmModal({...confirmModal, action: 'save'})}>
                    {confirmModal.data ? 'TIMPA DATA (SAVE)' : 'SIMPAN DATA (SAVE)'}
                  </button>
                  <button className="modal-btn cancel" style={{marginTop: '10px'}} onClick={cancelAction}>
                    BATAL
                  </button>
                </div>
              </>
            ) : (
              /* JIKA SUDAH YAKIN LOAD / SAVE */
              <>
                <h3 className="modal-title">Konfirmasi</h3>
                <p className="modal-text">
                  {confirmModal.action === 'load' 
                    ? `Muat data dari Slot ${confirmModal.slotNum}? Progres saat ini yang belum di-save akan hilang.`
                    : confirmModal.data 
                      ? `Timpa data di Slot ${confirmModal.slotNum} dengan progres saat ini?`
                      : `Simpan progres saat ini ke Slot ${confirmModal.slotNum}?`
                  }
                </p>
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={cancelAction}>BATAL</button>
                  <button className="modal-btn confirm" onClick={executeAction}>YA, {confirmModal.action === 'load' ? 'MUAT' : 'SIMPAN'}</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
