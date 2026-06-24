import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Terminal, Clock, Cpu, ChevronRight, Sparkles } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import api from '../services/api'
import { useAuth } from '../components/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

interface AnalyticsData {
  widgets: {
    totalQueries: number;
    executedQueries: number;
    successRate: number;
    avgResponseTimeMs: number;
  };
  usageTrend: { date: string; queries: number }[];
  tableUsage: { name: string; value: number }[];
  complexityDistribution: { name: string; value: number }[];
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get<{ success: boolean; data: AnalyticsData }>('/query/analytics')
        if (response.data?.success) {
          setData(response.data.data)
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-16">
        <div className="space-y-4">
          <div className="h-32 rounded-3xl bg-slate-900/80 shadow-lg shadow-slate-950/20" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-3xl bg-slate-900/80 shadow-lg shadow-slate-950/20" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 rounded-3xl bg-slate-900/80 shadow-lg shadow-slate-950/20" />
          <div className="h-72 rounded-3xl bg-slate-900/80 shadow-lg shadow-slate-950/20" />
          <div className="space-y-4">
            <div className="h-32 rounded-3xl bg-slate-900/80 shadow-lg shadow-slate-950/20" />
          </div>
        </div>
      </div>
    )
  }

  const chartPalette = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981']
  const complexityColors = ['#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent border border-primary/15 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span>Welcome back, {user?.name || 'Developer'}!</span>
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Genie is synchronized to your MongoDB query store. Create prompts, parse schema fields, and audit real-time query executions below.
          </p>
        </div>
        <Link
          to="/generator"
          className="sm:self-center inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/10 glow-hover hover:bg-primary/95 transition-all duration-200 shrink-0"
        >
          <span>Open Generator</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>


      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Trend Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm premium-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-primary" />
              <span>Query Usage Trends</span>
            </h3>
            <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-full font-bold text-muted-foreground uppercase tracking-wider">
              Last 7 Days
            </span>
          </div>
          <div className="h-60 w-full">
            {(!data || data.usageTrend.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-secondary/30 text-center p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">No activity yet</span>
                <span>Start by generating SQL to see your workspace usage trend.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.usageTrend} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usageGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                  />
                  <Area type="monotone" dataKey="queries" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#usageGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Complexity Segmentations */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border flex flex-col justify-between">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Cpu className="h-4.5 w-4.5 text-violet-500" />
            <span>Complexity Distribution</span>
          </h3>
          <div className="h-60 w-full flex flex-col justify-center">
            {(!data || data.complexityDistribution.reduce((acc, curr) => acc + curr.value, 0) === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Complexity logs will update after executions.
              </div>
            ) : (
              <div className="relative h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={data.complexityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.complexityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={complexityColors[index % complexityColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legends list */}
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 text-[10px] font-semibold">
                  {data.complexityDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: complexityColors[index % complexityColors.length] }} />
                      <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Row 3: Table Usage breakdown & Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Usage Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm premium-border flex flex-col justify-between">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Database className="h-4.5 w-4.5 text-emerald-500" />
            <span>Table Query Frequencies</span>
          </h3>
          <div className="h-56 w-full">
            {(!data || data.tableUsage.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-secondary/30 text-center p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Schema usage not available yet</span>
                <span>Upload or sync your schema to unlock table frequency insights.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tableUsage} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {data.tableUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Links panels */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
            <span>Quick Actions</span>
          </h3>
          <div className="grid grid-cols-1 gap-3.5">
            <Link
              to="/generator"
              className="group bg-card hover:bg-secondary/40 border border-border hover:border-primary/25 rounded-xl p-4 text-left transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Terminal className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">SQL Generator</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Translate English prompts to SQL</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/upload"
              className="group bg-card hover:bg-secondary/40 border border-border hover:border-primary/25 rounded-xl p-4 text-left transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Database className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Schema Explorer</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Map DDL structures & ER Diagrams</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/history"
              className="group bg-card hover:bg-secondary/40 border border-border hover:border-primary/25 rounded-xl p-4 text-left transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Query History</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Audit past executions logs</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link
              to="/upload"
              className="group bg-card hover:bg-secondary/40 border border-border hover:border-primary/25 rounded-xl p-4 text-left transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Database className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Explore Schema</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Inspect table metadata and relationships</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard;
