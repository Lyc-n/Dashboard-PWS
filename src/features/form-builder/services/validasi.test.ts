import { describe, expect, it } from 'vitest'
import {
  validasiAturanField,
  validasiEdisiVersi,
  validasiNik,
  validasiNilaiField,
  validasiOpsiField,
  validasiParentSection,
  validasiTerbitkanVersi
  
} from '@/features/form-builder/services/validasi'
import type {HasilValidasi} from '@/features/form-builder/services/validasi';
import { maskNik } from '@/features/form-builder/services/masking'

function kode(hasil: HasilValidasi): string | null {
  return hasil.ok ? null : hasil.kode
}

describe('validasiOpsiField', () => {
  it('tipe tanpa opsi tetap lolos walau opsi kosong', () => {
    expect(validasiOpsiField({ tipe: 'text', opsi: [] })).toEqual({ ok: true })
  })

  it('select tanpa opsi ditolak', () => {
    expect(kode(validasiOpsiField({ tipe: 'select', opsi: [] }))).toBe('OPSI_KOSONG')
  })

  it('opsi nonaktif tidak dihitung sebagai opsi tersedia', () => {
    const hasil = validasiOpsiField({
      tipe: 'radio',
      opsi: [{ value: 'ya', aktif: false }],
    })
    expect(kode(hasil)).toBe('OPSI_KOSONG')
  })

  it('nilai opsi dobel ditolak', () => {
    const hasil = validasiOpsiField({
      tipe: 'checkbox',
      opsi: [{ value: 'Ya' }, { value: 'Ya' }],
    })
    expect(kode(hasil)).toBe('OPSI_KOSONG')
  })

  it('opsi kosong whitespace ditolak', () => {
    const hasil = validasiOpsiField({ tipe: 'select', opsi: [{ value: '   ' }] })
    expect(kode(hasil)).toBe('OPSI_KOSONG')
  })
})

describe('validasiParentSection', () => {
  const dasar = {
    formVersionId: 'v1',
    parentId: null,
    sectionId: null,
    parentFormVersionId: null,
  }

  it('section tanpa parent lolos', () => {
    expect(validasiParentSection(dasar)).toEqual({ ok: true })
  })

  it('parent dari versi lain ditolak', () => {
    const hasil = validasiParentSection({
      ...dasar,
      parentId: 'p1',
      parentFormVersionId: 'v2',
    })
    expect(kode(hasil)).toBe('PARENT_BEDA_VERSI')
  })

  it('parent dari versi sama lolos', () => {
    expect(
      validasiParentSection({ ...dasar, parentId: 'p1', parentFormVersionId: 'v1' }),
    ).toEqual({ ok: true })
  })

  it('parent yang tidak ada ditolak', () => {
    const hasil = validasiParentSection({
      ...dasar,
      parentId: 'hilang',
      parentFormVersionId: null,
    })
    expect(kode(hasil)).toBe('PARENT_BEDA_VERSI')
  })

  it('section jadi parent dirinya sendiri ditolak', () => {
    const hasil = validasiParentSection({
      ...dasar,
      sectionId: 's1',
      parentId: 's1',
      parentFormVersionId: 'v1',
    })
    expect(kode(hasil)).toBe('PARENT_SAMA_DIRI')
  })

  it('parent berputar ditolak', () => {
    // s1 -> s2 -> s1: saat s1 diubah jadi anak s2, s1 sudah ada di rantai ancestor.
    const hasil = validasiParentSection({
      ...dasar,
      sectionId: 's1',
      parentId: 's2',
      parentFormVersionId: 'v1',
      ancestorIds: ['s2', 's1'],
    })
    expect(kode(hasil)).toBe('PARENT_SIKLUS')
  })
})

describe('validasiEdisiVersi', () => {
  it('draft boleh diedit', () => {
    expect(validasiEdisiVersi('draft')).toEqual({ ok: true })
  })

  it('published tidak boleh diedit', () => {
    expect(kode(validasiEdisiVersi('published'))).toBe('VERSI_SUDAH_TERBIT')
  })

  it('archived tidak boleh diedit', () => {
    expect(kode(validasiEdisiVersi('archived'))).toBe('VERSI_BUKAN_DRAFT')
  })

  it('versi hilang ditolak', () => {
    expect(kode(validasiEdisiVersi(null))).toBe('VERSI_TIDAK_ADA')
  })
})

describe('validasiTerbitkanVersi', () => {
  it('draft boleh diterbitkan', () => {
    expect(validasiTerbitkanVersi('draft')).toEqual({ ok: true })
  })

  it('published tidak boleh diterbitkan dua kali', () => {
    expect(kode(validasiTerbitkanVersi('published'))).toBe('VERSI_SUDAH_TERBIT')
  })

  it('archived tidak boleh diterbitkan', () => {
    expect(kode(validasiTerbitkanVersi('archived'))).toBe('VERSI_BUKAN_DRAFT')
  })
})

describe('validasiAturanField', () => {
  it('opsi tanpa nilai ditolak', () => {
    const hasil = validasiAturanField({
      tipe: 'option',
      sourceFieldId: null,
      operator: null,
      value: null,
      fieldFormVersionId: 'v1',
    })
    expect(kode(hasil)).toBe('ATURAN_TIDAK_LENGKAP')
  })

  it('visibility tanpa sumber ditolak', () => {
    const hasil = validasiAturanField({
      tipe: 'visibility',
      sourceFieldId: null,
      operator: 'equals',
      value: 'Ya',
      fieldFormVersionId: 'v1',
    })
    expect(kode(hasil)).toBe('ATURAN_TIDAK_LENGKAP')
  })

  it('visibility tanpa operator ditolak', () => {
    const hasil = validasiAturanField({
      tipe: 'visibility',
      sourceFieldId: 'f1',
      operator: null,
      value: 'Ya',
      fieldFormVersionId: 'v1',
    })
    expect(kode(hasil)).toBe('ATURAN_TIDAK_LENGKAP')
  })

  it('sumber dari versi lain ditolak', () => {
    const hasil = validasiAturanField({
      tipe: 'visibility',
      sourceFieldId: 'f1',
      operator: 'equals',
      value: 'Ya',
      fieldFormVersionId: 'v1',
      sourceFormVersionId: 'v2',
    })
    expect(kode(hasil)).toBe('ATURAN_SUMBER_BEDA_VERSI')
  })

  it('visibility lengkap dari versi sama lolos', () => {
    const hasil = validasiAturanField({
      tipe: 'visibility',
      sourceFieldId: 'f1',
      operator: 'equals',
      value: 'Ya',
      fieldFormVersionId: 'v1',
      sourceFormVersionId: 'v1',
    })
    expect(hasil).toEqual({ ok: true })
  })
})

describe('validasiNilaiField', () => {
  const opsi = [{ value: 'Ya' }, { value: 'Tidak' }]

  it('nilai kosong dianggap belum diisi dan lolos', () => {
    expect(validasiNilaiField({ tipe: 'text', value: null })).toEqual({ ok: true })
    expect(validasiNilaiField({ tipe: 'text', value: '' })).toEqual({ ok: true })
  })

  it('text menolak angka', () => {
    expect(kode(validasiNilaiField({ tipe: 'text', value: 42 }))).toBe('NILAI_TIDAK_COCOK')
  })

  it('number menolak teks', () => {
    expect(kode(validasiNilaiField({ tipe: 'number', value: '42' }))).toBe('NILAI_TIDAK_COCOK')
  })

  it('number menolak NaN dan Infinity', () => {
    expect(kode(validasiNilaiField({ tipe: 'number', value: Number.NaN }))).toBe(
      'NILAI_TIDAK_COCOK',
    )
    expect(kode(validasiNilaiField({ tipe: 'number', value: Infinity }))).toBe(
      'NILAI_TIDAK_COCOK',
    )
  })

  it('date menolak tanggal yang tidak ada di kalender', () => {
    expect(kode(validasiNilaiField({ tipe: 'date', value: '2026-02-30' }))).toBe(
      'NILAI_TIDAK_COCOK',
    )
    expect(validasiNilaiField({ tipe: 'date', value: '2026-02-28' })).toEqual({ ok: true })
  })

  it('date menolak format lain', () => {
    expect(kode(validasiNilaiField({ tipe: 'date', value: '28-02-2026' }))).toBe(
      'NILAI_TIDAK_COCOK',
    )
  })

  it('time menolak jam di luar 24 jam', () => {
    expect(kode(validasiNilaiField({ tipe: 'time', value: '24:00' }))).toBe('NILAI_TIDAK_COCOK')
    expect(validasiNilaiField({ tipe: 'time', value: '23:59' })).toEqual({ ok: true })
  })

  it('radio menolak jawaban di luar opsi', () => {
    expect(kode(validasiNilaiField({ tipe: 'radio', value: 'Mungkin', opsi }))).toBe(
      'NILAI_TIDAK_COCOK',
    )
    expect(validasiNilaiField({ tipe: 'radio', value: 'Ya', opsi })).toEqual({ ok: true })
  })

  it('checkbox menolak nilai tunggal, harus daftar', () => {
    expect(kode(validasiNilaiField({ tipe: 'checkbox', value: 'Ya', opsi }))).toBe(
      'NILAI_TIDAK_COCOK',
    )
  })

  it('checkbox menerima daftar opsi', () => {
    expect(
      validasiNilaiField({ tipe: 'checkbox', value: ['Ya', 'Tidak'], opsi }),
    ).toEqual({ ok: true })
  })

  it('checkbox menolak daftar yang partly di luar opsi', () => {
    const hasil = validasiNilaiField({
      tipe: 'checkbox',
      value: ['Ya', 'Mungkin'],
      opsi,
    })
    expect(kode(hasil)).toBe('NILAI_TIDAK_COCOK')
  })

  it('opsi nonaktif tidak boleh dipilih', () => {
    const hasil = validasiNilaiField({
      tipe: 'select',
      value: 'Ya',
      opsi: [{ value: 'Ya', aktif: false }],
    })
    expect(kode(hasil)).toBe('NILAI_TIDAK_COCOK')
  })

  it('image dan file tidak divalidasi di sini', () => {
    expect(validasiNilaiField({ tipe: 'image', value: 123 })).toEqual({ ok: true })
    expect(validasiNilaiField({ tipe: 'file', value: 123 })).toEqual({ ok: true })
  })
})

describe('validasiNik', () => {
  it('16 digit lolos', () => {
    expect(validasiNik('3273010101900001')).toEqual({ ok: true })
  })

  it('huruf dan panjang salah ditolak', () => {
    expect(kode(validasiNik('327301010190000A'))).toBe('NIK_TIDAK_VALID')
    expect(kode(validasiNik('12345'))).toBe('NIK_TIDAK_VALID')
  })
})

describe('maskNik', () => {
  it('menyembunyikan digit tengah dan mempertahankan 4 digit depan/belakang', () => {
    expect(maskNik('3273010101900001')).toBe('3273****0001')
  })

  it('NIK pendek tidak bocor dan tidak error', () => {
    expect(maskNik('123')).toBe('****')
    expect(maskNik('12345678')).toBe('1234****5678')
  })

  it('hasil masking tidak mengandung NIK penuh', () => {
    const nik = '3273010101900001'
    expect(maskNik(nik)).not.toContain(nik)
    expect(maskNik(nik)).toHaveLength(12)
  })
})
