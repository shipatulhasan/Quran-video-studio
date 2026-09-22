import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = { id: number; label: string; shortLabel?: string };

type StepIndicatorProps = {
  steps: WizardStep[];
  currentStep: number;
  onStepSelect?: (step: number) => void;
};

export function StepIndicator({ steps, currentStep, onStepSelect }: StepIndicatorProps) {
  return <nav aria-label="Wizard progress"><ol className="flex items-center justify-center">{steps.map((step, index) => { const complete = currentStep > step.id; const active = currentStep === step.id; return <li className="flex items-center" key={step.id}><button type="button" disabled={!complete} onClick={() => complete && onStepSelect?.(step.id)} className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors", active && "border border-primary/20 bg-primary/10 text-primary", complete && "text-primary hover:bg-primary/10", !active && !complete && "cursor-default text-muted-foreground")}><span className={cn("flex size-4 items-center justify-center rounded-full text-[10px] font-semibold", active || complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{complete ? <Check className="size-2.5" /> : step.id}</span><span className="hidden sm:block">{step.label}</span><span className="sm:hidden">{step.shortLabel ?? step.label}</span></button>{index < steps.length - 1 && <span aria-hidden className={cn("mx-0.5 h-px w-5", complete ? "bg-primary/50" : "bg-border")} />}</li>; })}</ol></nav>;
}
