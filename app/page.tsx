"use client";

import { useEffect, useState } from "react";
import { CsvImportStep } from "@/components/csv-import-step";
import { WizardFooter } from "@/components/wizard-footer";
import { WizardHeader } from "@/components/wizard-header";

const steps = [
  { id: 1, label: "Upload CSV", shortLabel: "CSV" },
  { id: 2, label: "Add Video", shortLabel: "Video" },
  { id: 3, label: "Preview & Sync", shortLabel: "Sync" },
  { id: 4, label: "Render & Export", shortLabel: "Export" },
];

export default function Home() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <WizardHeader
        steps={steps}
        currentStep={1}
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
      />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <CsvImportStep onComplete={() => undefined} />
      </main>
      <WizardFooter />
    </div>
  );
}
