import { describe, expect, it } from 'vitest'
import { getNestedValue, setNestedValue, deleteNestedValue } from './nested'

describe('nested utils', () => {
  it('getNestedValue untuk path sederhana', () => {
    const obj = { nama: 'Budi', nik: '123' }
    expect(getNestedValue(obj, 'nama')).toBe('Budi')
    expect(getNestedValue(obj, 'nik')).toBe('123')
    expect(getNestedValue(obj, 'tidakada')).toBeUndefined()
  })

  it('getNestedValue untuk path bersarang', () => {
    const obj = {
      info: {
        namaKK: 'Budi',
        nik: '1234567890123456',
      },
      sanitasi: {
        jambanSaniter: 'ada',
      },
    }
    expect(getNestedValue(obj, 'info.namaKK')).toBe('Budi')
    expect(getNestedValue(obj, 'info.nik')).toBe('1234567890123456')
    expect(getNestedValue(obj, 'sanitasi.jambanSaniter')).toBe('ada')
    expect(getNestedValue(obj, 'info.tidakada')).toBeUndefined()
  })

  it('setNestedValue untuk path sederhana tanpa menghapus properti lain', () => {
    const obj: Record<string, unknown> = { nama: 'Budi', nik: '123' }
    const result = setNestedValue(obj, 'alamat', 'Jl. Test')
    expect(result.nama).toBe('Budi')
    expect(result.nik).toBe('123')
    expect(result.alamat).toBe('Jl. Test')
    expect(obj.alamat).toBeUndefined() // immutability
  })

  it('setNestedValue untuk path bersarang tanpa menghapus properti tetangga', () => {
    const obj: Record<string, unknown> = {
      info: {
        namaKK: 'Budi',
        nik: '1234567890123456',
      },
      sanitasi: {
        jambanSaniter: 'ada',
      },
    }
    const result = setNestedValue(obj, 'info.alamat', 'Jl. Baru')
    const info = result.info as Record<string, unknown>
    const sanitasi = result.sanitasi as Record<string, unknown>
    expect(info.namaKK).toBe('Budi')
    expect(info.nik).toBe('1234567890123456')
    expect(info.alamat).toBe('Jl. Baru')
    expect(sanitasi.jambanSaniter).toBe('ada')
    const objInfo = obj.info as Record<string, unknown>
    expect(objInfo.alamat).toBeUndefined() // immutability
  })

  it('setNestedValue membuat nested object jika belum ada', () => {
    const obj: Record<string, unknown> = { nama: 'Budi' }
    const result = setNestedValue(obj, 'info.nik', '123')
    expect(result.nama).toBe('Budi')
    expect((result.info as Record<string, unknown>).nik).toBe('123')
  })

  it('deleteNestedValue menghapus nested path tanpa menghapus tetangga', () => {
    const obj: Record<string, unknown> = {
      info: {
        namaKK: 'Budi',
        nik: '123',
        alamat: 'Jl. Test',
      },
    }
    const result = deleteNestedValue(obj, 'info.alamat')
    const info = result.info as Record<string, unknown>
    expect(info.namaKK).toBe('Budi')
    expect(info.nik).toBe('123')
    expect(info.alamat).toBeUndefined()
  })
})
