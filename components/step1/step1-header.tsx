export function Step1Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="space-y-1"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1><p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p></div>;
}
