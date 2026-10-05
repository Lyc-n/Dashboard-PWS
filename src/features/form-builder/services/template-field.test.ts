/**
 * Katalog komponen siap pakai harus tetap sinkron dengan aturan form.
 *
 * Semua test di sini murni: tidak menyentuh database. Yang diuji adalah
 * kesesuaian katalog dengan validasi yang sudah ada, supaya template yang
 * salah tidak menunggu sampai admin menekan Build.
 */
import { describe, expect, it } from 'vitest'
import {
  cariTemplate,
  idDragTemplate,
  presetDariTemplate,
  templatePerKelompok,
  TEMPLATE_FIELD,
} from './template-field'
import { cariSumber, tipeBolehPakaiSumber, SUMBER_CARI_WARGA } from './sumber-opsi'
import { TIPE_BUTUH_OPSI, validasiSumberOpsi } from './validasi'

/**
 * Salinan `POLA_NAMA_FIELD` dari `validasi.ts`.
 *
 * Disalin, bukan di-import, karena konstanta itu sengaja tidak diekspor: yang
 * perlu dijaga di sini adalah bentuk string yang sah, bukan implementasi
 * validasinya. Kalau polanya berubah, test ini ikut gagal — itu memang wajar
 * untuk test katalog, dan kegagalan ini hanya menyentuh test katalog.
 */
const POLA_NAMA_SAMA = /^[a-z0-9_]{1,100}$/

describe('TEMPLATE_FIELD', () => {
  it('setiap nama teknis lolos POLA_NAMA_FIELD', () => {
    // Nama teknis ditulis apa adanya ke `form_fields.nama`, dan builder
    // memvalidasinya dengan pola ini. Nama yang gagal pola akan ditolak Build.
    const salah = TEMPLATE_FIELD.filter((t) => !POLA_NAMA_SAMA.test(t.nama)).map((t) => t.nama)
    expect(salah).toEqual([])
  })

  it('setiap sumber jawaban terdaftar di katalog SUMBER_OPSI', () => {
    // Kalau sumber tidak dikenal, `validasiSumberOpsi` menolak Build.
    const salah = TEMPLATE_FIELD.filter(
      (t) => t.optionSourceType && cariSumber(t.optionSourceType, t.optionSourceKey) === null,
    ).map((t) => `${t.optionSourceType}::${t.optionSourceKey}`)
    expect(salah).toEqual([])
  })

  it('tiplenya boleh memakai sumber jawabannya', () => {
    // Kombinasi tipe + sumber yang ditolak UI akan ditolak server juga.
    const salah = TEMPLATE_FIELD.filter(
      (t) =>
        t.optionSourceType !== null &&
        !tipeBolehPakaiSumber({
          tipe: t.tipe,
          type: t.optionSourceType,
          key: t.optionSourceKey,
        }),
    ).map((t) => t.id)
    expect(salah).toEqual([])
  })

  it('setiap preset lolos validasi server', () => {
    // Cek langsung ke validator yang dipakai `build.server.ts`, bukan tiruan.
    const salah = TEMPLATE_FIELD.filter((t) => {
      const hasil = validasiSumberOpsi({
        tipe: t.tipe,
        opsi: [],
        optionSourceType: t.optionSourceType,
        optionSourceKey: t.optionSourceKey,
      })
      return !hasil.ok
    }).map((t) => t.id)
    expect(salah).toEqual([])
  })

  it('optionSourceType dan optionSourceKey selalu berpasangan', () => {
    // Setengah terisi berarti field yang menyimpan sumber tapi tidak tahu
    // sumber mana, atau sebaliknya. Keduanya kelihatan benar di DB tapi salah
    // saat render.
    const salah = TEMPLATE_FIELD.filter(
      (t) => (t.optionSourceType === null) !== (t.optionSourceKey === null),
    ).map((t) => t.id)
    expect(salah).toEqual([])
  })

  it('tidak ada nama teknis yang duplikat dalam satu kelompok', () => {
    // Dua field dengan nama sama di section sama ditolak Build, jadi drag dua
    // template ke satu section harus gagal dengan pesan yang jelas — bukan
    // menyesatkan.
    for (const kelompok of templatePerKelompok()) {
      const nama = kelompok.daftar.map((t) => t.nama)
      expect(new Set(nama).size, `duplikat di ${kelompok.kelompok}`).toBe(nama.length)
    }
  })

  it('id template unik dan bisa dicari dari id drag', () => {
    const id = TEMPLATE_FIELD.map((t) => t.id)
    expect(new Set(id).size).toBe(id.length)

    for (const template of TEMPLATE_FIELD) {
      expect(cariTemplate(idDragTemplate(template.id))?.id).toBe(template.id)
    }
  })

  it('cariTemplate menolak id drag yang tidak dikenal', () => {
    expect(cariTemplate('template-tidak-ada')).toBeNull()
    // Id komponen biasa bukan id template: jangan salah dibaca sebagai template.
    expect(cariTemplate('palette-select')).toBeNull()
  })
})

describe('presetDariTemplate', () => {
  it('menyalin nama, label, tipe, dan sumber apa adanya', () => {
    const agama = TEMPLATE_FIELD.find((t) => t.id === 'enum-agama')!
    expect(presetDariTemplate(agama)).toEqual({
      nama: 'agama',
      label: 'Agama',
      tipe: 'radio',
      optionSourceType: 'enum',
      optionSourceKey: 'agama',
      opsi: [],
    })
  })

  it('sumber cari_warga mengisi kolom yang ditandai, bukan kolom lain', () => {
    // Key sumber menentukan kolom mana yang mengisi field. Kalau key dan kolomnya
    // berbeda, satu baris bisa mengisi field dengan kolom yang tidak diminta —
    // dan itu tidak akan ketahuan dari layar isi.
    const cari = TEMPLATE_FIELD.filter((t) => t.optionSourceType === SUMBER_CARI_WARGA)
    expect(cari.length).toBeGreaterThan(0)
    for (const template of cari) {
      const sumber = cariSumber(template.optionSourceType, template.optionSourceKey)
      expect(sumber?.kolom, template.id).toBe(template.optionSourceKey)
    }
  })

  it('opsi selalu kosong, walau tipenya butuh opsi', () => {
    // Opsi statis tidak boleh diisi template: daftar jawabannya sudah ada di
    // enum atau di database, dan baris `form_field_options` akan jadi kontradiksi.
    // Termasuk `cari_warga`, yang daftarnya memang datang saat mengetik.
    const butuhOpsi = TEMPLATE_FIELD.filter((t) => TIPE_BUTUH_OPSI.includes(t.tipe))
    const punyaSumber = TEMPLATE_FIELD.filter((t) => t.optionSourceType !== null)
    for (const template of [...butuhOpsi, ...punyaSumber]) {
      expect(presetDariTemplate(template).opsi).toEqual([])
    }
  })

  it('tidak ikut menebak field wajib', () => {
    // `wajib` harus tetap bernilai default false: template tidak tahu apakah
    // tiap form mewajibkan field ini.
    expect(Object.keys(presetDariTemplate(TEMPLATE_FIELD[0]!))).not.toContain('wajib')
  })
})

describe('templatePerKelompok', () => {
  it('kelompok urut dan tidak kosong', () => {
    const groups = templatePerKelompok()
    expect(groups.map((g) => g.kelompok)).toEqual([
      'Data warga',
      'Kategori warga',
      'Petugas & fasilitas',
    ])
    for (const g of groups) expect(g.daftar.length).toBeGreaterThan(0)
  })

  it('setiap template muncul tepat sekali', () => {
    // Kalau ada template yang tidak masuk kelompok mana pun, ia tidak akan pernah
    // tampil di palette tapi tetap bisa dragged dari id-nya.
    const total = templatePerKelompok().reduce((n, g) => n + g.daftar.length, 0)
    expect(total).toBe(TEMPLATE_FIELD.length)
  })
})