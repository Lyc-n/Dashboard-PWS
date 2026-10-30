import { db } from '@/lib/server/db.server'
import { formFieldAutofills } from '@/lib/schema/schema'

export async function seedKrAutofillRules(formVersionId: string, cariWargaFieldId: string) {
  const rules = [
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.nik', sumber: 'warga', kolom: 'nik', transform: 'nik' },
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.namaKK', sumber: 'warga', kolom: 'namaKk', transform: 'teks' },
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.alamat', sumber: 'warga', kolom: 'alamat', transform: 'teks' },
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.rt', sumber: 'warga', kolom: 'rt', transform: 'teks' },
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.rw', sumber: 'warga', kolom: 'rw', transform: 'teks' },
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.kelurahan', sumber: 'warga', kolom: 'kelurahan', transform: 'teks' },
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'info.kecamatan', sumber: 'warga', kolom: 'kecamatan', transform: 'teks' },
    // Group Anggota Keluarga
    { triggerFieldId: cariWargaFieldId, targetFieldId: 'anggota', sumber: 'anggota', kolom: '*', transform: 'teks' },
  ]

  for (const [index, r] of rules.entries()) {
    await db.insert(formFieldAutofills).values({
      formVersionId,
      triggerFieldId: r.triggerFieldId,
      targetFieldId: r.targetFieldId,
      sumber: r.sumber,
      kolom: r.kolom,
      transform: r.transform,
      mode: 'isi_kosong',
      urutan: index,
      aktif: true,
    })
  }
}