# Leonardo AI - Feature Reference

Semua fitur yang tersedia di `leonardo.mjs` beserta cara pakai.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Blueprint API](#2-blueprint-api)
3. [Model API](#3-model-api)
4. [Generate API](#4-generate-api)

---

## 1. Authentication

### Setup

```javascript
import { leonardo } from './leonardo.mjs';
```

### Signup

Buat akun baru. Code verifikasi dikirim ke email.

```javascript
const result = await leonardo.signup('email@example.com', 'password123');
// result: {} (object kosong jika berhasil)
```

### Confirm Signup

Konfirmasi akun dengan code dari email.

```javascript
await leonardo.confirmSignup('email@example.com', '123456');
```

### Login

Login dengan SRP authentication. Mengembalikan tokens.

```javascript
const tokens = await leonardo.login('email@example.com', 'password123');
// tokens: {
//   AccessToken: '...',
//   IdToken: '...',
//   ExpiresIn: 3600,
//   TokenType: 'Bearer',
//   RefreshToken: '...'
// }
```

**Penting:** Simpan `RefreshToken` untuk refresh nanti.

### Refresh Token

Refresh token yang sudah expired. IdToken baru dihasilkan.

```javascript
const tokens = await leonardo.refreshToken(savedRefreshToken);
// tokens: {
//   AccessToken: '...',
//   IdToken: '...',       // ← pakai ini untuk API calls
//   ExpiresIn: 3600,
//   TokenType: 'Bearer',
//   RefreshToken: '...'   // ← refresh token yang sama
// }
```

**Catatan:** Refresh token tidak di-rotate (token yang sama bisa dipakai berulang kali).

---

## 2. Blueprint API

Blueprint adalah template preset untuk generasi gambar.

### Get Categories

```javascript
const cats = await leonardo.blueprint.categories(idToken);
// cats: { totalCount: 10, edges: [{ node: { name, handle, description } }] }
```

### List Blueprints

```javascript
const blueprints = await leonardo.blueprint.list(idToken, category?, first?);
// category: filter by category name (optional)
// first: jumlah hasil (default: 50)
// blueprints: { edges: [{ node: { name, akUUID, description, thumbnails, categories } }], pageInfo }
```

Contoh:
```javascript
// Semua blueprints
const all = await leonardo.blueprint.list(idToken);

// Filter by category
const anime = await leonardo.blueprint.list(idToken, 'Anime', 10);
```

### Blueprint Detail

```javascript
const detail = await leonardo.blueprint.detail(idToken, 'blueprint-akUUID');
// detail: { name, akUUID, description, accessTier, thumbnails, categories, versions }
```

---

## 3. Model API

### Categories

Dapatkan list kategori model.

```javascript
const imgCats = await leonardo.model.categories(idToken, 'image');
// [
//   { id: 'all', name: 'All' },
//   { id: 'real-and-cinematic', name: 'Real & Cinematic' },
//   { id: 'artistic', name: 'Artistic' },
//   { id: 'design-and-marketing', name: 'Design & Marketing' },
//   { id: 'edit-and-experiment', name: 'Edit & Experiment' },
//   { id: 'text-and-typography', name: 'Text & Typography' },
// ]

const vidCats = await leonardo.model.categories(idToken, 'video');
// [
//   { id: 'all', name: 'All' },
//   { id: 'cinematic-and-realism', name: 'Cinematic & Realism' },
//   { id: 'stylised-and-animation', name: 'Stylised & Animation' },
//   { id: 'content-and-social', name: 'Content & Social' },
//   { id: 'quick-and-experimental', name: 'Quick & Experimental' },
//   { id: 'sound-and-dialogue', name: 'Sound & Dialogue' },
//   { id: 'long-form', name: 'Long Form' },
// ]
```

### List Models

Dapatkan semua model berdasarkan type.

```javascript
const imgModels = await leonardo.model.list(idToken, 'image');
// 46 models: [{ id, name, type, order, isNew, isFeatured, description, tags, capabilities, cost }]

const vidModels = await leonardo.model.list(idToken, 'video');
// 34 models
```

### List by Category

Filter model berdasarkan kategori.

```javascript
// Video: filter by model set
const cinematic = await leonardo.model.listByCategory(idToken, 'cinematic-and-realism', 'video');
// [{ id: 'seedance-2.0', name: 'Seedance 2.0', ... }]

// Image: filter by preset category
const artistic = await leonardo.model.listByCategory(idToken, 'artistic', 'image');
// [{ akUUID, name, modelId, ... }] ← returns presets, not models
```

### Model Detail

```javascript
const model = await leonardo.model.detail(idToken, 'openai/gpt-image-2.5-flare');
// {
//   id: 'openai/gpt-image-2.5-flare',
//   name: 'GPT Image 2.5 Flare',
//   type: 'image',
//   description: 'Fast everyday image generation with strong prompt following',
//   tags: [{ label: 'Image Ref', value: 'image_ref' }],
//   capabilities: { generate: true, remix: true, iterate: true, ... },
//   cost: { tokens: 7, apiCredits: 5 }
// }
```

---

## 4. Generate API

### Get Styles

Dapatkan list semua style yang tersedia (182 styles).

```javascript
const styles = await leonardo.generate.styles(idToken);
// [{ id: 1, akUUID: '...', name: '3D Render', description: 'ALCHEMY_SDXL', ... }]
```

**Contoh styles:** 3D Cute, 3D Render, Acrylic, Anime, Anime Background, Anime Flat Illustration, dll.

### Generate Image

Buat gambar baru.

```javascript
const result = await leonardo.generate.create(idToken, {
    model: 'lucid-origin',          // model ID (wajib)
    prompt: 'a beautiful sunset',    // prompt (wajib)
    styleIds: [],                    // style UUIDs (optional)
    mode: 'FAST',                    // 'FAST' atau 'QUALITY'
    enhance: 'AUTO',                 // 'AUTO' atau 'OFF'
    quantity: 1,                     // jumlah gambar (1-4)
    width: 1024,                     // lebar
    height: 1024,                    // tinggi
    isPublic: true                   // public atau private
});
// result: { generationId: '...', apiCreditCost: null }
```

**Parameter:**

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| `model` | wajib | Model ID (contoh: `lucid-origin`, `openai/gpt-image-2.5-flare`) |
| `prompt` | wajib | Deskripsi gambar |
| `styleIds` | `[]` | Array style UUIDs |
| `mode` | `'FAST'` | `FAST` atau `QUALITY` |
| `enhance` | `'AUTO'` | `AUTO` atau `OFF` |
| `quantity` | `1` | 1-4 gambar |
| `width` | `1024` | Lebar dalam pixel |
| `height` | `1024` | Tinggi dalam pixel |
| `isPublic` | `true` | Public atau private |

**Contoh:**

```javascript
// Simple generate
const gen = await leonardo.generate.create(idToken, {
    model: 'lucid-origin',
    prompt: 'a cute cat wearing a hat'
});

// Generate dengan style
const gen = await leonardo.generate.create(idToken, {
    model: 'lucid-origin',
    prompt: 'anime girl with blue hair',
    styleIds: ['8f80fd23-...'], // Anime style
    quantity: 4,
    width: 1024,
    height: 768
});
```

### Get Results

Ambil hasil generasi terbaru.

```javascript
const gens = await leonardo.generate.result(idToken, { limit: 5 });
// [
//   {
//     id: 'generation-id',
//     prompt: 'a cute cat wearing a hat',
//     status: 'COMPLETE',
//     createdAt: '2026-09-19T04:09:29.934',
//     images: [
//       {
//         id: 'image-id',
//         url: 'https://cdn.leonardo.ai/users/.../image.jpg',
//         finalWidth: 1024,
//         finalHeight: 1024,
//         nsfw: false,
//         public: true
//       }
//     ]
//   }
// ]
```

**Opsi:**

| Opsi | Default | Keterangan |
|------|---------|------------|
| `userId` | auto | User ID (auto-detect dari token jika tidak diisi) |
| `limit` | `8` | Jumlah hasil |

**Contoh:**

```javascript
// Auto-detect userId
const gens = await leonardo.generate.result(idToken, { limit: 3 });

// Dengan userId manual
const gens = await leonardo.generate.result(idToken, {
    userId: 'c6f79fd9-058c-4337-967d-8f678a8a9dc5',
    limit: 10
});
```

---

## Profile

Ambil detail profil user termasuk token balance dan plan.

```javascript
const profile = await leonardo.profile(idToken);
```

**Response:**
```json
{
  "userId": "c6f79fd9-...",
  "email": "user@example.com",
  "plan": "FREE",
  "tokens": {
    "paid": 0,
    "subscription": 2,
    "gpt": 100,
    "rollover": 0,
    "total": 2
  },
  "subscription": { "source": null, "frequency": null },
  "featureAccess": { "hasLegacyPremiumFeatures": false, "canManageSubscription": true }
}
```

**Contoh:**
```javascript
const p = await leonardo.profile(idToken);
console.log(`Plan: ${p.plan}`);
console.log(`Tokens: ${p.tokens.total} (paid: ${p.tokens.paid}, sub: ${p.tokens.subscription})`);
```

---

## Estimate Cost

Hitung perkiraan token cost sebelum generate.

### Image Models

```javascript
// Lucid Origin: per_megapixel
const cost1 = await leonardo.estimateCost.forModel(idToken, 'lucid-origin', {
    width: 1024, height: 1024
});
// = 8 tokens (2 × 1024 × 1024 / 1M)

// Lucid Origin: +mode +modifiers
const cost2 = await leonardo.estimateCost.forModel(idToken, 'lucid-origin', {
    width: 1024, height: 1024, mode: 'QUALITY', style: true, content: true
});
// = 8 × 3 + 3 + 2 = 29 tokens

// Auto Preset: fixed
const cost3 = await leonardo.estimateCost.forModel(idToken, 'auto-preset', {
    width: 1024, height: 1024
});
// = 40 tokens (fixed)
```

### Video Models

```javascript
// Hailuo 2.3: fixed + adders
const hailuo = await leonardo.estimateCost.forModel(idToken, 'hailuo-2_3', {
    width: 1376, height: 768, duration: 6
});
// = 98 tokens (base)

const hailuo1080 = await leonardo.estimateCost.forModel(idToken, 'hailuo-2_3', {
    width: 1920, height: 1080, duration: 6
});
// = 196 tokens (base + 98 for 1080p)

const hailuo10s = await leonardo.estimateCost.forModel(idToken, 'hailuo-2_3', {
    width: 1920, height: 1080, duration: 10
});
// = 322 tokens (base + 98 for 1080p + 126 for 10s)

// Seedance 1.0 Pro: base × w × h × duration
const seedance = await leonardo.estimateCost.forModel(idToken, 'seedance-1.0-pro', {
    width: 1248, height: 704, duration: 6
});
// = 310 tokens (0.00005859375 × 1248 × 704 × 6)

// Happy Horse: base × duration (×2 for 1080p)
const happy = await leonardo.estimateCost.forModel(idToken, 'happy-horse', {
    width: 1080, height: 1080, duration: 15
});
// = 4200 tokens (140 × 2 × 15)

// Kling 3.0 Turbo: base × duration
const kling = await leonardo.estimateCost.forModel(idToken, 'kling-3.0-turbo', {
    width: 960, height: 960, duration: 15
});
// = 1950 tokens (130 × 15)
```

### Direct calculate (without fetching model)

```javascript
const cost = leonardo.estimateCost.calculate(model.cost, {
    width: 1024, height: 1024, quantity: 1,
    mode: 'QUALITY', style: true
});
```

---

## Full Example

```javascript
import { leonardo } from './leonardo.mjs';

async function main() {
    // 1. Login
    const tokens = await leonardo.login('email@example.com', 'password');
    const idToken = tokens.IdToken;

    // 2. Get models
    const models = await leonardo.model.list(idToken, 'image');
    console.log('Available models:', models.length);

    // 3. Get styles
    const styles = await leonardo.generate.styles(idToken);
    console.log('Available styles:', styles.length);

    // 4. Generate image
    const gen = await leonardo.generate.create(idToken, {
        model: 'lucid-origin',
        prompt: 'a beautiful mountain landscape at sunset',
        quantity: 1,
        width: 1024,
        height: 1024
    });
    console.log('Generation ID:', gen.generationId);

    // 5. Wait and get result
    await new Promise(r => setTimeout(r, 5000));
    const result = await leonardo.generate.result(idToken, { limit: 1 });
    console.log('Image URL:', result[0]?.images[0]?.url);

    // 6. Generate video (jika model video tersedia)
    const video = await leonardo.generate.create(idToken, {
        model: 'hailuo-2_3',
        prompt: 'a cute cat playing with a ball of yarn',
        duration: 6,
        width: 1376,
        height: 768
    });
    console.log('Video Generation ID:', video.generationId);

    // 7. Poll video status
    const videoStatus = await leonardo.generate.poll(idToken, video.generationId, { interval: 3000, timeout: 60000 });
    console.log('Video Status:', videoStatus.status);

    // 8. Get video result
    const videoResult = await leonardo.generate.result(idToken, { limit: 1 });
    console.log('Video URL:', videoResult[0]?.images[0]?.motionMP4URL);

    // 9. Estimate cost (image)
    const imageCost = await leonardo.estimateCost.forModel(idToken, 'lucid-origin', {
        width: 1024, height: 1024,
        mode: 'QUALITY', style: true, content: true
    });
    console.log('Image cost:', imageCost, 'tokens');

    // 10. Estimate cost (video)
    const videoCost = await leonardo.estimateCost.forModel(idToken, 'hailuo-2_3', {
        width: 1376, height: 768, duration: 6
    });
    console.log('Hailuo 6s cost:', videoCost, 'tokens');

    const seedanceCost = await leonardo.estimateCost.forModel(idToken, 'seedance-1.0-pro', {
        width: 1248, height: 704, duration: 6
    });
    console.log('Seedance Pro 6s cost:', seedanceCost, 'tokens');

    // 11. List all models with pricing
    const models = await leonardo.model.list(idToken, 'image');
    for (const m of models.slice(0, 5)) {
        console.log(`${m.name}: ${m.cost.tokens} tokens (${m.cost.tokensType})`);
    }

    // 12. Refresh token (jika expired)
    const newTokens = await leonardo.refreshToken(tokens.RefreshToken);
    console.log('New IdToken:', newTokens.IdToken.substring(0, 50) + '...');
}

main().catch(console.error);
```

---

*Cara pakai untuk edukasi dan analisis.*
