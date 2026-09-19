import type { ConditionalRule } from "@/lib/kr-form";

export function isConditionalActive(
  rule: ConditionalRule,
  values: Record<string, string>,
  checks: Record<string, boolean>,
): boolean {
  if (rule.kind === "checks") return !!checks[rule.trigger];
  const v = values[rule.trigger] ?? "";
  if (rule.whenNonEmpty) return !!String(v).trim();
  if (rule.when !== undefined) return String(v) === rule.when;
  return !!String(v).trim();
}

export function buildConditionalMap(rules: ConditionalRule[]): Map<string, ConditionalRule> {
  const m = new Map<string, ConditionalRule>();
  for (const r of rules) for (const dep of r.dependents) m.set(dep, r);
  return m;
}
