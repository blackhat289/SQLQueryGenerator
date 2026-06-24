import React, { useMemo } from 'react'
import { Activity, Clock3, Database, GitFork, DollarSign } from 'lucide-react'
import { ComplexityResponse } from '../types'

interface QueryAnalysisCardProps {
  complexity: ComplexityResponse;
  optimizationScore: number;
  tablesUsed: string[];
}

export const QueryAnalysisCard: React.FC<QueryAnalysisCardProps> = ({ complexity, optimizationScore, tablesUsed }) => {
  const metrics = useMemo(() => {
    const joinCount = complexity.details.joins_count
    const cost = Math.max(0.8, 12 - optimizationScore / 10).toFixed(1)
    const runtime = Math.max(90, 220 - optimizationScore * 1.1).toFixed(0)
    const rows = Math.max(420, joinCount * 1200 + optimizationScore * 8).toFixed(0)
    return {
      estimatedCost: `$${cost}k`,
      executionTime: `${runtime} ms`,
      rowsScanned: `${rows}`,
      joinCount: joinCount.toString(),
      complexityScore: `${optimizationScore}%`
    }
  }, [complexity.details.joins_count, optimizationScore])

  const cards = [
    { label: 'Estimated Cost', value: metrics.estimatedCost, icon: DollarSign },
    { label: 'Execution Time', value: metrics.executionTime, icon: Clock3 },
    { label: 'Rows Scanned', value: metrics.rowsScanned, icon: Database },
    { label: 'Join Count', value: metrics.joinCount, icon: GitFork },
    { label: 'Complexity Score', value: metrics.complexityScore, icon: Activity }
  ]

  return (
    <div className="bg-card border border-border rounded-[2rem] p-5 shadow-xl shadow-black/10 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Query Analysis</p>
          <h3 className="mt-2 text-xl font-bold text-foreground">Execution profile</h3>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-3xl border border-border bg-secondary/40 p-4 transition hover:border-primary/40 hover:bg-secondary/70">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300 shadow-sm">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-secondary/50 dark:border-white/10 dark:bg-slate-950/80 px-4 py-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Tables involved</p>
        <p className="mt-2 text-sm text-muted-foreground">{tablesUsed.length > 0 ? tablesUsed.join(', ') : 'No tables detected yet'}</p>
      </div>
    </div>
  )
}

export default QueryAnalysisCard;
