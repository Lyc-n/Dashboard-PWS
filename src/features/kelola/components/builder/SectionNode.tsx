import { useSortable } from "@dnd-kit/react/sortable";
import { ChevronRight, Plus, Trash2, GripVertical, FolderOpen } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import type { DraftSection, FlatNode, DraftField } from "./types";
import { ROOT_GROUP } from "./tree";
import { FieldNode } from "./FieldNode";

interface Props {
  section: DraftSection;
  flatTree: FlatNode[];
  depth: number;
  index: number;
  disabled?: boolean;
  isSelected: boolean;
  isOrphan?: boolean;
  sectionsByClientId: Map<string, DraftSection>;
  fieldsByClientId: Map<string, DraftField>;
  onSelect: (clientId: string) => void;
  onSelectField: (clientId: string) => void;
  onDeselectField: () => void;
  selectedFieldClientId: string | null;
  onAddField: (sectionClientId: string) => void;
  onAddSubSection: (parentClientId: string) => void;
  onUpdateSection: (clientId: string, patch: Partial<DraftSection>) => void;
  onDeleteSection: (clientId: string) => void;
  onUpdateField: (clientId: string, patch: Partial<DraftField>) => void;
  onDeleteField: (clientId: string) => void;
}

export function SectionNode({
  section,
  flatTree,
  depth,
  index,
  disabled,
  isSelected,
  isOrphan = false,
  sectionsByClientId,
  fieldsByClientId,
  onSelect,
  onSelectField,
  onDeselectField,
  selectedFieldClientId,
  onAddField,
  onAddSubSection,
  onUpdateSection,
  onDeleteSection,
  onUpdateField,
  onDeleteField,
}: Props) {
  // Terima section (reorder sibling) + field (pindah masuk). Tolak palette? palette
  // justru diterima di sini untuk membuat field baru — lihat matriks accept.
  const { ref, isDropTarget, isDragging } = useSortable({
    id: section.clientId,
    index,
    group: section.parentClientId ?? ROOT_GROUP,
    type: "section",
    accept: ["palette", "section", "field"],
    data: { kind: "section", clientId: section.clientId },
    disabled,
  });
  
  const children = flatTree.filter(
    (n) => n.kind === "section" && n.parentKey === section.clientId
  );
  const fields = flatTree.filter(
    (n) => n.kind === "field" && n.parentKey === section.clientId
  );
  
  const hasChildren = children.length > 0;

  return (
    <div
      ref={ref}
      className={`relative ${depth > 0 ? "ml-6 border-l border-line pl-3" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div
        className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${
          isSelected ? "border-accent-border bg-accent-light" : "border-line hover:border-accent-border"
        } ${isDropTarget ? "bg-accent-light/50 border-accent-border" : ""}`}
        onClick={() => onSelect(section.clientId)}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {hasChildren ? (
            <ChevronRight className="w-4 h-4 text-muted shrink-0" style={{ transform: "rotate(90deg)" }} />
          ) : (
            <div className="w-4 h-4 shrink-0" />
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="w-4 h-4 text-muted cursor-grab opacity-0 group-hover:opacity-100" />
            <FolderOpen className="w-4 h-4 text-accent shrink-0" />
            <Input
              value={section.nama}
              onChange={(e) => { e.stopPropagation(); onUpdateSection(section.clientId, { nama: e.target.value }); }}
              className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 text-sm font-medium text-ink placeholder:text-muted"
              placeholder="Nama section"
            />
            {isOrphan && (
              <span className="text-[10px] text-destructive font-mono px-1.5 py-0.5 rounded bg-destructive/10" title="Parent section tidak ditemukan, ditampilkan sebagai root. Perbaiki parent-nya sebelum Build.">
                yatim
              </span>
            )}
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
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAddSubSection(section.clientId); }}>
            <Plus className="w-3 h-3" /> Sub
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); onDeleteSection(section.clientId); }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {section.deskripsi && (
        <div className="mt-1 ml-6 text-xs text-muted italic border-l border-line pl-2">
          {section.deskripsi}
        </div>
      )}
      
      <>
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
      </>
      
      {children.map((child, childIdx) => {
        const childSection = sectionsByClientId.get(child.clientId);
        if (!childSection) return null;
        return (
          <SectionNode
            key={child.clientId}
            section={childSection}
            flatTree={flatTree}
            depth={depth + 1}
            index={childIdx}
            disabled={disabled}
            isSelected={isSelected}
            isOrphan={false}
            sectionsByClientId={sectionsByClientId}
            fieldsByClientId={fieldsByClientId}
            onSelect={onSelect}
            onSelectField={onSelectField}
            onDeselectField={onDeselectField}
            selectedFieldClientId={selectedFieldClientId}
            onAddField={onAddField}
            onAddSubSection={onAddSubSection}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
            onUpdateField={onUpdateField}
            onDeleteField={onDeleteField}
          />
        );
      })}
    </div>
  );
}