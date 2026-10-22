import { ReportTable } from '../../services/data-analysis/report';

export const ReportTableView = ({ table, number }: { table: ReportTable; number?: number }) => (
  <figure className="my-6">
    <figcaption className="mb-2 text-sm">
      {number !== undefined && <span className="block font-semibold text-white">Table {number}</span>}
      <span className="italic text-zinc-300">{table.caption}</span>
    </figcaption>
    <div className="overflow-x-auto">
      <table className="w-full border-y border-zinc-600 text-left text-xs text-zinc-300">
        <thead className="border-b border-zinc-600">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-2 py-1.5 font-semibold text-white">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800 last:border-0">
              {table.headers.map((_, j) => (
                <td key={j} className="px-2 py-1 tabular-nums">{row[j]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {table.note && (
      <p className="mt-1.5 text-xs text-zinc-500"><span className="italic">Note.</span> {table.note}</p>
    )}
  </figure>
);
