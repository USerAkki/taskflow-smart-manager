import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  LogOut, Zap, ChevronRight, Shield, User, Moon, Sun
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,    label: 'Projects' },
  { to: '/tasks',     icon: CheckSquare,     label: 'All Tasks' }
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('tf_theme') || 'dark')

  const handleLogout = () => { logout(); navigate('/login') }

  useEffect(() => {
    localStorage.setItem('tf_theme', theme)
    document.documentElement.classList.toggle('theme-light', theme === 'light')
  }, [theme])

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#111520] border-r border-[#1e2535]">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-[#1e2535]">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center pulse-ring">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight">TaskFlow</div>
            <div className="text-slate-500 text-[10px]">Smart Execution</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  {label}
                  {isActive && <ChevronRight size={12} className="ml-auto text-brand-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-[#1e2535]">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#1a1f2e] text-slate-400 hover:text-slate-200 border border-[#2d3748] transition-all"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1f2e]">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              {user?.role === 'admin'
                ? <Shield size={12} className="text-brand-400" />
                : <User size={12} className="text-slate-400" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200 text-xs font-medium truncate">{user?.name}</div>
              <div className="text-slate-500 text-[10px] capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

