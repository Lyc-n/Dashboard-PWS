import { useMemo } from "react";
import { X, Settings, FolderOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input, Textarea, Select, Checkbox } from "@/components/atoms";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import type { DraftField, DraftSection, DraftOpsi, DraftAturan, TipeFieldEditor, SelectedItem } from "./types";
import { TIPE_FIELD_LABELS, TIPE_BUTUH_OPSI, SEMUA_TIPE_FIELD } from "./types";

interface Props {
  selectedItem: SelectedItem;
  onClose: () => void;
  document: { sections: DraftSection[]; fields: DraftField[] } | null;
  updateSection: (clientId: string, patch: Partial<DraftSection>) => void;
  deleteSection: (clientId: string) => void;
  updateField: (clientId: string, patch: Partial<DraftField>) => void;
  deleteField: (clientId: string) => void;
  addOpsi: (fieldClientId: string) => void;
  updateOpsi: (fieldClientId: string, opsiClientId: string, patch: Partial<DraftOpsi>) => void;
  deleteOpsi: (fieldClientId: string, opsiClientId: string) => void;
  addAturan: (fieldClientId: string, sourceClientId: string) => void;
  updateAturan: (fieldClientId: string, aturanClientId: string, patch: Partial<DraftAturan>) => void;
  deleteAturan: (fieldClientId: string, aturanClientId: string) => void;
}

export function SettingsPanel({ 
  selectedItem, 
  onClose, 
  document,
  updateSection,
  deleteSection,
  updateField,
  deleteField,
  addOpsi,
  updateOpsi,
  deleteOpsi,
  addAturan,
  updateAturan,
  deleteAturan,
}: Props) {
  
  if (!selectedItem) {
    return (
      <div className="w-[320px] shrink-0 border-l border-line bg-surface-2 p-3 overflow-y-auto h-full min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">Pengaturan</h3>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="text-center text-muted py-8">
          <Settings className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Pilih section atau field untuk mengedit</p>
        </div>
      </div>
    );
  }
  
  if (selectedItem.type === "section") {
    return <SectionSettings 
      sectionClientId={selectedItem.clientId} 
      onClose={onClose}
      document={document}
      updateSection={updateSection}
      deleteSection={deleteSection}
    />;
  }
  
  return <FieldSettings 
    fieldClientId={selectedItem.clientId} 
    onClose={onClose}
    document={document}
    updateField={updateField}
    deleteField={deleteField}
    addOpsi={addOpsi}
    updateOpsi={updateOpsi}
    deleteOpsi={deleteOpsi}
    addAturan={addAturan}
    updateAturan={updateAturan}
    deleteAturan={deleteAturan}
  />;
}

function SectionSettings({ 
  sectionClientId, 
  onClose,
  document,
  updateSection,
  deleteSection,
}: { 
  sectionClientId: string; 
  onClose: () => void;
  document: { sections: DraftSection[]; fields: DraftField[] } | null;
  updateSection: (clientId: string, patch: Partial<DraftSection>) => void;
  deleteSection: (clientId: string) => void;
}) {
  const section = document?.sections.find((s) => s.clientId === sectionClientId);
  if (!section) return null;
  
  return (
    <div className="w-[320px] shrink-0 border-l border-line bg-surface-2 p-3 overflow-y-auto h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-1">
          <FolderOpen className="w-4 h-4" /> Section
        </h3>
        <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      
      <div className="grid gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Nama section</label>
          <Input
            value={section.nama}
            onChange={(e) => updateSection(sectionClientId, { nama: e.target.value })}
            placeholder="Nama section"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Deskripsi (opsional)</label>
          <Textarea
            value={section.deskripsi ?? ""}
            onChange={(e) => updateSection(sectionClientId, { deskripsi: e.target.value })}
            placeholder="Deskripsi section"
            rows={2}
          />
        </div>
        
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <Checkbox
            checked={section.aktif}
            onChange={(e) => updateSection(sectionClientId, { aktif: e.target.checked })}
          />
          Aktif (tampil di form)
        </label>
        
        <div className="pt-2 border-t border-line">
          <Button
            size="sm"
            variant="danger"
            className="w-full"
            onClick={() => { deleteSection(sectionClientId); onClose(); }}
          >
            Hapus Section
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldSettings({ 
  fieldClientId, 
  onClose,
  document,
  updateField,
  deleteField,
  addOpsi,
  updateOpsi,
  deleteOpsi,
  addAturan,
  updateAturan,
  deleteAturan,
}: { 
  fieldClientId: string; 
  onClose: () => void;
  document: { sections: DraftSection[]; fields: DraftField[] } | null;
  updateField: (clientId: string, patch: Partial<DraftField>) => void;
  deleteField: (clientId: string) => void;
  addOpsi: (fieldClientId: string) => void;
  updateOpsi: (fieldClientId: string, opsiClientId: string, patch: Partial<DraftOpsi>) => void;
  deleteOpsi: (fieldClientId: string, opsiClientId: string) => void;
  addAturan: (fieldClientId: string, sourceClientId: string) => void;
  updateAturan: (fieldClientId: string, aturanClientId: string, patch: Partial<DraftAturan>) => void;
  deleteAturan: (fieldClientId: string, aturanClientId: string) => void;
}) {
  const field = document?.fields.find((f) => f.clientId === fieldClientId);
  if (!field) return null;
  
  const needsOptions = TIPE_BUTUH_OPSI.includes(field.tipe);
  const hasOptions = field.opsi.some((o) => o.value.trim() && o.aktif);
  const availableSources = useMemo(() => 
    document?.fields
      .filter((f) => f.clientId !== fieldClientId && ["select", "radio", "checkbox"].includes(f.tipe))
      .map((f) => ({ id: f.clientId, label: f.label || f.nama }))
    ?? [], [document, fieldClientId]);
  
  return (
    <div className="w-95 shrink-0 border-l border-line bg-surface-2 p-3 overflow-y-auto h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-1">
          <Settings className="w-4 h-4" /> Field
        </h3>
        <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      
      <div className="grid gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Pertanyaan (label)</label>
          <Input
            value={field.label}
            onChange={(e) => updateField(fieldClientId, { label: e.target.value })}
            placeholder="Contoh: Tekanan darah"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Kode teknis (nama)</label>
          <Input
            value={field.nama}
            onChange={(e) => updateField(fieldClientId, { nama: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
            placeholder="tekanan_darah"
            disabled={!!field.id}
          />
          {field.id && <p className="text-[10px] text-muted mt-0.5">Kode terkunci karena sudah punya jawaban tersimpan</p>}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Tipe</label>
          <Select
            value={field.tipe}
            onChange={(e) => {
              const tipe = e.target.value as TipeFieldEditor;
              const patch: Partial<DraftField> = { tipe, jumlahKolom: tipe === "group" ? 2 : null };
              if (!TIPE_BUTUH_OPSI.includes(tipe)) patch.opsi = [];
              updateField(fieldClientId, patch);
            }}
          >
            {SEMUA_TIPE_FIELD.map((t) => (
              <option key={t} value={t}>{TIPE_FIELD_LABELS[t]}</option>
            ))}
          </Select>
        </div>
        
        {field.tipe === "group" && (
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Jumlah kolom per baris</label>
            <Input
              type="number"
              min={1}
              value={field.jumlahKolom ?? 2}
              onChange={(e) => updateField(fieldClientId, { jumlahKolom: Number(e.target.value) || 1 })}
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <Checkbox checked={field.wajib} onChange={(e) => updateField(fieldClientId, { wajib: e.target.checked })} />
            Wajib diisi
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <Checkbox checked={field.aktif} onChange={(e) => updateField(fieldClientId, { aktif: e.target.checked })} />
            Aktif
          </label>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Placeholder (opsional)</label>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => updateField(fieldClientId, { placeholder: e.target.value })}
            placeholder="Contoh: 120/80"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1">Catatan untuk petugas (opsional)</label>
          <Textarea
            value={field.deskripsi ?? ""}
            onChange={(e) => updateField(fieldClientId, { deskripsi: e.target.value })}
            placeholder="Petunjuk isi..."
            rows={2}
          />
        </div>
        
        {needsOptions && (
          <fieldset className="rounded-lg border border-line p-3">
            <legend className="px-1 text-xs font-semibold text-ink-2 flex items-center gap-1">
              Pilihan jawaban {hasOptions ? <StatusBadge variant="done">Siap</StatusBadge> : <AlertTriangle className="w-3 h-3 text-warning" />}
            </legend>
            {field.opsi.length === 0 ? (
              <p className="text-sm text-muted text-center py-2">Belum ada opsi</p>
            ) : (
              <div className="grid gap-2">
                {field.opsi.map((o) => (
                  <div key={o.clientId} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      value={o.value}
                      placeholder="nilai tersimpan"
                      onChange={(e) => updateOpsi(fieldClientId, o.clientId, { value: e.target.value })}
                    />
                    <Input
                      value={o.label}
                      placeholder="teks untuk petugas"
                      onChange={(e) => updateOpsi(fieldClientId, o.clientId, { label: e.target.value })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteOpsi(fieldClientId, o.clientId)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => addOpsi(fieldClientId)}>
              + Tambah opsi
            </Button>
          </fieldset>
        )}
        
        <fieldset className="rounded-lg border border-line p-3">
          <legend className="px-1 text-xs font-semibold text-ink-2">Tampilkan hanya bila… (aturan visibility)</legend>
          {field.aturan.length === 0 ? (
            <p className="text-sm text-muted text-center py-2">Tanpa aturan, pertanyaan ini selalu tampil.</p>
          ) : (
            <div className="grid gap-2">
              {field.aturan.map((a) => (
                <div key={a.clientId} className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Select
                    value={a.sourceClientId}
                    onChange={(e) => updateAturan(fieldClientId, a.clientId, { sourceClientId: e.target.value })}
                  >
                    <option value="">Pilih pertanyaan sumber…</option>
                    {availableSources.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </Select>
                  <Select
                    value={a.operator}
                    onChange={(e) => updateAturan(fieldClientId, a.clientId, { operator: e.target.value as "equals" | "not_equals" })}
                  >
                    <option value="equals">sama dengan</option>
                    <option value="not_equals">tidak sama dengan</option>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteAturan(fieldClientId, a.clientId)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {availableSources.length > 0 && (
            <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => { const src = availableSources[0]; if (src) addAturan(fieldClientId, src.id); }}>
              + Tambah aturan
            </Button>
          )}
          {availableSources.length === 0 && field.aturan.length === 0 && (
            <p className="text-xs text-muted text-center mt-2">Butuh field select/radio/checkbox lain sebagai sumber</p>
          )}
        </fieldset>
        
        <div className="pt-2 border-t border-line">
          <Button
            size="sm"
            variant="danger"
            className="w-full"
            onClick={() => { deleteField(fieldClientId); onClose(); }}
          >
            Hapus Field
          </Button>
        </div>
      </div>
    </div>
  );
}