import { describe, expect, it } from 'vitest'
import {
  SUMBER_CARI_WARGA,
  SUMBER_OPSI,
  SUMBER_SUGGEST,
  WARGA_KEYS,
  cariSumber,
  nilaiEnum,
  sumberOpsiPerKelompok,
  tipeBolehPakaiSumber,
} from './sumber-opsi'
import { AGAMA_VALUES, JENIS_KELAMIN_VALUES } from '@/lib/enum-values'

describe('katalog sumber opsi', () => {
  it('tidak ada type+key yang sama dua kali', () => {
    const kunci = SUMBER_OPSI.map((s) => `${s.type}::${s.key}`)
    expect(new Set(kunci).size).toBe(kunci.length)
  })

  it('semua sumber punya type, key, dan label', () => {
    for (const s of SUMBER_OPSI) {
      expect(s.type.length).toBeGreaterThan(0)
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.key.length).toBeGreaterThan(0)
    }
  })

  it('sumber enum punya daftar nilai yang tidak kosong', () => {
    for (const s of SUMBER_OPSI.filter((x) => x.type === 'enum')) {
      const nilai = nilaiEnum(s.key)
      expect(nilai, `sumber ${s.key} tidak punya daftar nilai`).not.toBeNull()
      expect((nilai ?? []).length).toBeGreaterThan(0)
    }
  })

  it('daftar nilai enum sama persis dengan enum data warga', () => {
    expect(nilaiEnum('agama')).toEqual(AGAMA_VALUES)
    expect(nilaiEnum('jenis_kelamin')).toEqual(JENIS_KELAMIN_VALUES)
  })

  it('key yang tidak dikenal tidak punya daftar nilai', () => {
    expect(nilaiEnum('entah')).toBeNull()
  })

  it('setiap kelompok punya minimal satu sumber', () => {
    const kelompok = sumberOpsiPerKelompok().map((g) => g.kelompok)
    expect(kelompok).toContain('Kategori warga')
    expect(kelompok).toContain('Saran')
    expect(kelompok).toContain('Data warga')
  })

  it('sumber data warga hanya memakai key yang ada di daftar', () => {
    for (const s of SUMBER_OPSI.filter((x) => x.type === 'warga')) {
      expect(WARGA_KEYS).toContain(s.key)
    }
  })
})

describe('cariSumber', () => {
  it('type dan key dicocokkan keduanya', () => {
    expect(cariSumber('enum', 'agama')?.label).toBe('Agama')
    expect(cariSumber('enum', 'pekerjaan')?.label).toBe('Pekerjaan')
    expect(cariSumber('enum', 'entah')).toBeNull()
  })

  it('type saja cukup saat key kosong (data lama tanpa key)', () => {
    expect(cariSumber('users', null)?.label).toContain('petugas')
    expect(cariSumber('users', '')?.label).toContain('petugas')
  })

  it('suggest dicocokkan tanpa key', () => {
    expect(cariSumber(SUMBER_SUGGEST, null)?.label).toContain('saran')
  })

  it('type null berarti tidak ada sumber', () => {
    expect(cariSumber(null, 'agama')).toBeNull()
  })
})

describe('tipeBolehPakaiSumber', () => {
  it('select boleh memakai sumber enum', () => {
    expect(
      tipeBolehPakaiSumber({ tipe: 'select', type: 'enum', key: 'agama' }),
    ).toBe(true)
  })

  it('field teks hanya boleh memakai daftar saran atau pencarian warga', () => {
    expect(
      tipeBolehPakaiSumber({ tipe: 'text', type: SUMBER_SUGGEST, key: 'text' }),
    ).toBe(true)
    expect(
      tipeBolehPakaiSumber({ tipe: 'text', type: 'enum', key: 'agama' }),
    ).toBe(false)
    expect(
      tipeBolehPakaiSumber({ tipe: 'text', type: 'users', key: 'petugas' }),
    ).toBe(false)
  })

  it('pencarian warga hanya boleh dipakai pada field teks', () => {
    for (const key of ['nama_art', 'nama_kk', 'nik']) {
      expect(
        tipeBolehPakaiSumber({ tipe: 'text', type: SUMBER_CARI_WARGA, key }),
        key,
      ).toBe(true)
      // Dropdown dan `<datalist>` tidak berlaku di select, jadi offering
      // sumber ini di sana akan表现为 dropdown kosong tanpa penjelasan.
      expect(
        tipeBolehPakaiSumber({ tipe: 'select', type: SUMBER_CARI_WARGA, key }),
        key,
      ).toBe(false)
    }
    // Field dengan kolom bukan teks: input tanggal/number tidak punya dropdown.
    expect(
      tipeBolehPakaiSumber({
        tipe: 'number',
        type: SUMBER_CARI_WARGA,
        key: 'nik',
      }),
    ).toBe(false)
    expect(
      tipeBolehPakaiSumber({
        tipe: 'date',
        type: SUMBER_CARI_WARGA,
        key: 'nama_art',
      }),
    ).toBe(false)
  })

  it('select tidak boleh memakai daftar saran', () => {
    expect(
      tipeBolehPakaiSumber({
        tipe: 'select',
        type: SUMBER_SUGGEST,
        key: 'text',
      }),
    ).toBe(false)
  })

  it('pencarian warga dengan kolom tak dikenal tidak boleh dipasang', () => {
    // Key menentukan kolom mana yang mengisi field, jadi key yang tidak dikenal
    // berarti form tidak punya cara tahu apa yang harus diisi.
    expect(
      tipeBolehPakaiSumber({
        tipe: 'text',
        type: SUMBER_CARI_WARGA,
        key: 'entah',
      }),
    ).toBe(false)
  })

  it('sumber tak dikenal tidak boleh dipasang', () => {
    expect(
      tipeBolehPakaiSumber({ tipe: 'select', type: 'entah', key: 'x' }),
    ).toBe(false)
  })

  it('tanpa sumber apa pun tetap boleh', () => {
    expect(
      tipeBolehPakaiSumber({ tipe: 'number', type: null, key: null }),
    ).toBe(true)
  })
})
