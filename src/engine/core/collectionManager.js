// src/engine/core/collectionManager.js
const COLLECTION_KEY = 'fei_collections_unlocked';

// Mengambil array ID koleksi yang sudah di-unlock
export const getUnlockedCollections = () => {
  try {
    const data = localStorage.getItem(COLLECTION_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load collections", e);
    return [];
  }
};

// Menyimpan/Membuka kunci koleksi baru
export const unlockCollection = (collectionId) => {
  if (!collectionId) return false;
  
  try {
    const currentUnlocked = getUnlockedCollections();
    if (!currentUnlocked.includes(collectionId)) {
      currentUnlocked.push(collectionId);
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(currentUnlocked));
      return true; // Berhasil membuka kunci baru
    }
    return false; // Sudah terbuka sebelumnya
  } catch (e) {
    console.error("Failed to unlock collection", e);
    return false;
  }
};

// Cek apakah suatu koleksi sudah terbuka
export const isCollectionUnlocked = (collectionId) => {
  const currentUnlocked = getUnlockedCollections();
  return currentUnlocked.includes(collectionId);
};
