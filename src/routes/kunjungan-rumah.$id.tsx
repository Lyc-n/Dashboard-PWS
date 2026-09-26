import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth";
import { getKunjunganRumah } from "@/lib/utils.functions";
import { sanitizeRecord } from "@/features/kunjungan-rumah/types";
import { KunjunganRumahFormScene } from "@/features/kunjungan-rumah/components/KunjunganRumahFormScene";
import type { KunjunganRumahRecord } from "@/features/kunjungan-rumah/types";

export const Route = createFileRoute("/kunjungan-rumah/$id")({
  beforeLoad: requireAuth,
  loader: async ({ params }): Promise<{ record: KunjunganRumahRecord | null }> => {
    const row = await getKunjunganRumah({ data: { id: params.id } });
    if (!row) return { record: null };
    return { record: sanitizeRecord(row) };
  },
  component: KunjunganRumahEdit,
});

function KunjunganRumahEdit() {
  const { record } = Route.useLoaderData();
  // Record tidak ditemukan: fallback ke halaman input baru.
  return <KunjunganRumahFormScene record={record} />;
}
