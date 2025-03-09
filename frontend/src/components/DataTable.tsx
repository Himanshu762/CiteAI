import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper
} from "@tanstack/react-table";

const columnHelper = createColumnHelper<DataType>()

interface DataType {
  name: string;
  status: 'active' | 'inactive';
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
}

const Badge = ({ children, variant = 'default' }: BadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'default' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
  }`}>
    {children}
  </span>
);

const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="min-w-full divide-y divide-gray-200">{children}</table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>;
const TableBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;
const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>
);
const TableRow = ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>;
const TableCell = ({ children }: { children: React.ReactNode }) => <td className="px-6 py-4">{children}</td>;

export function DataTable({ data }: { data: DataType[] }) {
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <Badge variant={info.getValue() === 'active' ? 'default' : 'secondary'}>
          {info.getValue()}
        </Badge>
      )
    })
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 