# Log Aktivitas Harian ASN — Perkebunan (PWA)

Peluncur **Progressive Web App** untuk aplikasi Log Aktivitas Harian ASN
Dinas Perkebunan Provinsi Jawa Timur.

Repositori ini hanya berisi cangkang aplikasi — manifest, service worker, ikon, dan
alur pemasangan. Seluruh logika dan data tetap berada di Google Apps Script.

```
Pengguna → ketuk ikon aplikasi
        → [peluncur PWA di GitHub Pages]   ← manifest, service worker, ikon, install prompt
        → navigasi ke [Web app Apps Script] ← seluruh logika & data
```

## Kenapa perlu cangkang terpisah?

Google Apps Script selalu merender web app di dalam iframe miliknya sendiri, sehingga
`<link rel="manifest">` dan service worker tidak dapat didaftarkan dari dalam, dan
peristiwa `beforeinstallprompt` tidak pernah sampai ke halaman. Cangkang ini
menyelesaikan ketiganya.

## Kenapa memakai navigasi, bukan iframe?

Web app-nya dideploy dengan akses **"Siapa saja yang memiliki Akun Google"**, jadi
tetap memerlukan login. Alur login Google tidak dapat berjalan di dalam iframe
lintas-origin (menghasilkan galat 401), sehingga peluncur ini membuka aplikasi lewat
navigasi tingkat atas. Halaman tetap berjalan di jendela aplikasi yang terpasang.

## Struktur

| Berkas | Fungsi |
|---|---|
| `index.html` | Peluncur: tombol Buka & Pasang, panduan per platform, indikator offline. Bila sudah terpasang, langsung mengalihkan ke aplikasi |
| `config.js` | Konfigurasi — berisi URL `/exec` web app Apps Script |
| `manifest.webmanifest` | Nama, ikon, warna, `display: standalone`, pintasan Input/Rekap |
| `sw.js` | Service worker; hanya men-cache cangkang, respons Apps Script tidak di-cache |
| `icons/` | Ikon 192, 512, maskable, apple-touch, favicon |
| `tools/make-icons.js` | Generator ikon (`node tools/make-icons.js`) |

## Mengubah URL aplikasi

Bila Anda membuat deployment Apps Script yang baru, perbarui `execUrl` di `config.js`
dengan URL yang berakhiran `/exec`, lalu commit dan push.

## Pemasangan

Buka halaman ini melalui HTTPS, lalu:

- **Android (Chrome/Edge):** ketuk **Pasang Aplikasi**, atau menu ⋮ › Instal aplikasi.
- **Desktop (Chrome/Edge):** ikon instal di ujung kanan bilah alamat.
- **iOS (Safari):** Bagikan › Tambah ke Layar Utama. Di iOS cara paling ringkas justru
  menambahkan URL `/exec` Apps Script langsung ke Layar Utama — halaman itu sudah
  membawa meta tag yang membuatnya terbuka layar penuh.
