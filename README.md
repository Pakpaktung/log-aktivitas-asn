# Log Aktivitas Harian ASN — Perkebunan (PWA)

Cangkang **Progressive Web App** untuk aplikasi Log Aktivitas Harian ASN
Dinas Perkebunan Provinsi Jawa Timur.

Repositori ini hanya berisi cangkang aplikasi (manifest, service worker, ikon,
dan dialog pemasangan). Seluruh logika dan data tetap berada di Google Apps Script
yang dimuat di dalam iframe.

```
Pengguna → [cangkang PWA di GitHub Pages]  ← manifest, service worker, ikon, install prompt
                       └── iframe → [Web app Apps Script]  ← seluruh logika & data
```

## Kenapa perlu cangkang terpisah?

Google Apps Script selalu merender web app di dalam iframe miliknya sendiri, sehingga
`<link rel="manifest">` dan service worker tidak dapat didaftarkan dari dalam, dan
peristiwa `beforeinstallprompt` tidak pernah sampai ke halaman. Cangkang ini
menyelesaikan ketiganya.

## Struktur

| Berkas | Fungsi |
|---|---|
| `index.html` | Splash screen, iframe aplikasi, tombol Pasang, panduan iOS, indikator offline |
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

- **Android (Chrome/Edge):** ketuk tombol **Pasang Aplikasi**, atau menu ⋮ › Instal aplikasi.
- **iOS (Safari):** Bagikan › Tambah ke Layar Utama.
- **Desktop (Chrome/Edge):** ikon instal di ujung kanan bilah alamat.
