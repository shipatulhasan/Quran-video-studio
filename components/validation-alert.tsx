import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ValidationError = { row: number; field: string; message: string };
type ValidationAlertProps = { errors: ValidationError[]; title?: string };

export function ValidationAlert({ errors, title = "Validation failed" }: ValidationAlertProps) {
  if (!errors.length) return null;
  return <Alert variant="destructive"><AlertTitle>{title}</AlertTitle><AlertDescription><ul className="list-disc space-y-1 pl-5">{errors.map((error, index) => <li key={`${error.row}-${error.field}-${index}`}>Row {error.row}, {error.field}: {error.message}</li>)}</ul></AlertDescription></Alert>;
}
