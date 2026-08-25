// src/engine/core/assetManager.js

/**
 * AssetManager berfungsi untuk mengambil path file secara pintar (Smart Resolver).
 * Di masa Development (Browser), dia akan mengarah ke folder lokal (/public atau Github).
 * Di masa Production (APK), dia akan dikembangkan untuk membaca file hasil download 
 * dari Internal Storage Capacitor (@capacitor/filesystem).
 */

const IS_CAPACITOR = false; // Nanti diubah jika berjalan di Capacitor asli

export const AssetManager = {
  get: (filePath) => {
    // Jika path sudah berupa URL HTTP utuh (misal dari Unsplash), langsung kembalikan
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    if (IS_CAPACITOR) {
      // TODO: Logic untuk membaca dari filesystem Capacitor saat dirilis nanti
      // return Capacitor.convertFileSrc(local_device_path);
      return filePath; 
    } else {
      // Masa development / browser testing: 
      // File yang tidak memiliki http, dianggap diletakkan di dalam folder public/
      // Pastikan filePath dimulai dengan '/' misal: "/bg/sekolah.jpg"
      return filePath.startsWith('/') ? filePath : `/${filePath}`;
    }
  }
};
