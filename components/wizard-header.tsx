"use client";

import { Moon, Sun, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator, type WizardStep } from "@/components/step-indicator";

type WizardHeaderProps = { steps: WizardStep[]; currentStep: number; dark: boolean; onToggleDark: () => void; onStepSelect?: (step: number) => void };

export function WizardHeader({ steps, currentStep, dark, onToggleDark, onStepSelect }: WizardHeaderProps) {
  return <header className="sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"><div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4 sm:px-6"><div className="flex shrink-0 items-center gap-2.5"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><Video className="size-4" /></div><span className="hidden text-sm font-semibold tracking-tight sm:block">Quran Video Studio</span></div><div className="flex-1"><StepIndicator steps={steps} currentStep={currentStep} onStepSelect={onStepSelect} /></div><Button type="button" size="icon" variant="outline" onClick={onToggleDark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun /> : <Moon />}</Button></div></header>;
}
