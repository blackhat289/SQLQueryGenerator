import React, { useMemo, useState } from 'react'
import { Search, ChevronUp, ChevronDown, CornerDownRight, LayoutGrid, FileText } from 'lucide-react'

interface ResultPreviewCardProps {
  sql?: string;
}

interface TableData {
  columns: string[];
  rows: Array<(string | number)[]>;
}

const getMockData = (sql: string): TableData => {
  const query = sql.toLowerCase()
  if (query.includes('count')) {
    return {
      columns: ['total_count'],
      rows: [[42], [88], [130]]
    }
  }
  if (query.includes('avg') || query.includes('average')) {
    return {
      columns: ['metric', 'average_value'],
      rows: [['sale', 89.5], ['order', 62.8], ['active_user', 74.2]]
    }
  }
  if (query.includes('users') && query.includes('orders')) {
    return {
      columns: ['user_name', 'total_amount', 'status'],
      rows: [
        ['Jane Doe', 750.0, 'completed'],
        ['Alex Smith', 480.0, 'completed'],
        ['Bob Vance', 120.0, 'pending']
      ]
    }
  }
  if (query.includes('products')) {
    return {
      columns: ['id', 'name', 'price', 'stock'],
      rows: [
        [101, 'Ergonomic Office Chair', 199.99, 25],
        [102, 'Noise Cancelling Headphones', 149.99, 14],
        [103, 'Mechanical Keyboard', 89.99, 42]
      ]
    }
  }
  return {
    columns: ['id', 'result_value'],
    rows: [
      [1, 'Mock Data Row A'],
      [2, 'Mock Data Row B'],
      [3, 'Mock Data Row C']
    ]
  }
}

export const ResultPreviewCard: React.FC<ResultPreviewCardProps> = ({ sql = '' }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const pageSize = 4

  const mockData = useMemo(() => getMockData(sql), [sql])

  const filteredRows = useMemo(() => {
    let rows = mockData.rows
    if (search.trim()) {
      rows = rows.filter((row) => row.some((value) => value.toString().toLowerCase().includes(search.toLowerCase())))
    }
    if (sortKey !== null) {
      const index = mockData.columns.indexOf(sortKey)
      rows = [...rows].sort((a, b) => {
        const left = a[index]
        const right = b[index]
        if (typeof left === 'number' && typeof right === 'number') {
          return sortDirection === 'asc' ? left - right : right - left
        }
        return sortDirection === 'asc'
          ? String(left).localeCompare(String(right))
          : String(right).localeCompare(String(left))
      })
    }
    return rows
  }, [mockData.rows, mockData.columns, search, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (column: string) => {
    if (sortKey === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column)
      setSortDirection('asc')
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 bg-secondary px-5 py-4 text-left text-sm font-semibold text-foreground transition hover:bg-secondary/80"
      >
        <span className="flex items-center gap-2">
          <LayoutGrid className="h-4.5 w-4.5 text-cyan-500 dark:text-cyan-400" />
          Result Preview
        </span>
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {isOpen ? 'Collapse' : 'Expand'}
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {isOpen && (
        <div className="space-y-5 px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-foreground">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview status</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">This live preview renders a placeholder dataset to give you a feel for your query structure.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search preview"
                  className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {mockData.rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No results available yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Run a query to view a preview from your database.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60 text-sm text-left">
                  <thead className="bg-secondary/70 text-muted-foreground">
                    <tr>
                      {mockData.columns.map((column) => (
                        <th
                          key={column}
                          onClick={() => handleSort(column)}
                          className="cursor-pointer px-4 py-3 font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:text-cyan-600 dark:hover:text-cyan-300"
                        >
                          <div className="flex items-center gap-1">
                            {column}
                            <span className="text-xs">{sortKey === column ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {currentRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="transition hover:bg-secondary/40">
                        {row.map((value, colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className="px-4 py-3 text-foreground">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-border bg-secondary/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Showing {currentRows.length} of {filteredRows.length} rows
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={page === 1}
                    className="rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={page === totalPages}
                    className="rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-border bg-secondary/45 px-4 py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CornerDownRight className="h-4.5 w-4.5 text-cyan-500 dark:text-cyan-400" />
              <p>Preview results do not reflect live database values unless executed by the backend.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultPreviewCard;
