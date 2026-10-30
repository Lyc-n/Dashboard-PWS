import { describe, expect, it } from 'vitest'
import { evaluasiVisibilitas } from './visibilitas'
import type { RuleVisibilitas } from './types'

describe('evaluasiVisibilitas', () => {
  it('semua aktif secara default', () => {
    const answers = {}
    const rules: RuleVisibilitas[] = []
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: ['s1'],
    })
    expect(result.fieldAktif.has('f1')).toBe(true)
    expect(result.fieldAktif.has('f2')).toBe(true)
    expect(result.sectionAktif.has('s1')).toBe(true)
    expect(result.toClearField.size).toBe(0)
  })

  it('menyembunyikan field jika rule tidak cocok (operator eq)', () => {
    const answers = { pilih: 'Tidak' }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih',
        operator: 'eq',
        nilaiAcuan: 'Ya',
        aktif: true,
        urutan: 0,
      },
    ]
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: ['s1'],
    })
    expect(result.fieldAktif.has('f1')).toBe(true)
    expect(result.fieldAktif.has('f2')).toBe(false)
    expect(result.toClearField.has('f2')).toBe(true)
  })

  it('menampilkan field jika rule cocok', () => {
    const answers = { pilih: 'Ya' }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih',
        operator: 'eq',
        nilaiAcuan: 'Ya',
        aktif: true,
        urutan: 0,
      },
    ]
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: ['s1'],
    })
    expect(result.fieldAktif.has('f2')).toBe(true)
    expect(result.toClearField.has('f2')).toBe(false)
  })

  it('mendukung operator kosong dan tidak_kosong', () => {
    const answers1 = { pilih: '' }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih',
        operator: 'tidak_kosong',
        nilaiAcuan: null,
        aktif: true,
        urutan: 0,
      },
    ]
    const result1 = evaluasiVisibilitas({
      answers: answers1,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: [],
    })
    expect(result1.fieldAktif.has('f2')).toBe(false)
    expect(result1.toClearField.has('f2')).toBe(true)

    const answers2 = { pilih: 'ada' }
    const result2 = evaluasiVisibilitas({
      answers: answers2,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: [],
    })
    expect(result2.fieldAktif.has('f2')).toBe(true)
  })

  it('mendukung operator in dan nin', () => {
    const answers = { pilih: 'B' }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih',
        operator: 'in',
        nilaiAcuan: ['A', 'B', 'C'],
        aktif: true,
        urutan: 0,
      },
    ]
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: [],
    })
    expect(result.fieldAktif.has('f2')).toBe(true)

    const rules2: RuleVisibilitas[] = [
      {
        id: 'v2',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih',
        operator: 'nin',
        nilaiAcuan: ['A', 'B'],
        aktif: true,
        urutan: 0,
      },
    ]
    const result2 = evaluasiVisibilitas({
      answers: { pilih: 'B' },
      rules: rules2,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: [],
    })
    expect(result2.fieldAktif.has('f2')).toBe(false)
  })

  it('mendukung nested path untuk trigger field', () => {
    const answers = {
      info: {
        status: 'Ya',
      },
    }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'info.status',
        operator: 'eq',
        nilaiAcuan: 'Ya',
        aktif: true,
        urutan: 0,
      },
    ]
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: [],
    })
    expect(result.fieldAktif.has('f2')).toBe(true)
  })

  it('menyembunyikan section jika rule tidak cocok', () => {
    const answers = { pilih: 'Tidak' }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'section',
        targetId: 's2',
        triggerFieldId: 'pilih',
        operator: 'eq',
        nilaiAcuan: 'Ya',
        aktif: true,
        urutan: 0,
      },
    ]
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1'],
      allSectionIds: ['s1', 's2'],
    })
    expect(result.sectionAktif.has('s1')).toBe(true)
    expect(result.sectionAktif.has('s2')).toBe(false)
    expect(result.toClearSection.has('s2')).toBe(true)
  })

  it('semua rule harus cocok (AND) per target', () => {
    const answers = { pilih1: 'Ya', pilih2: 'Tidak' }
    const rules: RuleVisibilitas[] = [
      {
        id: 'v1',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih1',
        operator: 'eq',
        nilaiAcuan: 'Ya',
        aktif: true,
        urutan: 0,
      },
      {
        id: 'v2',
        targetType: 'field',
        targetId: 'f2',
        triggerFieldId: 'pilih2',
        operator: 'eq',
        nilaiAcuan: 'Ya',
        aktif: true,
        urutan: 1,
      },
    ]
    const result = evaluasiVisibilitas({
      answers,
      rules,
      allFieldIds: ['f1', 'f2'],
      allSectionIds: [],
    })
    expect(result.fieldAktif.has('f2')).toBe(false) // pilih2 tidak cocok
  })
})
