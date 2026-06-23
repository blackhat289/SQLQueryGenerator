import React from 'react'
import { Database, Filter, Layers, Zap } from 'lucide-react'

interface InsightCardsProps {
  queryType: string;
  tablesUsed: string[];
  filtersApplied: string[];
  complexity: string;
}

export const InsightCards: React.FC<InsightCardsProps> = ({ queryType, tablesUsed, filtersApplied, complexity }) => {
  const cards = [
    {
      title: 'Query Type',
      value: queryType,
      icon: Zap,
      description: 'Predicted SQL operation category.'
    },
    {
      title: 'Tables Used',
      value: tablesUsed.length > 0 ? tablesUsed.join(', ') : 'None detected',
      icon: Database,
      description: 'Entities targeted in the generated query.'
    },
    {
      title: 'Filters Applied',
      value: filtersApplied.length > 0 ? filtersApplied.join(', ') : 'No explicit filters',
      icon: Filter,
      description: 'Detected WHERE and HAVING clauses.'
    },
    {
      title: 'Estimated Complexity',
      value: complexity,
      icon: Layers,
      description: 'How challenging the query is to execute.'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.title} className="rounded-[1.75rem] border border-border/70 bg-slate-950/80 p-5 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-cyan-300 shadow-sm shadow-cyan-500/10">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{card.title}</span>
            </div>
            <p className="mt-5 text-lg font-semibold text-foreground leading-tight">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export default InsightCards;
