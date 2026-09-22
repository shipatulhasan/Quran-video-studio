import { FileUp, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FileUploadDropzoneProps = {
  accept: string;
  title: string;
  description: string;
  actionLabel?: string;
  onFileSelect?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
};

export function FileUploadDropzone({ accept, title, description, actionLabel = "Choose a file", onFileSelect, className }: FileUploadDropzoneProps) {
  return <Card className={cn("border-dashed", className)}><CardContent className="relative flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center"><Input type="file" accept={accept} onChange={onFileSelect} className="absolute inset-0 h-full cursor-pointer opacity-0" aria-label={title} /><div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UploadCloud className="size-7" /></div><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><span className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary"><FileUp className="size-3.5" />{actionLabel}</span></CardContent></Card>;
}
