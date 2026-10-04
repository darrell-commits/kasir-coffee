# Kasir Coffee Shop — Kedai Kopi Senja

Sistem kasir (POS) sederhana untuk coffee shop, dibuat dengan Next.js + MySQL (Laragon) + CSS biasa.

## Fitur yang sudah jadi di paket ini

- Login admin & kasir (password di-hash bcrypt, session JWT httpOnly cookie)
- Proteksi role di middleware (bukan cuma disembunyikan di frontend)
- Halaman kasir/POS: cari & scan kode produk, kategori, keranjang, member + diskon otomatis, pembayaran (cash/QRIS/debit/e-wallet), hitung kembalian
- Transaksi tersimpan atomik (DB transaction) + stok otomatis berkurang
- Struk digital + tombol cetak (print CSS rapi)
- Riwayat transaksi kasir
- Dashboard admin (statistik + stok menipis + transaksi terbaru)
- CRUD produk & kategori (admin)
- Tiap menu punya "gambar" berupa ikon SVG sesuai kategori (Coffee, Non-Coffee, Pastry, Snack) — tidak perlu upload foto

## Yang belum dibuat (lanjutan langkah berikutnya)

- CRUD member & CRUD akun kasir dari UI admin (API-nya sudah ada untuk member; kasir baru perlu halaman `/admin/petugas`)
- Halaman laporan penjualan (`/admin/laporan`)
- Detail transaksi di sisi admin (`/admin/transaksi`)

Kita akan tambahkan satu per satu di percakapan berikutnya.

---

## 1. Persiapan

- **Laragon** sudah terpasang dan MySQL dijalankan (klik **Start All** di Laragon).
- **Node.js** LTS terpasang (`node -v` untuk cek).
- **VS Code** dan **HeidiSQL** terpasang.

## 2. Ekstrak project & install dependency

Ekstrak folder `kasir-coffee` ke `C:\laragon\www\kasir-coffee`, lalu buka terminal di folder itu:

```bash
cd C:\laragon\www\kasir-coffee
npm install
```

## 3. Buat file environment

Salin `.env.local.example` menjadi `.env.local`:

```bash
copy .env.local.example .env.local
```

Buka `.env.local`, sesuaikan bila perlu (default Laragon: user `root`, password kosong, port `3306`).

## 4. Buat database

Buka **HeidiSQL** (lewat Laragon: klik kanan tray icon → HeidiSQL), lalu:

1. Buat koneksi baru ke `localhost` (user `root`, password kosong).
2. Buka file `database/schema.sql` di tab Query, lalu jalankan (klik ▶ atau tekan F9).

Ini akan membuat database `db_kasir_coffee`, semua tabel, kategori, dan contoh menu coffee shop.

## 5. Buat akun admin & kasir (password ter-hash)

Kembali ke terminal VS Code:

```bash
node database/seed-users.js
```

Akan muncul:

```
Akun 'admin' (admin) dibuat.
Akun 'kasir' (kasir) dibuat.
Selesai. Login dengan admin/admin atau kasir/kasir.
```

## 6. Jalankan aplikasi

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

## 7. Testing

| Aksi | Hasil yang diharapkan |
|---|---|
| Login `admin` / `admin` | Masuk ke `/admin/dashboard` |
| Login `kasir` / `kasir` | Masuk ke `/kasir` |
| Login dengan password salah | Muncul pesan "Username atau password salah." |
| Ketik URL `/admin/dashboard` saat login sebagai kasir | Diarahkan kembali ke `/login` |
| Di halaman `/kasir`, klik produk | Produk masuk ke keranjang kanan |
| Pilih "Member", masukkan `08123456789`, klik Cari | Muncul nama "Budi Santoso" + diskon 10% otomatis di ringkasan |
| Isi uang bayar lebih besar dari total, klik Bayar | Diarahkan ke halaman struk, stok produk di admin berkurang |
| Di halaman struk, klik "Cetak Struk" | Muncul preview print browser yang rapi |

## Troubleshooting

- **Error `ECONNREFUSED` saat load produk** → MySQL di Laragon belum jalan, klik Start All.
- **Error `Unknown database 'db_kasir_coffee'`** → Langkah 4 (jalankan `schema.sql`) belum dilakukan.
- **Login selalu gagal walau username/password benar** → Langkah 5 (`node database/seed-users.js`) belum dijalankan, atau `.env.local` salah kredensial.
- **Halaman blank / error alias `@/...`** → pastikan file `jsconfig.json` ada di root project (sudah disertakan di paket ini).

## Struktur folder

```
kasir-coffee/
├── app/
│   ├── login/              → halaman login
│   ├── admin/               → dashboard, produk, kategori (khusus role admin)
│   ├── kasir/               → POS, riwayat, struk (khusus role kasir & admin)
│   └── api/                 → route handler: auth, products, categories, members, transactions
├── components/              → MenuIcon (ikon SVG menu), Sidebar, Topbar
├── lib/                     → db.js (koneksi MySQL), auth.js (session JWT), config.js (diskon member)
├── database/
│   ├── schema.sql            → buat database + tabel + seed produk/kategori/member
│   └── seed-users.js         → buat akun admin & kasir dengan password bcrypt
├── middleware.js             → proteksi route /admin dan /kasir berdasarkan role
└── .env.local.example
```
