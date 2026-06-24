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
          <div key={card.title} className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary text-cyan-600 dark:text-cyan-300 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{card.title}</span>
            </div>
            <p className="mt-5 text-lg font-semibold text-foreground leading-tight">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export default InsightCards;
