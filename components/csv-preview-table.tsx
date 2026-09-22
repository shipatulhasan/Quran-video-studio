import type { Segment } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CsvPreviewTableProps = { segments: Segment[]; title?: string };

export function CsvPreviewTable({ segments, title = "CSV preview" }: CsvPreviewTableProps) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{segments.length} segment{segments.length === 1 ? "" : "s"} loaded.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Ayah</TableHead><TableHead>Arabic</TableHead><TableHead>Translation</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead></TableRow></TableHeader><TableBody>{segments.map((segment, index) => <TableRow key={segment.id}><TableCell>{segment.segmentIndex ?? index}</TableCell><TableCell>{segment.ayah}</TableCell><TableCell dir="rtl" className="min-w-48 text-right">{segment.arabic}</TableCell><TableCell className="min-w-56">{segment.translation}</TableCell><TableCell>{segment.startTime.toFixed(3)}s</TableCell><TableCell>{segment.endTime.toFixed(3)}s</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
}
