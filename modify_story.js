import fs from 'fs';

const storyPath = './src/game/scripts/story.json';
let rawData = fs.readFileSync(storyPath, 'utf8');
let story = JSON.parse(rawData);

const spritePath = 'assets/characters/kurogane-shannz.png';

for (let sceneKey in story) {
  let scene = story[sceneKey];
  if (scene.lines) {
    for (let i = 0; i < scene.lines.length; i++) {
      let line = scene.lines[i];
      if (line.speaker === 'Kurogane Shannz') {
        line.sprite = spritePath;
      }
    }
  }
}

fs.writeFileSync(storyPath, JSON.stringify(story, null, 2), 'utf8');
console.log("Successfully updated story.json");
