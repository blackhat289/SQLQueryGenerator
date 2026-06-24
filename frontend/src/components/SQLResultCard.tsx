import React, { useState, useEffect } from 'react'
import { Copy, Check, Play, Table, Loader2, FileText, CornerDownRight } from 'lucide-react'

// Lightweight regex-based SQL syntax highlighting tool
const highlightSQL = (code: string): string => {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'ON', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET', 'HAVING', 'AND', 'OR', 'IN', 'NOT',
    'LIKE', 'ILIKE', 'IS', 'NULL', 'AS', 'SUM', 'AVG', 'COUNT', 'MIN', 'MAX',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'FOREIGN'
  ]
  
  // Escape HTML entities to prevent rendering issues or injection
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const regex = /(\/\*[\s\S]*?\*\/|--.*)|(&quot;(?:[^&]|\\.)*&quot;)|(&#39;(?:[^&]|\\.)*&#39;)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(\b\d+\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g

  return escaped.replace(regex, (match, comment, dblQuote1, sglQuote1, sglQuote2, dblQuote2, numberVal, wordVal) => {
    if (comment) {
      return `<span class="text-zinc-500 italic">${match}</span>`
    }
    if (dblQuote1 || sglQuote1 || sglQuote2 || dblQuote2) {
      return `<span class="text-amber-300">${match}</span>`
    }
    if (numberVal) {
      return `<span class="text-rose-400">${match}</span>`
    }
    if (wordVal) {
      if (keywords.includes(wordVal.toUpperCase())) {
        return `<span class="text-[#a855f7] font-bold">${match}</span>`
      }
    }
    return match
  })
}

interface SQLResultCardProps {
  sql: string;
  title?: string;
}

export const SQLResultCard: React.FC<SQLResultCardProps> = ({ sql, title = "Generated SQL Query" }) => {
  const [copied, setCopied] = useState(false)
  const [executed, setExecuted] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Reset execution state if SQL changes
  useEffect(() => {
    setExecuted(false)
    setExecuting(false)
  }, [sql])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy SQL', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'generated-query.sql'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExecute = () => {
    setExecuting(true)
    setTimeout(() => {
      setExecuting(false)
      setExecuted(true)
    }, 1000)
  }

  const getMockData = () => {
    const query = sql.toLowerCase()
    if (query.includes('count')) {
      return {
        columns: ["total_count"],
        rows: [[42]]
      }
    }
    if (query.includes('avg') || query.includes('average')) {
      return {
        columns: ["average_value"],
        rows: [[89.50]]
      }
    }
    if (query.includes('users') && query.includes('orders')) {
      return {
        columns: ["user_name", "total_amount", "status"],
        rows: [
          ["Jane Doe", 750.00, "completed"],
          ["Alex Smith", 480.00, "completed"],
          ["Bob Vance", 120.00, "pending"]
        ]
      }
    }
    if (query.includes('users')) {
      return {
        columns: ["id", "name", "email", "role"],
        rows: [
          [1, "Jane Doe", "jane@example.com", "admin"],
          [2, "Alex Smith", "alex@example.com", "user"],
          [3, "Bob Vance", "bob@example.com", "user"]
        ]
      }
    }
    if (query.includes('products')) {
      return {
        columns: ["id", "name", "price", "stock"],
        rows: [
          [101, "Ergonomic Office Chair", 199.99, 25],
          [102, "Noise Cancelling Headphones", 149.99, 14],
          [103, "Mechanical Keyboard", 89.99, 42]
        ]
      }
    }
    return {
      columns: ["id", "result_value"],
      rows: [
        [1, "Mock Data Row A"],
        [2, "Mock Data Row B"]
      ]
    }
  }

  const mockData = getMockData()

  // Load editor configurations from local settings storage
  const wordWrap = localStorage.getItem('sqlgenie_word_wrap') !== 'false'
  const lineNumbers = localStorage.getItem('sqlgenie_line_numbers') !== 'false'
  const syntaxHighlighting = localStorage.getItem('sqlgenie_syntax_highlighting') !== 'false'

  // Highlight and prepare SQL string representation
  const highlightedCode = syntaxHighlighting ? highlightSQL(sql) : sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = highlightedCode.split('\n')

  const preClass = `text-xs text-zinc-100 leading-relaxed font-mono ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}`

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">Professional SQL editor preview with copy, download, and fullscreen tools.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:border-primary/50 hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/80"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/10 transition hover:bg-primary/95"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            <span>Fullscreen</span>
          </button>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {executing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Run Dry-Run</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="relative bg-zinc-950 rounded-xl p-4 border border-zinc-800 text-left overflow-x-auto">
        <pre className={preClass}>
          {lineNumbers ? (
            <div className="flex flex-col">
              {lines.map((line, idx) => (
                <div key={idx} className="flex hover:bg-zinc-900/35">
                  <span className="w-8 shrink-0 text-zinc-600 select-none text-right pr-3 border-r border-zinc-800/80 mr-3">{idx + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: line || ' ' }} />
                </div>
              ))}
            </div>
          ) : (
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          )}
        </pre>
      </div>

      {executed && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in text-left">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Table className="h-4 w-4 text-violet-500" />
            <span>Simulation Table Output</span>
          </h4>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead className="bg-secondary/70">
                <tr>
                  {mockData.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2.5 font-semibold text-secondary-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {mockData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30">
                    {row.map((val, valIdx) => (
                      <td key={valIdx} className="px-4 py-2.5 font-mono text-muted-foreground">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default SQLResultCard;
