import { describe, expect, it } from 'vitest'
import { draftKeRuntime, hitungDepthClient } from './draft-ke-runtime'
import type { DraftField, DraftFormDocument, DraftSection } from '../types'

function section(
  partial: Partial<DraftSection> & { clientId: string },
): DraftSection {
  return {
    id: null,
    parentClientId: null,
    nama: 'Section',
    deskripsi: null,
    aktif: true,
    ...partial,
  }
}

function field(
  partial: Partial<DraftField> & { clientId: string },
): DraftField {
  return {
    id: null,
    sectionClientId: 's1',
    nama: 'nama_field',
    label: 'Label',
    tipe: 'text',
    wajib: false,
    aktif: true,
    placeholder: null,
    deskripsi: null,
    jumlahKolom: null,
    optionSourceType: null,
    optionSourceKey: null,
    opsi: [],
    aturan: [],
    ...partial,
  }
}

function documentOf(
  sections: DraftSection[],
  fields: DraftField[],
): DraftFormDocument {
  return { formVersionId: 'v1', sections, fields }
}

describe('hitungDepthClient', () => {
  it('root depth 0, anak 1, cucu 2', () => {
    const depth = hitungDepthClient([
      section({ clientId: 'a' }),
      section({ clientId: 'b', parentClientId: 'a' }),
      section({ clientId: 'c', parentClientId: 'b' }),
    ])

    expect(depth.get('a')).toBe(0)
    expect(depth.get('b')).toBe(1)
    expect(depth.get('c')).toBe(2)
  })

  it('parent yang tidak ada dihitung sebagai root', () => {
    const depth = hitungDepthClient([
      section({ clientId: 'a', parentClientId: 'hilang' }),
    ])
    expect(depth.get('a')).toBe(0)
  })

  it('siklus parent berhenti, tidak loop tak berujung', () => {
    const depth = hitungDepthClient([
      section({ clientId: 'a', parentClientId: 'b' }),
      section({ clientId: 'b', parentClientId: 'a' }),
    ])

    // Rantai berhenti saat id yang sama muncul dua kali; yang penting selesai.
    expect(depth.get('a')).toBeGreaterThanOrEqual(0)
    expect(depth.get('b')).toBeGreaterThanOrEqual(0)
  })

  it('rantai panjang dipotong di batas kedalaman', () => {
    const sections = Array.from({ length: 12 }, (_, i) =>
      section({
        clientId: `s${i}`,
        parentClientId: i === 0 ? null : `s${i - 1}`,
      }),
    )
    const depth = hitungDepthClient(sections)
    expect(depth.get('s11')).toBe(5)
  })
})

describe('draftKeRuntime', () => {
  it('section dan field nonaktif dibuang', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [
          section({ clientId: 's1' }),
          section({ clientId: 's2', aktif: false }),
        ],
        [
          field({ clientId: 'f1', sectionClientId: 's1' }),
          field({ clientId: 'f2', sectionClientId: 's1', aktif: false }),
          field({ clientId: 'f3', sectionClientId: 's2' }),
        ],
      ),
    )

    expect(hasil.sections).toHaveLength(1)
    expect(hasil.sections[0]!.fields.map((f) => f.id)).toEqual(['f1'])
    expect(hasil.fieldYatim).toHaveLength(0)
  })

  it('field tanpa section dipisah, section tanpa parent jadi root', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1', parentClientId: 'hilang' })],
        [
          field({ clientId: 'f1', sectionClientId: 's1' }),
          field({ clientId: 'f9', sectionClientId: 's9' }),
        ],
      ),
    )

    expect(hasil.sections[0]!.parentId).toBeNull()
    expect(hasil.sections[0]!.depth).toBe(0)
    expect(hasil.fieldYatim.map((f) => f.id)).toEqual(['f9'])
  })

  it('id field memakai clientId dan urutannya indeks', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({ clientId: 'f1', sectionClientId: 's1' }),
          field({ clientId: 'f2', sectionClientId: 's1' }),
        ],
      ),
    )

    expect(hasil.sections[0]!.fields.map((f) => [f.id, f.urutan])).toEqual([
      ['f1', 0],
      ['f2', 1],
    ])
  })

  it('opsi diurutkan indeks dan label jatuh ke value', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'select',
            opsi: [
              { clientId: 'o1', value: ' a ', label: '', aktif: true },
              { clientId: 'o2', value: 'b', label: ' B ', aktif: false },
            ],
          }),
        ],
      ),
    )

    expect(hasil.sections[0]!.fields[0]!.opsi).toEqual([
      { value: 'a', label: 'a', urutan: 0, aktif: true },
      { value: 'b', label: 'B', urutan: 1, aktif: false },
    ])
  })

  it('opsiDinamis null dan sumber tidak dikenali false', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [field({ clientId: 'f1', sectionClientId: 's1' })],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.opsiDinamis).toBeNull()
    expect(f.sumberOpsiTidakDikenali).toBe(false)
  })

  it('nama kosong tidak jadi undefined dan label punya teks pengganti', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1', nama: '  ' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            nama: ' ',
            label: '',
          }),
        ],
      ),
    )

    expect(hasil.sections[0]!.nama).toBe('(section tanpa nama)')
    expect(hasil.sections[0]!.fields[0]!.nama).toBe('')
    expect(hasil.sections[0]!.fields[0]!.label).toBe('(tanpa label)')
  })

  it('aturan visibility membawa sourceClientId sebagai sourceFieldId', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({ clientId: 'f1', sectionClientId: 's1' }),
          field({
            clientId: 'f2',
            sectionClientId: 's1',
            aturan: [
              {
                clientId: 'r1',
                sourceClientId: 'f1',
                operator: 'equals',
                value: ' ya ',
                aktif: true,
              },
            ],
          }),
        ],
      ),
    )

    expect(hasil.sections[0]!.fields[1]!.aturan).toEqual([
      {
        id: 'r1',
        sourceFieldId: 'f1',
        operator: 'equals',
        value: 'ya',
        label: null,
        urutan: 0,
        aktif: true,
      },
    ])
  })

  it('nilai aturan kosong jadi null', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            aturan: [
              {
                clientId: 'r1',
                sourceClientId: 'f1',
                operator: 'not_equals',
                value: '  ',
                aktif: true,
              },
            ],
          }),
        ],
      ),
    )

    expect(hasil.sections[0]!.fields[0]!.aturan[0]!.value).toBeNull()
  })

  it('jumlah kolom group diteruskan', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'group',
            jumlahKolom: 3,
          }),
        ],
      ),
    )

    expect(hasil.sections[0]!.fields[0]!.jumlahKolom).toBe(3)
  })
})

describe('draftKeRuntime: sumber opsi', () => {
  it('sumber enum di-resolve di klien tanpa query', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'select',
            optionSourceType: 'enum',
            optionSourceKey: 'agama',
          }),
        ],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.opsiDinamis?.map((o) => o.value)).toContain('Islam')
    expect(f.opsiDinamis?.map((o) => o.value)).toContain('Kristen')
    expect(f.sumberOpsiLabel).toBe('Agama')
    // Opsi statis sengaja tidak dipakai kalau sumber aktif.
    expect(f.opsi).toEqual([])
  })

  it('sumber yang butuh database tidak dikarang di pratinjau', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'select',
            optionSourceType: 'users',
            optionSourceKey: 'petugas',
          }),
        ],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.opsiDinamis).toBeNull()
    // Bukan salah konfigurasi, jadi tidak ditandai "tidak dikenali".
    expect(f.sumberOpsiTidakDikenali).toBe(false)
    expect(f.sumberOpsiLabel).toContain('petugas')
  })

  it('sumber data warga tanpa key tidak diarang', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'select',
            optionSourceType: 'warga',
            optionSourceKey: 'nama_art',
          }),
        ],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.opsiDinamis).toBeNull()
    expect(f.sumberOpsiLabel).toContain('Nama warga')
  })

  it('daftar saran mengisi saran dan opsiDinamis', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'text',
            optionSourceType: 'suggest',
            opsi: [
              { clientId: 'o1', value: 'Budi Santoso', label: '', aktif: true },
              {
                clientId: 'o2',
                value: 'Siti Aminah',
                label: 'Siti A.',
                aktif: true,
              },
            ],
          }),
        ],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.saran).toEqual(['Budi Santoso', 'Siti A.'])
    expect(f.opsiDinamis?.map((o) => o.value)).toEqual([
      'Budi Santoso',
      'Siti Aminah',
    ])
  })

  it('field tanpa sumber tetap tanpa opsiDinamis', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [field({ clientId: 'f1', sectionClientId: 's1' })],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.opsiDinamis).toBeNull()
    expect(f.sumberOpsiLabel).toBeNull()
    expect(f.saran).toEqual([])
  })

  it('sumber tak dikenal tidak diarang, tapi labelnya tetap tampil', () => {
    const hasil = draftKeRuntime(
      documentOf(
        [section({ clientId: 's1' })],
        [
          field({
            clientId: 'f1',
            sectionClientId: 's1',
            tipe: 'select',
            optionSourceType: 'entah',
            optionSourceKey: 'x',
          }),
        ],
      ),
    )

    const f = hasil.sections[0]!.fields[0]!
    expect(f.opsiDinamis).toBeNull()
    expect(f.sumberOpsiLabel).toBeNull()
  })
})
