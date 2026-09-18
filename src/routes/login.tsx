import { useState } from "react";
import type {FormEvent} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { APP_BRAND } from "@/lib/constants";
import { DEMO_ACCOUNTS, getAuth } from "@/lib/auth";
import { useAuth } from "@/providers/auth";
import { useToast } from "@/providers/toast";
import { LogoEmblem } from "@/components/atoms/LogoEmblem";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import ThemeToggle from "@/components/ThemeToggle";

export const Route = createFileRoute("/login")({
  beforeLoad: () => (getAuth() ? ({ redirect: { to: "/" } }) : undefined),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }
    const ok = login(username, password);
    if (!ok) {
      setError("Username atau password salah.");
      return;
    }
    toast("Berhasil masuk. Selamat bekerja!");
    void navigate({ to: "/" });
  };

  const demoUsername = DEMO_ACCOUNTS[0]?.username ?? "admin";

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-380">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoEmblem className="size-14 border-[3px] text-sm">PK</LogoEmblem>
          <div>
            <h1 className="text-lg font-bold leading-tight text-ink">{APP_BRAND.name}</h1>
            <p className="text-xs font-semibold tracking-[0.22em] text-muted">{APP_BRAND.region}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7 shadow-elev">
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <div>
              <h2 className="text-base font-bold text-ink">Masuk ke Dashboard</h2>
              <p className="mt-0.5 text-xs text-muted">Gunakan akun yang sudah terdaftar.</p>
            </div>

            <FormField label="Username" required error={error ?? undefined} invalid={!!error}>
              <Input
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="cth. admin"
                autoComplete="username"
              />
            </FormField>

            <FormField label="Password" required hint="Lihat sandi" error={error ?? undefined} invalid={!!error}>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-muted hover:text-ink"
                  aria-label={showPw ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPw ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
                </button>
              </div>
            </FormField>

            <Button type="submit" variant="primary" size="md" className="mt-1 w-full">
              Masuk
            </Button>

            <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3 text-xs text-muted">
              <span className="font-semibold text-ink">Akun demo:</span>{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-ink">{demoUsername}</code> /{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-ink">admin</code>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}