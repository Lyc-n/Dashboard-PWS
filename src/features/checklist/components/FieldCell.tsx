import type { KrTemplateField } from "@/lib/kr-templates";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";

interface Props {
  field: KrTemplateField;
  value: string;
  invalid?: boolean;
  onChange: (v: string) => void;
}

export function FieldCell({ field, value, invalid, onChange }: Props) {
  const errorId = `${field.id}-error`;
  const getPlaceholder = (f: KrTemplateField): string => {
    if (f.id.includes("Tempat")) return "contoh: Puskesmas Trajeng";
    if (f.id.includes("Petugas")) return "contoh: Bidan Siti";
    if (f.id.includes("Materi")) return "contoh: Penyuluhan gizi ibu hamil";
    if (f.id.includes("Hasil")) return "contoh: Normal";
    if (f.id === "nama" || f.id === "namaKK") return "contoh: Siti Aminah";
    if (f.id.includes("nama")) return "contoh: Siti Aminah";
    if (f.id === "umur") return "contoh: 28";
    if (f.id === "kehamilanKe" || f.id === "kelahiranKe") return "contoh: 2";
    if (f.id === "jarakKehamilan") return "contoh: 2 tahun";
    if (f.id === "paraf") return "contoh: Siti Aminah";
    if (f.id === "pukul") return "contoh: 08:00";
    if (f.id === "usiaKehamilan") return "contoh: 38";
    if (f.id.includes("alamat")) return "contoh: Jl. Melati No.12";
    if (f.id.includes("hp")) return "contoh: 08123456789";
    if (f.hint) return f.hint;
    return `Masukkan ${f.label.toLowerCase()}`;
  };
  if (field.kind === "text" || field.kind === "number") {
    return (
      <div className="grid gap-1.5">
        <span className="text-[11px] font-normal text-muted">{field.label}{field.required ? <span className="text-danger"> *</span> : null}</span>
        <Input placeholder={getPlaceholder(field)} value={value} onChange={(e) => onChange(e.target.value)} inputMode={field.kind === "number" ? "decimal" : undefined} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
        {field.hint ? <span className="text-[11px] font-normal text-muted">{field.hint}</span> : null}
        {invalid ? <span id={errorId} role="alert" className="text-[11px] font-semibold text-danger">Wajib diisi.</span> : null}
      </div>
    );
  }
  if (field.kind === "date") {
    return (
      <div className="grid gap-1.5">
        <span className="text-[11px] font-normal text-muted">{field.label}{field.required ? <span className="text-danger"> *</span> : null}</span>
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
        {field.hint ? <span className="text-[11px] font-normal text-muted">{field.hint}</span> : null}
        {invalid ? <span id={errorId} role="alert" className="text-[11px] font-semibold text-danger">Wajib diisi.</span> : null}
      </div>
    );
  }
  if (field.kind === "select") {
    return (
      <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib diisi." hint={field.hint} errorId={errorId}>
        <Select value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} aria-describedby={invalid ? errorId : undefined}>
          <option value="">— Pilih —</option>
          {(field.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </FormField>
    );
  }
  // Sisa satu-satunya kind yang belum return di atas adalah "checkbox".
  return (
    <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib centang." hint={field.hint} errorId={errorId}>
      <Checkbox checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))} aria-describedby={invalid ? errorId : undefined} />
    </FormField>
  );
}
