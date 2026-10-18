import type { KunjunganRumahTemplateField } from '@/lib/kunjungan-rumah/template/kunjungan-rumah-templates'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'

/**
 * Satu cell field template kunjungan rumah.
 *
 * text, number, dan date sengaja lewat satu jalur FormField yang sama —
 * dulu ketiganya ditulis manual dengan label 11px muted, sementara select
 * di grid yang sama sudah FormField (12px semibold ink). Dua bahasa label di
 * satu form sunting itu hasil sisa pendahuluan, bukan desain; FormField juga
 * yang memegang perilaku invalid/hint/error yang sudah teruji.
 */
export function FieldCell({
  field,
  value,
  invalid,
  onChange,
}: {
  field: KunjunganRumahTemplateField
  value: string
  invalid?: boolean
  onChange: (v: string) => void
}) {
  const errorId = `${field.id}-error`
  const getPlaceholder = (f: KunjunganRumahTemplateField): string => {
    if (f.id.includes('Tempat')) return 'contoh: Puskesmas Trajeng'
    if (f.id.includes('Petugas')) return 'contoh: Bidan Siti'
    if (f.id.includes('Materi')) return 'contoh: Penyuluhan gizi ibu hamil'
    if (f.id.includes('Hasil')) return 'contoh: Normal'
    if (f.id === 'nama' || f.id === 'namaKK') return 'contoh: Siti Aminah'
    if (f.id.includes('nama')) return 'contoh: Siti Aminah'
    if (f.id === 'umur') return 'contoh: 28'
    if (f.id === 'kehamilanKe' || f.id === 'kelahiranKe') return 'contoh: 2'
    if (f.id === 'jarakKehamilan') return 'contoh: 2 tahun'
    if (f.id === 'paraf') return 'contoh: Siti Aminah'
    if (f.id === 'pukul') return 'contoh: 08:00'
    if (f.id === 'usiaKehamilan') return 'contoh: 38'
    if (f.id.includes('alamat')) return 'contoh: Jl. Melati No.12'
    if (f.id.includes('hp')) return 'contoh: 08123456789'
    if (f.hint) return f.hint
    return `Masukkan ${f.label.toLowerCase()}`
  }

  if (field.kind === 'select') {
    return (
      <FormField
        label={field.label}
        required={field.required}
        invalid={invalid}
        error="Wajib diisi."
        hint={field.hint}
        errorId={errorId}
      >
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
        >
          <option value="">— Pilih —</option>
          {(field.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </FormField>
    )
  }
  if (field.kind === 'checkbox') {
    return (
      <FormField
        label={field.label}
        required={field.required}
        invalid={invalid}
        error="Wajib centang."
        hint={field.hint}
        errorId={errorId}
      >
        <Checkbox
          checked={value === 'true'}
          onChange={(e) => onChange(String(e.target.checked))}
          aria-describedby={invalid ? errorId : undefined}
        />
      </FormField>
    )
  }
  // Sisa text / number / date: bedanya cuma atribut input-nya.
  return (
    <FormField
      label={field.label}
      required={field.required}
      invalid={invalid}
      error="Wajib diisi."
      hint={field.hint}
      errorId={errorId}
    >
      <Input
        type={field.kind === 'date' ? 'date' : undefined}
        inputMode={field.kind === 'number' ? 'decimal' : undefined}
        placeholder={field.kind === 'date' ? undefined : getPlaceholder(field)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
      />
    </FormField>
  )
}
