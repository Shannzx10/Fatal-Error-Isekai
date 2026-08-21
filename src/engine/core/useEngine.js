// src/engine/core/useEngine.js
import { useState, useCallback, useEffect } from 'react';

export function useEngine(script) {
  const [currentSceneId, setCurrentSceneId] = useState('start');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  // State untuk Backlog
  const [history, setHistory] = useState([]);
  
  // State untuk Auto & Skip
  const [isAuto, setIsAuto] = useState(false);
  const [isSkip, setIsSkip] = useState(false);

  const currentScene = script[currentSceneId];
  const currentLine = currentScene ? currentScene.lines[currentLineIndex] : null;

  // Catat riwayat setiap kali baris dialog berubah
  useEffect(() => {
    if (currentLine && currentLine.text) {
      setHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].text === currentLine.text && prev[prev.length - 1].speaker === currentLine.speaker) {
          return prev;
        }
        return [...prev, { speaker: currentLine.speaker, text: currentLine.text }];
      });
    }
    
    // Matikan Auto & Skip jika menemui percabangan pilihan (Choice)
    if (currentLine && currentLine.choices) {
      setIsAuto(false);
      setIsSkip(false);
    }
  }, [currentLine]);

  const nextLine = useCallback(() => {
    if (!currentScene) return;

    if (currentLineIndex < currentScene.lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1);
    } else if (currentScene.nextScene) {
      setCurrentSceneId(currentScene.nextScene);
      setCurrentLineIndex(0);
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
  };
}
