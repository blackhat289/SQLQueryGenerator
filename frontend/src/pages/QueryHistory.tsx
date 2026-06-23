import React, { useEffect, useState } from 'react'
import { QueryHistoryTable } from '../components/QueryHistoryTable'
import api from '../services/api'
import { QueryHistoryItem, ExplanationStep, ComplexityResponse } from '../types'
import { OptimizationScoreCard } from '../components/OptimizationScoreCard'
import { ComplexityAnalysisCard } from '../components/ComplexityAnalysisCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastNotifications'
import { Clock, Eye } from 'lucide-react'

export const QueryHistory: React.FC = () => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<QueryHistoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const loadHistory = async () => {
    try {
      const response = await api.get<QueryHistoryItem[]>('/history')
      setHistory(response.data)
      if (response.data.length > 0) {
        setSelectedItem(response.data[0])
      }
    } catch (err) {
      showToast('Failed to fetch query logs from backend history.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  if (loading) {
    return <LoadingSpinner message="Extracting execution history..." fullPage />
  }

  const handleSelectItem = (item: QueryHistoryItem) => {
    setSelectedItem(item)
    showToast('Loaded query logs to detailed inspector.', 'info')
  }

  const getComplexityObj = (item: QueryHistoryItem): ComplexityResponse => {
    const queryUpper = item.sql_query.toUpperCase()
    const joins = queryUpper.split('JOIN').length - 1
    const subqueries = Math.max(0, queryUpper.split('SELECT').length - 2)
    const hasGroup = queryUpper.includes('GROUP BY')
    
    const indicators = []
    if (joins > 0) indicators.push(`Includes ${joins} relational join links`)
    if (subqueries > 0) indicators.push(`Contains ${subqueries} nested selections`)
    if (hasGroup) indicators.push('Groups rows by parameters')
    if (indicators.length === 0) indicators.push('Standard single-table query filters')

    return {
      level: item.complexity,
      details: {
        joins_count: joins,
        has_group_by: hasGroup,
        subqueries_count: subqueries,
        indicators
      }
    }
  }

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Execution Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Audit previous natural language prompts, check complexity metrics, and analyze optimizer details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table logs */}
        <div className="lg:col-span-2">
          <QueryHistoryTable history={history} onSelect={handleSelectItem} />
        </div>

        {/* Selected Item inspector */}
        <div className="space-y-6">
          {selectedItem ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm premium-border">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="h-4.5 w-4.5 text-primary" />
                    <span>Workspace Inspector</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/generator')}
                      className="text-xs text-primary hover:text-primary/80 font-bold hover:underline"
                    >
                      Open in Generator
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this query log entry?')) {
                          try {
                            await api.delete(`/history/${selectedItem.id}`)
                            showToast('Log entry removed successfully.', 'success')
                            setSelectedItem(null)
                            loadHistory()
                          } catch (err: any) {
                            showToast('Could not remove log entry.', 'error')
                          }
                        }
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-3.5 text-left">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">NL Prompt</span>
                    <p className="text-xs font-semibold text-foreground mt-1 leading-normal">
                      "{selectedItem.nl_query}"
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">SQL Query Statement</span>
                    <pre className="text-[11px] font-mono bg-zinc-950 text-zinc-100 p-3.5 rounded-xl border border-zinc-850 overflow-x-auto mt-1 leading-relaxed">
                      <code>{selectedItem.sql_query}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <OptimizationScoreCard
                score={selectedItem.optimization_score}
                suggestions={[]}
              />

              <ComplexityAnalysisCard complexity={getComplexityObj(selectedItem)} />
            </div>
          ) : (
            <div className="bg-card/20 border border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground h-full min-h-[320px] flex flex-col items-center justify-center">
              <Clock className="h-10 w-10 mb-3 text-muted-foreground" />
              <h4 className="text-sm font-semibold mb-1 text-foreground">Detail Monitor</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Click the "Workspace" action button on any record row to inspect full statements, complexity statistics, and optimization details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QueryHistory;
