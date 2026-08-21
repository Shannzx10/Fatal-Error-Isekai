// src/engine/core/audioManager.js

let bgmAudio = new Audio();
bgmAudio.loop = true;

let volumes = {
  master: 1,
  bgm: 0.8,
  sfx: 0.8
};

// Kita menggunakan Web Audio API untuk efek suara SFX agar responsif (tanpa delay/lag)
let audioCtx = null;

export const updateAudioSettings = (settings) => {
  volumes.master = settings.masterVolume / 100;
  volumes.bgm = settings.bgmVolume / 100;
  volumes.sfx = settings.sfxVolume / 100;
  
  bgmAudio.volume = volumes.master * volumes.bgm;
};

export const playBGM = (url) => {
  if (!url) {
    bgmAudio.pause();
    return;
  }
  
  // Hanya ganti track jika URL-nya berbeda
  if (bgmAudio.src !== new URL(url, document.baseURI).href) {
    bgmAudio.src = url;
    bgmAudio.volume = volumes.master * volumes.bgm;
    bgmAudio.play().catch(e => console.warn("Autoplay dicegah oleh browser. Membutuhkan interaksi user.", e));
  } else if (bgmAudio.paused) {
    bgmAudio.play().catch(e => console.warn("Autoplay dicegah.", e));
  }
};

export const stopBGM = () => {
  bgmAudio.pause();
};

// SFX Ketikan bergaya Sci-Fi blip (Dihasilkan langsung dengan Math/AudioContext tanpa file!)
export const playTypingSFX = () => {
  if (volumes.master === 0 || volumes.sfx === 0) return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Karakteristik suara "Blip"
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime); // Nada dasar
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.03); // Melengking cepat

  // Volume suara blip
  const actualVol = volumes.master * volumes.sfx * 0.05; // 0.05 agar tidak berisik
  gainNode.gain.setValueAtTime(actualVol, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.03);
};
