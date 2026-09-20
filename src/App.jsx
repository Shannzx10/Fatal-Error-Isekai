import React, { useState, useEffect } from 'react';
import { useEngine, Stage, DialogBox, ChoiceMenu, Sprite, MainMenu, DataMenu, SettingMenu, HistoryLog, CollectionMenu, ChapterMenu, LoadingScreen, saveGameData, getSettings, updateAudioSettings } from './engine';
import { getAutoSave } from './engine/core/saveManager';
import { AssetManager } from './engine/core/assetManager';
import defaultStoryData from './game/scripts/story.json';
import './App.css';
import './engine/components/UnlockNotification.css';

function App() {
  const initialAutoSave = getAutoSave();
  const [gameState, setGameState] = useState(initialAutoSave ? 'playing' : 'menu'); 
  const [globalSettings, setGlobalSettings] = useState(getSettings());
  const [showHistory, setShowHistory] = useState(false);
  const [hideUI, setHideUI] = useState(false);
  
  // State untuk skala layar (Letterboxing / Fill Screen)
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1280);

  // State untuk menyimpan script JSON yang sedang dimainkan
  const [currentScript, setCurrentScript] = useState(defaultStoryData);

  // Kalkulasi skala layar agar muat di device apa pun tanpa merusak rasio (1280x720)
  useEffect(() => {
    const handleResize = () => {
      // Tunggu sedikit agar Capacitor selesai rotasi jika di mobile
      setTimeout(() => {
        const BASE_HEIGHT = 720;
        const scaleY = window.innerHeight / BASE_HEIGHT;
        const dynamicWidth = window.innerWidth / scaleY;
        
        setScale(scaleY);
        setContainerWidth(dynamicWidth);
      }, 100);
    };

    handleResize(); // Set awal
    
    // Tambahkan listener untuk orientation change juga
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Pastikan audio sync saat pertama kali dimuat
  useEffect(() => {
    updateAudioSettings(globalSettings);
  }, []);

  const {
    currentSceneId,
    currentLineIndex,
    currentLine,
    visuals,
    history,
    nextLine,
    makeChoice,
    loadState,
    resetGame,
    isAuto,
    isSkip,
    toggleAuto,
    toggleSkip,
    isEnd,
    unlockNotification,
    achievedEnding
  } = useEngine(currentScript);

  // Jika nanti butuh import JSON chapter lain secara dinamis
  const loadChapterScript = async (scriptFile) => {
    try {
      // Dalam prakteknya (Pendekatan B), ini nanti mengambil JSON dari AssetManager/Filesystem
      // Sementara kita mock dengan defaultStoryData (karena chapter2.json belum dibuat)
      if (scriptFile === 'story.json') {
        setCurrentScript(defaultStoryData);
      } else {
        // Simulasi jika ada file lain:
        // const res = await fetch(AssetManager.get(scriptFile));
        // const data = await res.json();
        // setCurrentScript(data);
        console.warn(`File ${scriptFile} belum ada, menggunakan story.json sementara.`);
        setCurrentScript(defaultStoryData);
      }
    } catch (e) {
      console.error("Gagal meload script chapter", e);
    }
  };

  const startGame = () => {
    resetGame();
    setShowHistory(false);
    setGameState('chapter'); // Masuk ke pemilihan chapter, bukan langsung main
  };

  const playChapter = async (chapterId, scriptFile) => {
    // 1. Masuk ke Layar Loading dulu
    setGameState('loading');
    
    // 2. Mulai proses muat data script
    await loadChapterScript(scriptFile);
    resetGame();
    setShowHistory(false);
    
    // 3. Jeda buatan (artificial delay) agar animasi loading terlihat elegan
    setTimeout(() => {
      setGameState('playing');
    }, 7500); // 7.5 detik loading sesuai request
  };

  const handleGlobalNavigation = (destination) => {
    if (destination === 'playing') {
      // isActuallyInGame adalah variabel yg sudah kita buat di bawah, tapi karena belum dirender,
      // kita cek manual logic kasarnya:
      const checkInGame = (currentLineIndex !== undefined && currentLineIndex >= 0 && !isEnd) && 
                          (currentSceneId !== 'start' || currentLineIndex > 0);
                          
      if (!checkInGame || isEnd) {
        startGame(); // Arahkan ke Chapter Selection
      } else {
        setGameState('playing'); // Lanjutkan game yang sedang berjalan
      }
    } else if (destination === 'menu') {
      // Saat kembali ke menu utama dari dalam game, pastikan engine di-reset
      // agar tidak dianggap masih in-game
      resetGame();
      setGameState('menu');
    } else if (destination === 'exit') {
      alert("Fitur Exit belum diimplementasi (Biasanya hanya menutup app di Android)");
    } else {
      setGameState(destination); 
    }
  };

  const handleDataAction = (actionType, slotNumber, data) => {
    if (actionType === 'load') {
      if (data) {
        setGameState('loading');
        setTimeout(() => {
          loadState(data.sceneId, data.lineIndex);
          setShowHistory(false);
          setGameState('playing');
        }, 7500); // 7.5 detik loading
      }
    } else if (actionType === 'save') {
      const textPreview = currentLine?.text || '...';
      saveGameData(slotNumber, currentSceneId, currentLineIndex, textPreview);
    }
  };

  // Tambahkan kurung tutup ekstra untuk memastikan logika AND/OR tidak bocor ke gameState === 'menu'
  const isActuallyInGame = 
    (gameState === 'playing' || gameState === 'data' || gameState === 'setting' || gameState === 'collection') && 
    (currentLineIndex !== undefined && currentLineIndex >= 0 && !isEnd) && 
    (currentSceneId !== 'start' || currentLineIndex > 0);

  return (
    <div className="game-container" style={{ transform: `scale(${scale})`, width: `${containerWidth}px` }}>
      {/* Toast Notification untuk Unlock Collection */}
      {unlockNotification && (
        <div className="unlock-notification">
          <div 
            className="unlock-notification-thumb" 
            style={{ backgroundImage: `url(${AssetManager.get(unlockNotification.thumbnail)})` }}
          />
          <div className="unlock-notification-text">
            <p className="unlock-notification-subtitle">NEW COLLECTION UNLOCKED</p>
            <p className="unlock-notification-title">{unlockNotification.title}</p>
          </div>
        </div>
      )}

      {gameState === 'menu' && (
        <MainMenu 
          onStart={startGame}
          onLoad={() => handleGlobalNavigation('data')}
          onSettings={() => handleGlobalNavigation('setting')}
          onCollection={() => handleGlobalNavigation('collection')}
          onExit={() => handleGlobalNavigation('exit')}
        />
      )}

      {gameState === 'chapter' && (
        <ChapterMenu 
          onBack={() => handleGlobalNavigation('menu')} 
          onPlayChapter={playChapter}
        />
      )}

      {gameState === 'loading' && (
        <LoadingScreen text="Mensimulasikan Realita Baru..." />
      )}

      {gameState === 'data' && (
        <DataMenu 
          inGame={isActuallyInGame}
          onAction={handleDataAction}
          onBack={() => isActuallyInGame ? setGameState('playing') : handleGlobalNavigation('menu')} 
          onNavigate={handleGlobalNavigation}
        />
      )}

      {gameState === 'setting' && (
        <SettingMenu 
          inGame={isActuallyInGame}
          onBack={() => { 
            if (isActuallyInGame) {
              setGameState('playing');
            } else {
              handleGlobalNavigation('menu');
            }
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

      {gameState === 'collection' && (
        <CollectionMenu 
          inGame={isActuallyInGame}
          onBack={() => isActuallyInGame ? setGameState('playing') : handleGlobalNavigation('menu')} 
          onNavigate={handleGlobalNavigation}
        />
      )}

      {gameState === 'playing' && (
        <>
          {/* Grup Tombol In-Game Kanan Atas */}
          {!hideUI && !isEnd && !currentLine?.isCutscene && (
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

              {/* Tombol Hide UI */}
              <button 
                className="ingame-menu-btn" 
                onClick={() => {
                  if (isAuto) toggleAuto();
                  if (isSkip) toggleSkip();
                  setHideUI(true);
                }} 
                title="Sembunyikan UI"
              >
                HIDE
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
          )}

          {showHistory && (
            <HistoryLog history={history} onClose={() => setShowHistory(false)} />
          )}

          {isEnd ? (
            <div 
              className="end-screen"
              style={{
                backgroundImage: achievedEnding ? `url(${AssetManager.get(achievedEnding.thumbnail)})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              {/* Overlay gelap agar teks terbaca */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: achievedEnding ? 'rgba(0,0,0,0.5)' : 'transparent',
                zIndex: 0
              }} />
              
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <h1 style={{ 
                  fontFamily: "'Chakra Petch', sans-serif", 
                  fontSize: '4rem', 
                  margin: '0 0 10px 0',
                  textShadow: '0 0 15px var(--accent-color, #ff3366)'
                }}>
                  {achievedEnding ? achievedEnding.title : "THE END"}
                </h1>
                
                {achievedEnding && (
                  <p style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '1.5rem',
                    color: '#ddd',
                    marginBottom: '30px',
                    letterSpacing: '2px'
                  }}>
                    Ending Unlocked
                  </p>
                )}
                
                <button 
                  className="ingame-menu-btn"
                  onClick={() => handleGlobalNavigation('menu')} 
                  style={{ padding: '15px 30px', fontSize: '1.2rem', margin: '0 auto' }}
                >
                  Kembali ke Menu
                </button>
              </div>
            </div>
          ) : currentLine && !showHistory ? (
            <Stage 
              background={visuals.activeBg} 
              video={visuals.activeVideo}
              onVideoEnd={currentLine.isCutscene ? nextLine : undefined}
              enableTransitions={globalSettings.enableTransitions}
            >
              
              {/* Jika isCutscene true, kita bisa hide Karakter dan Dialog Box secara penuh */}
              {!currentLine?.isCutscene && (
                <>
                  <Sprite 
                    src={visuals.activeSpriteLeft} 
                    position="left" 
                    enableTransitions={globalSettings.enableTransitions}
                    isActive={visuals.activeSlot === 'left'}
                  />
                  <Sprite 
                    src={visuals.activeSpriteCenter} 
                    position="center" 
                    enableTransitions={globalSettings.enableTransitions}
                    isActive={visuals.activeSlot === 'center'}
                  />
                  <Sprite 
                    src={visuals.activeSpriteRight} 
                    position="right" 
                    enableTransitions={globalSettings.enableTransitions}
                    isActive={visuals.activeSlot === 'right'}
                  />
                </>
              )}

              {/* Overlay khusus untuk klik mengembalikan UI (Hanya jika bukan cutscene) */}
              {hideUI && !currentLine.isCutscene && (
                <div 
                  className="hide-ui-overlay" 
                  onClick={() => setHideUI(false)} 
                  title="Klik untuk memunculkan UI kembali"
                />
              )}

              {/* Jika Cutscene, tekan layar dimana saja untuk SKIP video */}
              {currentLine.isCutscene && (
                <div 
                  className="cutscene-skip-overlay" 
                  onClick={nextLine} 
                  title="Klik untuk Skip Video"
                />
              )}

              {/* Wrapper untuk elemen UI agar bisa disembunyikan tanpa unmount */}
              {!currentLine.isCutscene && (
                <div style={{ display: hideUI ? 'none' : 'contents' }}>
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
                </div>
              )}
              
            </Stage>
          ) : null}
        </>
      )}
    </div>
  );
}

export default App;
