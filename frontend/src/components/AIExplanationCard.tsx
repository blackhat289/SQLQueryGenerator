import React, { useMemo, useState } from 'react'
import { ArrowRight, Columns, Filter, Layers, ShieldCheck, Terminal } from 'lucide-react'

interface AIExplanationCardProps {
  sql: string;
  tablesUsed: string[];
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({ sql, tablesUsed }) => {
  const [isOpen, setIsOpen] = useState(true)

  const details = useMemo(() => {
    const targetTableMatch = sql.match(/from\s+([\w.]+)/i)
    const targetTable = targetTableMatch?.[1] || tablesUsed[0] || 'Unknown'

    const selectMatch = sql.match(/select\s+([\s\S]*?)\s+from/i)
    const selectedColumns = selectMatch?.[1]
      ? selectMatch[1].split(',').map((col) => col.trim()).slice(0, 4)
      : ['*']

    const filtersMatch = sql.match(/where\s+([\s\S]*?)(order\s+by|group\s+by|limit|$)/i)
    const filters = filtersMatch?.[1]?.trim() || 'No filters detected'

    const sortMatch = sql.match(/order\s+by\s+([\s\S]*?)(limit|$)/i)
    const sortFields = sortMatch?.[1]?.trim() || 'No sorting applied'

    return {
      targetTable,
      selectedColumns,
      filters,
      sortFields,
      optimizedSql: sql
    }
  }, [sql, tablesUsed])

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-black/10 transition-transform duration-300 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 bg-slate-950/80 px-5 py-4 text-left text-sm font-semibold text-foreground transition hover:bg-slate-900"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-cyan-400" />
          Why This Query Was Generated
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {isOpen ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-5 px-5 pb-5 pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border/70 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Target table</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{details.targetTable}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <Columns className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Required columns</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {details.selectedColumns.join(', ')}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Applied filters</p>
                  <p className="mt-2 text-sm font-semibold text-foreground truncate">{details.filters}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Applied sorting</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{details.sortFields}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Generated optimized SQL</p>
                  <p className="mt-2 text-sm font-semibold text-foreground overflow-hidden text-ellipsis max-h-16">{details.optimizedSql}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIExplanationCard;
