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
  if (field.kind === "checkbox") {
    return (
      <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib centang." hint={field.hint} errorId={errorId}>
        <Checkbox checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))} aria-describedby={invalid ? errorId : undefined} />
      </FormField>
    );
  }
  return (
    <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib diisi." hint={field.hint} errorId={errorId}>
      {field.kind === "number" ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
      ) : field.kind === "date" ? (
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
      )}
    </FormField>
  );
}
