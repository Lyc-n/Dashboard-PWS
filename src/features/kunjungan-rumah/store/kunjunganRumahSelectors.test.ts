/**
 * Uji selector kunjungan rumah.
 *
 * Selector sendiri cuma satu baris middleware yang meneruskan ke
 * `services/progress.ts` — perhitungan yang ditujunya sudah punya test sendiri di
 * `progress.test.ts`. Yang diuji di sini adalah **pengaitannya**: bahwa setiap
 * selector meneruskan argumen yang benar dan tidak membuang atau mengubah nilai
 * di jalan.
 *
 * Perlakuan `templates` yang hanya wajib di sebagian selector ikut dikunci. Kalau
 * suatu saat `selectFillPercent` dan `selectBahaCount` berhenti membedakan mana
 * yang butuh template, test ini yang memberi tahu.
 */
import { describe, expect, it } from 'vitest'
import {
  selectBahaCount,
  selectFillPercent,
  selectStepState,
} from '@/features/kunjungan-rumah/store/kunjunganRumahSelectors'
import {
  computeBahaCount,
  computeFillPercent,
  computeStepState,
} from '@/features/kunjungan-rumah/services/progress'
import { initialKunjunganRumahState } from '@/features/kunjungan-rumah/store/kunjunganRumahReducer'
import type { KunjunganRumahState } from '@/features/kunjungan-rumah/store/kunjunganRumahReducer'
import type { AnggotaKeluarga } from '@/features/kunjungan-rumah/models'
import { createDefaultKunjunganRumahTemplates } from '@/lib/kunjungan-rumah-templates'

const templates = createDefaultKunjunganRumahTemplates()

const anggota: AnggotaKeluarga = {
  id: 'a1',
  nama: 'Budi Setiawan',
  nik: '3579015202800001',
  tglLahir: '1980-02-15',
  jk: 'L',
  hubKK: 'Anak',
  statusKawin: 'Kawin',
  pendidikan: 'SMA',
  pekerjaan: 'Buruh',
}

/** State yang cukup untuk dihitung ketiga selector, dengan satu anggota terisi penuh. */
function state(): KunjunganRumahState {
  const dasar = initialKunjunganRumahState()
  return {
    ...dasar,
    info: {
      ...dasar.info,
      tglPengumpulan: '2026-02-14',
      posyandu: 'Mawar 2',
      nik: '3579015202800001',
    },
    anggota: [anggota],
  }
}

describe('selectFillPercent', () => {
  it('meneruskan state dan template apa adanya ke computeFillPercent', () => {
    const s = state()
    expect(selectFillPercent(s, templates)).toBe(
      computeFillPercent({
        info: s.info,
        anggota: s.anggota,
        penilaian: s.penilaian,
        masalah: s.masalah,
        hasil: s.hasil,
        ttd: s.ttd,
        fotos: s.fotos,
        templates,
      }),
    )
  })

  it('bukan 0% bahkan tanpa isian, karena dua field punya nilai bawaan', () => {
    // State awal bukan benar-benar kosong. `hasil` diisi pilihan pertama, dan
    // `tglPengumpulan` diisi `hariIni()` saat modul dimuat — jadi mengosongkan
    // `hasil` saja masih menyisakan satu field wajib terisi. Nol persen hanya
    // terjadi kalau keduanya dikosongkan eksplisit.
    expect(selectFillPercent(initialKunjunganRumahState(), templates)).toBe(20)
    expect(
      selectFillPercent(
        { ...initialKunjunganRumahState(), hasil: '' },
        templates,
      ),
    ).toBe(10)
    expect(
      selectFillPercent(
        {
          ...initialKunjunganRumahState(),
          hasil: '',
          info: { ...initialKunjunganRumahState().info, tglPengumpulan: '' },
        },
        templates,
      ),
    ).toBe(0)
  })

  it('hasil tanpa `templates` sekecil mungkin dengan template kosong', () => {
    // Template kosong berarti tidak ada field yang bisa dihitung terisi, jadi
    // hasilnya tidak mungkin 100% walau baris sudah ada.
    const kosong = createDefaultKunjunganRumahTemplates()
    const hasil = selectFillPercent(state(), {
      ...kosong,
      keluargaInfo: [],
      anggota: [],
      sanitasi: [],
      masalah: [],
    })
    expect(hasil).toBeLessThan(100)
  })
})

describe('selectBahaCount', () => {
  it('meneruskan penilaian apa adanya ke computeBahaCount', () => {
    const s = state()
    expect(selectBahaCount(s)).toBe(computeBahaCount(s.penilaian))
  })

  it('0% saat tidak ada penilaian', () => {
    expect(selectBahaCount(initialKunjunganRumahState())).toBe(0)
  })

  it('menghitung tanda bahaya yang memang ada di template sasaran', () => {
    // `demam` adalah tanda bahaya ibu hamil, bukan dewasa. Kalau template-grown
    // tidak ikut diteruskan, hitungannya akan salah untuk semua sasaran.
    const s: KunjunganRumahState = {
      ...state(),
      penilaian: [
        {
          id: 'p1',
          anggotaId: 'a1',
          sasaran: 'ibu-hamil',
          values: {},
          checks: { demam: true },
          prioritas: [],
        },
      ],
    }
    expect(selectBahaCount(s)).toBe(1)
  })
})

describe('selectStepState', () => {
  it('meneruskan bagian state yang relevan ke computeStepState', () => {
    const s = state()
    // `toEqual`, bukan `toBe`: computeStepState menyusun larik baru tiap
    // panggilan, jadi perbandingan referensi selalu gagal.
    expect(selectStepState(s)).toEqual(
      computeStepState({
        anggota: s.anggota,
        penilaian: s.penilaian,
        ttd: s.ttd,
      }),
    )
  })

  it('langkah pertama aktif saat belum ada anggota', () => {
    expect(selectStepState(initialKunjunganRumahState())).toEqual([
      'now',
      'todo',
      'todo',
    ])
  })

  it('hanya membaca anggota, penilaian, dan ttd', () => {
    // Dua state yang identik pada tiga bagian itu, tapi `info` berbeda jauh,
    // harusnya menghasilkan urutan langkah yang sama. Kalau selector ikut
    // membaca `info` atau bagian lain, langkah pertama bisa selesai hanya
    // karena kolom keluarga terisi.
    const a = state()
    const b: KunjunganRumahState = {
      ...a,
      info: {
        ...a.info,
        alamat: 'Jl. Sama Sekali Berbeda',
        posyandu: 'Melati 1',
        nik: '3579011111111111',
      },
    }
    expect(selectStepState(a)).toEqual(['done', 'now', 'todo'])
    expect(selectStepState(b)).toEqual(selectStepState(a))
  })
})
