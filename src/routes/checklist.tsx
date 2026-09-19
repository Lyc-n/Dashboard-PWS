import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth";
import { ChecklistFormScene } from "@/features/checklist/components/ChecklistFormScene";

export const Route = createFileRoute("/checklist")({
  beforeLoad: requireAuth,
  component: Checklist,
});

function Checklist() {
  return <ChecklistFormScene />;
}