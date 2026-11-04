import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { roleHome } from '../../utils/navigation.js'
import Button from '../ui/Button.jsx'
import Logo from './Logo.jsx'
import Footer from './Footer.jsx'

export default function PublicLayout() {
  const { user } = useApp()
  const { pathname, hash } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(false)
    // In-page anchors (e.g. /#how-it-works) scroll to their section; other navigations start at the top.
    const target = hash && document.getElementById(hash.slice(1))
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  const link = ({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
              <NavLink to="/jobs" className={link}>Find Jobs</NavLink>
              <Link to="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">How it works</Link>
              <Link to="/#categories" className="text-sm font-medium text-slate-600 hover:text-slate-900">Categories</Link>
            </nav>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {user ? <Button to={roleHome(user.role)}>Go to dashboard</Button> : (
              <>
                <Button to="/login" variant="ghost">Log in</Button>
                <Button to="/register">Get started</Button>
              </>
            )}
          </div>
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-slate-100 bg-white px-4 py-3 md:hidden">
            <Link to="/jobs" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Find Jobs</Link>
            {user ? <Link to={roleHome(user.role)} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">Go to dashboard</Link> : (
              <>
                <Link to="/login" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Log in</Link>
                <Link to="/register" className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">Get started</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <Footer />
    </div>
  )
}
