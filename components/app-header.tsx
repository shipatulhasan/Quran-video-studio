"use client";

import { Moon, Sun, Tv2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { StepIndicator, type WizardStep } from "@/components/step-indicator";

type AppHeaderProps = {
  steps: WizardStep[];
  currentStep: number;
  onStepSelect?: (step: number) => void;
};

export function AppHeader({ steps, currentStep, onStepSelect }: AppHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Tv2 className="size-4" />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold leading-none tracking-tight">SyncCaster</span>
            <span className="text-[10px] leading-none text-muted-foreground">Timed overlay studio</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex-1">
          <StepIndicator steps={steps} currentStep={currentStep} onStepSelect={onStepSelect} />
        </div>

        {/* Theme toggle */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}
