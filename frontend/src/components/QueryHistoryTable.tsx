import React from 'react'
import { History, PlayCircle, Clock } from 'lucide-react'
import { QueryHistoryItem } from '../types'

interface QueryHistoryTableProps {
  history: QueryHistoryItem[];
  onSelect: (item: QueryHistoryItem) => void;
}

export const QueryHistoryTable: React.FC<QueryHistoryTableProps> = ({ history, onSelect }) => {
  const getComplexityBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
    }
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString()
    } catch (e) {
      return isoString
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden premium-border text-left">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span>Execution Logs</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm text-left">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Natural Language</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Complexity</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Optimization</th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">
                  No queries in logs. Go to SQL Generator and enter a prompt.
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-all duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    <p className="max-w-xs sm:max-w-md truncate" title={item.nl_query}>
                      {item.nl_query}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getComplexityBadge(item.complexity)}`}>
                      {item.complexity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        item.optimization_score >= 90 ? 'bg-emerald-500' : item.optimization_score >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span className="font-semibold">{item.optimization_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <button
                      onClick={() => onSelect(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold shadow-sm transition-all duration-200"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>Workspace</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default QueryHistoryTable;
