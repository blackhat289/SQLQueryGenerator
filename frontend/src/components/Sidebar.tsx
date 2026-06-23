import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Terminal, UploadCloud, History, Settings, User } from 'lucide-react'

export const Sidebar: React.FC = () => {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/generator', label: 'SQL Generator', icon: Terminal },
    { to: '/upload', label: 'Schema Explorer', icon: UploadCloud },
    { to: '/history', label: 'History', icon: History },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-card/10 shrink-0 min-h-[calc(100vh-4rem)] p-4">
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 glow-hover'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md flex justify-around py-2 px-1 shadow-2xl">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

export default Sidebar;
