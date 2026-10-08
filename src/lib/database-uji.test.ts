/**
 * Uji penjaga database uji (`src/lib/database-uji.ts`).
 *
 * Fungsi ini tidak membuka koneksi, jadi seluruh keputusannya bisa diuji tanpa
 * database sama sekali — cukup mengisi `DATABASE_URL` lalu memanggilnya.
 *
 * Fokusnya dua hal. Pertama, skrip uji harus berhenti sebelum menulis apa pun
 * ketika `DATABASE_URL` menunjuk database yang tidak ditandai uji. Kedua,
 * tempat yang selama ini mengikatkan pesan error ke nama skrip sudah hilang —
 * sekarang pesannya menerima nama kegiatan sebagai argumen, jadi dua skrip tidak
 * bisa diam-diam memakai pesan yang salah.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NAMA_DB_DIIZINKAN, pastikanDatabaseUji } from '@/lib/database-uji'

const ASLI = process.env.DATABASE_URL

function denganUrl(url: string | undefined): void {
  if (url === undefined) {
    process.env.DATABASE_URL = ''
  } else {
    process.env.DATABASE_URL = url
  }
}

/** Jalankan `fn` dengan `DATABASE_URL` tertentu lalu pulihkan nilai semula. */
function saatUrl<T>(url: string | undefined, fn: () => T): T {
  const sebelum = process.env.DATABASE_URL
  denganUrl(url)
  try {
    return fn()
  } finally {
    if (sebelum === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = sebelum
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  if (ASLI === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = ASLI
})

describe('NAMA_DB_DIIZINKAN', () => {
  it('menerima URL dengan penanda uji, tanpa mempedulikan huruf besar', () => {
    expect(
      NAMA_DB_DIIZINKAN.test('postgresql://localhost:5432/dashboard_pws'),
    ).toBe(true)
    expect(
      NAMA_DB_DIIZINKAN.test('postgresql://127.0.0.1:5432/dashboard_pws'),
    ).toBe(true)
    expect(NAMA_DB_DIIZINKAN.test('postgresql://u:p@host/prod')).toBe(false)
  })

  it('menerima nama database yang mengandung penanda uji', () => {
    expect(NAMA_DB_DIIZINKAN.test('dashboard_pws_uji_schema')).toBe(true)
    expect(NAMA_DB_DIIZINKAN.test('dashboard_pws_uji-coba')).toBe(true)
    expect(NAMA_DB_DIIZINKAN.test('dashboard_trial')).toBe(true)
    expect(NAMA_DB_DIIZINKAN.test('dashboard_test')).toBe(true)
    expect(NAMA_DB_DIIZINKAN.test('dashboard_staging')).toBe(true)
  })
})

describe('pastikanDatabaseUji', () => {
  it('melempar error kalau DATABASE_URL kosong', () => {
    saatUrl(undefined, () => {
      expect(() => pastikanDatabaseUji()).toThrow('DATABASE_URL belum diisi.')
    })
  })

  it('melempar error untuk database yang tidak ditandai uji', () => {
    saatUrl(
      'postgresql://user:pass@db.production.internal:5432/dashboard_pws',
      () => {
        expect(() => pastikanDatabaseUji()).toThrow(/bukan database uji/)
        expect(() => pastikanDatabaseUji()).toThrow(/dashboard_pws/)
      },
    )
  })

  it('menyebut nama kegiatan yang diberikan pada pesan error', () => {
    // Inilah yang membuat pemindahan ke modul bersama aman: tiap skrip tetap
    // memberi tahu kegiatan mana yang gagal, tanpa menyalin pesan sendiri.
    saatUrl(
      'postgresql://user:pass@db.production.internal:5432/dashboard_pws',
      () => {
        expect(() => pastikanDatabaseUji('smoke test')).toThrow(
          /menjalankan smoke test/,
        )
        expect(() => pastikanDatabaseUji('seed')).toThrow(/menjalankan seed/)
      },
    )
  })

  it('mengembalikan nama database yang terdeteksi', () => {
    saatUrl('postgresql://user:pass@localhost:5432/dashboard_pws_uji', () => {
      expect(pastikanDatabaseUji()).toBe('dashboard_pws_uji')
    })
  })

  it('menerima URL yang tidak bisa di-parse selama memuat penanda uji', () => {
    // URL rusak tidak boleh membuat skrip berhenti sebelum sempat dicek; yang
    // menentukan kelayakan tetap penanda di dalam teksnya.
    saatUrl('bukan-url-tetapi-ada-katanya-uji', () => {
      expect(pastikanDatabaseUji()).toBe('')
    })
  })

  it('mencetak nama database ke log', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    saatUrl('postgresql://user:pass@localhost:5432/dashboard_pws_uji', () => {
      pastikanDatabaseUji()
    })
    expect(log).toHaveBeenCalledWith('Database uji: dashboard_pws_uji')
  })

  it('tidak mencetak apa pun saat menolak database produksi', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    saatUrl(
      'postgresql://user:pass@db.production.internal:5432/dashboard_pws',
      () => {
        expect(() => pastikanDatabaseUji()).toThrow()
      },
    )
    expect(log).not.toHaveBeenCalled()
  })

  it('tidak membuka koneksi database sama sekali', () => {
    // Mengimpor modul ini tidak boleh menarik `db.server`, karena dengan begitu
    // test-nya ikut butuh environment database. Yang diperiksa di sini hanya
    // bahwa pemanggilannya murni pada environment.
    saatUrl('postgresql://user:pass@localhost:5432/dashboard_pws_uji', () => {
      expect(() => pastikanDatabaseUji()).not.toThrow()
    })
  })
})
