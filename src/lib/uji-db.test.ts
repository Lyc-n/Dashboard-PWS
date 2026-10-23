import { describe, expect, it } from 'vitest'
import { dalamTransaksiUji } from './uji-db'
import type { TransactionRunner } from './uji-db'

/**
 * Transaction runner palsu yang mencatat apakah transaksi berakhir commit atau
 * rollback. Rollback pada API transaksi berbasis callback terjadi dengan melempar error,
 * jadi lemparan itulah yang membuat runner ini membatalkan — persis seperti yang
 * dilakukan PostgreSQL.
 */
function runnerPalsu(catatan: { commit: number; rollback: number }) {
  const fn = (async (cb: (tx: unknown) => Promise<unknown>) => {
    try {
      await cb({})
    } catch (err) {
      // Rollback lalu error diteruskan, sama seperti drizzle dan PostgreSQL.
      // Kalau error ditelan di sini, `dalamTransaksiUji` tidak bisa membedakan
      // "callback gagal" dari "callback tidak pernah jalan" — dan itu justru
      // yang sedang diuji.
      catatan.rollback += 1
      throw err
    }
    catatan.commit += 1
    return undefined
  }) as unknown as TransactionRunner
  return fn
}

describe('dalamTransaksiUji', () => {
  it('selalu membatalkan transaksi meski callback-nya berhasil', async () => {
    const catatan = { commit: 0, rollback: 0 }
    const hasil = await dalamTransaksiUji(
      async () => 'selesai',
      runnerPalsu(catatan),
    )
    expect(hasil).toBe('selesai')
    expect(catatan.rollback).toBe(1)
    expect(catatan.commit).toBe(0)
  })

  it('membatalkan transaksi dan meneruskan error saat callback gagal', async () => {
    const catatan = { commit: 0, rollback: 0 }
    await expect(
      dalamTransaksiUji(async () => {
        throw new Error('AssertionError: Something went wrong')
      }, runnerPalsu(catatan)),
    ).rejects.toThrow('Something went wrong')
    // Rollback harus terjadi juga di jalur gagal, dan error aslinya tidak ditelan.
    expect(catatan.rollback).toBe(1)
    expect(catatan.commit).toBe(0)
  })

  it('tidak pernah mengembalikan undefined karena dilewati diam-diam', async () => {
    // Kalau nanti ada jalur yang keluar tanpa menjalankan callback, pemanggil
    // akan mendapat `undefined` dan bisa salah menganggap semua assertion lolos.
    const tanpaCallback = (async () =>
      undefined) as unknown as TransactionRunner
    await expect(
      dalamTransaksiUji(async () => 1, tanpaCallback),
    ).rejects.toThrow(/tanpa menjalankan callback/)
  })

  it('menyerahkan objek transaksi ke callback', async () => {
    const catatan = { commit: 0, rollback: 0 }
    let diterima: unknown
    await dalamTransaksiUji(async (tx) => {
      diterima = tx
    }, runnerPalsu(catatan))
    expect(diterima).toEqual({})
  })

  it('rollback terjadi meski callback-nya melempar objek non-Error', async () => {
    const catatan = { commit: 0, rollback: 0 }
    await expect(
      dalamTransaksiUji(async () => {
        throw 'bukan Error'
      }, runnerPalsu(catatan)),
    ).rejects.toBe('bukan Error')
    expect(catatan.rollback).toBe(1)
    expect(catatan.commit).toBe(0)
  })
})
