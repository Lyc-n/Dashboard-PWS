import { useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { pinLogin, getSessionToken } from "@/lib/utils.functions";
import { APP_BRAND } from "@/lib/constants";
import { useToast } from "@/providers/toast";
import brandIcon from "@/assets/brandIcon.png";
import { Button, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import ThemeToggle from "@/components/ThemeToggle";

/* ALUR LOGIN
1. cek sessionToken pake beforeLoad di /laporan (form)
2. sessionToken di crosscheck ke validSessions di DB
3. kalo gk ada kredensial redirect ke pin
4. pin valid redirect ke /laporan
5. update expireTime sessionToken kalo akses /laporan
*/

export const Route = createFileRoute("/pin")({
  beforeLoad: async () => {
    try {
      await getSessionToken();
    } catch {
      return undefined;
    }
    throw redirect({ to: "/" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("PIN wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      // expect: PIN benar → cookie sesi terpasang → pindah ke dashboard "/".
      const ok = await pinLogin({ data: { pin: Number(pin) } });
      if (!ok) {
        setError("PIN salah.");
        return;
      }
      toast("Berhasil masuk. Selamat bekerja!");
      void navigate({ to: "/" });
    } catch {
      setError("Gagal masuk. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <main className="max-w-xl w-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={brandIcon} alt="Kunjungan Rumah" width={64}/>
          <div>
            <h1 className="text-lg font-bold leading-tight text-ink">{APP_BRAND.name}</h1>
            <p className="text-xs font-semibold tracking-[0.22em] text-muted">{APP_BRAND.region}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7 shadow-elev">
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <div>
              <h2 className="text-base font-bold text-ink">Masuk dengan PIN</h2>
              <p className="mt-0.5 text-xs text-muted">Satu-satunya gerbang dashboard. Sesi berlaku 12 jam.</p>
            </div>

            <FormField label="PIN" required error={error ?? undefined} invalid={!!error}>
              <Input
                autoFocus
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="••••••"
                autoComplete="off"
                maxLength={8}
              />
            </FormField>

            <Button type="submit" variant="primary" size="md" className="mt-1 w-full" disabled={busy}>
              {busy ? "Memeriksa…" : "Masuk"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
