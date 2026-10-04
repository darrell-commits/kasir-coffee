// Konfigurasi yang mudah diubah tanpa menyentuh banyak file.

// Diskon member dalam persen (0 - 100).
// Contoh: guru minta ubah jadi 5% -> cukup ubah angka di bawah ini.
export const MEMBER_DISCOUNT_PERCENT = 10;

// Batas stok dianggap "menipis" (dipakai di dashboard admin & badge produk).
export const LOW_STOCK_THRESHOLD = 10;

// Nama toko, diambil dari environment variable agar mudah diganti.
export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Kedai Kopi Senja";
