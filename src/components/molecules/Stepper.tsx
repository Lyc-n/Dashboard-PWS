import { cn } from "@/lib/utils";

export interface Step {
  label: string;
  state: "done" | "now" | "todo";
}

export interface StepperProps {
  steps: Step[];
  className?: string;
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <div className={cn("mt-4 flex flex-wrap gap-2", className)}>
      {steps.map((step, i) => (
        <div
          key={step.label}
          className={cn(
            "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-semibold",
            step.state === "done" && "border-line bg-surface text-accent",
            step.state === "now" && "border-accent-border bg-accent-light text-ink",
            step.state === "todo" && "border-line bg-surface text-muted",
          )}
        >
          <i
            className={cn(
              "grid size-[22px] place-items-center rounded-full text-[11px] font-bold not-italic",
              step.state === "done" && "bg-accent text-white",
              step.state === "now" && "bg-ink text-white",
              step.state === "todo" && "bg-line-2 text-muted",
            )}
          >
            {i + 1}
          </i>
          {step.label}
        </div>
      ))}
    </div>
  );
}
