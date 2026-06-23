import React, { useEffect, useState } from 'react'
import { SchemaUploadComponent } from '../components/SchemaUploadComponent'
import { ERDiagram } from '../components/ERDiagram'
import api from '../services/api'
import { SchemaStatus } from '../types'
import { useToast } from '../components/ToastNotifications'
import { Database, CheckCircle, Table, Sparkles } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export const SchemaUpload: React.FC = () => {
  const [status, setStatus] = useState<SchemaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  const fetchStatus = async () => {
    try {
      const response = await api.get<SchemaStatus>('/status')
      setStatus(response.data)
    } catch (err) {
      console.error('Failed to load schema catalog status', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Listen to custom schema-updated events
    window.addEventListener('schema-updated', fetchStatus)
    return () => {
      window.removeEventListener('schema-updated', fetchStatus)
    }
  }, [])

  const handleUploadSuccess = (tablesFound: string[]) => {
    showToast(`Successfully registered schema with ${tablesFound.length} tables!`, 'success')
    fetchStatus()
  }

  const handleUploadError = (errMessage: string) => {
    showToast(errMessage, 'error')
  }

  if (loading) {
    return <LoadingSpinner message="Scanning database catalog..." />
  }

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Schema Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload DDL schema scripts to align the Natural Language RAG parser to your specific database tables and constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Option Panel: Upload & Pastes */}
        <div className="lg:col-span-4 space-y-6">
          <SchemaUploadComponent
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            uploading={uploading}
            setUploading={setUploading}
          />

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm premium-border flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Active Catalog Context
              </h4>
              <div className="mt-3 flex items-center justify-between py-2 border-b border-border/80">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-violet-500" />
                  Source file:
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {status?.filename ? status.filename : 'Default Retail Schema'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Table className="h-4 w-4 text-indigo-500" />
                  Tables Count:
                </span>
                <span className="text-xs font-bold text-foreground">
                  {status?.tables ? Object.keys(status.tables).length : 0} registered
                </span>
              </div>
            </div>

            {status?.filename && (
              <div className="mt-5 pt-3 border-t border-border flex items-start gap-2 text-[10px] text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>RAG context is active. SQL queries generated will match these column keys.</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual ER Diagram Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          {status && status.tables && Object.keys(status.tables).length > 0 ? (
            <ERDiagram tables={status.tables} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[460px]">
              <Database className="h-12 w-12 text-muted-foreground/35 mb-4 animate-pulse" />
              <h4 className="text-base font-bold text-foreground mb-1">ER Diagram Explorer offline</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                Provide custom DDL syntax statements on the upload panel to analyze and generate your table relationships diagram here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchemaUpload;
