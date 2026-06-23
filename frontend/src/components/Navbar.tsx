import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Network, Settings as SettingsIcon, LogOut, User as UserIcon } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from './AuthContext'
import api from '../services/api'
import { SchemaStatus } from '../types'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const [status, setStatus] = useState<SchemaStatus | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await api.get<SchemaStatus>('/status')
      setStatus(response.data)
    } catch (err) {
      console.error('Failed to load active schema status in Navbar', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchStatus()
    }

    // Listen to custom schema-updated events to refresh table counters
    window.addEventListener('schema-updated', fetchStatus)
    return () => {
      window.removeEventListener('schema-updated', fetchStatus)
    }
  }, [user])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400 font-extrabold tracking-wide">
              Genie
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border ml-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              status?.rag_status === 'Loaded'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
            }`}>
              <Network className="h-3.5 w-3.5" />
              <span>RAG: {status?.rag_status || 'Pending'}</span>
            </div>
            {status?.tables_count !== undefined && status.tables_count > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400 animate-fade-in">
                <Database className="h-3.5 w-3.5" />
                <span>{status.tables_count} Tables Active</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <ThemeToggle />
          <Link
            to="/settings"
            className="p-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-muted/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/45"
            title="Settings"
          >
            <SettingsIcon className="h-4.5 w-4.5" />
          </Link>

          {user && (
            <div className="relative group">
              <button className="flex items-center gap-2 focus:outline-none">
                <div className="h-9.5 w-9.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary font-sans text-sm hover:bg-primary/15 transition-all duration-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block hover:block z-50">
                <div className="bg-card border border-border rounded-xl shadow-xl p-1.5 animate-fade-in">
                  <div className="px-3 py-2.5 border-b border-border/80 mb-1 text-left">
                    <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-lg transition-colors text-left"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg font-semibold transition-colors mt-0.5 text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar;
