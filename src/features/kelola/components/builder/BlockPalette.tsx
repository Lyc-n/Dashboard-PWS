import { useDraggable } from "@dnd-kit/react";
import { ikonUntuk } from "./ikon-builder";
import type { PaletteItem } from "./types";
import { idDragTemplate, templatePerKelompok } from "@/features/form-builder/services/template-field";
import type { TemplateField } from "@/features/form-builder/services/template-field";

export function BlockPalette({ items, onDragStart, disabled }: { items: PaletteItem[]; onDragStart?: () => void; disabled?: boolean }) {
  const kelompokTemplate = templatePerKelompok();

  return (
    <div className="w-60 shrink-0 border-r border-line bg-surface-2 p-3 overflow-y-auto overflow-x-none h-full min-h-0">
      <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-2">Komponen</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <PaletteItemDraggable key={item.tipe} item={item} onDragStart={onDragStart} disabled={disabled} />
        ))}
      </div>

      {kelompokTemplate.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wide mt-5 mb-1">
            Siap pakai
          </h3>
          <p className="text-[10px] leading-snug text-muted mb-2">
            Tarik ke section, field langsung jadi lengkap — nama teknis dan
            daftar jawabannya sudah terisi.
          </p>
          {kelompokTemplate.map((group) => (
            <div key={group.kelompok} className="mb-3 last:mb-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">
                {group.kelompok}
              </div>
              <div className="grid gap-1.5">
                {group.daftar.map((template) => (
                  <TemplateDraggable
                    key={template.id}
                    template={template}
                    onDragStart={onDragStart}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function PaletteItemDraggable({ item, onDragStart, disabled }: { item: PaletteItem; onDragStart?: () => void; disabled?: boolean }) {
  const Icon = ikonUntuk(item.icon);
  const { ref, isDragging } = useDraggable({
    id: `palette-${item.tipe}`,
    type: "palette",
    data: { kind: "palette", fieldType: item.tipe },
    disabled,
  });

  return (
    <div
      ref={ref}
      onDragStart={onDragStart}
      className="group flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 cursor-grab hover:border-accent-border hover:shadow-sm transition-all"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded border border-line bg-accent-light">
        <Icon className="w-4 h-4 text-accent" strokeWidth={2} />
      </div>
      <span className="flex-1 text-sm font-medium text-ink truncate">{item.label}</span>
    </div>
  );
}

/**
 * Satu template siap pakai.
 *
 * Ikon memakai nama ikon dari katalog, bukan tipe field: dua template sama-sama
 * `radio` (mis. agama dan pendidikan) butuh ikon berbeda supaya mudah dibedakan
 * saat memilih.
 */
function TemplateDraggable({ template, onDragStart, disabled }: {
  template: TemplateField;
  onDragStart?: () => void;
  disabled?: boolean;
}) {
  const Icon = ikonUntuk(template.ikon);
  const { ref, isDragging } = useDraggable({
    id: idDragTemplate(template.id),
    type: "template",
    data: { kind: "template", templateId: template.id },
    disabled,
  });

  return (
    <div
      ref={ref}
      onDragStart={onDragStart}
      title={`${template.nama} — ${template.hint}`}
      className="group flex items-center gap-2 rounded-lg border border-dashed border-accent-border bg-accent-light/40 p-2 cursor-grab hover:border-accent hover:bg-accent-light hover:shadow-sm transition-all"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="w-7 h-7 flex items-center justify-center rounded border border-line bg-surface shrink-0">
        <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-ink truncate">{template.label}</div>
        <div className="text-[10px] text-muted font-mono truncate">{template.nama}</div>
      </div>
    </div>
  );
}