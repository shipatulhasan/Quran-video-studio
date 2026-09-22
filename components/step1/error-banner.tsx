import type { ValidationError } from "@/components/validation-alert";

export function Step1ErrorBanner({ errors }: { errors: ValidationError[] }) {
  if (!errors.length) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/70 dark:bg-red-950/30">
      <p className="text-sm font-medium text-red-800 dark:text-red-300">We could not validate this CSV.</p>
      <ul className="mt-1 space-y-0.5 text-xs text-red-700 dark:text-red-400">
        {errors.slice(0, 8).map((error, index) => (
          <li key={`${error.row}-${error.field}-${index}`}>Row {error.row}, {error.field}: {error.message}</li>
        ))}
      </ul>
      {errors.length > 8 && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{errors.length - 8} more validation errors.</p>}
    </div>
  );
}
