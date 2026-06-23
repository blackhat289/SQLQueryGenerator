import React from 'react'
import { BookOpen } from 'lucide-react'
import { ExplanationStep } from '../types'

interface QueryExplanationCardProps {
  explanation: ExplanationStep[];
}

export const QueryExplanationCard: React.FC<QueryExplanationCardProps> = ({ explanation }) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border text-left">
      <h3 className="text-base font-semibold text-foreground mb-4.5 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <span>Step-by-Step Logic Explainer</span>
      </h3>
      {explanation.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No query logic breakdown generated yet. Enter a query above.
        </p>
      ) : (
        <div className="relative border-l border-border pl-5 ml-3 space-y-5">
          {explanation.map((step, idx) => (
            <div key={idx} className="relative group animate-fade-in">
              <span className="absolute -left-[29px] top-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary border-4 border-background text-[0px] font-bold text-primary-foreground group-hover:scale-125 transition-transform duration-200" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {step.step || `Step ${idx + 1}`}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    {step.action}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default QueryExplanationCard;
