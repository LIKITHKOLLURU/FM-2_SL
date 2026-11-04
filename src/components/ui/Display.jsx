import { Loader2, Inbox } from 'lucide-react'
import { initials } from '../../utils/format.js'

export function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-500 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50"><Icon className="h-7 w-7 text-brand-600" /></div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return <EmptyState title="We hit a snag" message={message} action={onRetry && <button onClick={onRetry} className="text-sm font-medium text-brand-600 hover:underline">Try again</button>} />
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, hint, tone = 'indigo' }) {
  const tones = { indigo: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600' }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div>}
      </div>
    </div>
  )
}

export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' }
  const palette = ['from-indigo-500 to-violet-500', 'from-violet-500 to-fuchsia-500', 'from-sky-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500']
  const idx = [...(name || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${palette[idx]} ${sizes[size]} ${className}`} aria-hidden="true">
      {initials(name)}
    </div>
  )
}

export function ProgressBar({ value, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium text-slate-600">{value}%</span>
    </div>
  )
}

export function SkillTags({ skills = [], max = 6 }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.slice(0, max).map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s}</span>)}
      {skills.length > max && <span className="px-1 text-xs text-slate-400">+{skills.length - max}</span>}
    </div>
  )
}

export function DataTable({ columns, rows, rowKey = 'id', empty }) {
  if (!rows.length) return <div className="card">{empty}</div>
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>{columns.map((c) => <th key={c.header} className={`th ${c.className || ''}`}>{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r[rowKey]} className="transition hover:bg-slate-50/70">
                {columns.map((c) => <td key={c.header} className={`td ${c.className || ''}`}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  )
}
