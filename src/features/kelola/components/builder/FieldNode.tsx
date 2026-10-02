import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, Trash2, Settings, AlertTriangle, EyeOff } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import type { DraftField } from "./types";
import { TIPE_FIELD_LABELS, TIPE_BUTUH_OPSI } from "./types";

interface Props {
  fieldClientId: string;
  index: number;
  disabled?: boolean;
  field: DraftField;
  isSelected: boolean;
  onSelect: (clientId: string) => void;
  onDeselect: () => void;
  onUpdateField: (clientId: string, patch: Partial<DraftField>) => void;
  onDeleteField: (clientId: string) => void;
}

export function FieldNode({
  fieldClientId,
  index,
  disabled,
  field,
  isSelected,
  onSelect,
  onDeselect,
  onUpdateField,
  onDeleteField,
}: Props) {
  // Terima field (reorder) + palette (buat baru via section induk — lihat hook).
  // Section ditolak: accept hanya field dan palette.
  const { ref, isDragging, isDropTarget } = useSortable({
    id: fieldClientId,
    index,
    group: field.sectionClientId,
    type: "field",
    accept: ["palette", "field"],
    data: { kind: "field", clientId: fieldClientId },
    disabled,
  });
  
  const needsOptions = TIPE_BUTUH_OPSI.includes(field.tipe);
  const hasOptions = field.opsi.some((o) => o.value.trim() && o.aktif);
  const hasRules = field.aturan.length > 0;

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={`relative group flex items-start gap-2 rounded-lg border p-2 transition-all ${
        isSelected ? "border-accent-border bg-accent-light" : "border-line hover:border-accent-border"
      } ${isDropTarget && !isDragging ? "bg-accent-light/50 border-accent-border" : ""}`}
      onClick={() => onSelect(fieldClientId)}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        <GripVertical className="w-4 h-4 text-muted cursor-grab opacity-0 group-hover:opacity-100" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={field.label}
            onChange={(e) => { e.stopPropagation(); onUpdateField(fieldClientId, { label: e.target.value }); }}
            className="flex-1 min-w-30 bg-transparent border-0 focus:ring-0 text-sm font-medium text-ink placeholder:text-muted"
            placeholder="Pertanyaan"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-line text-muted font-mono">
            {TIPE_FIELD_LABELS[field.tipe]}
          </span>
          {needsOptions && !hasOptions && (
            <AlertTriangle className="w-3 h-3 text-warning">
              <title>Butuh opsi jawaban</title>
            </AlertTriangle> 
          )}
          {field.wajib && <span className="text-red-500" title="Wajib">*</span>}
          {!field.aktif && <EyeOff className="w-3 h-3 text-muted" ><title>Nonaktif</title></EyeOff>}
          {field.id && (
            <span className="text-[10px] text-muted font-mono px-1.5 py-0.5 rounded bg-line">
              {field.id.slice(0, 8)}
            </span>
          )}
        </div>
        
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          {field.tipe === "group" && field.jumlahKolom && (
            <span>📋 {field.jumlahKolom} kolom</span>
          )}
          {hasOptions && <span>☑ {field.opsi.filter((o) => o.aktif && o.value).length} opsi</span>}
          {hasRules && <span>🔗 {field.aturan.filter((a) => a.aktif).length} aturan</span>}
          {field.placeholder && <span className="italic">"{field.placeholder}"</span>}
        </div>
        
        {field.deskripsi && (
          <div className="mt-1 text-[11px] text-muted italic">
            {field.deskripsi}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            if (isSelected) {
              onDeselect();
            } else {
              onSelect(fieldClientId);
            }
          }}
        >
          <Settings className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDeleteField(fieldClientId); }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}