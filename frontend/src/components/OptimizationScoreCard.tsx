import React from 'react'
import { Award, Zap, AlertTriangle, CheckCircle } from 'lucide-react'

interface OptimizationScoreCardProps {
  score: number;
  suggestions: string[];
}

export const OptimizationScoreCard: React.FC<OptimizationScoreCardProps> = ({ score, suggestions }) => {
  const getScoreColorClass = (val: number) => {
    if (val >= 90) return 'text-emerald-500 stroke-emerald-500'
    if (val >= 75) return 'text-amber-500 stroke-amber-500'
    return 'text-rose-500 stroke-rose-500'
  }

  const getScoreBgClass = (val: number) => {
    if (val >= 90) return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
    if (val >= 75) return 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
    return 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
  }

  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border text-left">
      <h3 className="text-base font-semibold text-foreground mb-4.5 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary animate-pulse" />
        <span>Optimization Rating</span>
      </h3>
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-5">
        <div className="relative flex items-center justify-center h-24 w-24 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r={radius} className="stroke-muted/30 fill-transparent" strokeWidth="7" />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className={`fill-transparent transition-all duration-1000 ease-out ${getScoreColorClass(score)}`}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-foreground">{score}</span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Score</span>
          </div>
        </div>
        <div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBgClass(score)}`}>
            <Award className="h-3.5 w-3.5" />
            <span>{score >= 90 ? 'Fully Optimized' : score >= 75 ? 'Review Needed' : 'Sub-Optimal'}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            The optimization score evaluates wildcard selection operators, explicit key matchups, and lookup complexity indexes.
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          Suggestions & Indexing Adjustments
        </h4>
        {suggestions.length === 0 || (suggestions.length === 1 && suggestions[0].toLowerCase().includes('excellent')) ? (
          <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/25">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>No warnings detected. The generated query aligns with DBMS query planner patterns.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground bg-muted/30 border border-border p-3 rounded-xl">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{sug}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimizationScoreCard;
