import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth";
import { getKunjungan } from "@/lib/utils.functions";
import { sanitizeRecord } from "@/features/checklist/types";
import { ChecklistFormScene } from "@/features/checklist/components/ChecklistFormScene";
import type { KunjunganRecord } from "@/features/checklist/types";

export const Route = createFileRoute("/checklist/$id")({
  beforeLoad: requireAuth,
  loader: async ({ params }): Promise<{ record: KunjunganRecord | null }> => {
    const row = await getKunjungan({ data: { id: params.id } });
    if (!row) return { record: null };
    return { record: sanitizeRecord(row) };
  },
  component: ChecklistEdit,
});

function ChecklistEdit() {
  const { record } = Route.useLoaderData();
  // Record tidak ditemukan: fallback ke halaman input baru.
  return <ChecklistFormScene record={record} />;
}
