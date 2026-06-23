import React from 'react'
import { CheckCircle, Code2, Slash, ArrowRightCircle } from 'lucide-react'

const tips = [
  {
    title: 'Use indexes on frequently filtered columns',
    icon: CheckCircle
  },
  {
    title: 'Avoid SELECT *',
    icon: Slash
  },
  {
    title: 'Use LIMIT when possible',
    icon: ArrowRightCircle
  },
  {
    title: 'Optimize joins using explicit keys',
    icon: Code2
  }
]

export const SQLTips: React.FC = () => {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-slate-950/80 p-6 shadow-xl shadow-black/10 transition hover:shadow-[0_40px_80px_-60px_rgba(15,23,42,0.9)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">SQL Optimization Tips</p>
          <h3 className="mt-2 text-lg font-bold text-foreground">Best practices for faster queries</h3>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((tip) => {
          const Icon = tip.icon
          return (
            <div key={tip.title} className="rounded-3xl border border-border/70 bg-slate-900/80 p-4 transition hover:border-primary/40 hover:bg-slate-900/95">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SQLTips;
