/**
 * Uji pembantu komponen laporan (`features/laporan/components/report-shared.ts`).
 *
 * `paginate` muncul di kop surat yang dicetak, jadi lebar halaman dan nomor
 * halaman ikut menentukan isi laporan. Tes ini mengunci perhitungan offset dan
 * nomor halaman — termasuk kasus batasnya yang menghasilkan angka aneh.
 *
 * Perilaku aneh itu TIDAK dibetulkan di sini; hanya dicatat supaya tidak
 * disalahpahami sebagai bug pada saat penginstalan ini berikutnya. Perbaikannya
 * perlu keputusan produk: nomor halaman untuk daftar kosong bisa ditulis "Hal 1
 * · 0 dari 0", atau barisnya dihilangkan altogether.
 */
import { describe, expect, it } from 'vitest'
import {
  BRAND_ADDRESS,
  paginate,
  TODAY,
} from '@/features/laporan/components/report-shared'

describe('paginate', () => {
  it('menghitung maxPage dari jumlah baris dan ukuran halaman', () => {
    const baris = Array.from({ length: 25 }, (_, i) => i + 1)
    expect(paginate(baris, 1, 10).maxPage).toBe(3)
    expect(paginate(baris.slice(0, 20), 1, 10).maxPage).toBe(2)
    expect(paginate(baris.slice(0, 10), 1, 10).maxPage).toBe(1)
  })

  it('mengirim baris milik halaman yang diminta', () => {
    const baris = Array.from({ length: 25 }, (_, i) => i + 1)
    expect(paginate(baris, 1, 10).pageRows).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(paginate(baris, 2, 10).pageRows).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
    expect(paginate(baris, 3, 10).pageRows).toEqual([21, 22, 23, 24, 25])
  })

  it('menjepit halaman yang melebihi batas ke halaman terakhir', () => {
    // Tanpa penjepitan, `slice` mengembalikan baris kosong dan kop surat akan
    // tercetak tanpa isi sama sekali.
    const baris = Array.from({ length: 25 }, (_, i) => i + 1)
    const hasil = paginate(baris, 99, 10)
    expect(hasil.pageClamped).toBe(3)
    expect(hasil.pageRows).toEqual([21, 22, 23, 24, 25])
  })

  it('halaman terakhir yang tidak penuh hanya mengambil sisa baris', () => {
    const hasil = paginate(
      Array.from({ length: 25 }, (_, i) => i + 1),
      3,
      10,
    )
    expect(hasil.pageRows).toHaveLength(5)
  })

  it('menyusun teks kop dengan nomor urut dan total benar', () => {
    const baris = Array.from({ length: 25 }, (_, i) => i + 1)
    expect(paginate(baris, 1, 10).info).toBe('Hal 1 · 1–10 dari 25')
    expect(paginate(baris, 2, 10).info).toBe('Hal 2 · 11–20 dari 25')
    // Baris terakhir tidak penuh, jadi angka atasnya ikut dipotong ke total.
    expect(paginate(baris, 3, 10).info).toBe('Hal 3 · 21–25 dari 25')
  })

  it('daftar kosong menghasilkan maxPage 1 tanpa baris', () => {
    const hasil = paginate([], 1, 10)
    expect(hasil.maxPage).toBe(1)
    expect(hasil.pageClamped).toBe(1)
    expect(hasil.pageRows).toEqual([])
  })

  it('daftar kosong menghasilkan nomor urut menurun — perilaku yang perlu diputuskan', () => {
    // Dikunci apa adanya: "1–0" terlihat salah, tapi mengoreksinya berarti
    // mengubah isi kop surat yang sudah tercetak. Lihat catatan di kepala file.
    expect(paginate([], 1, 10).info).toBe('Hal 1 · 1–0 dari 0')
  })

  it('pageSize 0 tidak melempar error', () => {
    // Pembagian dengan nol menghasilkan Infinity, bukan exception. `pageRows`
    // kosong karena `slice(0, 0)`.
    const hasil = paginate([1, 2, 3], 1, 0)
    expect(hasil.pageRows).toEqual([])
    expect(Number.isFinite(hasil.maxPage)).toBe(false)
  })

  it('halaman 0 atau negatif tidak dijepit ke 1', () => {
    // `page` hanya dijepit dari atas, bukan dari bawah. Nomor baris jadi negatif
    // di teks kop. Dikunci apa adanya supaya tidak berubah diam-diam.
    const hasil = paginate([1, 2, 3, 4, 5], 0, 2)
    expect(hasil.pageClamped).toBe(0)
    expect(hasil.pageRows).toEqual([])
  })
})

describe('konstanta kop surat', () => {
  it('BRAND_ADDRESS tidak kosong dan memuat nama puskesmas', () => {
    expect(BRAND_ADDRESS).toContain('Puskesmas')
    expect(BRAND_ADDRESS.length).toBeGreaterThan(0)
  })

  it('TODAY berformat tanggal Indonesia', () => {
    // Nilai dihitung sekali saat modul dimuat, jadi hanya polanya yang diuji.
    expect(TODAY).toMatch(/\d{1,2} \w+ \d{4}/)
  })
})
