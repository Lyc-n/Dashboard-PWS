import type { DraftSection, DraftField, FlatNode } from "./types";

export type { FlatNode } from "./types";

/** Kunci grup sortable untuk section root (group harus string tak kosong). */
export const ROOT_GROUP = "root";

export interface TreeNode {
  kind: "section";
  clientId: string;
  children: TreeNode[];
  fields: { kind: "field"; clientId: string }[];
}

function buildSectionTree(sections: DraftSection[]): Map<string, TreeNode> {
  const nodeMap = new Map<string, TreeNode>();

  for (const s of sections) {
    nodeMap.set(s.clientId, { kind: "section", clientId: s.clientId, children: [], fields: [] });
  }

  for (const s of sections) {
    const node = nodeMap.get(s.clientId)!;
    if (s.parentClientId) {
      const parent = nodeMap.get(s.parentClientId);
      // Parent hilang: jangan dibuang, biarkan jadi root di flattenTree + warning.
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return nodeMap;
}

function attachFieldsToTree(tree: Map<string, TreeNode>, fields: DraftField[]): void {
  const fieldsBySection = new Map<string, { kind: "field"; clientId: string }[]>();
  for (const f of fields) {
    const list = fieldsBySection.get(f.sectionClientId) ?? [];
    list.push({ kind: "field", clientId: f.clientId });
    fieldsBySection.set(f.sectionClientId, list);
  }
  for (const [sectionId, fieldList] of fieldsBySection) {
    const node = tree.get(sectionId);
    if (node) node.fields = fieldList;
  }
}

/** Section yang parent-nya menunjuk id tidak ada. Ditampilkan sebagai root + warning. */
export function getOrphanSectionIds(sections: DraftSection[]): string[] {
  const ids = new Set(sections.map((s) => s.clientId));
  return sections
    .filter((s) => s.parentClientId && !ids.has(s.parentClientId))
    .map((s) => s.clientId);
}

/** Field yang section-nya tidak ada. Ditampilkan ikut warning, tidak dibuang. */
export function getOrphanFieldIds(sections: DraftSection[], fields: DraftField[]): string[] {
  const ids = new Set(sections.map((s) => s.clientId));
  return fields.filter((f) => !ids.has(f.sectionClientId)).map((f) => f.clientId);
}

export function flattenTree(
  sections: DraftSection[],
  fields: DraftField[]
): FlatNode[] {
  const tree = buildSectionTree(sections);
  attachFieldsToTree(tree, fields);

  const flat: FlatNode[] = [];
  let index = 0;

  function visitSection(node: TreeNode, parentKey: string | null, depth: number): void {
    flat.push({ kind: "section", clientId: node.clientId, parentKey, depth, index: index++ });
    for (const field of node.fields) {
      flat.push({ kind: "field", clientId: field.clientId, parentKey: node.clientId, depth: depth + 1, index: index++ });
    }
    for (const child of node.children) {
      visitSection(child, node.clientId, depth + 1);
    }
  }

  const ids = new Set(sections.map((s) => s.clientId));
  const visited = new Set<string>();

  // Root normal dulu, sesuai urutan input.
  for (const s of sections) {
    if (!s.parentClientId) {
      const node = tree.get(s.clientId);
      if (node && !visited.has(s.clientId)) {
        visited.add(s.clientId);
        // Tandai seluruh subtree agar tidak dikunjungi dua kali.
        const mark = (n: TreeNode) => {
          visited.add(n.clientId);
          for (const c of n.children) mark(c);
        };
        mark(node);
        visitSection(node, null, 0);
      }
    }
  }

  // Yatim: parent menunjuk id tak ada (atau siklus terputus) → tampil sebagai root.
  for (const s of sections) {
    if (visited.has(s.clientId)) continue;
    // Siklus A↔B tidak bisa di-visit lewat root; putus di sini jadi root agar terlihat.
    const node = tree.get(s.clientId);
    if (node) {
      visited.add(s.clientId);
      visitSection(node, null, 0);
    }
  }

  // Field yatim: section-nya tak ada → tempel di akhir agar tidak hilang diam-diam.
  const fieldIdsInFlat = new Set(flat.filter((n) => n.kind === "field").map((n) => n.clientId));
  for (const f of fields) {
    if (!fieldIdsInFlat.has(f.clientId) && !ids.has(f.sectionClientId)) {
      flat.push({ kind: "field", clientId: f.clientId, parentKey: null, depth: 0, index: index++ });
    }
  }

  void ids;
  return flat;
}
