/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { HistoryPanel } from '@/components/organisms/HistoryPanel'
import { HistoryRow } from '@/components/molecules/HistoryRow'
import { Tag } from '@/components/atoms/Tag'
import { fmtDate } from '@/lib/utils'
import type { KrTemplates } from '@/lib/kr-templates'
import type { KunjunganRecord } from '../types'

interface Props {
  records: KunjunganRecord[]
  templates: KrTemplates
}

export function HistorySection({ records, templates }: Props) {
  return (
    <HistoryPanel
      items={records.map((r) => (
        <HistoryRow key={r.id} layout="stack">
          <div className="flex flex-wrap items-center gap-2">
            <b>{r.info.namaKK || 'Tanpa nama KK'}</b>
            {r.penilaian.map((p) => (
              <Tag key={p.id}>
                {templates.sasaran[p.sasaran]
                  ? templates.sasaran[p.sasaran].label
                  : p.sasaran}
              </Tag>
            ))}
            {r.penilaian
              .flatMap((p) => p.prioritas)
              .map((prio, j) => (
                <Tag key={`${prio}-${j}`} priority={prio} />
              ))}
            <span className="text-muted">{fmtDate(r.info.tglPengumpulan)}</span>
          </div>
          <span className="text-muted">
            Posyandu {r.info.posyandu} · Kel. {r.info.kelurahan} ·{' '}
            {r.anggota.length} anggota · hasil: {r.hasil}
          </span>
          <span className="text-muted">
            {r.penilaian.length} penilaian sasaran · {r.masalah.length} masalah
            · kader {r.ttd}
          </span>
        </HistoryRow>
      ))}
    />
  )
}
