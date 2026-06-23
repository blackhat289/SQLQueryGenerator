import React from 'react'
import { ShieldCheck, Sparkles } from 'lucide-react'

interface AIConfidenceCardProps {
  score: number;
}

export const AIConfidenceCard: React.FC<AIConfidenceCardProps> = ({ score }) => {
  const percent = Math.max(0, Math.min(100, score || 92))
  const status = percent >= 90 ? 'High Confidence' : percent >= 75 ? 'Moderate Confidence' : 'Review Recommended'
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="bg-gradient-to-br from-slate-950/95 via-slate-900 to-slate-950 border border-white/10 rounded-[2rem] p-5 shadow-[0_32px_120px_-60px_rgba(99,102,241,0.8)] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">AI Confidence</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{percent}%</h3>
          <p className="mt-1 text-xs text-slate-400">{status}</p>
        </div>
        <div className="relative">
          <svg className="h-24 w-24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} className="stroke-slate-800 fill-transparent" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-cyan-400 animate-spin-slow fill-transparent"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-cyan-400" />
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-400 shadow-inner shadow-black/20">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Trusted AI signal</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Confidence estimate reflects query clarity, schema alignment, and optimization indicators from the generated SQL flow.
        </p>
      </div>
    </div>
  )
}

export default AIConfidenceCard;
