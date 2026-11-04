import { Link } from 'react-router-dom'

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 shadow-pop">
        <svg viewBox="0 0 32 32" className="h-5 w-5"><path d="M10 9h12v3.5H14v3h7v3.5h-7V24h-4z" fill="#fff" /></svg>
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>Freelance<span className={light ? 'text-brand-300' : 'text-brand-600'}>Hub</span></span>
    </Link>
  )
}
