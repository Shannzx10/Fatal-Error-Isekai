// src/engine/core/useEngine.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { playBGM, stopBGM, playSFX, playVoice, stopVoice, resumePendingAudio } from './audioManager';
import { saveAutoSave, clearAutoSave, getAutoSave } from './saveManager';
import { unlockCollection } from './collectionManager';
import collectionsData from '../../game/collectionsData.json';

export function useEngine(script) {
  // Ambil state awal dari autosave jika ada
  const initialSave = getAutoSave();
  
  const [currentSceneId, setCurrentSceneId] = useState(initialSave ? initialSave.sceneId : 'start');
  const [currentLineIndex, setCurrentLineIndex] = useState(initialSave ? initialSave.lineIndex : 0);
  
  const isInitialMount = useRef(true);

  // State untuk Backlog
  const [history, setHistory] = useState([]);
  
  // State untuk Auto & Skip
  const [isAuto, setIsAuto] = useState(false);
  const [isSkip, setIsSkip] = useState(false);

  // State untuk Notifikasi Unlock Collection & Data Ending
  const [unlockNotification, setUnlockNotification] = useState(null);
  const [achievedEnding, setAchievedEnding] = useState(null);

  const currentScene = script[currentSceneId];
  const currentLine = currentScene ? currentScene.lines[currentLineIndex] : null;

  // Fungsi untuk mendapatkan visual yang persisten dengan melacak mundur dalam scene
  const getPersistentVisuals = useCallback(() => {
    let bg = null, video = null;
    let spriteLeft = null, spriteCenter = null, spriteRight = null;
    let activeSlot = 'center'; // Melacak siapa yang sedang bicara
    
    // Dictionary sederhana untuk mengingat karakter mana ada di slot mana
    const speakerToSlot = {};
    
    if (currentScene && currentScene.lines) {
      // Pastikan kita tidak melampaui batas index array
      const maxIndex = Math.min(currentLineIndex, currentScene.lines.length - 1);
      for (let i = 0; i <= maxIndex; i++) {
        const line = currentScene.lines[i];
        if (line.bg !== undefined) bg = line.bg;
        if (line.video !== undefined) video = line.video;
        
        // Kompatibilitas mundur
        if (line.sprite !== undefined) {
          const pos = line.spritePos || 'center';
          if (pos === 'left') spriteLeft = line.sprite;
          if (pos === 'center') spriteCenter = line.sprite;
          if (pos === 'right') spriteRight = line.sprite;
          
          if (line.speaker && line.sprite !== 'clear') {
            speakerToSlot[line.speaker] = pos;
          }
        }
        
        if (line.spriteLeft !== undefined) {
          spriteLeft = line.spriteLeft;
          if (line.speaker && spriteLeft !== 'clear') speakerToSlot[line.speaker] = 'left';
        }
        if (line.spriteCenter !== undefined) {
          spriteCenter = line.spriteCenter;
          if (line.speaker && spriteCenter !== 'clear') speakerToSlot[line.speaker] = 'center';
        }
        if (line.spriteRight !== undefined) {
          spriteRight = line.spriteRight;
          if (line.speaker && spriteRight !== 'clear') speakerToSlot[line.speaker] = 'right';
        }

        // Tentukan siapa yang aktif di baris ini
        if (line.speaker) {
          if (speakerToSlot[line.speaker]) {
            activeSlot = speakerToSlot[line.speaker];
          } else {
            // Jika tidak ada di memory, default ke tengah
            activeSlot = 'center'; 
          }
        } else {
          // Jika narator (tanpa speaker), semua sprite bisa redup, atau tetap seperti sebelumnya
          activeSlot = null; 
        }
      }
    }
    
    return { 
      activeBg: bg === 'clear' ? null : bg, 
      activeVideo: video === 'clear' ? null : video, 
      activeSpriteLeft: spriteLeft === 'clear' ? null : spriteLeft,
      activeSpriteCenter: spriteCenter === 'clear' ? null : spriteCenter,
      activeSpriteRight: spriteRight === 'clear' ? null : spriteRight,
      activeSlot
    };
  }, [currentScene, currentLineIndex]);

  const visuals = getPersistentVisuals();

  // Catat riwayat setiap kali baris dialog berubah
  useEffect(() => {
    if (!currentLine) return;

    // --- LOGIKA BGM ---
    if (currentLine.bgm) {
      if (currentLine.bgm === 'stop') {
        stopBGM();
      } else {
        playBGM(currentLine.bgm);
      }
    }

    // --- LOGIKA SFX ---
    if (currentLine.sfx) {
      playSFX(currentLine.sfx);
    }

    // --- LOGIKA VOICE (Suara Karakter) ---
    if (currentLine.voice) {
      if (currentLine.voice === 'stop') {
        stopVoice();
      } else {
        playVoice(currentLine.voice);
      }
    } else {
      // Hentikan suara karakter sebelumnya jika baris baru tidak punya voice
      // (Bisa dihapus jika Anda ingin suaranya nyambung walau teks sudah diklik)
      stopVoice();
    }

    // --- LOGIKA COLLECTION UNLOCK ---
    if (currentLine.unlockCollection) {
      const isNew = unlockCollection(currentLine.unlockCollection);
      
      // Ambil data collection untuk notifikasi dan ending screen
      const collectionItem = collectionsData.find(c => c.id === currentLine.unlockCollection);
      
      if (collectionItem) {
        if (isNew) {
          // Trigger notifikasi jika benar-benar baru terbuka
          setUnlockNotification(collectionItem);
          
          // Hilangkan notifikasi setelah 4 detik
          setTimeout(() => {
            setUnlockNotification(null);
          }, 4000);
        }
        
        // Simpan data ending jika tipe-nya ending (untuk ditampilkan di layar akhir)
        if (collectionItem.type === 'ending') {
          setAchievedEnding(collectionItem);
        }
      }
    }

    if (currentLine.text) {
      setHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].text === currentLine.text && prev[prev.length - 1].speaker === currentLine.speaker) {
          return prev;
        }
        return [...prev, { speaker: currentLine.speaker, text: currentLine.text }];
      });
    }

    // Hindari save saat render pertama kali, biarkan interaksi player yang trigger
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      // Auto-save setiap kali baris berubah agar tidak hilang saat browser ke-refresh
      saveAutoSave(currentSceneId, currentLineIndex);
    }
    
  }, [currentLine, currentSceneId, currentLineIndex]);

  const nextLine = useCallback(() => {
    resumePendingAudio(); // Paksa jalankan audio yang tertahan kebijakan autoplay browser

    if (!currentScene) return;

    if (currentLineIndex < currentScene.lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1);
    } else if (currentScene.nextScene) {
      setCurrentSceneId(currentScene.nextScene);
      setCurrentLineIndex(0);
    } else {
      // Jika di baris terakhir dan tidak ada nextScene, berarti game tamat
      setCurrentLineIndex((prev) => prev + 1);
    }
  }, [currentScene, currentLineIndex]);

  const makeChoice = useCallback((targetSceneId) => {
    setHistory(prev => [...prev, { speaker: 'Anda', text: `>> Memilih opsi cerita... <<`, isChoice: true }]);
    setCurrentSceneId(targetSceneId);
    setCurrentLineIndex(0);
  }, []);

  const jumpTo = useCallback((sceneId) => {
    setCurrentSceneId(sceneId);
    setCurrentLineIndex(0);
  }, []);
  
  const loadState = useCallback((sceneId, lineIndex) => {
    setCurrentSceneId(sceneId);
    setCurrentLineIndex(lineIndex);
    setHistory([]);
    setIsAuto(false);
    setIsSkip(false);
  }, []);

  const resetGame = useCallback(() => {
    setCurrentSceneId('start');
    setCurrentLineIndex(0);
    setHistory([]); 
    setIsAuto(false);
    setIsSkip(false);
    setAchievedEnding(null);
    setUnlockNotification(null);
    stopBGM();
    stopVoice();
    clearAutoSave(); // Bersihkan auto-save saat pemain kembali ke Main Menu secara sengaja
  }, []);

  const toggleAuto = useCallback(() => {
    setIsAuto(prev => !prev);
    setIsSkip(false); // Matikan skip jika auto nyala
  }, []);

  const toggleSkip = useCallback(() => {
    setIsSkip(prev => !prev);
    setIsAuto(false); // Matikan auto jika skip nyala
  }, []);

  // Effect untuk menjalankan Auto dan Skip
  useEffect(() => {
    let timer;
    if (isSkip && currentLine && !currentLine.choices && currentScene) {
      // Skip melompat sangat cepat (misal 100ms per baris)
      timer = setTimeout(nextLine, 100);
    }
    return () => clearTimeout(timer);
  }, [isSkip, currentLineIndex, currentSceneId, nextLine, currentLine, currentScene]);
  // Auto Mode akan di-trigger dari dalam DialogBox.jsx karena dia butuh tahu kapan teks SELESAI diketik.

  return {
    currentSceneId,
    currentLineIndex,
    currentLine,
    visuals,
    history,
    nextLine,
    makeChoice,
    jumpTo,
    loadState,
    resetGame,
    isAuto,
    isSkip,
    toggleAuto,
    toggleSkip,
    isEnd: !currentLine && !currentScene?.nextScene,
    unlockNotification,
    achievedEnding,
  };
}
