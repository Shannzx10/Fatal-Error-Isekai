# Panduan Pembuatan Script Visual Novel (STORY_MAKER)

Tugas Anda sebagai AI Story Generator adalah menghasilkan **DUA BUAH FILE JSON** yang 100% kompatibel dengan *engine* Visual Novel kami:
1. `story.json` (Berisi alur cerita, dialog, dan logika percabangan).
2. `collectionsData.json` (Berisi daftar *Ending* atau *CG/Galeri* yang bisa dibuka oleh pemain).

---

## BAGIAN 1: Pembuatan `collectionsData.json`
File ini mengatur tampilan di menu "Gallery & Endings". Jika di dalam `story.json` pemain mencapai *scene* tertentu (misalnya *Bad Ending*), gembok pada galeri ini akan terbuka.

### Format `collectionsData.json`
Bentuknya adalah **Array of Objects**. Setiap objek mewakili satu kotak galeri.
```json
[
  {
    "id": "cg_good_ending",
    "title": "Pahlawan Sejati",
    "thumbnail": "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=300",
    "type": "ending"
  },
  {
    "id": "cg_bad_ending",
    "title": "Tertidur Selamanya",
    "thumbnail": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=300",
    "type": "ending"
  },
  {
    "id": "cg_secret_weapon",
    "title": "Pedang Legendaris",
    "thumbnail": "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=300",
    "type": "cg"
  }
]
```
- `"id"`: Harus unik dan sama persis dengan yang nanti dipanggil di `story.json`.
- `"title"`: Judul yang tampil saat gembok terbuka.
- `"thumbnail"`: URL gambar (*landscape* 16:9). Bebas gunakan *placeholder* seperti Unsplash.
- `"type"`: Kategori (bebas diisi `"ending"`, `"cg"`, `"secret"`, dll).

---

## BAGIAN 2: Pembuatan `story.json`
File cerita dibentuk dari objek JSON utama, di mana **Key** pertama adalah ID dari *Scene* (adegan). Engine akan selalu mencari *Scene* dengan ID `"start"` sebagai titik awal permainan.

```json
{
  "start": {
    "lines": [
      {
        "speaker": "Nama Karakter",
        "text": "Teks dialog di sini."
      }
    ],
    "nextScene": "scene_berikutnya"
  },
  "scene_berikutnya": {
    "lines": []
  }
}
```

### 1. Aturan Navigasi (Wajib Diperhatikan!)
Agar game tidak macet (*softlock*), setiap *Scene* harus memiliki jalan menuju *Scene* lain, KECUALI untuk adegan penutup (Ending). 
Ada 2 cara berpindah *Scene*:

1. **Menggunakan `nextScene`**: Jika adegan berjalan linear. Ditulis sejajar dengan array `"lines"`.
2. **Menggunakan `choices` (Pilihan)**: Jika ada percabangan cerita. Ditaruh di dalam objek/baris (line) terakhir.

*(Catatan: Jangan gabungkan `choices` dan `nextScene` dalam satu baris/scene yang sama).*

---

### 2. Properti yang Tersedia di Setiap Baris (Line)
Di dalam array `"lines"`, setiap objek (baris dialog) dapat menampung properti berikut. **Gunakan hanya yang diperlukan di baris tersebut**, tidak perlu menuliskan properti kosong (seperti `"bg": ""`).

### A. Teks & Narasi
* `"speaker"` *(string)*: Nama karakter yang sedang bicara. Hilangkan properti ini jika baris tersebut adalah narasi (suara hati/narator).
* `"text"` *(string)*: Teks dialog. Mendukung teks panjang, tapi usahakan wajar agar muat di kotak dialog.

### B. Visual (Latar & Karakter)
* `"bg"` *(string)*: Path/URL gambar untuk *Background*. Jika menggunakan file lokal, tulis lokasinya dari dalam folder `public`. (Contoh: `"assets/backgrounds/kelas.jpg"`). Tulis `"clear"` untuk mengosongkan/menghitamkan layar.
* `"spriteLeft"`, `"spriteCenter"`, `"spriteRight"` *(string)*: Path/URL gambar karakter. Tentukan posisi karakter dari awal (kiri, tengah, atau kanan). Anda bisa memunculkan hingga 3 karakter secara bersamaan!
  * Tulis `"clear"` jika ingin menghilangkan karakter dari posisi tersebut.
  * *Engine* akan otomatis meredupkan dan mengecilkan karakter yang sedang tidak berbicara.

### C. Video & Cutscene
* `"video"` *(string)*: Path/URL file video (format .mp4 atau .webm). (Contoh lokal: `"assets/videos/opening.mp4"`). Tulis `"clear"` untuk mematikan video.
  * Jika hanya `"video"` saja, video akan menjadi *Background* (berjalan *loop*) di belakang UI/Karakter.
* `"isCutscene"` *(boolean)*: Tulis `true` jika video ini adalah sinematik murni. UI kotak dialog dan karakter akan **disembunyikan**, lalu game otomatis lompat ke baris selanjutnya jika video sudah tamat. (Pemain bisa klik layar untuk skip).

### D. Audio (Musik & Suara)
* `"bgm"` *(string)*: Path/URL musik latar. Musik akan terus berputar secara *looping* menembus *scene* sampai ditimpa lagu lain. (Contoh lokal: `"assets/sounds/town_bgm.mp3"`). Tulis `"stop"` untuk menghentikan musik sepenuhnya.
* `"sfx"` *(string)*: Path/URL efek suara (petir, ledakan, dll). Akan berbunyi sekali (*one-shot*). (Contoh lokal: `"assets/sounds/lightning.mp3"`).
* `"voice"` *(string)*: Path/URL suara dubbing karakter bicara. Akan berhenti otomatis di baris selanjutnya jika tidak ada suara baru. Tulis `"stop"` untuk memaksa berhenti di tengah jalan.

### E. Sistem Unlock & Galeri
* `"unlockCollection"` *(string)*: Menandai bahwa pemain mendapatkan *Ending* atau *CG (Gallery)*. Masukkan **ID dari Collection** tersebut (misal `"cg_good_ending"`). Kotak di menu "Gallery & Ending" akan otomatis terbuka permanen bagi pemain ini.

### F. Pilihan (Branching)
* `"choices"` *(array of objects)*: Membuat tombol pilihan ganda. HANYA taruh di baris **terakhir** dari sebuah scene. Kotak dialog teks tidak akan memunculkan indikator panah "lanjut" saat ini muncul.
  * Isi formatnya: `[{"text": "Pilihan 1", "target": "id_scene_tujuan"}, {"text": "Pilihan 2", "target": "id_scene_tujuan2"}]`

---

### 3. Contoh `story.json` yang Kompleks
Berikan *prompt* kepada AI Story Generator untuk membuat struktur seperti contoh di bawah ini. Placeholder untuk URL aset (seperti Unsplash, Pixabay, dll) sangat diperbolehkan untuk keperluan *prototyping*.

```json
{
  "start": {
    "lines": [
      {
        "bgm": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "bg": "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1000",
        "sfx": "path/to/suara_angin.mp3",
        "text": "Angin malam berhembus sangat kencang..."
      },
      {
        "speaker": "Pria Misterius",
        "sprite": "https://cdn.pixabay.com/photo/2017/08/01/01/33/beanie-2562646_1280.jpg",
        "spritePos": "center",
        "voice": "path/to/voice_01.mp3",
        "text": "Akhirnya kamu sadar juga."
      },
      {
        "speaker": "Pria Misterius",
        "text": "Ini adalah batas dunia. Apa yang akan kamu lakukan?"
      },
      {
        "speaker": "Sistem",
        "text": "Waktu terus berjalan. Buat keputusanmu sekarang.",
        "choices": [
          {
            "text": "Melawan dan Bertahan",
            "target": "fight_scene"
          },
          {
            "text": "Menyerah pada Takdir",
            "target": "give_up_scene"
          }
        ]
      }
    ]
  },
  
  "fight_scene": {
    "lines": [
      {
        "bgm": "stop",
        "video": "path/to/epic_fight.mp4",
        "isCutscene": true
      },
      {
        "bg": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1000",
        "bgm": "path/to/victory_music.mp3",
        "speaker": "Pria Misterius",
        "text": "Mustahil... Kekuatan macam apa ini?!"
      }
    ],
    "nextScene": "ending_good"
  },
  
  "give_up_scene": {
    "lines": [
      {
        "bg": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1000",
        "sfx": "path/to/game_over_sound.mp3",
        "speaker": "Pria Misterius",
        "text": "Keputusan yang bijak. Tidurlah selamanya."
      }
    ],
    "nextScene": "ending_bad"
  },
  
  "ending_good": {
    "lines": [
      {
        "unlockCollection": "cg_good_ending",
        "text": "Kamu berhasil menyelamatkan dunia."
      }
    ]
  },
  
  "ending_bad": {
    "lines": [
      {
        "unlockCollection": "cg_bad_ending",
        "text": "Kegelapan menelan segalanya."
      }
    ]
  }
}
```

### 4. Aturan Tambahan untuk AI Generator
1. **Dilarang keras memberikan *Trailing Comma*** (koma di akhir array/objek yang tidak memiliki elemen setelahnya) karena akan membuat *parsing* JSON *error* di React.
2. Gunakan `"` (double quote) murni untuk *string* (jangan gunakan quote melengkung gaya MS Word).
3. Jika menggunakan teks ber-kutip di dalam dialog, gunakan karakter *escape* `\"` dengan benar.
4. Selalu akhiri satu rute (contoh di atas `ending_good` dan `ending_bad`) tanpa atribut `"nextScene"` maupun `"choices"`, agar *engine* bisa mendeteksi bahwa game telah tamat (`isEnd`).