import React, { useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'
import api from '../services/api'

interface SchemaUploadComponentProps {
  onUploadSuccess: (tablesFound: string[]) => void;
  onUploadError: (errorMessage: string) => void;
  uploading: boolean;
  setUploading: (val: boolean) => void;
}

export const SchemaUploadComponent: React.FC<SchemaUploadComponentProps> = ({
  onUploadSuccess,
  onUploadError,
  uploading,
  setUploading,
}) => {
  const [schemaText, setSchemaText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleClear = () => {
    setSchemaText('')
    setSelectedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !schemaText.trim()) return

    setUploading(true)
    const formData = new FormData()

    if (selectedFile) {
      formData.append('file', selectedFile)
    } else {
      formData.append('schema_text', schemaText)
    }

    try {
      const response = await api.post('/schema/upload', formData)
      const result = response.data
      if (response.status === 200 && result.success) {
        onUploadSuccess(result.tables_found)
        // Fire custom window event to trigger Navbar catalog refresh
        window.dispatchEvent(new Event('schema-updated'))
        handleClear()
      } else {
        onUploadError(result.detail || 'Could not parse tables from SQL script.')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Connection to DB Schema Uploader API failed. Make sure server is online.'
      console.error('Schema upload failed:', err)
      onUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border text-left">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
            Option A: Upload DDL File
          </h4>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 relative ${
              dragActive 
                ? 'border-primary bg-primary/5 scale-[0.99]' 
                : 'border-border hover:border-primary/40 bg-background/30'
            }`}
          >
            <input
              type="file"
              id="ddl-file"
              accept=".sql,.txt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <UploadCloud className={`h-10 w-10 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-semibold text-foreground truncate max-w-xs">
                {selectedFile ? selectedFile.name : 'Select or drop schema script'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports SQL CREATE TABLE queries (.sql, .txt)
              </p>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 font-medium transition-all duration-200"
              >
                <X className="h-3 w-3" />
                <span>Remove Script</span>
              </button>
            )}
          </div>
        </div>

        {!selectedFile && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Option B: Paste DDL Syntax
              </h4>
              {schemaText.trim() && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Clear Paste
                </button>
              )}
            </div>
            <textarea
              id="ddl-text"
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              placeholder={`CREATE TABLE customers (\n  id INT PRIMARY KEY,\n  full_name VARCHAR(100),\n  email VARCHAR(100) UNIQUE\n);`}
              rows={6}
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-all duration-200"
              disabled={uploading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || (!selectedFile && !schemaText.trim())}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 glow-hover hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary-foreground border-t-transparent" />
              <span>Analyzing Tables...</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              <span>Parse & Register Schema</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default SchemaUploadComponent;
