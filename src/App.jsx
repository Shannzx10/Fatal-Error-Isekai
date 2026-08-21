import React, { useState, useEffect } from 'react';
import { useEngine, Stage, DialogBox, ChoiceMenu, Sprite, MainMenu, DataMenu, SettingMenu, HistoryLog, saveGameData, getSettings, updateAudioSettings } from './engine';
import storyData from './game/scripts/story.json';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('menu'); 
  const [globalSettings, setGlobalSettings] = useState(getSettings());
  const [showHistory, setShowHistory] = useState(false);

  // Pastikan audio sync saat pertama kali dimuat
  useEffect(() => {
    updateAudioSettings(globalSettings);
  }, []);

  const {
    currentSceneId,
    currentLineIndex,
    currentLine,
    history,
    nextLine,
    makeChoice,
    loadState,
    resetGame,
    isAuto,
    isSkip,
    toggleAuto,
    toggleSkip,
    isEnd
  } = useEngine(storyData);

  const startGame = () => {
    resetGame();
    setShowHistory(false);
    setGameState('playing');
  };

  const handleGlobalNavigation = (destination) => {
    if (destination === 'playing') {
      if (gameState === 'menu' || isEnd) {
        startGame(); 
      } else {
        setGameState('playing'); 
      }
    } else if (destination === 'exit') {
      alert("Fitur Exit belum diimplementasi (Biasanya hanya menutup app di Android)");
    } else {
      setGameState(destination); 
    }
  };

  const handleDataAction = (actionType, slotNumber, data) => {
    if (actionType === 'load') {
      if (data) {
        loadState(data.sceneId, data.lineIndex);
        setShowHistory(false);
        setGameState('playing');
      }
    } else if (actionType === 'save') {
      const textPreview = currentLine?.text || '...';
      saveGameData(slotNumber, currentSceneId, currentLineIndex, textPreview);
    }
  };

  const isActuallyInGame = (gameState === 'playing' || gameState === 'data' || gameState === 'setting') && currentLineIndex !== undefined && currentLineIndex >= 0 && !isEnd && currentSceneId !== 'start' || (currentSceneId === 'start' && currentLineIndex > 0);

  return (
    <div className="game-container">
      {gameState === 'menu' && (
        <MainMenu 
          onStart={startGame}
          onLoad={() => handleGlobalNavigation('data')}
          onSettings={() => handleGlobalNavigation('setting')}
          onExit={() => handleGlobalNavigation('exit')}
        />
      )}

      {gameState === 'data' && (
        <DataMenu 
          inGame={isActuallyInGame}
          onAction={handleDataAction}
          onBack={() => setGameState(isActuallyInGame ? 'playing' : 'menu')} 
          onNavigate={handleGlobalNavigation}
        />
      )}

      {gameState === 'setting' && (
        <SettingMenu 
          inGame={isActuallyInGame}
          onBack={() => { 
            setGameState(isActuallyInGame ? 'playing' : 'menu');
            const newSettings = getSettings();
            setGlobalSettings(newSettings); 
            updateAudioSettings(newSettings);
          }}
          onNavigate={(dest) => {
            handleGlobalNavigation(dest);
            const newSettings = getSettings();
            setGlobalSettings(newSettings); 
            updateAudioSettings(newSettings);
          }}
        />
      )}

      {gameState === 'playing' && (
        <>
          {/* Grup Tombol In-Game Kanan Atas */}
          <div className="ingame-menu-container">
            {/* Tombol Skip */}
            <button 
              className={`ingame-menu-btn ${isSkip ? 'active' : ''}`}
              onClick={toggleSkip} 
              title="Lewati Percakapan"
            >
              SKIP
            </button>

            {/* Tombol Auto */}
            <button 
              className={`ingame-menu-btn ${isAuto ? 'active' : ''}`}
              onClick={toggleAuto} 
              title="Jalan Otomatis"
            >
              AUTO
            </button>

            {/* Tombol Backlog (History) */}
            <button 
              className="ingame-menu-btn" 
              onClick={() => setShowHistory(true)} 
              title="Log Percakapan"
            >
              LOG
            </button>

            {/* Tombol Menu Utama */}
            <button 
              className="ingame-menu-btn icon-btn" 
              onClick={() => setGameState('data')} 
              title="Menu"
            >
              ||
            </button>
          </div>

          {showHistory && (
            <HistoryLog history={history} onClose={() => setShowHistory(false)} />
          )}

          {isEnd ? (
            <div className="end-screen">
              <h1>THE END</h1>
              <button onClick={() => setGameState('menu')} style={{marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer'}}>Kembali ke Menu</button>
            </div>
          ) : currentLine && !showHistory ? (
            <Stage background={currentLine.bg}>
              
              {currentLine.sprite && (
                 <Sprite src={currentLine.sprite} position={currentLine.spritePos || 'center'} animation="fade-in" />
              )}

              {currentLine.choices ? (
                <ChoiceMenu choices={currentLine.choices} onSelect={makeChoice} />
              ) : (
                <DialogBox 
                  speaker={currentLine.speaker} 
                  text={currentLine.text} 
                  onClick={nextLine} 
                  settings={globalSettings}
                  isAuto={isAuto}
                  isSkip={isSkip}
                />
              )}
              
            </Stage>
          ) : null}
        </>
      )}
    </div>
  );
}

export default App;
