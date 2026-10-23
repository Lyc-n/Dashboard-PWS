import { useEffect, useState } from 'react'
import type { KunjunganRumahTemplates } from '@/lib/kunjungan-rumah-templates'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { RadioCard } from '@/components/atoms/RadioCard'
import { FormField } from '@/components/molecules/FormField'
import { hasilKind, HASIL_KIND_LABEL } from '@/lib/hasil'
import { listSurveyors } from '@/lib/utils.functions'
import type {
  KunjunganRumahAction,
  KunjunganRumahState,
} from '@/features/kunjungan-rumah/store/kunjunganRumahReducer'

interface Props {
  state: KunjunganRumahState
  templates: KunjunganRumahTemplates
  dispatch: React.Dispatch<KunjunganRumahAction>
}

export function HasilSection({ state, templates, dispatch }: Props) {
  const hasilOpsi = templates.hasilOpsi
  const kind = hasilKind(state.hasil)
  const jadwalWajib = kind === 'jadwal'

  // [perbaikan] kader yang menandatangani dipilih dari daftar akun petugas aktif,
  //   bukan diketik manual — expect: nama cadres yang di histori sama persis dengan
  //   nama di tabel surveyor, dan `ttd` terisi otomatis begitu petugas dipilih.
  //   Petugas dipindah ke akhir form karena ini Newsigned penutup, bukan identitas household.
  const [petugas, setPetugas] = useState<{ id: string; nama: string }[]>([])
  useEffect(() => {
    let hidup = true
    void listSurveyors()
      .then((rows) => {
        if (hidup) setPetugas(rows)
      })
      .catch(() => {
        if (hidup) setPetugas([])
      })
    return () => {
      hidup = false
    }
  }, [])

  const petugasInvalid = !!state.invalid.petugasId || !!state.invalid.ttd
  const petugasErrorId = 'ttd-error'

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        {hasilOpsi.map((h) => (
          <RadioCard
            key={h}
            title={h}
            description={HASIL_KIND_LABEL[hasilKind(h)]}
            inputProps={{
              name: 'hasil',
              checked: state.hasil === h,
              onChange: () => dispatch({ type: 'SET_HASIL', value: h }),
            }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <FormField
          label={jadwalWajib ? 'Jadwal ulang' : 'Jadwal kontrol berikutnya'}
          required={jadwalWajib}
          invalid={!!state.invalid.jadwal}
          error="Wajib isi jadwal."
          errorId="jadwal-error"
        >
          <Input
            type="date"
            value={state.jadwal}
            onChange={(e) =>
              dispatch({ type: 'SET_JADWAL', value: e.target.value })
            }
            invalid={!!state.invalid.jadwal}
            aria-describedby={state.invalid.jadwal ? 'jadwal-error' : undefined}
          />
        </FormField>
        {/* [perbaikan] select kader menggantikan ketikan TTD manual — expect: satu
            pilihan mengisi `petugasId` (uuid untuk header DB) dan `ttd` (nama tersimpan
            di histori) sekaligus, jadi konsisten dan tidak bisa beda dengan petugas. */}
        <FormField
          label="TTD / nama jelas kader"
          required
          invalid={petugasInvalid}
          error="Wajib dipilih."
          errorId={petugasErrorId}
        >
          <Select
            value={state.info.petugasId}
            onChange={(e) => {
              const id = e.target.value
              const nama = petugas.find((p) => p.id === id)?.nama ?? ''
              dispatch({ type: 'SET_FIELD', key: 'petugasId', value: id })
              dispatch({ type: 'SET_FIELD', key: 'petugasNama', value: nama })
              dispatch({ type: 'SET_TTD', value: nama })
            }}
            invalid={petugasInvalid}
            aria-describedby={petugasInvalid ? petugasErrorId : undefined}
          >
            <option value="">— Pilih Kader —</option>
            {petugas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      {state.invalid.hasil ? (
        <span className="mt-2 block text-[11px] font-semibold text-danger">
          Pilih salah satu hasil kunjungan rumah.
        </span>
      ) : null}
    </>
  )
}
