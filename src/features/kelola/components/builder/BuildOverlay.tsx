import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";

const STAGES = [
  { key: "validate", label: "Memvalidasi struktur form..." },
  { key: "sections", label: "Menyimpan section..." },
  { key: "fields", label: "Menyimpan pertanyaan..." },
  { key: "rules", label: "Menyimpan opsi & aturan..." },
  { key: "done", label: "Selesai" },
] as const;

type StageKey = typeof STAGES[number]["key"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBuild: () => Promise<{ jumlahSection: number; jumlahField: number; jumlahDihapus: number } | null>;
  saving: boolean;
}

export function BuildOverlay({ isOpen, onClose, onBuild, saving }: Props) {
  const [currentStage, setCurrentStage] = useState<StageKey>("validate");
  const [result, setResult] = useState<{ jumlahSection: number; jumlahField: number; jumlahDihapus: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
      setCurrentStage("validate");
      setResult(null);
      setError(null);
      setAnimating(false);
      return;
    }
    
    setAnimating(true);
    
    const runBuild = async () => {
      const res = await onBuild();
      setAnimating(false);
      if (res) {
        setResult(res);
        setCurrentStage("done");
      } else {
        setError("Build gagal");
        setCurrentStage("validate");
      }
    };
    
    runBuild();
  }, [isOpen, onBuild]);
  
  useEffect(() => {
    if (!animating || currentStage === "done") return;
    
    const stageIndex = STAGES.findIndex((s) => s.key === currentStage);
    if (stageIndex < STAGES.length - 1) {
      const timer = setTimeout(() => {
        const next = STAGES[stageIndex + 1];
        if (next) setCurrentStage(next.key);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [animating, currentStage]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Memproses build form">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-elev">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink">Memproses Build</h3>
          {!saving && !animating && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-destructive bg-destructive/10 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
        
        <div className="grid gap-2 mb-4">
          {STAGES.map((stage) => {
            const currentIdx = STAGES.findIndex((s) => s.key === currentStage);
            const isCurrent = stage.key === currentStage;
            const isDone = STAGES.indexOf(stage) < Math.max(0, currentIdx);

            return (
              <div
                key={stage.key}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all ${
                  isCurrent ? "bg-accent-light/50 border-l-2 border-accent" :
                  isDone ? "text-muted" :
                  "text-muted/50"
                }`}
              >
                {isCurrent && animating ? (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                ) : isDone ? (
                  <CheckCircle className="w-4 h-4 text-done" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-line flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${isCurrent ? "text-ink" : "text-muted"}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {result && (
          <div className="p-3 rounded-lg border border-done bg-done/10 grid gap-1 text-sm">
            <div className="flex items-center gap-2 text-done">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Build berhasil!</span>
            </div>
            <div className="ml-6 grid gap-0.5 text-muted">
              <div>Section: <span className="font-medium text-ink">{result.jumlahSection}</span></div>
              <div>Pertanyaan: <span className="font-medium text-ink">{result.jumlahField}</span></div>
              {result.jumlahDihapus > 0 && (
                <div className="text-warning">Dihapus: <span className="font-medium">{result.jumlahDihapus}</span></div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-end gap-2">
          {!saving && !animating && currentStage === "done" && (
            <Button variant="primary" onClick={onClose}>Tutup</Button>
          )}
          {!saving && !animating && currentStage !== "done" && !result && (
            <Button variant="primary" onClick={onClose}>Tutup</Button>
          )}
        </div>
      </div>
    </div>
  );
}