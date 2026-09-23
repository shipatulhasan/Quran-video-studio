"use client";

import { useState } from "react";
import type { Segment } from "@prisma/client";
import CsvImportStep from "@/components/csv-import-step";
import PreviewSyncStep from "@/components/steps/preview-sync-step";
import type { SyncSegment } from "@/components/steps/preview-sync/types";
import RenderStep from "@/components/steps/render-step";
import VideoUploadStep from "@/components/steps/video-upload-step";
import { WizardFooter } from "@/components/wizard-footer";
import { WizardHeader } from "@/components/wizard-header";

type StepId = 1 | 2 | 3 | 4;
const STEPS = [
  { id: 1, label: "Upload CSV", shortLabel: "CSV" },
  { id: 2, label: "Add Video", shortLabel: "Video" },
  { id: 3, label: "Preview & Sync", shortLabel: "Sync" },
  { id: 4, label: "Render & Export", shortLabel: "Export" },
];

function toSyncSegments(segments: Segment[]): SyncSegment[] {
  return segments.map((segment) => ({
    id: segment.id,
    ayah: segment.ayah,
    arabic: segment.arabic,
    translation: segment.translation,
    start: segment.startTime,
    end: segment.endTime,
    overlayAssetPath: segment.overlayAssetPath,
  }));
}

export default function QuranVideoWizard() {
  const [step, setStep] = useState<StepId>(1);
  const [dark, setDark] = useState(false);
  const [segments, setSegments] = useState<SyncSegment[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const toggleDark = () =>
    setDark((value) => {
      const next = !value;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 transition-colors duration-200 dark:bg-[#0a0f1a]">
      <WizardHeader
        steps={STEPS}
        currentStep={step}
        dark={dark}
        onToggleDark={toggleDark}
        onStepSelect={(value) => setStep(value as StepId)}
      />
      <main className="mx-auto flex w-full max-w-[1260px] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        {step === 1 && (
          <CsvImportStep
            onProjectId={setProjectId}
            onComplete={(value) => setSegments(toSyncSegments(value))}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <VideoUploadStep
            projectId={projectId}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <PreviewSyncStep
            projectId={projectId}
            initialSegments={segments}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && <RenderStep projectId={projectId} segmentCount={segments.length} onBack={() => setStep(3)} />}
      </main>
      <WizardFooter />
    </div>
  );
}
