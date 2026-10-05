import { useSortable } from "@dnd-kit/react/sortable";
import { Plus, Trash2, GripVertical, FolderOpen } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import type { DraftSection, FlatNode, DraftField } from "./types";
import { SECTION_GROUP } from "./tree";
import { FieldNode } from "./FieldNode";

interface Props {
  section: DraftSection;
  flatTree: FlatNode[];
  index: number;
  disabled?: boolean;
  isSelected: boolean;
  fieldsByClientId: Map<string, DraftField>;
  onSelect: (clientId: string) => void;
  onSelectField: (clientId: string) => void;
  onDeselectField: () => void;
  selectedFieldClientId: string | null;
  onAddField: (sectionClientId: string) => void;
  onUpdateSection: (clientId: string, patch: Partial<DraftSection>) => void;
  /** undefined = form ini mengunci struktur section, jadi tombolnya disembunyikan. */
  onDeleteSection?: (clientId: string) => void;
  onUpdateField: (clientId: string, patch: Partial<DraftField>) => void;
  /** undefined = field ini tidak boleh dihapus, jadi tombolnya disembunyikan. */
  onDeleteField?: (clientId: string) => void;
}

export function SectionNode({
  section,
  flatTree,
  index,
  disabled,
  isSelected,
  fieldsByClientId,
  onSelect,
  onSelectField,
  onDeselectField,
  selectedFieldClientId,
  onAddField,
  onUpdateSection,
  onDeleteSection,
  onUpdateField,
  onDeleteField,
}: Props) {
  // Terima section (reorder) + field (pindah masuk) + palette (buat field baru).
  const { ref, isDropTarget, isDragging } = useSortable({
    id: section.clientId,
    index,
    group: SECTION_GROUP,
    type: "section",
    accept: ["palette", "template", "section", "field"],
    data: { kind: "section", clientId: section.clientId },
    disabled,
  });

  const fields = flatTree.filter(
    (n) => n.kind === "field" && n.parentKey === section.clientId
  );

  return (
    <div
      ref={ref}
      className="relative"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div
        className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${
          isSelected ? "border-accent-border bg-accent-light" : "border-line hover:border-accent-border"
        } ${isDropTarget ? "bg-accent-light/50 border-accent-border" : ""}`}
        onClick={() => onSelect(section.clientId)}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-4 h-4 shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="w-4 h-4 text-muted cursor-grab opacity-0 group-hover:opacity-100" />
            <FolderOpen className="w-4 h-4 text-accent shrink-0" />
            <Input
              value={section.nama}
              onChange={(e) => { e.stopPropagation(); onUpdateSection(section.clientId, { nama: e.target.value }); }}
              className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 text-sm font-medium text-ink placeholder:text-muted"
              placeholder="Nama section"
            />
            {section.id && (
              <span className="text-[10px] text-muted font-mono px-1.5 py-0.5 rounded bg-line">
                {section.id.slice(0, 8)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAddField(section.clientId); }}>
            <Plus className="w-3 h-3" /> Field
          </Button>
          {onDeleteSection ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onDeleteSection(section.clientId); }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          ) : null}
        </div>
      </div>

      {section.deskripsi && (
        <div className="mt-1 ml-6 text-xs text-muted italic border-l border-line pl-2">
          {section.deskripsi}
        </div>
      )}

      <div className="ml-6">
        {fields.map((f, idx) => {
          const field = fieldsByClientId.get(f.clientId);
          if (!field) return null;
          return (
            <FieldNode
              key={f.clientId}
              fieldClientId={f.clientId}
              index={idx}
              disabled={disabled}
              field={field}
              isSelected={selectedFieldClientId === f.clientId}
              onSelect={onSelectField}
              onDeselect={onDeselectField}
              onUpdateField={onUpdateField}
              onDeleteField={onDeleteField}
            />
          );
        })}
        {fields.length === 0 && (
          <div className="mt-2 ml-6 text-xs text-muted italic border-l border-dashed border-line pl-2 py-1">
            Belum ada pertanyaan. Tarik dari panel kiri atau klik + Field.
          </div>
        )}
      </div>
    </div>
  );
}