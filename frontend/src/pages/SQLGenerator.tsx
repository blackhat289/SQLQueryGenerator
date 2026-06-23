import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { QueryInput } from '../components/QueryInput'
import { SQLResultCard } from '../components/SQLResultCard'
import { QueryExplanationCard } from '../components/QueryExplanationCard'
import { OptimizationScoreCard } from '../components/OptimizationScoreCard'
import { ComplexityAnalysisCard } from '../components/ComplexityAnalysisCard'
import AIConfidenceCard from '../components/AIConfidenceCard'
import QueryAnalysisCard from '../components/QueryAnalysisCard'
import ResultPreviewCard from '../components/ResultPreviewCard'
import InsightCards from '../components/InsightCards'
import SQLTips from '../components/SQLTips'
import { AIExplanationCard } from '../components/AIExplanationCard'
import api from '../services/api'
import { GenerateResponse } from '../types'
import { useToast } from '../components/ToastNotifications'
import { Terminal, Cpu, FileText, UploadCloud, ChevronDown, ChevronUp, Search } from 'lucide-react'

interface DatasetMeta {
  name: string
  size: string
  rows: number
  columns: number
  uploadedAt: string
}

interface SchemaColumn {
  name: string
  type: string
}

interface SchemaPreview {
  tableName: string
  columns: SchemaColumn[]
}

type DatasetRow = Record<string, string | number>

export const SQLGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GenerateResponse | null>(null)
  const [datasetFile, setDatasetFile] = useState<File | null>(null)
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta | null>(null)
  const [schemaPreview, setSchemaPreview] = useState<SchemaPreview | null>(null)
  const [previewColumns, setPreviewColumns] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<DatasetRow[]>([])
  const [datasetSearch, setDatasetSearch] = useState('')
  const [datasetPage, setDatasetPage] = useState(1)
  const [datasetSortKey, setDatasetSortKey] = useState<string | null>(null)
  const [datasetSortDirection, setDatasetSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dragActive, setDragActive] = useState(false)
  const [schemaOpen, setSchemaOpen] = useState(true)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { showToast } = useToast()

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${sizes[index]}`
  }

  const normalizeColumns = (row: unknown[]) => row.map((value) => String(value ?? '').trim())

  const inferType = (values: string[]) => {
    const sample = values.find((value) => value !== '') ?? ''
    if (sample === '') return 'TEXT'
    if (!Number.isNaN(Number(sample))) {
      return sample.includes('.') ? 'DECIMAL' : 'INTEGER'
    }
    if (!Number.isNaN(Date.parse(sample))) return 'DATE'
    return 'TEXT'
  }

  const parseCSVRow = (line: string) => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (char === ',' && !inQuotes) {
        cells.push(current)
        current = ''
      } else {
        current += char
      }
    }

    cells.push(current)
    return cells
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((row) => row.trim() !== '')
    const headers = lines.length ? normalizeColumns(parseCSVRow(lines[0])) : []
    const rows = lines.slice(1).map((line) => normalizeColumns(parseCSVRow(line)))
    return { headers, rows }
  }

  const parseXLSXFile = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheet = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheet]
    const sheetData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, raw: false })
    const headers = normalizeColumns(sheetData[0] || [])
    const rows = sheetData.slice(1).map((row) => normalizeColumns(row || []))
    return { headers, rows, tableName: firstSheet || 'Sheet1' }
  }

  const parseSQLSchema = (schemaText: string): SchemaPreview => {
    const cleaned = schemaText.replace(/\r/g, ' ').replace(/\n/g, ' ')
    const tableMatch = cleaned.match(/CREATE\s+TABLE\s+[`\"']?([\w-]+)/i)
    const tableName = tableMatch ? tableMatch[1] : 'uploaded_table'
    const columnMatches = Array.from(cleaned.matchAll(/\b([\w_]+)\s+([A-Za-z0-9()]+)(?:\s+NOT\s+NULL|\s+NULL|\s+DEFAULT[^,]*)?/gi))
    const columns = columnMatches.map((match) => ({ name: match[1], type: match[2].toUpperCase() }))
    return { tableName, columns: columns.length ? columns : [{ name: 'id', type: 'INTEGER' }] }
  }

  const detectSchema = (headers: string[], rows: string[][], tableName: string): SchemaPreview => {
    const sampleRows = rows.slice(0, 8)
    const columns = headers.map((header, index) => {
      const values = sampleRows.map((row) => String(row[index] ?? ''))
      return { name: header || `column_${index + 1}`, type: inferType(values) }
    })
    return { tableName, columns }
  }

  const saveDatasetState = (meta: DatasetMeta, schema: SchemaPreview | null, columns: string[], rows: DatasetRow[]) => {
    const payload = { meta, schema, columns, rows }
    localStorage.setItem('sqlgenie_uploaded_dataset', JSON.stringify(payload))
  }

  const clearDataset = () => {
    setDatasetFile(null)
    setDatasetMeta(null)
    setSchemaPreview(null)
    setPreviewColumns([])
    setPreviewRows([])
    setDatasetSearch('')
    setDatasetPage(1)
    setDatasetSortKey(null)
    setDatasetSortDirection('asc')
    setUploadError(null)
    localStorage.removeItem('sqlgenie_uploaded_dataset')
  }

  useEffect(() => {
    const stored = localStorage.getItem('sqlgenie_uploaded_dataset')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      setDatasetMeta(parsed.meta)
      setSchemaPreview(parsed.schema)
      setPreviewColumns(parsed.columns || [])
      setPreviewRows(parsed.rows || [])
    } catch (error) {
      console.error('Unable to parse stored dataset.', error)
    }
  }, [])

  const getTableNameFromFile = (name: string) => name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase() || 'dataset'

  const handleDatasetFile = async (file: File) => {
    setUploadError(null)
    setDatasetFile(file)
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const fileMeta: DatasetMeta = {
      name: file.name,
      size: formatBytes(file.size),
      rows: 0,
      columns: 0,
      uploadedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }

    try {
      let headers: string[] = []
      let rows: string[][] = []
      let schema: SchemaPreview | null = null

      if (extension === 'csv') {
        const text = await file.text()
        const parsed = parseCSV(text)
        headers = parsed.headers
        rows = parsed.rows
        schema = detectSchema(headers, rows, getTableNameFromFile(file.name))
      } else if (extension === 'xlsx' || extension === 'xls') {
        const parsed = await parseXLSXFile(file)
        headers = parsed.headers
        rows = parsed.rows
        schema = detectSchema(headers, rows, getTableNameFromFile(file.name))
      } else if (extension === 'sql' || extension === 'ddl' || extension === 'txt') {
        const text = await file.text()
        schema = parseSQLSchema(text)
        headers = schema.columns.map((column) => column.name)
        rows = []
      } else {
        throw new Error('Unsupported dataset format. Please upload CSV, Excel, or SQL schema files.')
      }

      fileMeta.rows = rows.length
      fileMeta.columns = headers.length
      setDatasetMeta(fileMeta)
      setSchemaPreview(schema)
      setPreviewColumns(headers)
      const mappedRows = rows.slice(0, 10).map((row) =>
        headers.reduce<DatasetRow>((acc, header, idx) => {
          acc[header] = row[idx] ?? ''
          return acc
        }, {})
      )
      setPreviewRows(mappedRows)
      saveDatasetState(fileMeta, schema, headers, mappedRows)
      setDatasetPage(1)
      setDatasetSortKey(null)
      setDatasetSortDirection('asc')
    } catch (error: any) {
      setUploadError(error.message || 'Could not process the uploaded dataset.')
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type !== 'dragleave')
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleDatasetFile(e.dataTransfer.files[0])
    }
  }

  const filteredDatasetRows = useMemo(() => {
    if (!datasetSearch.trim()) return previewRows
    return previewRows.filter((row) =>
      previewColumns.some((col) => row[col]?.toString().toLowerCase().includes(datasetSearch.toLowerCase()))
    )
  }, [datasetSearch, previewRows, previewColumns])

  const sortedDatasetRows = useMemo(() => {
    if (!datasetSortKey) return filteredDatasetRows
    return [...filteredDatasetRows].sort((left, right) => {
      const leftValue = left[datasetSortKey] ?? ''
      const rightValue = right[datasetSortKey] ?? ''
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return datasetSortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue
      }
      return datasetSortDirection === 'asc'
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue))
    })
  }, [filteredDatasetRows, datasetSortDirection, datasetSortKey])

  const currentDatasetRows = sortedDatasetRows.slice((datasetPage - 1) * 10, datasetPage * 10)
  const datasetTotalPages = Math.max(1, Math.ceil(sortedDatasetRows.length / 10))

  const enhancedPrompt = (prompt: string) => {
    if (!datasetMeta || !schemaPreview) return prompt
    return `${prompt}\n\nUse the uploaded dataset table "${schemaPreview.tableName}" with columns ${schemaPreview.columns.map((c) => c.name).join(', ')}.`
  }

  const handleGenerate = async (prompt: string) => {
    setLoading(true)
    setData(null)
    try {
      const response = await api.post<GenerateResponse>('/generate', { prompt: enhancedPrompt(prompt) })
      setData(response.data)
      showToast('Generated SQL query successfully!', 'success')
    } catch (err: any) {
      const msg = err.displayMessage || 'Failed to translate natural language prompt.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const queryType = useMemo(() => {
    if (!data) return 'N/A'
    const firstWord = data.sql.trim().split(/\s+/)[0] || 'SELECT'
    return firstWord.toUpperCase()
  }, [data])

  const filtersApplied = useMemo(() => {
    if (!data) return []
    const match = data.sql.match(/WHERE\s+([\s\S]*?)(ORDER\s+BY|GROUP\s+BY|LIMIT|$)/i)
    if (!match) return []
    const filterText = match[1].trim()
    if (!filterText) return []
    return filterText.split(/\s+AND\s+|\s+OR\s+/i).map((entry) => entry.trim()).filter(Boolean)
  }, [data])

  const mockResultCount = useMemo(() => {
    if (!data) return 0
    const query = data.sql.toLowerCase()
    if (query.includes('count')) return 1
    if (query.includes('avg') || query.includes('average')) return 4
    if (query.includes('top') || query.includes('limit')) return 10
    return 6
  }, [data])

  return (
    <div className="space-y-8 text-left animate-fade-in pb-16">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">AI SQL Workspace</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Granting Your Database Wishes</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Transform natural language requests into clean, optimized SQL with premium AI insights, interactive previews, and intelligent query guidance.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-500 dark:text-cyan-300/80">Dataset Upload</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Upload a dataset to explore with AI</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200">
                <UploadCloud className="h-4 w-4" /> Supported formats
                <span className="ml-2 text-muted-foreground">CSV · XLSX · SQL</span>
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`rounded-[1.75rem] border-2 p-8 text-center transition-all duration-300 ${
                    dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-dashed border-border bg-secondary/30 hover:border-cyan-400'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.sql,.txt"
                    onChange={(event) => {
                      if (event.target.files?.[0]) {
                        handleDatasetFile(event.target.files[0])
                      }
                    }}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-cyan-600 dark:text-cyan-300 shadow-lg shadow-cyan-500/10">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-foreground">Drag & drop your dataset here</p>
                  <p className="mt-2 text-sm text-muted-foreground">Support for CSV, Excel (.xlsx), and SQL schema files. Click to browse.</p>
                  {uploadError && <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{uploadError}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dataset summary</p>
                  {datasetMeta ? (
                    <div className="mt-4 space-y-3 text-sm text-foreground">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">File name</span>
                        <span>{datasetMeta.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">File size</span>
                        <span>{datasetMeta.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rows</span>
                        <span>{datasetMeta.rows}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Columns</span>
                        <span>{datasetMeta.columns}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Uploaded</span>
                        <span>{datasetMeta.uploadedAt}</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearDataset}
                        className="mt-3 w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-200 transition hover:bg-rose-500/15"
                      >
                        Remove dataset
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">No dataset uploaded yet. Upload a file to detect schema, preview rows, and ask AI questions against your data.</p>
                  )}
                </div>
              </div>
            </div>

            {datasetMeta && (
              <div className="mt-6 rounded-[1.75rem] border border-border bg-card p-5">
                <button
                  type="button"
                  onClick={() => setSchemaOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-foreground"
                >
                  <span>Schema Preview</span>
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    {schemaOpen ? 'Collapse' : 'Expand'}
                    {schemaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {schemaOpen && schemaPreview && (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-3xl border border-border/70 bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Table</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{schemaPreview.tableName}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {schemaPreview.columns.map((column) => (
                        <div key={column.name} className="rounded-3xl border border-border/70 bg-background p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{column.name}</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{column.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 rounded-[1.75rem] border border-border bg-card p-5">
              {datasetMeta ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dataset preview</p>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">First 10 rows</h3>
                    </div>
                    <div className="relative w-full sm:w-52">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={datasetSearch}
                        onChange={(e) => { setDatasetSearch(e.target.value); setDatasetPage(1) }}
                        placeholder="Search preview"
                        className="w-full rounded-2xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  {previewColumns.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-background p-8 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">No preview data available</p>
                      <p className="mt-2 text-sm text-muted-foreground">This file type contains only schema definitions or no data rows.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-background">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm text-left">
                          <thead className="bg-secondary/40 text-muted-foreground">
                            <tr>
                              {previewColumns.map((column) => (
                                <th
                                  key={column}
                                  onClick={() => {
                                    if (datasetSortKey === column) {
                                      setDatasetSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
                                    } else {
                                      setDatasetSortKey(column)
                                      setDatasetSortDirection('asc')
                                    }
                                  }}
                                  className="cursor-pointer px-4 py-3 font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:text-cyan-500"
                                >
                                  <div className="flex items-center gap-1">
                                    {column}
                                    {datasetSortKey === column ? (datasetSortDirection === 'asc' ? '▲' : '▼') : ''}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {currentDatasetRows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="transition hover:bg-secondary/50">
                                {previewColumns.map((column) => (
                                  <td key={column} className="px-4 py-3 text-foreground">{row[column]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-border bg-secondary/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Showing {currentDatasetRows.length} of {sortedDatasetRows.length} rows
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDatasetPage((value) => Math.max(1, value - 1))}
                            disabled={datasetPage === 1}
                            className="rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <span className="text-xs text-muted-foreground">{datasetPage}/{datasetTotalPages}</span>
                          <button
                            type="button"
                            onClick={() => setDatasetPage((value) => Math.min(datasetTotalPages, value + 1))}
                            disabled={datasetPage === datasetTotalPages}
                            className="rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                  <p className="text-lg font-semibold text-foreground">Upload a dataset to start asking questions.</p>
                  <p className="mt-2 text-sm leading-6">Once a dataset is uploaded, Genie will detect the schema, preview rows, and allow dataset-focused prompts.</p>
                </div>
              )}
            </div>
          </section>

          <QueryInput
            onSubmit={handleGenerate}
            isLoading={loading}
            placeholder={datasetMeta ? `Ask questions about ${schemaPreview?.tableName || 'your dataset'}...` : undefined}
          />

          {loading && (
            <div className="rounded-[2rem] border border-border bg-card p-12 text-center shadow-2xl shadow-black/5 dark:shadow-black/20">
              <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-muted border-t-cyan-400 animate-spin" />
              <p className="text-sm font-semibold text-muted-foreground">Genie is writing and optimizing SQL statements...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <SQLResultCard sql={data.sql} />
              <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-2xl shadow-black/5 dark:shadow-black/20">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Query Results</p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">Generated SQL & result preview</h3>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-200">Total records returned: {mockResultCount}</span>
                </div>
              </div>
              <ResultPreviewCard sql={data.sql} />
              <AIExplanationCard sql={data.sql} tablesUsed={data.tables_used} />
              <QueryExplanationCard explanation={data.explanation} />
            </div>
          )}

          <div className="space-y-6">
            <div>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Query Insights</p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground">Understand your query profile</h2>
                </div>
              </div>
              <InsightCards
                queryType={queryType}
                tablesUsed={data?.tables_used || []}
                filtersApplied={filtersApplied}
                complexity={data?.complexity.level || 'N/A'}
              />
            </div>
            <SQLTips />
          </div>
        </div>

        <div className="space-y-6">
          {datasetMeta ? (
            <div className="rounded-[2rem] border border-border/70 bg-slate-950/80 p-6 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Uploaded dataset</p>
                  <h2 className="mt-2 text-2xl font-bold text-foreground">{datasetMeta.name}</h2>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Data loaded</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rows</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{datasetMeta.rows}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Columns</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{datasetMeta.columns}</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preview schema</p>
                <p className="mt-2 text-sm text-slate-300">{schemaPreview?.tableName || 'Dataset'}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-border/70 bg-slate-950/80 p-6 text-center shadow-2xl shadow-black/10">
              <Terminal className="mx-auto mb-4 h-12 w-12 text-slate-500" />
              <h3 className="text-lg font-semibold text-foreground">No dataset loaded</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Upload a dataset in the left panel to unlock dataset-aware SQL generation and previews.</p>
            </div>
          )}

          {data ? (
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border/70 bg-slate-950/80 p-6 shadow-2xl shadow-black/10">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-violet-400" /> AI Confidence
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">92%</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">This result preview is generated from AI-assisted SQL output and dataset metadata.</p>
              </div>
              <AIConfidenceCard score={92} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SQLGenerator;
