// src/engine/core/chapterManager.js
const CHAPTER_UNLOCK_KEY = 'fei_chapters_unlocked';

export const getUnlockedChapters = () => {
  try {
    const data = localStorage.getItem(CHAPTER_UNLOCK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const unlockChapter = (chapterId) => {
  if (!chapterId) return false;
  
  try {
    const currentUnlocked = getUnlockedChapters();
    if (!currentUnlocked.includes(chapterId)) {
      currentUnlocked.push(chapterId);
      localStorage.setItem(CHAPTER_UNLOCK_KEY, JSON.stringify(currentUnlocked));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to unlock chapter", e);
    return false;
  }
};

export const isChapterUnlocked = (chapterId) => {
  const currentUnlocked = getUnlockedChapters();
  return currentUnlocked.includes(chapterId);
};
