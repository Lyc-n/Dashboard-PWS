import { describe, expect, it } from 'vitest'
import {
  susunUlangFieldSetelahDrag,
  susunUlangSectionSetelahDrag,
} from './drag-reorder'
import type { DraftField, DraftSection } from './types'

const sections: DraftSection[] = [
  { id: 's1', clientId: 's1', nama: 'S1', deskripsi: null, aktif: true },
  { id: 's2', clientId: 's2', nama: 'S2', deskripsi: null, aktif: true },
]

function buatField(
  partial: Partial<DraftField> &
    Pick<DraftField, 'clientId' | 'sectionClientId'>,
): DraftField {
  return {
    id: partial.clientId,
    nama: partial.clientId,
    label: partial.clientId,
    tipe: 'text',
    wajib: false,
    aktif: true,
    placeholder: null,
    deskripsi: null,
    jumlahKolom: null,
    optionSourceType: null,
    optionSourceKey: null,
    opsi: [],
    ...partial,
  }
}

describe('susunUlangFieldSetelahDrag', () => {
  it('reorder field dalam section yang sama', () => {
    const fields = [
      buatField({ clientId: 'f1', sectionClientId: 's1' }),
      buatField({ clientId: 'f2', sectionClientId: 's1' }),
    ]
    const moved = { s1: ['f2', 'f1'], s2: [] }
    const hasil = susunUlangFieldSetelahDrag(sections, fields, moved)
    expect(hasil.map((f) => f.clientId)).toEqual(['f2', 'f1'])
    expect(hasil.map((f) => f.sectionClientId)).toEqual(['s1', 's1'])
  })

  it('memindahkan field dari section A ke section B dan memperbarui sectionClientId', () => {
    const fields = [
      buatField({ clientId: 'f1', sectionClientId: 's1' }),
      buatField({ clientId: 'f2', sectionClientId: 's2' }),
    ]
    const moved = { s1: [], s2: ['f2', 'f1'] }
    const hasil = susunUlangFieldSetelahDrag(sections, fields, moved)
    expect(hasil.map((f) => f.clientId)).toEqual(['f2', 'f1'])
    expect(hasil[1]?.sectionClientId).toBe('s2')
  })

  it('mempertahankan field yang tidak tercakup dalam hasil move di akhir', () => {
    const fields = [
      buatField({ clientId: 'f1', sectionClientId: 's1' }),
      buatField({ clientId: 'f2', sectionClientId: 's1' }),
    ]
    const moved = { s1: ['f1'], s2: [] } // f2 tidak tercakup
    const hasil = susunUlangFieldSetelahDrag(sections, fields, moved)
    expect(hasil.map((f) => f.clientId)).toEqual(['f1', 'f2'])
  })

  it('mempertahankan field yatim sesuai perilaku lama', () => {
    const fields = [
      buatField({ clientId: 'fy', sectionClientId: 's-hilang' }),
      buatField({ clientId: 'f1', sectionClientId: 's1' }),
    ]
    const moved = { s1: ['f1'], s2: [] }
    const hasil = susunUlangFieldSetelahDrag(sections, fields, moved)
    expect(hasil.some((f) => f.clientId === 'fy')).toBe(true)
    expect(hasil.some((f) => f.clientId === 'f1')).toBe(true)
  })

  it('tidak ada field yang hilang atau terduplikasi', () => {
    const fields = [
      buatField({ clientId: 'f1', sectionClientId: 's1' }),
      buatField({ clientId: 'f2', sectionClientId: 's1' }),
      buatField({ clientId: 'f3', sectionClientId: 's2' }),
    ]
    const moved = { s1: ['f2'], s2: ['f3'] } // f1 tidak tercakup
    const hasil = susunUlangFieldSetelahDrag(sections, fields, moved)
    expect(hasil.map((f) => f.clientId)).toEqual(['f2', 'f3', 'f1'])
    expect(new Set(hasil.map((f) => f.clientId)).size).toBe(3)
  })

  it('menangani hasil move kosong atau tidak lengkap', () => {
    const fields = [buatField({ clientId: 'f1', sectionClientId: 's1' })]
    const moved = { s1: [], s2: [] }
    const hasil = susunUlangFieldSetelahDrag(sections, fields, moved)
    expect(hasil.map((f) => f.clientId)).toEqual(['f1'])
  })
})

describe('susunUlangSectionSetelahDrag', () => {
  it('reorder section', () => {
    const moved = ['s2', 's1']
    const hasil = susunUlangSectionSetelahDrag(sections, moved)
    expect(hasil.map((s) => s.clientId)).toEqual(['s2', 's1'])
  })

  it('mempertahankan section yang tidak tercakup di hasil move di akhir', () => {
    const moved = ['s2']
    const hasil = susunUlangSectionSetelahDrag(sections, moved)
    expect(hasil.map((s) => s.clientId)).toEqual(['s2', 's1'])
  })

  it('menangani hasil move tidak lengkap/empty', () => {
    const moved: string[] = []
    const hasil = susunUlangSectionSetelahDrag(sections, moved)
    expect(hasil.map((s) => s.clientId)).toEqual(['s1', 's2'])
  })
})
