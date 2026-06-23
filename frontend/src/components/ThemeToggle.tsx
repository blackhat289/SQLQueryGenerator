import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-muted/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/45"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-violet-600" />
      )}
    </button>
  )
}

export default ThemeToggle;
