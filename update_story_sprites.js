import fs from 'fs';

const storyPath = './src/game/scripts/story.json';
let rawData = fs.readFileSync(storyPath, 'utf8');
let story = JSON.parse(rawData);

for (let sceneKey in story) {
  let scene = story[sceneKey];
  if (scene.lines) {
    for (let i = 0; i < scene.lines.length; i++) {
      let line = scene.lines[i];
      
      if (line.sprite !== undefined) {
        const pos = line.spritePos || 'center';
        
        if (pos === 'left') line.spriteLeft = line.sprite;
        if (pos === 'center') line.spriteCenter = line.sprite;
        if (pos === 'right') line.spriteRight = line.sprite;
        
        // Hapus property yang lama
        delete line.sprite;
        delete line.spritePos;
      }
    }
  }
}

fs.writeFileSync(storyPath, JSON.stringify(story, null, 2), 'utf8');
console.log("Successfully migrated story.json to multiple sprites system.");
