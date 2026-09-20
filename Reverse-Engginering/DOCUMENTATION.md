# Leonardo AI - AWS Cognito SRP Authentication Reverse Engineering

Semua temuan dalam dokumen ini diperoleh melalui reverse engineering file APK/ XAPK dari aplikasi Leonardo AI Android, termasuk decompilation bytecode smali, analisis resource XML/JSON, dan analisis library yang terbundling (Amplify SDK, Apollo GraphQL).

**Fitur yang di-reverse engineer:**
- AWS Cognito SRP authentication (signup, confirm, login, token refresh)
- GraphQL API (blueprints, models, presets)
- Model categories & preset-to-category mapping dari APK
- Image generation (mutation, results, styles)

---

## Table of Contents

1. [Overview](#overview)
2. [Cognito Configuration](#1-cognito-configuration)
3. [Auth Flow](#2-auth-flow)
4. [SRP (Secure Remote Password)](#3-srp-secure-remote-password)
5. [Key Derivation (HKDF)](#4-key-derivation-hkdf)
6. [Signature Generation](#5-signature-generation)
7. [Request Format](#6-request-format)
8. [GraphQL API Authentication](#7-graphql-api-authentication)
9. [Token Refresh](#8-token-refresh)
10. [Device Context & UserAgent](#9-device-context--useragent)
11. [Model API](#10-model-api)
12. [Generate API](#11-generate-api)
13. [Profile API](#12-profile-api)
14. [Rekomendasi Keamanan](#13-rekomendasi-keamanan)

---

## Overview

Leonardo AI menggunakan **AWS Cognito** untuk autentikasi user, dengan custom **USER_SRP_AUTH** flow yang dikombinasikan dengan Amplify Android SDK (`amplify-android#2.29.1`). Implementasi SRP mengikuti standar RFC 5054 (2048-bit MODP group) tetapi dengan beberapa modifikasi proprietary dari Amplify.

---

## 1. Cognito Configuration

**Sumber:** File resource `res/raw/amplifyconfiguration.json` di dalam APK Leonardo AI.

```json
{
  "UserPoolId": "us-east-1_xkVMuCqeu",
  "ClientId": "5i7j910t573mlmqc1k36vk5m9i",
  "Region": "us-east-1"
}
```

**Pool Name** (digunakan dalam SRP hash): `xkVMuCqeu`
- Diekstrak dari `UserPoolId` dengan `split('_')[1]`
- Ditemukan di: `com/amplifyframework/auth/cognito/helpers/CognitoUserPoolFactory.smali`

**Endpoint:** `https://cognito-idp.us-east-1.amazonaws.com`

**Cara menemukan:**
- Buka file APK hasil decompile, cari `amplifyconfiguration.json` di folder `res/raw/`
- Atau grep string `"PoolId"` di seluruh smali files

---

## 2. Auth Flow

**Sumber:** Class `ai/leonardo/auth/` dan `com/amplifyframework/auth/cognito/`

Alur autentikasi 4 langkah:

### Langkah 1: SignUp
```
POST cognito-idp.us-east-1.amazonaws.com
x-amz-target: AWSCognitoIdentityProviderService.SignUp
Body: { ClientId, Username: email, Password, UserAttributes: [] }
```
- UserAttributes kosong — tidak ada atribut custom yang dikirim saat signup
- Response mengembalikan `UserSub` (UUID user)

### Langkah 2: ConfirmSignUp
```
POST cognito-idp.us-east-1.amazonaws.com
x-amz-target: AWSCognitoIdentityProviderService.ConfirmSignUp
Body: { ClientId, Username: email, ConfirmationCode: code }
```
- Code dikirim via email oleh Cognito
- Ditemukan di class `ai/leonardo/auth/data/repository/AuthRepositoryImpl.smali`

### Langkah 3: InitiateAuth (SRP)
```
POST cognito-idp.us-east-1.amazonaws.com
x-amz-target: AWSCognitoIdentityProviderService.InitiateAuth
Body: {
  AuthFlow: "USER_SRP_AUTH",
  AuthParameters: { USERNAME: email, SRP_A: <hex public A> },
  ClientId, ClientMetadata: {}
}
```
- Response berisi challenge parameters: `SRP_B`, `SALT`, `SECRET_BLOCK`, `USER_ID_FOR_SRP`, `USERNAME`

### Langkah 4: RespondToAuthChallenge
```
POST cognito-idp.us-east-1.amazonaws.com
x-amz-target: AWSCognitoIdentityProviderService.RespondToAuthChallenge
Body: {
  ChallengeName: "PASSWORD_VERIFIER",
  ChallengeResponses: {
    USERNAME: <USER_ID_FOR_SRP (UUID)>,
    PASSWORD_CLAIM_SECRET_BLOCK: <secret block>,
    PASSWORD_CLAIM_SIGNATURE: <base64 HMAC-SHA256>,
    TIMESTAMP: <timestamp>
  },
  ClientId, ClientMetadata: {}
}
```
- Response mengembalikan `AuthenticationResult` dengan `AccessToken`, `IdToken`, `RefreshToken`

**Cara menemukan:**
- Amati flow autentikasi melalui network traffic analysis
- Atau trace class `CognitoUser.authenticateUser()` di `com/amplifyframework/statemachine/`

---

## 3. SRP (Secure Remote Password)

**Sumber:** 
- `com/amplifyframework/auth/cognito/AuthenticationHelper.smali` (Amplify SDK)
- `BigInteger.smali` (implementasi BigInteger two's complement)

### Parameters
| Parameter | Value | Sumber |
|-----------|-------|--------|
| N (prime) | `FFFFFFFFFFFFFFFFC90FDAA22168C234...` (RFC 5054 2048-bit MODP) | Hardcoded di Amplify SDK |
| g (generator) | `2` | Hardcoded |
| Hash function | SHA-256 | Standard SRP-6a |

### SRP_N — Prime Number
```
FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF
```

**Catatan Penting:** Banyak implementasi SRP online menggunakan SRP_N dari RFC 3526 (`AC6BDB41324A...`). Amplify menggunakan RFC 5054 yang berbeda. Salah menggunakan N akan menghasilkan hash yang salah.

**Cara menemukan:** Search string `AC6BDB` atau `C90FDA` di smali files Amplify SDK, atau baca langsung dari source Amplify Android di GitHub (`com.amplifyframework.auth.cognito.helpers.SRPHelper`).

### Client Key Computation

1. **Generate a (private):** `random(32 bytes)` sebagai BigInt
2. **Compute A (public):** `A = g^a mod N`
3. **x (password hash):**
   ```
   x = SHA256(pad(salt) || SHA256(poolName + userId + ":" + password))
   ```
   - `poolName` = `xkVMuCqeu` (dari `UserPoolId.split('_')[1]`)
   - `userId` = `USER_ID_FOR_SRP` (UUID, bukan email!)
4. **k (multiplier):** `k = SHA256(pad(N) || pad(g))`
5. **u (scrambling):** `u = SHA256(pad(A) || pad(B))`
6. **S (session key):**
   ```
   gPowX = g^x mod N
   s = (B - k * gPowX) mod N
   S = s^(a + u*x) mod N
   ```

### BigInteger Representation (Two's Complement)
- Fungsi `bigIntArray(n)` mengkonversi BigInt ke byte array dengan sign byte jika MSB set
- Sama seperti Java `BigInteger.toByteArray()`
- Contoh: `0x80XX` → `[0x00, 0x80, 0xXX]` (tambah byte 0 di depan)

**Cara menemukan:** Analisis `AuthenticationHelper.smali` method `getPasswordAuthenticationKey` dan `bigIntArray`.

---

## 4. Key Derivation (HKDF)

**Sumber:** `com/amplifyframework/auth/cognito/AuthenticationHelper.smali` method `computehkdf`

### Standard AWS HKDF (TIDAK digunakan)
```javascript
// Standard HKDF — salah!
prk = HMAC-SHA256(salt=pad(U), IKM=pad(S))
key = HMAC-SHA256(prk, infoBits)
```

### Amplify HKDF (benar)
```javascript
// Amplify proprietary — benar
prk = HMAC-SHA256(bigIntArray(U), bigIntArray(S))
infoBits = "Caldera Derived Key" + 0x01
key = HMAC-SHA256(prk, infoBits).subarray(0, 16)
```

**Perbedaan kritis:**
| Aspek | Standard HKDF | Amplify |
|-------|--------------|---------|
| Salt | `pad(U)` (hex padded) | `bigIntArray(U)` (byte array) |
| IKM | `pad(S)` (hex padded) | `bigIntArray(S)` (byte array) |
| Info | `"1234567890"` | `"Caldera Derived Key" + 0x01` |
| Output | 32 bytes | 16 bytes |

**Catatan:** `"Caldera Derived Key"` adalah nama internal Amplify, bukan nama yang ditemukan di dokumentasi publik AWS.

**Cara menemukan:** Baca method `computehkdf` di `AuthenticationHelper.smali`. String `"Caldera Derived Key"` bisa dicari dengan grep.

---

## 5. Signature Generation

**Sumber:** `com/amplifyframework/auth/cognito/CognitoUser.smali` method `respondToAuthChallenge`

### Signature Computation
```javascript
signature = HMAC-SHA256(K, poolName + userId + decodeBase64(SECRET_BLOCK) + timestamp)
```

**Komponen:**
| Komponen | Nilai | Keterangan |
|----------|-------|------------|
| K | 16-byte key dari HKDF | Hasil key derivation |
| poolName | `xkVMuCqeu` | Dari UserPoolId |
| userId | UUID dari USER_ID_FOR_SRP | **Bukan email** |
| SECRET_BLOCK | Base64-encoded block dari Cognito | Di-decode dulu |
| timestamp | `EEE MMM d HH:mm:ss z yyyy` | Contoh: `Fri Sep 18 04:01:28 UTC 2026` |

### Timestamp Format
```
EEE MMM d HH:mm:ss z yyyy
```
- `EEE` = Day (Sun, Mon, Tue, ...)
- `MMM` = Month (Jan, Feb, Mar, ...)
- `d` = Date (tanpa leading zero)
- `HH:mm:ss` = 24-hour time
- `z` = timezone (UTC)
- `yyyy` = year

**Cara menemukan:** Cari format string timestamp di smali files. Format ini sama dengan yang digunakan di `java.text.SimpleDateFormat`.

---

## 6. Request Format

**Sumber:** Analisis HTTP requests yang dikirim oleh aplikasi

### Headers yang Dikirim
```
User-Agent: aws-sdk-kotlin/1.3.81 ua/2.1 api/cognito-identity-provider#1.3.81 os/android#...
Accept-Encoding: identity
content-type: application/x-amz-json-1.1
x-amz-user-agent: aws-sdk-kotlin/1.3.81
amz-sdk-request: attempt=1; max=3
```

**Catatan:**
- Tidak ada `Accept` header
- `Accept-Encoding` harus `identity` (bukan `gzip`)
- `amz-sdk-request` berisi attempt number dan max retries
- Content-Type harus `application/x-amz-json-1.1` (bukan `application/json`)

### SRP_A Format
- Dikirim sebagai **hex tanpa padding** (`A.toString(16)`)
- Tidak perlu `00` prefix untuk angka yang mulai dengan `8-f`
- Ditemukan di `CognitoUser.smali` line `const-string v1, "SRP_A"`

### Challenge Response Fields
| Field | Nilai |
|-------|-------|
| USERNAME | `USER_ID_FOR_SRP` (UUID) — **bukan email** |
| PASSWORD_CLAIM_SECRET_BLOCK | Base64 block dari server |
| PASSWORD_CLAIM_SIGNATURE | Base64 HMAC-SHA256 |
| TIMESTAMP | Format `EEE MMM d HH:mm:ss z yyyy` |

**TIDAK ada:**
- `DEVICE_KEY` — tidak dikirim
- `UserContextData` — tidak dikirim untuk login
- `Session` — tidak dikirim

**Cara menemukan:** Trace HTTP traffic dari aplikasi, atau analisis method `respondToAuthChallenge` di `CognitoUser.smali`.

---

## 7. GraphQL API Authentication

**Sumber:** 
- `a2/a.smali` — AuthorizationInterceptor
- `b2/b.smali` — API endpoint configuration
- Apollo Kotlin interceptor

### Endpoint
```
https://api.leonardo.ai/v1/graphql
```

### Authorization Header
```
Authorization: Bearer <IdToken>
```

**PENTING:** Leonardo menggunakan **IdToken**, bukan AccessToken!

**Cara menemukan:**
- Cari string `"Authorization"` di smali files → akan menemukan `AuthorizationInterceptor`
- Cari string `"api.leonardo.ai/v1/graphql"` → endpoint GraphQL
- Perhatikan bahwa Amplify SDK mengambil token via `getIdToken()` bukan `getAccessToken()`

### Unauthenticated Queries
Beberapa query dapat dijalankan tanpa autentikasi:
- `android_GeneratedImageQuery_Unauthenticated`
- `android_FeaturedCreationsQuery_Unauthenticated`
- `android_RelatedGeneratedImagesQuery_Unauthenticated`
- `android_GetCustomModels`
- `android_GetPresets`
- `android_GetImageMotionVariations`
- `android_GetRelease`

Ditemukan di class `a2/b.smali` dalam whitelist check.

---

## 8. Token Refresh

**Sumber:** `com/amplifyframework/auth/cognito/actions/FetchAuthSessionCognitoActions.smali`

### Refresh Flow
```
POST cognito-idp.us-east-1.amazonaws.com
x-amz-target: AWSCognitoIdentityProviderService.InitiateAuth
Body: {
  AuthFlow: "REFRESH_TOKEN_AUTH",
  AuthParameters: { REFRESH_TOKEN: <refreshToken> },
  ClientId: <clientId>,
  ClientMetadata: {}
}
```

### Behavior
- Refresh token **tidak di-rotate** — token yang sama bisa dipakai berulang kali
- Setiap refresh menghasilkan `AccessToken` dan `IdToken` baru
- `RefreshToken` tidak dikembalikan dalam response refresh
- App menyimpan refresh token lokal di `CognitoUserPoolTokens`

**Cara menemukan:** Grep string `"REFRESH_TOKEN_AUTH"` di smali files, atau baca method `refreshUserPoolTokensAction`.

---

## 9. Device Context & UserAgent

**Sumber:** `res/raw/amplifyconfiguration.json` dan `ai/leonardo/LeonardoApplication.smali`

### User-Agent Format
```
aws-sdk-kotlin/1.3.81 ua/2.1 api/cognito-identity-provider#1.3.81 os/android#<version>-android<api>-<patch>-<build>-<hash>-<serial> lang/kotlin#2.3.20 md/javaVersion#0 md/jvmName#Dalvik md/jvmVersion#2.1.0 md/androidApiVersion#35 md/androidRelease#15 lib/amplify-android#2.29.1 md/locale#id_ID md/<brand>#<model>/<device>
```

### UserContextData
- Berisi JSON base64 dengan informasi device:
  - `ApplicationName`: `Leonardo.Ai`
  - `ApplicationTargetSdk`: `36`
  - `DeviceBrand`: device brand
  - `DeviceFingerprint`: device fingerprint string
  - `DeviceHardware`, `DeviceName`, `Product`, `BuildType`
  - `DeviceOsReleaseVersion`, `DeviceSdkVersion`
  - `ClientTimezone`
  - `Platform`: `ANDROID`
  - `DeviceId`: UUID generated locally
  - `DeviceLanguage`: locale
  - `ScreenHeightPixels`, `ScreenWidthPixels`
- Signed dengan HMAC-SHA256 menggunakan key `ANDROID20171114`
- Dikirim saat signup dan initiateAuth

**Catatan:** Untuk login via SRP, `UserContextData` tidak wajib. Cognito tetap menerima request tanpa field ini.

**Cara menemukan:** Cari string `"ANDROID20171114"` atau `"DeviceFingerprint"` di smali files.

---

## 10. Model API

**Sumber:**
- `n0/z.smali` — Model categories & preset-to-category mapping
- `android_GetRelease` query — Model list from server
- `android_GetPresets` query — Preset list from server

### Model Data Source

Model list diambil dari **`android_GetRelease`** query (bukan `android_GetCustomModels`):

```graphql
query android_GetRelease($version: String!) {
  release(id: $version) {
    schemaReferences(
      schemaIds: ["https://leonardo.ai/platform/requests/generate/meta"],
      recursive: true
    ) { schemaId schemaData }
  }
}
```

Response berisi 210 schema references dengan 85 model types:
- 57 image models
- 24 video models
- 4 audio models
- 1 3D model

Setiap model memiliki metadata:
- `id` — Model string ID (contoh: `openai/gpt-image-2.5-flare`)
- `name` — Display name
- `type` — `image`, `video`, `audio`, `3d`
- `order` — Sort order
- `isNew`, `isFeatured` — Flags
- `description` — Deskripsi singkat
- `tags` — Tags (contoh: `Image Ref`, `Style Ref`)
- `capabilities` — Objek capability (generate, remix, iterate, limitless, dll)
- `cost` — Token cost dan API credits

### Preset Data

Preset diambil dari **`android_GetPresets`** query:

```graphql
query android_GetPresets($where: preset_bool_exp, $order_by: [preset_order_by!]) {
  preset(where: $where, order_by: $order_by) {
    akUUID name modelId isPaid: isPremium isPublic
    ownerType thumbnailURL payload
  }
}
```

**Catatan:** Field `payload` harus sebagai scalar, bukan sub-selection. Query dengan sub-selection akan error: `"unexpected subselection set for non-object field"`.

### Model Categories (Image)

Kategori image hardcoded di APK (`n0/z.smali`):

| ID | Nama |
|----|------|
| `all` | All |
| `real-and-cinematic` | Real & Cinematic |
| `artistic` | Artistic |
| `design-and-marketing` | Design & Marketing |
| `edit-and-experiment` | Edit & Experiment |
| `text-and-typography` | Text & Typography |

Mapping preset → kategori menggunakan **preset `modelId`** (UUID), bukan `akUUID`.

**Sumber:** Method `b(Lo0/a1;)Ljava/util/List;` di `n0/z.smali` — sparse-switch pada `preset.c` (modelId).

### Model Categories (Video)

Kategori video hardcoded di APK:

| ID | Nama |
|----|------|
| `all` | All |
| `cinematic-and-realism` | Cinematic & Realism |
| `stylised-and-animation` | Stylised & Animation |
| `content-and-social` | Content & Social |
| `quick-and-experimental` | Quick & Experimental |
| `sound-and-dialogue` | Sound & Dialogue |
| `long-form` | Long Form |

Mapping model → kategori menggunakan **model ID string** (contoh: `seedance-2.0`, `kling-3.0`).

**Sumber:** Method `d(Ljava/lang/String;)Ljava/util/ArrayList;` di `n0/z.smali` — pengecekan membership di set m-r.

### Video Model Sets

| Set → Category | Model IDs |
|----------------|-----------|
| m → Cinematic & Realism | `veo-3.1-generate-001`, `sora-2`, `kling-3.0`, `seedance-1.0-pro`, `ltxv-2.0-pro`, dll (28 model) |
| n → Stylised & Animation | `hailuo-2_3-fast`, `motion_2.0-fast`, `hailuo-2_3`, `motion_2.0`, `motion_1.0` |
| o → Content & Social | `seedance-1.0-pro`, `seedance-2.0`, `kling-2.6`, `alibaba/wan-3.0`, dll (13 model) |
| p → Quick & Experimental | `motion_2.0-fast`, `veo-3.1-fast-generate-001`, `seedance-2.0-fast`, dll (11 model) |
| q → Sound & Dialogue | `veo-3.1-generate-001`, `kling-3.0`, `seedance-2.0`, `bfl/flux-3-video`, dll (11 model) |
| r → Long Form | `alibaba/wan-3.0`, `bytedance/seedance-2.5`, `bfl/flux-3-video`, `kling-3.0`, dll (15 model) |

### API Functions

```javascript
// List kategori
leonardo.model.categories(idToken, 'image')  // 6 kategori
leonardo.model.categories(idToken, 'video')  // 7 kategori

// Semua model
leonardo.model.list(idToken, 'image')  // 46 model
leonardo.model.list(idToken, 'video')  // 34 model

// Model per kategori
leonardo.model.listByCategory(idToken, 'artistic', 'image')  // 3 presets
leonardo.model.listByCategory(idToken, 'cinematic-and-realism', 'video')  // 24 models

// Detail model
leonardo.model.detail(idToken, 'openai/gpt-image-2.5-flare')
// → { id, name, type, description, tags, capabilities, cost, ... }
```

### Cara Menemukan

1. Model list: Capture network traffic dari APK, cari query `android_GetRelease`
2. Categories: Decompile APK, buka `n0/z.smali`, baca method `<clinit>` untuk definisi kategori
3. Preset mapping: Baca method `b(Lo0/a1;)` untuk sparse-switch preset UUID → kategori
4. Video sets: Baca field `m` sampai `r` di `<clinit>` untuk set model ID video

---

## 11. Generate API

**Sumber:**
- `android_GenerateMutation` — Generate image/video
- `android_UserGenerationsQuery` — Get generation results
- `android_GenerationsStatusQuery` — Poll generation status
- `android_GetStyles` — Get available styles
- `android_CurrentUserDetailsQuery` — Resolve userId from token

### Generate Mutation

```graphql
mutation android_GenerateMutation($request: CreateGenerationRequest!) {
  generate(request: $request) {
    generationId
    apiCreditCost
  }
}
```

**Request Parameters (Image):**

| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| `model` | String | wajib | Model ID (contoh: `lucid-origin`) |
| `parameters.prompt` | String | wajib | Deskripsi gambar |
| `parameters.style_ids` | [String] | `[]` | Array style UUIDs |
| `parameters.mode` | String | `FAST` | `FAST` atau `QUALITY` |
| `parameters.prompt_enhance` | String | `AUTO` | `AUTO` atau `OFF` |
| `parameters.quantity` | Int | `1` | Jumlah gambar (1-4) |
| `parameters.width` | Int | `1024` | Lebar pixel |
| `parameters.height` | Int | `1024` | Tinggi pixel |
| `public` | Boolean | `true` | Public atau private |

**Request Parameters (Video):**

| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| `model` | String | wajib | Video model ID (contoh: `hailuo-2_3`) |
| `parameters.prompt` | String | wajib | Deskripsi video |
| `parameters.duration` | Int | - | Durasi dalam detik (contoh: 6) |
| `parameters.quantity` | Int | `1` | Jumlah video |
| `parameters.width` | Int | `1376` | Lebar pixel |
| `parameters.height` | Int | `768` | Tinggi pixel |
| `public` | Boolean | `true` | Public atau private |

**Response:**
```json
{
  "data": {
    "generate": {
      "generationId": "1f1b3df9-7e4c-6ff0-b240-bb26831fbca7",
      "apiCreditCost": null
    }
  }
}
```

**Error Handling:**
- Jika ada error, response berisi `errors` array
- Contoh error: `"Insufficient tokens"`, `"parameters.style_ids[0] must be one of: ..."`
- Function throw Error dengan message dari server

### Poll Generation Status

```graphql
query android_GenerationsStatusQuery($where: generations_bool_exp = {}) {
  generations(where: $where) {
    id
    status
  }
}
```

**Variables:**
```json
{
  "where": {
    "id": { "_in": ["generation-id"] },
    "status": { "_in": ["COMPLETE", "FAILED"] }
  }
}
```

**Status Values:**
- `PENDING` — Sedang diproses
- `COMPLETE` — Selesai
- `FAILED` — Gagal

### Get Generation Results

```graphql
query android_UserGenerationsQuery($limit: Int, $userId: uuid!) {
  generations(limit: $limit, where: { userId: { _eq: $userId } }, order_by: [{ createdAt: desc }]) {
    id prompt status createdAt
    images: generated_images {
      id url finalWidth: image_width finalHeight: image_height
      motionMP4URL
    }
  }
}
```

**Response untuk Image:**
```json
{
  "images": [{
    "url": "https://cdn.leonardo.ai/.../image.jpg",
    "motionMP4URL": null
  }]
}
```

**Response untuk Video:**
```json
{
  "images": [{
    "url": "https://cdn.leonardo.ai/.../thumbnail.jpg",
    "motionMP4URL": "https://cdn.leonardo.ai/.../video.mp4"
  }]
}
```

### Resolve userId from Token

```graphql
query android_CurrentUserDetailsQuery($cognitoId: String!) {
  users: user_details(limit: 1, where: { cognitoId: { _eq: $cognitoId } }) {
    userId
  }
}
```

**Mapping:**
- JWT `sub` → Cognito ID
- `user_details.userId` → Leonardo userId (dipakai di generations query)

### Get Styles

```graphql
query android_GetStyles($where: style_bool_exp, $order_by: [style_order_by!]) {
  style(where: $where, order_by: $order_by) {
    id isPublic description akUUID name ownerType
  }
}
```

**Response:** 182 styles (3D Cute, 3D Render, Acrylic, Anime, dll)

### Generation Flow

**Image:**
```
1. Login → dapatkan IdToken
2. generate.create(idToken, { model: 'lucid-origin', prompt: '...' })
   → dapatkan generationId
3. Tunggu beberapa detik atau gunakan generate.poll()
4. generate.result(idToken, { limit: N })
   → dapatkan image URLs
```

**Video:**
```
1. Login → dapatkan IdToken
2. generate.create(idToken, { model: 'hailuo-2_3', prompt: '...', duration: 6 })
   → dapatkan generationId
3. generate.poll(idToken, generationId, { interval: 3000, timeout: 60000 })
   → tunggu sampai COMPLETE
4. generate.result(idToken, { limit: N })
   → dapatkan video URL (motionMP4URL)
```

### Cara Menemukan

1. Capture network traffic dari APK saat generate gambar/video
2. Cari `android_GenerateMutation` untuk request format
3. Cari `android_GenerationsStatusQuery` untuk polling format
4. Cari `android_UserGenerationsQuery` untuk result format
5. Cari `android_CurrentUserDetailsQuery` untuk userId resolution
6. Cari `android_GetStyles` untuk style list

---

## 12. Profile API

### Query: `android_CurrentUserDetailsQuery`

Mengambil detail profil user termasuk token balance, plan, dan subscription.

**Operation Name:** `android_CurrentUserDetailsQuery`

**Query:**
```graphql
query android_CurrentUserDetailsQuery($cognitoId: String!) {
  userFeatureAccess {
    hasLegacyPremiumFeatures
    canManageSubscription
  }
  users: user_details(limit: 1, where: { cognitoId: { _eq: $cognitoId } }) {
    userId
    user {
      ...UserFragment
      blocked
      suspensionStatus
      user_details {
        auth0Email
        plan
        paidTokens
        subscriptionTokens
        subscriptionGptTokens
        interests
        showNsfw
        interestsRoles
        interestsRolesOther
        tokenRenewalDate
        subscriptionSource
        planSubscribeFrequency
        rolloverTokens
        planSubscribeDate
      }
      tos_acceptances(limit: 1, order_by: { acceptedAt: desc }) {
        tosHash
        acceptedAt
      }
    }
  }
}

fragment UserFragment on users {
  id
  username
}
```

**Variables:**
```json
{
  "cognitoId": "JWT.sub"
}
```

**Contoh Response:**
```json
{
  "data": {
    "userFeatureAccess": {
      "hasLegacyPremiumFeatures": false,
      "canManageSubscription": true
    },
    "users": [{
      "userId": "c6f79fd9-...",
      "user": {
        "id": "c6f79fd9-...",
        "username": null,
        "blocked": false,
        "suspensionStatus": null,
        "user_details": [{
          "auth0Email": "user@example.com",
          "plan": "FREE",
          "paidTokens": 0,
          "subscriptionTokens": 2,
          "subscriptionGptTokens": 100,
          "rolloverTokens": 0,
          "tokenRenewalDate": null,
          "subscriptionSource": null,
          "planSubscribeFrequency": null,
          "planSubscribeDate": null
        }],
        "tos_acceptances": []
      }
    }]
  }
}
```

**Field Keterangan:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| `paidTokens` | Int | Token berbayar (beli) |
| `subscriptionTokens` | Int | Token dari subscription (regenerasi bulanan) |
| `subscriptionGptTokens` | Int | Token khusus GPT/Chat |
| `rolloverTokens` | Int | Token sisa dari periode sebelumnya |
| `plan` | String | Plan saat ini: `FREE`, `PREMIUM`, `PREMIUM_PLUS` |
| `tokenRenewalDate` | String | Tanggal perpanjangan otomatis |

---

## 13. Rekomendasi Keamanan

Berdasarkan temuan reverse engineering ini, berikut beberapa area yang bisa diperkuat:

### 1. Gunakan Cognito App Client dengan Secret
Saat ini App Client (`5i7j910t573mlmqc1k36vk5m9i`) **tidak menggunakan client secret**. Menambahkan client secret akan membuat autentikasi lebih sulit di-replicate karena secret tidak boleh di-embed di client.

### 2. Implement Device Tracking & Binding
- Implementasi **device binding** sehingga refresh token hanya bisa digunakan dari device yang sama
- Gunakan `DEVICE_KEY` yang sudah tersedia di Cognito tapi belum diaktifkan
- Track device fingerprint dan bandingkan antar sesi

### 3. Rate Limiting di Server Side
- Terapkan rate limiting untuk:
  - Signup (email-based)
  - Login attempts
  - Token refresh
- Implementasi **CAPTCHA** atau **bot detection** untuk signup endpoint

### 4. Token Binding & Proof of Possession
- Gunakan **sender-constrained tokens** (DPoP atau mTLS)
- Binding refresh token ke device identifier
- Implementasi **token rotation** untuk refresh token

### 5. Network-Level Protections
- **Certificate pinning** untuk endpoint Cognito dan GraphQL API
- Implementasi **bot detection** di CDN/WAF level
- Monitor anomali pattern (banyak signup dari IP/region sama)

### 6. UserContextData Enforcement
- Saat ini `UserContextData` opsional. Membuatnya wajib akan menambah friction bagi attacker
- Validasi `DeviceFingerprint` dan `DeviceId` di server side

### 7. Amplify SDK Version Updates
- Pastikan menggunakan versi Amplify SDK terbaru yang mungkin memiliki patches keamanan
- Monitor CVE untuk Amplify Android SDK

---

## Appendix: Perhitungan SRP Lengkap

### Fungsi-Fungsi Kunci

```
poolName = "xkVMuCqeu"  // dari USER_POOL_ID.split('_')[1]

// x = SHA256(poolName + userId + ":" + password)
x = SHA256(sha256(poolName || userId || ":" || password))

// pad(n) = hex string, 2-char per byte, leading 00 jika MSB=1
pad(n) = n.toString(16).padStart(2, '0')
if pad(n)[0] in [8,9,a-f]: pad(n) = "00" + pad(n)

// k = SHA256(pad(N) || pad(g))
k = sha256(pad(N) || pad(2))

// u = SHA256(pad(A) || pad(B))
u = sha256(pad(A) || pad(B))

// S = (B - k * g^x) ^ (a + u*x) mod N
gPowX = pow(2, x, N)
s = (B - k * gPowX) % N
S = pow(s, a + u*x, N)

// K = HMAC-SHA256(pad(U), pad(S)) → HKDF
prk = hmac_sha256(bigIntArray(U), bigIntArray(S))
K = hmac_sha256(prk, "Caldera Derived Key" + 0x01)[0:16]

// Signature
timestamp = "EEE MMM d HH:mm:ss z yyyy"
signature = hmac_sha256(K, poolName || userId || base64decode(SECRET_BLOCK) || timestamp)
```

---

## 12. Token Cost Pricing

Setiap model memiliki `leo:cost_config` yang di-embed di JSON schema (fetched via `android_GetRelease`).

### Formula

| Type | Formula |
|------|---------|
| `fixed` | `amount` (tidak terpengaruh resolusi/quantity) |
| `per_megapixel` | `amount × (width × height / 1,000,000) × quantity^quantityFactor` |

### Cost Config Fields

```
leo:cost_config: {
  tokens: {
    type: "fixed" | "per_megapixel",
    amount: <number>,
    quantityFactor: <number>,     // exponent untuk quantity (default: 1)
    minimum: <number>,            // minimum cost
    baseMinimum: <number>,        // hard minimum
    rounding: { method: "ceil"|"floor"|"round", precision: <int> }
  }
}
```

### Cost Modifiers

Model memiliki `leo:cost_modifier` yang menambah/mengurangi biaya berdasarkan parameter:

| Type | Behavior |
|------|----------|
| `multiply` | `cost *= factor` atau `cost *= quantity` (bySelf) |
| `add` | `cost += amount × quantity` (byPath/bySelf) |
| `add_per_megapixel` | `cost += amount × megapixels` |
| `multiply_from_dimensions` | `cost *= factor` jika di bawah threshold |
| `multiply_ceil` | `cost *= ratio` dengan ceiling |

### Video Model Cost

Video model menggunakan beberapa tipe cost calculation:

**Tipe 1: bySelf (base × w × h × duration)**
- Seedance 1.0 Pro: `0.00005859375 × width × height × duration`
- Contoh: 1248×704, 6s → 310 tokens; 1920×1088, 4s → 490 tokens
- Rounding: precision=-1 (kelipatan 10)

**Tipe 2: allOf × duration (base × dimFactor × duration)**
- Seedance 2.0: `0.000328125 × dimFactor × duration`

| Factor | Dimensions |
|--------|------------|
| 428544 | 864×496, 640×640, 496×864, 992×432, 752×560, 560×752 |
| 921600 | 1280×720, 960×960, 720×1280, 1470×630, 1112×834, 834×1112 |
| 2073600 | 1920×1080, 1440×1440, 1080×1920, 2520×1080, 1440×1080, 1080×1440 |
| 5802667 | 5040×2160, 3840×2160, 2880×2160, 2880×2880, 2160×2880, 2160×3840 |

**Tipe 3: fixed + adder**
- Hailuo 2.3: base 98, +98 untuk 1080p, +126 untuk durasi 10s
- Hailuo 2.3 Fast: base 80, +80 untuk 1080p, +126 untuk durasi 10s

**Tipe 4: fixed × duration**
- Happy Horse: base 140, ×duration, ×2 untuk 1080p
- Kling 3.0 Turbo: base 130, ×duration, ×1.23 untuk 1080p

**Tipe 5: fixed**
- Wan 3.0: 40, Seedance 2.5: 180, FLUX 3: 215, Veo 3.1: 200

### Verified Video Model Cost

| Model | Formula | 960×960, 15s | 1280×720, 6s | 1080×1080, 15s |
|-------|---------|-------------|-------------|----------------|
| seedance-1.0-pro | base×w×h×dur | 490 (1920×1088,4s) | 310 (1248×704,6s) | - |
| seedance-2.0 | base×factor×dur | - | 1814 | - |
| happy-horse | base×dur (×2 1080p) | - | - | 4200 |
| kling-3.0-turbo | base×dur (×1.23 1080p) | 1950 | - | - |
| hailuo-2_3 | fixed+adders | - | 98 (1376×768) | 322 (1920×1080,10s) |
| hailuo-2_3-fast | fixed+adders | - | 80 (1376×768) | - |

### Contoh Harga Image (tokens, base)

| Model | Type | 512×512 | 1024×1024 | Notes |
|-------|------|---------|-----------|-------|
| auto-preset | fixed | 40 | 40 | |
| gemini-image-2 | fixed | 140 | 140 | |
| nano-banana-2 | fixed | 80 | 80 | |
| lucid-origin | per_mp | 2 | 8 | ×3 QUALITY, +3 style, +2 content |
| flux-dev | per_mp | 2 | 8 | +3 style, +2 content |
| flux-schnell | per_mp | 1 | 2 | +3 style, +2 content |
| gpt-image-1 | per_mp | 5 | 19 | ×3 HD, ×10.75 Ultra |

---

*Dokumen ini dihasilkan dari reverse engineering APK Leonardo AI Android. Tujuan edukasi dan analisis keamanan.*
