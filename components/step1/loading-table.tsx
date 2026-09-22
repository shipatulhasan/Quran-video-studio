const headers = ["Ayah", "Seg", "Arabic", "Translation", "Start", "End"];

export function Step1LoadingTable() {
  return <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"><div className="overflow-x-auto"><table className="w-full"><thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{header}</th>)}</tr></thead><tbody className="bg-white dark:bg-slate-900">{Array.from({ length: 5 }, (_, row) => <tr key={row} className="border-b border-slate-100 dark:border-slate-800">{headers.map((header, index) => <td key={header} className="px-4 py-3"><div className="h-3.5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: `${48 + ((row + index) % 4) * 10}%` }} /></td>)}</tr>)}</tbody></table></div></div>;
}
