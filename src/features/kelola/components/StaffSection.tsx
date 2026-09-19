import { useMemo, useState } from "react";
import type { Staff } from "@/lib/seeds";
import { KELS, PERAN, POSY } from "@/lib/constants";
import { DEFAULT_STAFF_PASSWORD, staffUsernameSuggestion } from "@/lib/auth";
import { useToast } from "@/providers/toast";
import { DataTable } from "@/components/organisms/DataTable";
import { SectionCard } from "@/components/molecules/SectionCard";
import { FormField } from "@/components/molecules/FormField";
import { Toolbar } from "@/components/molecules/Toolbar";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import type { DlgState } from "@/features/kelola/types";
import { AdminModal } from "@/features/kelola/components/AdminModal";

interface Props {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
}

export function StaffSection({ staff, setStaff }: Props) {
  const toast = useToast();
  const [staffQ, setStaffQ] = useState("");
  const [staffF, setStaffF] = useState("all");
  const [dlg, setDlg] = useState<DlgState | null>(null);

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (s) =>
          (staffF === "all" || (staffF === "on" ? s.on : !s.on)) &&
          (!staffQ || s.nama.toLowerCase().includes(staffQ.toLowerCase())),
      ),
    [staff, staffF, staffQ],
  );

  const setForm = (key: string, value: string) =>
    setDlg((d) => (d ? { ...d, form: { ...d.form, [key]: value }, errs: { ...d.errs, [key]: "" } } : d));

  const saveDlg = () => {
    if (!dlg) return;
    const nama = (dlg.form.nama ?? "").trim();
    if (!nama) {
      setDlg((d) => ({ ...d!, errs: { ...d!.errs, nama: "Wajib isi nama staff." } }));
      return;
    }
    const payload = {
      nama,
      peran: dlg.form.peran ?? "Kader",
      kel: dlg.form.kel ?? KELS[0],
      posy: dlg.form.posy ?? "—",
      hp: dlg.form.hp ?? "",
      username: dlg.form.username?.trim() ? dlg.form.username.trim() : staffUsernameSuggestion(nama),
      password: dlg.form.password?.trim() || DEFAULT_STAFF_PASSWORD,
    };
    if (dlg.edit) {
      setStaff((prev) => prev.map((s) => (s === dlg.edit ? { ...s, ...payload } : s)));
    } else {
      setStaff((prev) => [...prev, { ...payload, on: true }]);
    }
    toast("Data staff tersimpan.");
    setDlg(null);
  };

  const openStaffDlg = (edit?: Staff) =>
    setDlg({
      kind: "staff",
      title: edit ? "Ubah staff" : "Tambah staff",
      edit,
      form: {
        nama: edit?.nama ?? "",
        peran: edit?.peran ?? "Kader",
        kel: edit?.kel ?? KELS[0],
        posy: edit?.posy ?? "—",
        hp: edit?.hp ?? "",
        username: edit?.username ?? "",
        password: edit?.password ?? DEFAULT_STAFF_PASSWORD,
      },
      errs: {},
    });

  const toggleStaff = (s: Staff) => {
    if (s.on && !window.confirm(`Nonaktifkan "${s.nama}"? Akun tidak bisa login sampai diaktifkan lagi.`)) return;
    setStaff((prev) => prev.map((x) => (x === s ? { ...x, on: !x.on } : x)));
    toast(`${s.nama} ${s.on ? "dinonaktifkan" : "diaktifkan"}.`);
  };

  return (
    <>
      <SectionCard title="Daftar staff & kader" sub="Nonaktifkan akun yang sudah tidak bertugas — data tidak dihapus permanen.">
        <Toolbar>
          <Button size="sm" variant="primary" onClick={() => openStaffDlg()}>
            + Tambah staff
          </Button>
          <Input value={staffQ} onChange={(e) => setStaffQ(e.target.value)} placeholder="Cari nama…" aria-label="Cari staff" className="max-w-55" />
          <Select value={staffF} onChange={(e) => setStaffF(e.target.value)} aria-label="Filter status staff" className="max-w-[180px]">
            <option value="all">Semua status</option>
            <option value="on">Aktif</option>
            <option value="off">Nonaktif</option>
          </Select>
          <span className="ml-auto text-xs text-muted">
            {filteredStaff.length} dari {staff.length} staff
          </span>
        </Toolbar>
        <DataTable
          columns={[
            { key: "nama", label: "Nama & peran" },
            { key: "wilayah", label: "Wilayah tugas" },
            { key: "kontak", label: "Kontak" },
            { key: "status", label: "Status" },
            { key: "aksi", label: "" },
          ]}
          rows={filteredStaff}
          emptyMessage="Tidak ada staff cocok."
          renderRow={(s, i) => (
            <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none hover:bg-surface-2">
              <td className="px-3 py-2.5">
                <div className="font-semibold text-ink">{s.nama}</div>
                <div className="text-[11px] text-muted">{s.peran}</div>
              </td>
              <td className="px-3 py-2.5">
                Kel. {s.kel} · {s.posy}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{s.hp}</td>
              <td className="px-3 py-2.5">
                <StatusBadge variant={s.on ? "on" : "off"} value={s.on ? "Aktif" : "Nonaktif"} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <Button size="sm" onClick={() => openStaffDlg(s)}>
                  Ubah
                </Button>{" "}
                <Button size="sm" onClick={() => toggleStaff(s)}>
                  {s.on ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </td>
            </tr>
          )}
          renderMobileRow={(s, i) => (
            <div key={i} className="border-b border-[var(--color-surface-2)] last:border-none px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{s.nama}</div>
                  <div className="text-[11px] text-muted">{s.peran} · Kel. {s.kel} · {s.posy}</div>
                </div>
                <StatusBadge variant={s.on ? "on" : "off"} value={s.on ? "Aktif" : "Nonaktif"} />
              </div>
              <div className="mt-1 text-[11px] text-muted">{s.hp}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => openStaffDlg(s)}>Ubah</Button>
                <Button size="sm" onClick={() => toggleStaff(s)}>
                  {s.on ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </div>
          )}
        />
      </SectionCard>

      {dlg ? (
        <AdminModal title={dlg.title} onClose={() => setDlg(null)} onSave={saveDlg}>
          <FormField label="Nama lengkap" required error={dlg.errs.nama || "Wajib diisi."} invalid={!!dlg.errs.nama}>
            <Input value={dlg.form.nama ?? ""} onChange={(e) => setForm("nama", e.target.value)} invalid={!!dlg.errs.nama} placeholder="cth. Ibu Warsini" />
          </FormField>
          <FormField label="Peran">
            <Select value={dlg.form.peran ?? ""} onChange={(e) => setForm("peran", e.target.value)}>
              {PERAN.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Kelurahan tugas">
            <Select value={dlg.form.kel ?? ""} onChange={(e) => setForm("kel", e.target.value)}>
              {KELS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Posyandu">
            <Select value={dlg.form.posy ?? ""} onChange={(e) => setForm("posy", e.target.value)}>
              <option>—</option>
              {POSY.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="No. HP">
            <Input value={dlg.form.hp ?? ""} onChange={(e) => setForm("hp", e.target.value)} placeholder="cth. 0812xxxx" type="tel" />
          </FormField>
          <FormField label="Username" hint={`Kosongkan: otomatis dari nama (mis. ${staffUsernameSuggestion(dlg.form.nama ?? "Siti Aminah")})`}>
            <Input value={dlg.form.username ?? ""} onChange={(e) => setForm("username", e.target.value)} placeholder="mis. siti.aminah" autoCapitalize="none" autoComplete="off" />
          </FormField>
          <FormField label="Password" hint={`Dipakai login kader. Default: ${DEFAULT_STAFF_PASSWORD}`}>
            <Input value={dlg.form.password ?? ""} onChange={(e) => setForm("password", e.target.value)} placeholder={DEFAULT_STAFF_PASSWORD} autoComplete="off" />
          </FormField>
        </AdminModal>
      ) : null}
    </>
  );
}
