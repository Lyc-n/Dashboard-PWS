-- Penghitung kegagalan login per IP untuk satu PIN global.
--
-- Latar: login aplikasi cuma satu PIN dari environment (`isValidPin` di
-- src/lib/utils.server.ts). Rate limit yang hanya hidup di memory proses tidak
-- cukup — di Vercel tiap instance punya memory sendiri dan restart saat cold
-- start, jadi penghitungnya bisa direset dengan mengirim request ke instance
-- berbeda. Tabel ini yang jadi satu-satunya sumber kebenaran, karena DB
-- benar-benar shared antar-instance.
--
-- Tidak ada kolom user: di sistem ini tidak ada akun per-akun (lihat catatan
-- di src/lib/auth.ts). Kunci `ip` sudah cukup untuk satu gerbang global.
--
-- Berapa lama baris boleh hidup: sampai lockout-nya lewat DAN gagalnya lebih
-- dari sehari, dibersihkan oleh `bersihkanKedaluwarsa`.
BEGIN;

CREATE TABLE IF NOT EXISTS pin_attempts (
  ip               varchar(64) PRIMARY KEY,
  gagal_berturut   integer     NOT NULL DEFAULT 0,
  terkunci_sampai  timestamptz,
  terakhir_gagal   timestamptz NOT NULL DEFAULT now()
);

-- Pencarian selalu per IP, jadi index utama sudah menutup. Index ini untuk
-- pembersihan: menyaring berdasarkan `terkunci_sampai` yang NULL.
CREATE INDEX IF NOT EXISTS pin_attempts_terkunci_idx ON pin_attempts (terkunci_sampai);

COMMIT;