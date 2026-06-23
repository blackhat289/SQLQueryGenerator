import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Send, Sparkles, Trash2 } from 'lucide-react'

interface QueryInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
}

const suggestions = [
  'Show top 10 employees by salary',
  'Find inactive customers',
  'Revenue by month',
  'Top selling products',
  'Average order value',
  'Active users this week'
]

export const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, isLoading, disabled = false, placeholder, helperText }) => {
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [prompt])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const clearPrompt = () => setPrompt('')

  return (
    <div className="bg-card border border-border rounded-[2rem] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ask Genie anything about your database</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Turn natural language prompts into clean SQL with AI insights, previews, and smart recommendations.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-secondary/60 px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm">
            Premium AI prompt
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="nl-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'Ask Genie anything about your database...'}
              className="min-h-[130px] w-full resize-none rounded-3xl border border-border/70 bg-background px-5 py-5 pr-28 text-sm leading-7 text-foreground placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all duration-300"
              disabled={isLoading || disabled}
            />
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={clearPrompt}
                disabled={!prompt.trim() || isLoading}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? 'Generating...' : 'Send'}
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{prompt.length}</span>
              <span>/</span>
              <span>280 chars</span>
            </div>
            <div className="text-xs text-muted-foreground">Use Shift + Enter for a new line.</div>
          </div>
        </form>

        <div className="rounded-[1.5rem] border border-border/70 bg-secondary/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Examples</p>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Click to populate</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                disabled={isLoading}
                className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary hover:text-foreground hover:bg-secondary"
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>{example}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueryInput;
