// src/components/kelola/builder/PropertyPanelVisibilitas.tsx
import React from 'react'
import type { RuleVisibilitas, OperatorVisibilitas, TargetVisibilitas } from '@/lib/form-builder/engine/types'

interface FieldOption {
  id: string
  nama: string
}

interface Props {
  targetType: TargetVisibilitas // 'field' | 'section'
  targetId: string
  allFields: FieldOption[]
  rules: RuleVisibilitas[]
  onChange: (newRules: RuleVisibilitas[]) => void
}

export function PropertyPanelVisibilitas({ targetType, targetId, allFields, rules, onChange }: Props) {
  const activeRules = rules.filter((r) => r.targetType === targetType && r.targetId === targetId)

  const handleAddRule = () => {
    const newRule: RuleVisibilitas = {
      id: crypto.randomUUID(),
      targetType,
      targetId,
      triggerFieldId: allFields[0]?.id || '',
      operator: 'eq',
      nilaiAcuan: '',
      aktif: true,
      urutan: activeRules.length,
    }
    onChange([...rules, newRule])
  }

  const handleUpdateRule = (id: string, updated: Partial<RuleVisibilitas>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...updated } : r)))
  }

  const handleDeleteRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Aturan Visibilitas (Show/Hide)</h4>
        <button
          type="button"
          onClick={handleAddRule}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
        >
          + Tambah Kondisi
        </button>
      </div>

      {activeRules.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Selalu tampil (tanpa syarat).</p>
      ) : (
        activeRules.map((rule, idx) => (
          <div key={rule.id} className="p-3 border rounded-md space-y-2 bg-gray-50 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Tampilkan Jika #{idx + 1}</span>
              <button
                type="button"
                onClick={() => handleDeleteRule(rule.id)}
                className="text-red-600 hover:text-red-800"
              >
                Hapus
              </button>
            </div>

            {/* Trigger Field */}
            <div>
              <label className="block text-gray-600 mb-1">Field Pemicu:</label>
              <select
                value={rule.triggerFieldId}
                onChange={(e) => handleUpdateRule(rule.id, { triggerFieldId: e.target.value })}
                className="w-full border rounded p-1"
              >
                {allFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nama} ({f.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Operator & Nilai Acuan */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 mb-1">Operator:</label>
                <select
                  value={rule.operator}
                  onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as OperatorVisibilitas })}
                  className="w-full border rounded p-1"
                >
                  <option value="eq">Sama Dengan (=)</option>
                  <option value="neq">Tidak Sama (!=)</option>
                  <option value="kosong">Kosong</option>
                  <option value="tidak_kosong">Tidak Kosong</option>
                </select>
              </div>

              {rule.operator !== 'kosong' && rule.operator !== 'tidak_kosong' && (
                <div>
                  <label className="block text-gray-600 mb-1">Nilai Acuan:</label>
                  <input
                    type="text"
                    value={String(rule.nilaiAcuan ?? '')}
                    onChange={(e) => handleUpdateRule(rule.id, { nilaiAcuan: e.target.value })}
                    className="w-full border rounded p-1"
                    placeholder="misal: Ya"
                  />
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}