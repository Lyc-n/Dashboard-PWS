import { describe, expect, it } from 'vitest'
import { cariSectionTargetUntukPalette } from './drag-target'
import type { DraftField, DraftSection } from './types'

const sections: DraftSection[] = [
  { id: 's1', clientId: 's1', nama: 'S1', deskripsi: null, aktif: true },
  { id: 's2', clientId: 's2', nama: 'S2', deskripsi: null, aktif: true },
]

const fields: DraftField[] = [
  {
    id: 'f1',
    clientId: 'f1',
    sectionClientId: 's1',
    nama: 'f1',
    label: 'F1',
    tipe: 'text',
    wajib: false,
    aktif: true,
    placeholder: null,
    deskripsi: null,
    jumlahKolom: null,
    optionSourceType: null,
    optionSourceKey: null,
    opsi: [],
  },
]

describe('cariSectionTargetUntukPalette', () => {
  it('target berupa section yang masih ada', () => {
    expect(
      cariSectionTargetUntukPalette(
        { kind: 'section', clientId: 's2' },
        sections,
        fields,
      ),
    ).toBe('s2')
  })

  it('target berupa field yang masih ada -> dialihkan ke section induknya', () => {
    expect(
      cariSectionTargetUntukPalette(
        { kind: 'field', clientId: 'f1' },
        sections,
        fields,
      ),
    ).toBe('s1')
  })

  it('target field yang sudah dihapus/tidak ditemukan -> null', () => {
    expect(
      cariSectionTargetUntukPalette(
        { kind: 'field', clientId: 'f-tidak-ada' },
        sections,
        fields,
      ),
    ).toBeNull()
  })

  it('target section yang sudah dihapus/tidak ditemukan -> null', () => {
    expect(
      cariSectionTargetUntukPalette(
        { kind: 'section', clientId: 's-hilang' },
        sections,
        fields,
      ),
    ).toBeNull()
  })

  it('target tidak dikenal/tidak valid -> null', () => {
    expect(cariSectionTargetUntukPalette({}, sections, fields)).toBeNull()
    expect(
      cariSectionTargetUntukPalette({ kind: 'lain' }, sections, fields),
    ).toBeNull()
    expect(
      cariSectionTargetUntukPalette({ kind: 'section' }, sections, fields),
    ).toBeNull()
    expect(
      cariSectionTargetUntukPalette({ kind: 'field' }, sections, fields),
    ).toBeNull()
  })

  it('field menunjuk section yang tidak ada di daftar section -> null', () => {
    const fieldsYatim: DraftField[] = [
      {
        id: 'fy',
        clientId: 'fy',
        sectionClientId: 's-hilang',
        nama: 'fy',
        label: 'FY',
        tipe: 'text',
        wajib: false,
        aktif: true,
        placeholder: null,
        deskripsi: null,
        jumlahKolom: null,
        optionSourceType: null,
        optionSourceKey: null,
        opsi: [],
      },
    ]
    expect(
      cariSectionTargetUntukPalette(
        { kind: 'field', clientId: 'fy' },
        sections,
        fieldsYatim,
      ),
    ).toBeNull()
  })
})
