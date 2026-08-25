// src/engine/core/audioManager.js
import { AssetManager } from './assetManager';

let bgmAudio = new Audio();
bgmAudio.loop = true;

// Untuk SFX kita bisa membuat audio pool atau langsung putar
// Array untuk menyimpan beberapa Audio object agar bisa play SFX bertumpuk (overlap)
const sfxPool = [];
const getSFXAudio = () => {
  let audio = sfxPool.find(a => a.paused || a.ended);
  if (!audio) {
    audio = new Audio();
    sfxPool.push(audio);
  }
  return audio;
};

// Satu channel khusus untuk Voice (karakter ngomong), biar tidak tumpang tindih
let voiceAudio = new Audio();

let volumes = {
  master: 1,
  bgm: 0.8,
  sfx: 0.8,
  voice: 1.0
};

// Kita menggunakan Web Audio API untuk efek suara ketikan agar responsif (tanpa delay/lag)
let audioCtx = null;

export const updateAudioSettings = (settings) => {
  volumes.master = settings.masterVolume / 100;
  volumes.bgm = settings.bgmVolume / 100;
  volumes.sfx = settings.sfxVolume / 100;
  volumes.voice = (settings.voiceVolume !== undefined ? settings.voiceVolume : 100) / 100;
  
  bgmAudio.volume = volumes.master * volumes.bgm;
  voiceAudio.volume = volumes.master * volumes.voice;
  
  // Update volume untuk semua sfx yang sedang berjalan jika memungkinkan
  sfxPool.forEach(audio => {
    audio.volume = volumes.master * volumes.sfx;
  });
};

export const playBGM = (url) => {
  if (!url) {
    bgmAudio.pause();
    return;
  }
  
  const resolvedUrl = AssetManager.get(url);
  
  // Hanya ganti track jika URL-nya berbeda
  if (bgmAudio.src !== new URL(resolvedUrl, document.baseURI).href) {
    bgmAudio.src = resolvedUrl;
    bgmAudio.volume = volumes.master * volumes.bgm;
    bgmAudio.play().catch(e => console.warn("Autoplay dicegah oleh browser.", e));
  } else if (bgmAudio.paused) {
    bgmAudio.play().catch(e => console.warn("Autoplay dicegah.", e));
  }
};

export const stopBGM = () => {
  bgmAudio.pause();
};

export const playSFX = (url) => {
  if (!url || volumes.master === 0 || volumes.sfx === 0) return;
  
  const audio = getSFXAudio();
  audio.src = AssetManager.get(url);
  audio.volume = volumes.master * volumes.sfx;
  audio.play().catch(e => console.warn("SFX dicegah browser", e));
};

export const playVoice = (url) => {
  if (!url) {
    voiceAudio.pause();
    return;
  }
  
  if (volumes.master === 0 || volumes.voice === 0) return;
  
  voiceAudio.src = AssetManager.get(url);
  voiceAudio.volume = volumes.master * volumes.voice;
  voiceAudio.play().catch(e => console.warn("Voice dicegah browser", e));
};

export const stopVoice = () => {
  voiceAudio.pause();
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
