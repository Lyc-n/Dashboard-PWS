import { useCallback, useState, useMemo } from "react";
import { buildFormBuilder } from "@/lib/utils.functions";
import type { DefinisiVersi } from "@/hooks/use-form-builder";
import type {
  DraftFormDocument,
  DraftSection,
  DraftField,
  DraftOpsi,
  DraftAturan,
  BuildFormVersionInput,
  SelectedItem,
  PaletteItem,
  TipeFieldEditor,
  BuildFormVersionResult,
} from "@/features/kelola/components/builder/types";
import type { DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { flattenTree, ROOT_GROUP } from "@/features/kelola/components/builder/tree";
import { SEMUA_TIPE_FIELD, TIPE_BUTUH_OPSI } from "@/features/form-builder/services/validasi";
import { useToast } from "@/providers/toast";

function generateClientId(): string {
  return crypto.randomUUID();
}

function createEmptyOpsi(tipe: TipeFieldEditor): DraftOpsi[] {
  if (TIPE_BUTUH_OPSI.includes(tipe)) {
    return [{ clientId: generateClientId(), value: "", label: "", aktif: true }];
  }
  return [];
}

function createDefaultField(sectionClientId: string, tipe: TipeFieldEditor = "text"): DraftField {
  return {
    id: null,
    clientId: generateClientId(),
    sectionClientId,
    nama: "",
    label: "",
    tipe,
    wajib: false,
    aktif: true,
    placeholder: null,
    deskripsi: null,
    jumlahKolom: tipe === "group" ? 2 : null,
    opsi: createEmptyOpsi(tipe),
    aturan: [],
  };
}

function createDefaultSection(parentClientId: string | null = null): DraftSection {
  return {
    id: null,
    clientId: generateClientId(),
    parentClientId,
    nama: "Section baru",
    deskripsi: null,
    aktif: true,
  };
}

function definisiToDraft(definisi: DefinisiVersi): DraftFormDocument {
  const sections: DraftSection[] = definisi.sections.map((s) => ({
    id: s.id,
    clientId: s.id,
    parentClientId: s.parentId,
    nama: s.nama,
    deskripsi: s.deskripsi,
    aktif: s.aktif,
  }));
  
  const fields: DraftField[] = definisi.sections.flatMap((section) =>
    section.fields.map((f) => ({
      id: f.id,
      clientId: f.id,
      sectionClientId: section.id,
      nama: f.nama,
      label: f.label,
      tipe: f.tipe,
      wajib: f.wajib,
      aktif: f.aktif,
      placeholder: f.placeholder,
      deskripsi: f.deskripsi,
      jumlahKolom: f.jumlahKolom,
      opsi: f.opsi.map((o, i) => ({
        clientId: o.id || `opsi-${f.id}-${i}`,
        value: o.value || "",
        label: o.label || "",
        aktif: o.aktif,
      })),
      aturan: f.aturan
        .filter(
          (a): a is typeof a & { sourceFieldId: string; operator: "equals" | "not_equals" } =>
            a.sourceFieldId !== null && a.operator !== null,
        )
        .map((a, i) => ({
          clientId: a.id || `aturan-${f.id}-${i}`,
          sourceClientId: a.sourceFieldId,
          operator: a.operator,
          value: a.value || "",
          aktif: a.aktif,
        })),
    }))
  );
  
  return { formVersionId: definisi.id, sections, fields };
}

interface UseFormBuilderDraftReturn {
  document: DraftFormDocument | null;
  flatTree: ReturnType<typeof flattenTree>;
  selectedItem: SelectedItem;
  setSelectedItem: (item: SelectedItem) => void;
  palette: PaletteItem[];
  saving: boolean;
  buildError: string | null;
  loadDocument: (definisi: DefinisiVersi) => void;
  clearDocument: () => void;
  addSection: (parentClientId: string | null) => string;
  deleteSection: (clientId: string) => void;
  addField: (sectionClientId: string, tipe: TipeFieldEditor) => string;
  deleteField: (clientId: string) => void;
  updateSection: (clientId: string, patch: Partial<DraftSection>) => void;
  updateField: (clientId: string, patch: Partial<DraftField>) => void;
  addOpsi: (fieldClientId: string) => void;
  updateOpsi: (fieldClientId: string, opsiClientId: string, patch: Partial<DraftOpsi>) => void;
  deleteOpsi: (fieldClientId: string, opsiClientId: string) => void;
  addAturan: (fieldClientId: string, sourceClientId: string) => void;
  updateAturan: (fieldClientId: string, aturanClientId: string, patch: Partial<DraftAturan>) => void;
  deleteAturan: (fieldClientId: string, aturanClientId: string) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  buildForm: () => Promise<BuildFormVersionResult | null>;
}

export function useFormBuilderDraft(): UseFormBuilderDraftReturn {
  const toast = useToast();
  const [document, setDocument] = useState<DraftFormDocument | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [saving, setSaving] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  
  const palette = useMemo<PaletteItem[]>(() => 
    SEMUA_TIPE_FIELD.map((t) => ({
      tipe: t,
      label: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " "),
      icon: t,
    }))
  , []);
  
  const flatTree = useMemo(() => 
    document ? flattenTree(document.sections, document.fields) : []
  , [document]);
  
  const loadDocument = useCallback((definisi: DefinisiVersi) => {
    setDocument(definisiToDraft(definisi));
    setSelectedItem(null);
    setBuildError(null);
  }, []);
  
  const clearDocument = useCallback(() => {
    setDocument(null);
    setSelectedItem(null);
    setBuildError(null);
  }, []);
  
  const updateDocument = useCallback((updater: (doc: DraftFormDocument) => DraftFormDocument) => {
    setDocument((prev) => prev ? updater(prev) : null);
  }, []);
  
  const addSection = useCallback((parentClientId: string | null) => {
    const clientId = generateClientId();
    updateDocument((doc) => ({
      ...doc,
      sections: [...doc.sections, { ...createDefaultSection(parentClientId), clientId }],
    }));
    return clientId;
  }, [updateDocument]);
  
  const deleteSection = useCallback((clientId: string) => {
    updateDocument((doc) => {
      const descendantSectionIds = new Set<string>();
      function collectDescendants(parentId: string) {
        for (const s of doc.sections) {
          if (s.parentClientId === parentId) {
            descendantSectionIds.add(s.clientId);
            collectDescendants(s.clientId);
          }
        }
      }
      collectDescendants(clientId);

      const sectionsToDelete = new Set([clientId, ...descendantSectionIds]);
      const deletedFieldIds = new Set(
        doc.fields.filter((f) => sectionsToDelete.has(f.sectionClientId)).map((f) => f.clientId)
      );

      return {
        ...doc,
        sections: doc.sections.filter((s) => !sectionsToDelete.has(s.clientId)),
        fields: doc.fields
          .filter((f) => !deletedFieldIds.has(f.clientId))
          .map((f) => ({
            ...f,
            aturan: f.aturan.filter((a) => !deletedFieldIds.has(a.sourceClientId)),
          })),
      };
    });
    setSelectedItem(null);
  }, [updateDocument]);
  
  const addField = useCallback((sectionClientId: string, tipe: TipeFieldEditor) => {
    const clientId = generateClientId();
    updateDocument((doc) => ({
      ...doc,
      fields: [...doc.fields, { ...createDefaultField(sectionClientId, tipe), clientId }],
    }));
    return clientId;
  }, [updateDocument]);
  
  const deleteField = useCallback((clientId: string) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields
        .filter((f) => f.clientId !== clientId)
        .map((f) => ({
          ...f,
          aturan: f.aturan.filter((a) => a.sourceClientId !== clientId),
        })),
    }));
    setSelectedItem((prev) => prev?.type === "field" && prev.clientId === clientId ? null : prev);
  }, [updateDocument]);
  
  const updateSection = useCallback((clientId: string, patch: Partial<DraftSection>) => {
    updateDocument((doc) => ({
      ...doc,
      sections: doc.sections.map((s) => (s.clientId === clientId ? { ...s, ...patch } : s)),
    }));
  }, [updateDocument]);
  
  const updateField = useCallback((clientId: string, patch: Partial<DraftField>) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) => (f.clientId === clientId ? { ...f, ...patch } : f)),
    }));
  }, [updateDocument]);
  
  const addOpsi = useCallback((fieldClientId: string) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) =>
        f.clientId === fieldClientId
          ? { ...f, opsi: [...f.opsi, { clientId: generateClientId(), value: "", label: "", aktif: true }] }
          : f
      ),
    }));
  }, [updateDocument]);
  
  const updateOpsi = useCallback((fieldClientId: string, opsiClientId: string, patch: Partial<DraftOpsi>) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) =>
        f.clientId === fieldClientId
          ? { ...f, opsi: f.opsi.map((o) => (o.clientId === opsiClientId ? { ...o, ...patch } : o)) }
          : f
      ),
    }));
  }, [updateDocument]);
  
  const deleteOpsi = useCallback((fieldClientId: string, opsiClientId: string) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) =>
        f.clientId === fieldClientId
          ? { ...f, opsi: f.opsi.filter((o) => o.clientId !== opsiClientId) }
          : f
      ),
    }));
  }, [updateDocument]);
  
  const addAturan = useCallback((fieldClientId: string, sourceClientId: string) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) =>
        f.clientId === fieldClientId
          ? { ...f, aturan: [...f.aturan, { clientId: generateClientId(), sourceClientId, operator: "equals", value: "", aktif: true }] }
          : f
      ),
    }));
  }, [updateDocument]);
  
  const updateAturan = useCallback((fieldClientId: string, aturanClientId: string, patch: Partial<DraftAturan>) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) =>
        f.clientId === fieldClientId
          ? { ...f, aturan: f.aturan.map((a) => (a.clientId === aturanClientId ? { ...a, ...patch } : a)) }
          : f
      ),
    }));
  }, [updateDocument]);
  
  const deleteAturan = useCallback((fieldClientId: string, aturanClientId: string) => {
    updateDocument((doc) => ({
      ...doc,
      fields: doc.fields.map((f) =>
        f.clientId === fieldClientId
          ? { ...f, aturan: f.aturan.filter((a) => a.clientId !== aturanClientId) }
          : f
      ),
    }));
  }, [updateDocument]);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (event.canceled || !document) return;
    const { source, target } = event.operation;
    if (!source || !target) return;

    const sourceId = String(source.id);
    const sourceData = source.data as { kind?: string; clientId?: string; fieldType?: TipeFieldEditor };
    const targetData = target.data as { kind?: string; clientId?: string };

    // Palette → buat field baru. Target field dialihkan ke section induknya.
    if (sourceId.startsWith("palette-")) {
      const fieldType = sourceData.fieldType ?? (sourceId.replace("palette-", "") as TipeFieldEditor);
      let targetSection: string | null = null;
      if (targetData.kind === "section" && targetData.clientId) {
        targetSection = targetData.clientId;
      } else if (targetData.kind === "field" && targetData.clientId) {
        targetSection = document.fields.find((f) => f.clientId === targetData.clientId)?.sectionClientId ?? null;
      }
      if (!targetSection || !document.sections.some((s) => s.clientId === targetSection)) return;
      const newClientId = addField(targetSection, fieldType);
      setSelectedItem({ type: "field", clientId: newClientId });
      return;
    }

    if (!isSortable(source)) return;
    const kind = sourceData.kind ?? (document.fields.some((f) => f.clientId === sourceId) ? "field" : "section");

    // Field → reorder / pindah section via move() per grup section.
    if (kind === "field") {
      const groups: Record<string, string[]> = {};
      for (const f of document.fields) {
        (groups[f.sectionClientId] ??= []).push(f.clientId);
      }
      const moved = move(groups, event);
      const byId = new Map(document.fields.map((f) => [f.clientId, f]));
      const seen = new Set<string>();
      const newFields: DraftField[] = [];
      for (const s of document.sections) {
        for (const fid of moved[s.clientId] ?? []) {
          const f = byId.get(fid);
          if (f && !seen.has(fid)) {
            seen.add(fid);
            newFields.push({ ...f, sectionClientId: s.clientId });
          }
        }
      }
      for (const f of document.fields) {
        if (!seen.has(f.clientId)) newFields.push(f);
      }
      setDocument({ ...document, fields: newFields });
      return;
    }

    // Section → reorder sibling / pindah parent (selalu sibling target, tak pernah jadi anak).
    const groups: Record<string, string[]> = {};
    for (const s of document.sections) {
      (groups[s.parentClientId ?? ROOT_GROUP] ??= []).push(s.clientId);
    }
    const moved = move(groups, event);
    const newParentKey = Object.keys(moved).find((g) => (moved[g] ?? []).includes(sourceId));
    const newParent = !newParentKey || newParentKey === ROOT_GROUP ? null : newParentKey;
    // Pengaman siklus: parent baru tak boleh keturunan section yang dipindah.
    let cursor: string | null = newParent;
    while (cursor) {
      if (cursor === sourceId) return;
      cursor = document.sections.find((s) => s.clientId === cursor)?.parentClientId ?? null;
    }
    const byId = new Map(document.sections.map((s) => [s.clientId, s]));
    const seen = new Set<string>();
    const newSections: DraftSection[] = [];
    const pushGroup = (groupKey: string, parent: string | null, keepParent: boolean) => {
      for (const sid of moved[groupKey] ?? []) {
        const s = byId.get(sid);
        if (!s || seen.has(sid)) continue;
        seen.add(sid);
        newSections.push(keepParent ? s : { ...s, parentClientId: parent });
        pushGroup(sid, sid, false);
      }
    };
    pushGroup(ROOT_GROUP, null, false);
    // Grup yatim (parent hilang): tampilkan, jangan ubah parent-nya.
    for (const key of Object.keys(moved)) {
      if (key === ROOT_GROUP || byId.has(key)) continue;
      for (const sid of moved[key] ?? []) {
        const s = byId.get(sid);
        if (s && !seen.has(sid)) {
          seen.add(sid);
          newSections.push(s);
        }
      }
    }
    for (const s of document.sections) {
      if (!seen.has(s.clientId)) newSections.push(s);
    }
    setDocument({ ...document, sections: newSections });
  }, [document, addField, setSelectedItem]);
  
  const buildForm = useCallback(async (): Promise<BuildFormVersionResult | null> => {
    if (!document) {
      setBuildError("Tidak ada form untuk dibangun.");
      return null;
    }
    
    setSaving(true);
    setBuildError(null);
    
    try {
      const sectionsPayload = document.sections.map((s) => ({
        clientId: s.clientId,
        id: s.id,
        parentClientId: s.parentClientId,
        nama: s.nama.trim(),
        deskripsi: s.deskripsi?.trim() ?? null,
        aktif: s.aktif,
      }));
      
      const fieldsPayload = document.fields.map((f) => ({
        clientId: f.clientId,
        id: f.id,
        sectionClientId: f.sectionClientId,
        nama: f.nama.trim(),
        label: f.label.trim(),
        tipe: f.tipe,
        wajib: f.wajib,
        aktif: f.aktif,
        placeholder: f.placeholder?.trim() ?? null,
        deskripsi: f.deskripsi?.trim() ?? null,
        jumlahKolom: f.jumlahKolom,
        opsi: f.opsi.map((o, idx) => ({
          value: o.value.trim(),
          label: o.label.trim() || o.value.trim(),
          urutan: idx,
          aktif: o.aktif,
        })),
        aturan: f.aturan.map((a, idx) => ({
          sourceClientId: a.sourceClientId,
          operator: a.operator,
          value: a.value.trim() || null,
          aktif: a.aktif,
          urutan: idx,
        })),
      }));
      
      const payload: BuildFormVersionInput = {
        formVersionId: document.formVersionId,
        sections: sectionsPayload,
        fields: fieldsPayload,
        actorId: null,
      };
      
      const result = await buildFormBuilder({ data: payload });
      toast(`Form dibangun: ${result.jumlahSection} section, ${result.jumlahField} pertanyaan`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membangun form.";
      setBuildError(msg);
      toast(msg);
      return null;
    } finally {
      setSaving(false);
    }
  }, [document, toast]);
  
  return {
    document,
    flatTree,
    selectedItem,
    setSelectedItem,
    palette,
    saving,
    buildError,
    loadDocument,
    clearDocument,
    addSection,
    deleteSection,
    addField,
    deleteField,
    updateSection,
    updateField,
    addOpsi,
    updateOpsi,
    deleteOpsi,
    addAturan,
    updateAturan,
    deleteAturan,
    handleDragEnd,
    buildForm,
  };
}