import { useDraggable } from "@dnd-kit/react";
import { 
  Type, AlignLeft, Hash, ChevronsDownUp, Circle, CheckSquare, 
  Calendar, Clock, Image, File, Layout 
} from "lucide-react";
import type { PaletteItem } from "./types";

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  select: ChevronsDownUp,
  radio: Circle,
  checkbox: CheckSquare,
  date: Calendar,
  time: Clock,
  image: Image,
  file: File,
  group: Layout,
};

export function BlockPalette({ items, onDragStart, disabled }: { items: PaletteItem[]; onDragStart?: () => void; disabled?: boolean }) {
  return (
    <div className="w-60 shrink-0 border-r border-line bg-surface-2 p-3 overflow-y-auto overflow-x-none h-full min-h-0">
      <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-2">Komponen</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <PaletteItemDraggable key={item.tipe} item={item} onDragStart={onDragStart} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

function PaletteItemDraggable({ item, onDragStart, disabled }: { item: PaletteItem; onDragStart?: () => void; disabled?: boolean }) {
  const Icon = ICON_MAP[item.icon] || Type;
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