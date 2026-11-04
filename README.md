# Bank Mandiri IT Intern - Simulasi Psikotes

Single Page Application (SPA) untuk simulasi tes psikometri seleksi IT Intern Bank Mandiri. Dibangun tanpa framework eksternal (Pure HTML/CSS/JS) dengan desain premium glassmorphism.

## Fitur
- 5 Modul Tes: Logika, Numerik, Verbal, DISC, dan Situational Judgement Test (SJT).
- Countdown Timer dengan visual urgency (merah di bawah 60 detik).
- Sistem skor instan dan Radar Chart/Bar Chart digambar murni dengan HTML5 Canvas.
- Penyimpanan lokal (localStorage) untuk riwayat tes.
- UI responsif dengan tema gelap premium (Bank Mandiri Blue & Gold).

## Menjalankan Aplikasi Lokal
Karena ini adalah file statis murni, Anda dapat membukanya langsung di browser atau menggunakan server lokal.

**Opsi 1: File langsung**
Buka file `index.html` pada browser Anda.

**Opsi 2: Live Server (VSCode)**
Klik kanan pada `index.html` dan pilih "Open with Live Server".

## Menjalankan dengan Docker

1. Build image:
   ```bash
   docker build -t psikotes-mandiri .
   ```
2. Jalankan container:
   ```bash
   docker run -p 8080:80 psikotes-mandiri
   ```
3. Buka browser di `http://localhost:8080`

## Struktur Direktori
- `index.html` - Struktur utama aplikasi
- `css/style.css` - Styling aplikasi
- `js/app.js` - Routing, timer, kontrol tes, dan rendering UI
- `js/scoring.js` - Algoritma skor dan DISC profiling
- `js/questions.js` - Bank data soal (data contract)
