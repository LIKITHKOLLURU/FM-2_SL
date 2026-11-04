import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Home } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { NAV, roleHome } from '../../utils/navigation.js'
import { Avatar } from '../ui/Display.jsx'
import Badge from '../ui/Badge.jsx'
import Logo from './Logo.jsx'
import { useEffect } from 'react'
import { useISTClock } from '../../hooks/useISTClock.js'

function SidebarContent({ role, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
      {NAV[role].map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function DashboardLayout() {
  const { user, actions } = useApp()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const clock = useISTClock()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const logout = async () => { await actions.logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-6"><Logo to={roleHome(user.role)} /></div>
        <SidebarContent role={user.role} />
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <Badge status={user.role} className="mt-0.5 capitalize" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="fade-up absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <Logo to={roleHome(user.role)} />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <SidebarContent role={user.role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="hidden text-sm text-slate-500 lg:block">Welcome back, <span className="font-semibold text-slate-900">{user.name.split(' ')[0]}</span></div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="mr-1 hidden text-right leading-tight sm:block" title="Indian Standard Time (UTC+05:30)">
              <p className="text-xs font-semibold text-slate-700">{clock.time}</p>
              <p className="text-[11px] text-slate-500">{clock.date}</p>
            </div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"><Home className="h-4 w-4" /><span className="hidden sm:inline">Home</span></button>
            <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><div className="fade-up"><Outlet /></div></main>
      </div>
    </div>
  )
}
