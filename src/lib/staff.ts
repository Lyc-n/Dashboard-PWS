import { staffUsername } from "@/lib/seeds";

// helper akun staff pindah dari auth.server.ts — 
// expect: StaffSection tetap dapat saran username & password default; 
// berkas ini soal DATA KELOLA, bukan jalur login

export const DEFAULT_STAFF_PASSWORD = "admin123";

export function staffUsernameSuggestion(nama: string): string {
  return staffUsername(nama);
}
