import React from 'react'
import { Activity, ShieldCheck, ShieldAlert, GitFork, Hash, Database } from 'lucide-react'
import { ComplexityResponse } from '../types'

interface ComplexityAnalysisCardProps {
  complexity: ComplexityResponse;
}

export const ComplexityAnalysisCard: React.FC<ComplexityAnalysisCardProps> = ({ complexity }) => {
  const getBadgeClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
      case 'hard':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
      default:
        return 'bg-secondary border-border text-secondary-foreground'
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border text-left">
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span>Complexity Profile</span>
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(complexity.level)}`}>
          {complexity.level}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-secondary/40 border border-border rounded-xl p-3 text-center">
          <GitFork className="h-4.5 w-4.5 text-violet-500 mx-auto mb-1.5" />
          <span className="text-lg font-bold block text-foreground leading-none">
            {complexity.details.joins_count}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mt-1.5 block">
            Joins
          </span>
        </div>
        <div className="bg-secondary/40 border border-border rounded-xl p-3 text-center">
          <Hash className="h-4.5 w-4.5 text-violet-500 mx-auto mb-1.5" />
          <span className="text-lg font-bold block text-foreground leading-none">
            {complexity.details.subqueries_count}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mt-1.5 block">
            Nesting
          </span>
        </div>
        <div className="bg-secondary/40 border border-border rounded-xl p-3 text-center">
          <Database className="h-4.5 w-4.5 text-violet-500 mx-auto mb-1.5" />
          <span className="text-xs font-bold block text-foreground leading-none truncate mt-0.5">
            {complexity.details.has_group_by ? 'GROUP BY' : 'SELECT'}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mt-1.5 block">
            Type
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Structural Drivers
        </h4>
        <div className="space-y-2">
          {complexity.details.indicators.map((ind, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              <span className="leading-tight">{ind}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ComplexityAnalysisCard;
