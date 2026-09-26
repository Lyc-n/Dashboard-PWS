import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth";
import { KunjunganRumahFormScene } from "@/features/kunjungan-rumah/components/KunjunganRumahFormScene";

export const Route = createFileRoute("/kunjungan-rumah")({
  beforeLoad: requireAuth,
  component: KunjunganRumah,
});

function KunjunganRumah() {
  return <KunjunganRumahFormScene />;
}