import React, { useEffect, useMemo, useState } from 'react'
import {
  Settings as SettingsIcon,
  Database,
  ShieldAlert,
  Key,
  Sparkles,
  ShieldCheck,
  Bell,
  Zap,
  Activity,
  Moon,
  Sun,
  Monitor,
  Code2,
  FileText,
  Clock3,
  RefreshCcw,
  Trash2,
  AlertTriangle,
  Clipboard,
  Shield,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '../components/ToastNotifications'
import api from '../services/api'

const cardBase =
  'rounded-[28px] border border-border bg-card/45 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl p-8 shadow-[0_30px_80px_-60px_rgba(124,58,237,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_120px_-70px_rgba(124,58,237,0.65)]'

const editorOptions = [
  { key: 'wordWrap', label: 'Word Wrap' },
  { key: 'autoCompletion', label: 'Auto Completion' },
  { key: 'syntaxHighlighting', label: 'Syntax Highlighting' },
  { key: 'lineNumbers', label: 'Line Numbers' },
  { key: 'queryFormatting', label: 'Query Formatting' },
] as const

const notificationOptions = [
  { key: 'notifyQueryCompletion', label: 'Query completion notifications' },
  { key: 'notifyErrorAlerts', label: 'Error alerts' },
  { key: 'notifySecurityAlerts', label: 'Security alerts' },
  { key: 'notifyProductUpdates', label: 'Product updates' },
] as const

const defaultSettings = {
  provider: localStorage.getItem('sqlgenie_ai_provider') || 'mock',
  apiKey: localStorage.getItem('sqlgenie_openai_key') || '',
  deploymentType: localStorage.getItem('sqlgenie_deployment_type') || 'standard',
  sqlDialect: localStorage.getItem('sqlgenie_sql_dialect') || 'postgresql',
  autoOptimize: localStorage.getItem('sqlgenie_auto_optimize') === 'true',
  autoExplain: localStorage.getItem('sqlgenie_auto_explain') === 'true',
  queryValidation: localStorage.getItem('sqlgenie_query_validation') === 'true',
  preferredDatabase: localStorage.getItem('sqlgenie_preferred_database') || 'PostgreSQL',
  connectionTimeout: Number(localStorage.getItem('sqlgenie_connection_timeout') || '30'),
  queryPreview: localStorage.getItem('sqlgenie_query_preview') !== 'false',
  autoSchemaRefresh: localStorage.getItem('sqlgenie_auto_schema_refresh') !== 'false',
  sessionTimeout: Number(localStorage.getItem('sqlgenie_session_timeout') || '30'),
  rememberDevice: localStorage.getItem('sqlgenie_remember_device') === 'true',
  wordWrap: localStorage.getItem('sqlgenie_word_wrap') !== 'false',
  autoCompletion: localStorage.getItem('sqlgenie_auto_completion') !== 'false',
  syntaxHighlighting: localStorage.getItem('sqlgenie_syntax_highlighting') !== 'false',
  lineNumbers: localStorage.getItem('sqlgenie_line_numbers') !== 'false',
  queryFormatting: localStorage.getItem('sqlgenie_query_formatting') !== 'false',
  notifyQueryCompletion: localStorage.getItem('sqlgenie_notify_query_completion') !== 'false',
  notifyErrorAlerts: localStorage.getItem('sqlgenie_notify_error_alerts') !== 'false',
  notifySecurityAlerts: localStorage.getItem('sqlgenie_notify_security_alerts') !== 'false',
  notifyProductUpdates: localStorage.getItem('sqlgenie_notify_product_updates') !== 'false',
  appearanceTheme: localStorage.getItem('sqlgenie_appearance_theme') || 'dark',
  fontSize: localStorage.getItem('sqlgenie_font_size') || 'medium',
}

type SettingsState = typeof defaultSettings

type ModalAction = 'clearHistory' | 'deleteLogs' | 'resetSettings' | null

export const Settings: React.FC = () => {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<SettingsState>({ ...defaultSettings })
  const [savedSettings, setSavedSettings] = useState<SettingsState>({ ...defaultSettings })
  const [savedAt, setSavedAt] = useState<string>('Saved just now')
  const [processing, setProcessing] = useState(false)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)

  const analytics = {
    queriesGenerated: Number(localStorage.getItem('sqlgenie_analytics_queries_generated') || '154'),
    queriesOptimized: Number(localStorage.getItem('sqlgenie_analytics_queries_optimized') || '87'),
    schemasIndexed: Number(localStorage.getItem('sqlgenie_analytics_schemas_indexed') || '4'),
    avgResponseTime: Number(localStorage.getItem('sqlgenie_analytics_avg_response_time') || '1.2'),
  }

  const dbStatus = [
    { label: 'Schema Loaded', value: 'Active', icon: ShieldCheck },
    { label: 'Connected', value: 'Live', icon: Activity },
    { label: 'Last Synced', value: '2 min ago', icon: RefreshCcw },
  ]

  const securityStatus = [
    { label: 'Current Session', value: 'This device', icon: Monitor },
    { label: 'Last Login', value: '2 hours ago', icon: Clock3 },
    { label: 'Account Security', value: 'Protected', icon: Shield },
  ]

  const isDirty = useMemo(
    () =>
      Object.keys(settings).some((key) =>
        (settings as any)[key] !== (savedSettings as any)[key],
      ),
    [settings, savedSettings],
  )

  useEffect(() => {
    if (!isDirty) {
      setSavedAt('Saved just now')
    }
  }, [isDirty])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const persistSettings = () => {
    localStorage.setItem('sqlgenie_ai_provider', settings.provider)
    localStorage.setItem('sqlgenie_openai_key', settings.apiKey)
    localStorage.setItem('sqlgenie_deployment_type', settings.deploymentType)
    localStorage.setItem('sqlgenie_sql_dialect', settings.sqlDialect)
    localStorage.setItem('sqlgenie_auto_optimize', String(settings.autoOptimize))
    localStorage.setItem('sqlgenie_auto_explain', String(settings.autoExplain))
    localStorage.setItem('sqlgenie_query_validation', String(settings.queryValidation))
    localStorage.setItem('sqlgenie_preferred_database', settings.preferredDatabase)
    localStorage.setItem('sqlgenie_connection_timeout', String(settings.connectionTimeout))
    localStorage.setItem('sqlgenie_query_preview', String(settings.queryPreview))
    localStorage.setItem('sqlgenie_auto_schema_refresh', String(settings.autoSchemaRefresh))
    localStorage.setItem('sqlgenie_session_timeout', String(settings.sessionTimeout))
    localStorage.setItem('sqlgenie_remember_device', String(settings.rememberDevice))
    localStorage.setItem('sqlgenie_word_wrap', String(settings.wordWrap))
    localStorage.setItem('sqlgenie_auto_completion', String(settings.autoCompletion))
    localStorage.setItem('sqlgenie_syntax_highlighting', String(settings.syntaxHighlighting))
    localStorage.setItem('sqlgenie_line_numbers', String(settings.lineNumbers))
    localStorage.setItem('sqlgenie_query_formatting', String(settings.queryFormatting))
    localStorage.setItem('sqlgenie_notify_query_completion', String(settings.notifyQueryCompletion))
    localStorage.setItem('sqlgenie_notify_error_alerts', String(settings.notifyErrorAlerts))
    localStorage.setItem('sqlgenie_notify_security_alerts', String(settings.notifySecurityAlerts))
    localStorage.setItem('sqlgenie_notify_product_updates', String(settings.notifyProductUpdates))
    localStorage.setItem('sqlgenie_appearance_theme', settings.appearanceTheme)
    localStorage.setItem('sqlgenie_font_size', settings.fontSize)
  }

  const handleSaveAll = (event?: React.FormEvent) => {
    event?.preventDefault()
    persistSettings()
    setSavedSettings({ ...settings })
    setSavedAt('Saved just now')
    showToast('Settings saved successfully.', 'success')
  }

  const handleDiscard = () => {
    setSettings({ ...savedSettings })
    showToast('Unsaved changes discarded.', 'info')
  }

  const handleClearHistory = async () => {
    setProcessing(true)
    try {
      await api.delete('/history')
      showToast('Query history cleared successfully.', 'success')
      window.dispatchEvent(new Event('schema-updated'))
    } catch (err: any) {
      showToast(err.displayMessage || 'Could not clear query history.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteStoredLogs = () => {
    localStorage.removeItem('sqlgenie_query_logs')
    localStorage.removeItem('sqlgenie_history_cache')
    showToast('Stored browser logs and local audit caches have been deleted.', 'success')
  }

  const handleResetSettings = () => {
    Object.keys(defaultSettings).forEach((key) => {
      localStorage.removeItem(`sqlgenie_${key}`)
    })
    setSettings({ ...defaultSettings })
    setSavedSettings({ ...defaultSettings })
    setSavedAt('Saved just now')
    showToast('All settings reset to default values.', 'success')
  }

  const handleConfirmAction = async () => {
    if (modalAction === 'clearHistory') {
      await handleClearHistory()
    }
    if (modalAction === 'deleteLogs') {
      handleDeleteStoredLogs()
    }
    if (modalAction === 'resetSettings') {
      handleResetSettings()
    }
    setModalAction(null)
  }

  return (
    <div className="relative px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-secondary/80 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_30px_-20px_rgba(124,58,237,0.3)]">
            <SettingsIcon className="h-4 w-4 text-[#a855f7]" />
            Settings Center
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Workspace settings for Genie</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Configure AI behavior, database preferences, editor controls, security protection, and notification settings in one polished control center.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-border bg-card/60 px-4 py-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <Zap className="h-4 w-4 text-[#a855f7]" />
                  AI Connected
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">Online</p>
              </div>
              <div className="rounded-3xl border border-border bg-card/60 px-4 py-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-[#7c3aed]" />
                  Schema Loaded
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">Active</p>
              </div>
              <div className="rounded-3xl border border-border bg-card/60 px-4 py-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <Monitor className="h-4 w-4 text-[#38bdf8]" />
                  Secure Session
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">This device</p>
              </div>
              <div className="rounded-3xl border border-border bg-card/60 px-4 py-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <RefreshCcw className="h-4 w-4 text-[#a855f7]" />
                  Last Sync
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">2 minutes ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#d8b4fe] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_-30px_rgba(124,58,237,0.9)] transition duration-300 hover:-translate-y-0.5"
          >
            Save Settings
          </button>
          <p className="text-sm text-muted-foreground">{savedAt}</p>
        </div>
      </div>

      <form className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">AI Settings</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Configure AI model routing, SQL dialects, and generation behavior.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Model Provider</label>
              <select
                value={settings.provider}
                onChange={(e) => updateSetting('provider', e.target.value as SettingsState['provider'])}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
              >
                <option value="mock">Offline SQL Parser</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="gemini">Google Gemini Pro</option>
              </select>
              <p className="text-xs text-slate-500">Choose the AI engine that powers SQL generation for your workspace.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Deployment Type</label>
                <select
                  value={settings.deploymentType}
                  onChange={(e) => updateSetting('deploymentType', e.target.value as SettingsState['deploymentType'])}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                >
                  <option value="standard">Shared Sandbox</option>
                  <option value="custom">Custom Provider</option>
                </select>
                <p className="text-xs text-slate-500">Select whether to use the built-in sandbox or your own provider key.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">SQL Dialect</label>
                <select
                  value={settings.sqlDialect}
                  onChange={(e) => updateSetting('sqlDialect', e.target.value as SettingsState['sqlDialect'])}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="sqlserver">SQL Server</option>
                </select>
                <p className="text-xs text-slate-500">Match generated SQL to the dialect used by your database.</p>
              </div>
            </div>

            {settings.provider !== 'mock' && (
              <div className="space-y-2 rounded-3xl border border-border bg-card/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">Provider API Key</p>
                  <button
                    type="button"
                    onClick={() => setApiKeyVisible((value) => !value)}
                    className="text-xs font-semibold uppercase text-[#a855f7] transition hover:text-[#d8b4fe]"
                  >
                    {apiKeyVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => updateSetting('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
                <p className="text-xs text-slate-500">Stored locally and used to authenticate requests to your provider.</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={settings.autoOptimize}
                  onChange={(e) => updateSetting('autoOptimize', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-border bg-background text-[#7c3aed]"
                />
                Auto Query Optimization
              </label>
              <label className="rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={settings.autoExplain}
                  onChange={(e) => updateSetting('autoExplain', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-border bg-background text-[#7c3aed]"
                />
                Auto SQL Explanation
              </label>
              <label className="rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={settings.queryValidation}
                  onChange={(e) => updateSetting('queryValidation', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-border bg-background text-[#7c3aed]"
                />
                Query Validation
              </label>
            </div>
          </div>
        </motion.section>

        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Database Settings</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage connection behavior and schema refresh for your database workflows.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              {dbStatus.map((item) => (
                <div key={item.label} className="flex min-w-[140px] items-center gap-3 rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
                  <item.icon className="h-4 w-4 text-[#8b5cf6]" />
                  <div>
                    <p className="font-medium text-foreground">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preferred Database</label>
              <select
                value={settings.preferredDatabase}
                onChange={(e) => updateSetting('preferredDatabase', e.target.value as SettingsState['preferredDatabase'])}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
              >
                <option>PostgreSQL</option>
                <option>MySQL</option>
                <option>SQLite</option>
                <option>SQL Server</option>
                <option>MongoDB</option>
              </select>
              <p className="text-xs text-slate-500">Select the database that best matches your current project scope.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Connection Timeout</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.connectionTimeout}
                  onChange={(e) => updateSetting('connectionTimeout', Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
                <p className="text-xs text-slate-500">Maximum wait time for database responses, measured in seconds.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Query Preview</label>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={settings.queryPreview}
                    onChange={(e) => updateSetting('queryPreview', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-[#7c3aed]"
                  />
                  <span className="text-sm text-foreground">Preview queries before execution</span>
                </div>
                <p className="text-xs text-slate-500">See a final SQL preview before it is executed against your database.</p>
              </div>
            </div>

            <label className="rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.autoSchemaRefresh}
                onChange={(e) => updateSetting('autoSchemaRefresh', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-border bg-background text-[#7c3aed]"
              />
              Auto Schema Refresh
            </label>
            <p className="text-xs text-slate-500">Refresh schema metadata automatically when your database changes.</p>
          </div>
        </motion.section>

        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Protect your workspace with session controls and activity visibility.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {securityStatus.map((item) => (
                <div key={item.label} className="rounded-3xl border border-border bg-card/60 px-4 py-4 text-sm text-foreground">
                  <div className="flex items-center gap-2 text-[#8b5cf6]">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Session Timeout</label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
                <p className="text-xs text-slate-500">Automatically sign users out after inactivity.</p>
              </div>

              <label className="rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={settings.rememberDevice}
                  onChange={(e) => updateSetting('rememberDevice', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-border bg-background text-[#7c3aed]"
                />
                Remember this device
              </label>
              <p className="text-xs text-slate-500">Allow trusted devices to stay logged in longer.</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">SQL Editor Preferences</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Customize how generated queries appear in the editor and preview panels.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {editorOptions.map((option) => (
              <label key={option.key} className="group flex items-center justify-between rounded-3xl border border-border bg-card/60 px-4 py-4 transition hover:border-primary/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{option.key === 'queryFormatting' ? 'Auto-format generated SQL for readability.' : 'Enable this editor preference for SQL workflows.'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(settings as any)[option.key]}
                  onChange={(e) => updateSetting(option.key, e.target.checked)}
                  className="h-5 w-5 rounded border-border bg-background text-[#7c3aed]"
                />
              </label>
            ))}
          </div>
        </motion.section>

        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Choose which product alerts and status updates you receive.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {notificationOptions.map((option) => (
              <label key={option.key} className="flex items-center justify-between rounded-3xl border border-border bg-card/60 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-500">Manage notifications for Genie workflow events.</p>
                </div>
                <input
                  type="checkbox"
                  checked={(settings as any)[option.key]}
                  onChange={(e) => updateSetting(option.key, e.target.checked)}
                  className="h-5 w-5 rounded border-border bg-background text-[#7c3aed]"
                />
              </label>
            ))}
          </div>
        </motion.section>

        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.25 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Usage Analytics</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Quick metrics to understand how Genie is being used.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card/60 px-5 py-5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-primary/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{analytics.queriesGenerated}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">Queries Generated</p>
                </div>
                <Zap className="h-5 w-5 text-[#a855f7]" />
              </div>
              <p className="mt-4 text-xs text-slate-500">+12% from last week</p>
            </div>
            <div className="rounded-3xl border border-border bg-card/60 px-5 py-5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-primary/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{analytics.queriesOptimized}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">Queries Optimized</p>
                </div>
                <Activity className="h-5 w-5 text-[#38bdf8]" />
              </div>
              <p className="mt-4 text-xs text-slate-500">+8% better efficiency</p>
            </div>
            <div className="rounded-3xl border border-border bg-card/60 px-5 py-5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-primary/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{analytics.schemasIndexed}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">Schemas Indexed</p>
                </div>
                <Database className="h-5 w-5 text-[#22c55e]" />
              </div>
              <p className="mt-4 text-xs text-slate-500">Updated as schema scanning runs</p>
            </div>
            <div className="rounded-3xl border border-border bg-card/60 px-5 py-5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-primary/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{analytics.avgResponseTime}s</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">Avg Response Time</p>
                </div>
                <RefreshCcw className="h-5 w-5 text-[#facc15]" />
              </div>
              <p className="mt-4 text-xs text-slate-500">Stable performance trends</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className={cardBase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.3 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-primary">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Light and dark theme preferences for a productive workspace.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Theme</label>
              <select
                value={settings.appearanceTheme}
                onChange={(e) => updateSetting('appearanceTheme', e.target.value as SettingsState['appearanceTheme'])}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
              <p className="text-xs text-slate-500">Choose how Genie appears in the UI.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Font Size</label>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value as SettingsState['fontSize'])}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <p className="text-xs text-slate-500">Adjust the editor and interface font scale across the app.</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className={`${cardBase} border-rose-500/30 bg-[#12060c]/45 dark:bg-[#12060c]/75 shadow-[0_30px_90px_-70px_rgba(220,38,38,0.20)]`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.35 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Danger Zone</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Destructive actions are stored here so you can make changes confidently.</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setModalAction('clearHistory')}
              className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left text-sm font-semibold text-rose-700 dark:text-rose-200 transition hover:bg-rose-500/15"
            >
              Clear Query History
              <span className="block mt-1 text-xs text-muted-foreground">Delete all generated query history from the backend store.</span>
            </button>
            <button
              type="button"
              onClick={() => setModalAction('deleteLogs')}
              className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left text-sm font-semibold text-rose-700 dark:text-rose-200 transition hover:bg-rose-500/15"
            >
              Delete Stored Logs
              <span className="block mt-1 text-xs text-muted-foreground">Remove local browser logs and cached audit data.</span>
            </button>
            <button
              type="button"
              onClick={() => setModalAction('resetSettings')}
              className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left text-sm font-semibold text-rose-700 dark:text-rose-200 transition hover:bg-rose-500/15"
            >
              Reset Settings
              <span className="block mt-1 text-xs text-muted-foreground">Restore Genie settings to their default state.</span>
            </button>
          </div>
        </motion.section>
      </form>

      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full border-t border-border bg-background/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10"
          >
            <div className="mx-auto flex max-w-[1440px] flex-col gap-4 rounded-[28px] border border-border bg-card/95 px-5 py-4 shadow-[0_25px_80px_-50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_80px_-50px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Unsaved Changes</p>
                <p className="text-sm text-muted-foreground">You have unsaved settings changes. Save or discard before navigating away.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="rounded-2xl border border-border bg-secondary/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                  Discard
                </button>
                 <button
                  type="button"
                  onClick={handleSaveAll}
                  className="rounded-2xl bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#d8b4fe] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_36px_-24px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-[32px] border border-border bg-card p-6 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_120px_-70px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">Confirm action</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {modalAction === 'clearHistory' && 'This will permanently clear query history from the backend store. This cannot be undone.'}
                    {modalAction === 'deleteLogs' && 'This will remove any browser-side logs and local audit cache data that Genie has stored.'}
                    {modalAction === 'resetSettings' && 'This will reset all workspace settings back to default values. You can save again after resetting.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={processing}
                  className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_-24px_rgba(239,68,68,0.75)] transition hover:bg-rose-400 disabled:opacity-50"
                >
                  {modalAction === 'clearHistory' && (processing ? 'Clearing...' : 'Clear History')}
                  {modalAction === 'deleteLogs' && 'Delete Logs'}
                  {modalAction === 'resetSettings' && 'Reset Settings'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Settings;
