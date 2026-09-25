import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth.server";
import { getKunjunganRepository } from "@/lib/repositories";
import { ChecklistFormScene } from "@/features/checklist/components/ChecklistFormScene";
import type { KunjunganRecord } from "@/features/checklist/types";

export const Route = createFileRoute("/checklist/$id")({
  beforeLoad: requireAuth,
  loader: async ({ params }): Promise<{ record: KunjunganRecord | null }> => {
    const list = getKunjunganRepository().list();
    return { record: list.find((r) => r.id === params.id) ?? null };
  },
  component: ChecklistEdit,
});

function ChecklistEdit() {
  const { record } = Route.useLoaderData();
  // Record tidak ditemukan (mis. laman dibuka langsung di server tanpa localStorage):
  // fallback ke halaman input baru; tombol edit selalu menghantar via navigasi client.
  return <ChecklistFormScene record={record} />;
}