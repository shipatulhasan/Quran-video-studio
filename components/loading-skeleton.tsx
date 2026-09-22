import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return <div className="space-y-3" aria-label="Loading"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" /><Skeleton className="h-32 w-full" /></div>;
}
