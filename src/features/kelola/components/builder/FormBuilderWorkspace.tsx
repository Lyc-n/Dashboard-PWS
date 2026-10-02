import { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { FolderPlus, RotateCcw, Save, AlertTriangle, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { BlockPalette } from "./BlockPalette";
import { SectionNode } from "./SectionNode";
import { SettingsPanel } from "./SettingsPanel";
import { BuildOverlay } from "./BuildOverlay";
import { getOrphanSectionIds, getOrphanFieldIds } from "./tree";
import type { DraftFormDocument, DraftField } from "./types";
import type { DefinisiVersi } from "@/hooks/use-form-builder";
import type { useFormBuilderDraft } from "@/hooks/use-form-builder-draft"

interface FormBuilderWorkspaceProps {
  formVersionId: string;
  bisaUbah: boolean;
  onBack?: () => void;
  document: DraftFormDocument | null;
  draft: Omit<ReturnType<typeof useFormBuilderDraft>, "document" | "loadDocument" | "clearDocument">;
  loadDocument: (definisi: DefinisiVersi) => void;
}

export function FormBuilderWorkspace({
  formVersionId,
  bisaUbah,
  onBack,
  document,
  draft,
  loadDocument,
}: FormBuilderWorkspaceProps) {
  const {
    flatTree,
    palette,
    saving,
    buildError,
    addSection,
    addField,
    handleDragEnd,
    buildForm,
    setSelectedItem,
    updateSection,
    deleteSection,
    updateField,
    deleteField,
    addOpsi,
    updateOpsi,
    deleteOpsi,
    addAturan,
    updateAturan,
    deleteAturan,
    selectedItem,
  } = draft;

  const [showBuildOverlay, setShowBuildOverlay] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  // Panel pengaturan otomatis terbuka saat ada yang dipilih.
  useEffect(() => {
    if (selectedItem) setSettingsOpen(true);
  }, [selectedItem]);

  const orphanSectionIds = useMemo(() =>
    document ? getOrphanSectionIds(document.sections) : []
  , [document]);
  const orphanSectionSet = useMemo(() => new Set(orphanSectionIds), [orphanSectionIds]);
  const orphanFieldCount = useMemo(() =>
    document ? getOrphanFieldIds(document.sections, document.fields).length : 0
  , [document]);

  const rootSections = useMemo(() => {
    if (!document) return [];
    const ids = new Set(document.sections.map((s) => s.clientId));
    return document.sections.filter((s) => !s.parentClientId || !ids.has(s.parentClientId));
  }, [document]);
  
  const sectionsByClientId = useMemo(() => {
    const map = new Map<string, DraftFormDocument["sections"][number]>();
    document?.sections.forEach((s) => map.set(s.clientId, s));
    return map;
  }, [document]);

  const fieldsByClientId = useMemo(() => {
    const map = new Map<string, DraftField>();
    document?.fields.forEach((f) => map.set(f.clientId, f));
    return map;
  }, [document]);
  
  const handleAddField = useCallback((sectionClientId: string) => {
    const newClientId = addField(sectionClientId, "text");
    setSelectedItem({ type: "field", clientId: newClientId });
  }, [addField, setSelectedItem]);
  
  const handleAddRootSection = useCallback(() => {
    addSection(null);
  }, [addSection]);
  
  const handleBuild = useCallback(async () => {
    setShowBuildOverlay(true);
    const result = await buildForm();
    if (result) {
      const { ambilEditorForm } = await import("@/lib/utils.functions");
      const fresh = await ambilEditorForm({ data: { formVersionId } });
      loadDocument(fresh);
    }
    setShowBuildOverlay(false);
    return result;
  }, [buildForm, formVersionId, loadDocument]);
  
  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="h-[calc(100vh-200px)] min-h-125 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              {onBack && <Button size="sm" variant="ghost" onClick={onBack}><RotateCcw className="w-4 h-4" /> Kembali</Button>}
              <span className="text-sm font-medium text-ink">Form Builder</span>
            </div>
            <div className="flex items-center gap-2">
              {bisaUbah ? (
                <>
                  <Button size="sm" variant="ghost" onClick={handleAddRootSection}><FolderPlus className="w-4 h-4" /> Tambah Section</Button>
                  <Button size="sm" variant="primary" onClick={handleBuild} disabled={saving}>
                    <Save className="w-4 h-4" /> {saving ? "Membangun..." : "Build"}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" disabled>Build (hanya draft)</Button>
              )}
            </div>
          </div>
          
          {buildError && (
            <div className="mb-3 p-3 rounded-lg border border-destructive bg-destructive/10 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {buildError}
            </div>
          )}
          
          {(orphanSectionIds.length > 0 || orphanFieldCount > 0) && (
            <div className="mb-3 p-3 rounded-lg border border-destructive bg-destructive/10 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {orphanSectionIds.length > 0
                ? `${orphanSectionIds.length} section yatim (parent hilang) ditampilkan sebagai root. Perbaiki parent-nya sebelum Build.`
                : `${orphanFieldCount} field yatim (section hilang) ditemukan. Pindahkan sebelum Build.`}
            </div>
          )}

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {paletteOpen ? (
              <div className="relative shrink-0 flex">
                <BlockPalette items={palette} disabled={!bisaUbah} />
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  title="Liput panel Komponen"
                  className="absolute top-2 -right-3 z-10 w-6 h-6 flex items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink hover:border-accent-border shadow-sm"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                title="Buka panel Komponen"
                className="shrink-0 w-8 flex flex-col items-center gap-2 border-r border-line bg-surface-2 py-3 text-muted hover:text-ink"
              >
                <ChevronsRight className="w-4 h-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ writingMode: "vertical-rl" }}>
                  Komponen
                </span>
              </button>
            )}
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3">
                {document ? (
                  <>
                    {rootSections.length === 0 ? (
                      <div className="text-center text-muted py-12">
                        <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Belum ada section. Klik "Tambah Section" atau tarik field ke area ini.</p>
                      </div>
                    ) : (
                      rootSections.map((section, rootIdx) => (
                        <SectionNode
                          key={section.clientId}
                          section={section}
                          flatTree={flatTree}
                          depth={0}
                          index={rootIdx}
                          disabled={!bisaUbah}
                          isSelected={selectedItem?.type === "section" && selectedItem.clientId === section.clientId}
                          isOrphan={orphanSectionSet.has(section.clientId)}
                          sectionsByClientId={sectionsByClientId}
                          fieldsByClientId={fieldsByClientId}
                          onSelect={(clientId) => setSelectedItem({ type: "section", clientId })}
                          onSelectField={(clientId) => setSelectedItem({ type: "field", clientId })}
                          onDeselectField={() => setSelectedItem(null)}
                          selectedFieldClientId={selectedItem?.type === "field" ? selectedItem.clientId : null}
                          onAddField={handleAddField}
                          onAddSubSection={addSection}
                          onUpdateSection={updateSection}
                          onDeleteSection={deleteSection}
                          onUpdateField={updateField}
                          onDeleteField={deleteField}
                        />
                      ))
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted py-12">
                    <p className="text-sm">Memuat form…</p>
                  </div>
                )}
              </div>
            </div>
            
            {settingsOpen ? (
              <div className="relative shrink-0 flex">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  title="Liput panel Pengaturan"
                  className="absolute top-2 -left-3 z-10 w-6 h-6 flex items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink hover:border-accent-border shadow-sm"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
                <SettingsPanel
                  selectedItem={selectedItem}
                  onClose={() => setSelectedItem(null)}
                  document={document}
                  updateSection={updateSection}
                  deleteSection={deleteSection}
                  updateField={updateField}
                  deleteField={deleteField}
                  addOpsi={addOpsi}
                  updateOpsi={updateOpsi}
                  deleteOpsi={deleteOpsi}
                  addAturan={addAturan}
                  updateAturan={updateAturan}
                  deleteAturan={deleteAturan}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Buka panel Pengaturan"
                className="shrink-0 w-8 flex flex-col items-center gap-2 border-l border-line bg-surface-2 py-3 text-muted hover:text-ink"
              >
                <ChevronsLeft className="w-4 h-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ writingMode: "vertical-rl" }}>
                  Pengaturan
                </span>
              </button>
            )}
          </div>
        </div>

      <BuildOverlay
        isOpen={showBuildOverlay}
        onClose={() => setShowBuildOverlay(false)}
        onBuild={handleBuild}
        saving={saving}
      />
    </DragDropProvider>
  );
}