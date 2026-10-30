import React from 'react'
import { KOLOM_WARGA } from '@/lib/form-builder/rules/autofill-katalog'
import type { RuleAutofill, SumberAutofill, TransformAutofill, ModeAutofill } from '@/lib/form-builder/engine/types'

interface FieldOption {
  id: string
  nama: string
}

interface Props {
  triggerFieldId: string
  allFields: FieldOption[]
  rules: RuleAutofill[]
  onChange: (newRules: RuleAutofill[]) => void
}

export function PropertyPanelAutofill({ triggerFieldId, allFields, rules, onChange }: Props) {
  // Filter aturan yang hanya berlaku untuk triggerFieldId ini
  const activeRules = rules.filter((r) => r.triggerFieldId === triggerFieldId)

  const handleAddRule = () => {
    const newRule: RuleAutofill = {
      id: crypto.randomUUID(),
      triggerFieldId,
      targetFieldId: allFields.find((f) => f.id !== triggerFieldId)?.id || '',
      sumber: 'warga',
      kolom: 'nik',
      transform: 'teks',
      mode: 'isi_kosong',
      aktif: true,
      urutan: activeRules.length,
    }
    onChange([...rules, newRule])
  }

  const handleUpdateRule = (id: string, updated: Partial<RuleAutofill>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...updated } : r)))
  }

  const handleDeleteRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Aturan Auto-Fill</h4>
        <button
          type="button"
          onClick={handleAddRule}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
        >
          + Tambah Target
        </button>
      </div>

      {activeRules.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Belum ada target auto-fill untuk field ini.</p>
      ) : (
        activeRules.map((rule, idx) => (
          <div key={rule.id} className="p-3 border rounded-md space-y-2 bg-gray-50 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Aturan #{idx + 1}</span>
              <button
                type="button"
                onClick={() => handleDeleteRule(rule.id)}
                className="text-red-600 hover:text-red-800"
              >
                Hapus
              </button>
            </div>

            {/* Target Field */}
            <div>
              <label className="block text-gray-600 mb-1">Target Field (Path / ID):</label>
              <select
                value={rule.targetFieldId}
                onChange={(e) => handleUpdateRule(rule.id, { targetFieldId: e.target.value })}
                className="w-full border rounded p-1"
              >
                <option value="">-- Pilih Target --</option>
                {allFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nama} ({f.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Sumber Data */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 mb-1">Sumber Data:</label>
                <select
                  value={rule.sumber}
                  onChange={(e) => handleUpdateRule(rule.id, { sumber: e.target.value as SumberAutofill })}
                  className="w-full border rounded p-1"
                >
                  <option value="warga">Warga</option>
                  <option value="anggota">Anggota (Group)</option>
                  <option value="riwayat">Riwayat</option>
                </select>
              </div>

              {/* Kolom */}
              <div>
                <label className="block text-gray-600 mb-1">Kolom Sumber:</label>
                {rule.sumber === 'warga' ? (
                  <select
                    value={rule.kolom}
                    onChange={(e) => handleUpdateRule(rule.id, { kolom: e.target.value })}
                    className="w-full border rounded p-1"
                  >
                    {KOLOM_WARGA.map((kw) => (
                      <option key={kw.value} value={kw.value}>
                        {kw.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={rule.kolom}
                    placeholder="mis: nik, nama"
                    onChange={(e) => handleUpdateRule(rule.id, { kolom: e.target.value })}
                    className="w-full border rounded p-1"
                  />
                )}
              </div>
            </div>

            {/* Transform & Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 mb-1">Transform:</label>
                <select
                  value={rule.transform}
                  onChange={(e) => handleUpdateRule(rule.id, { transform: e.target.value as TransformAutofill })}
                  className="w-full border rounded p-1"
                >
                  <option value="teks">Teks</option>
                  <option value="nik">NIK (16 Digit)</option>
                  <option value="tanggal">Tanggal</option>
                  <option value="opsi">Opsi Select</option>
                  <option value="angka">Angka</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Mode Overwrite:</label>
                <select
                  value={rule.mode}
                  onChange={(e) => handleUpdateRule(rule.id, { mode: e.target.value as ModeAutofill })}
                  className="w-full border rounded p-1"
                >
                  <option value="isi_kosong">Isi Hanya Jika Kosong</option>
                  <option value="timpa">Selalu Timpa</option>
                </select>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}