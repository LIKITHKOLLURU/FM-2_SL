import { labelize } from '../../utils/format.js'

const TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
}

const STATUS_TONE = {
  open: 'green', in_progress: 'blue', completed: 'indigo', closed: 'gray',
  pending: 'amber', accepted: 'green', rejected: 'red', withdrawn: 'gray',
  not_started: 'gray', in_review: 'violet', on_hold: 'amber',
  paid: 'green', refunded: 'red',
  active: 'green', suspended: 'red',
  admin: 'violet', client: 'blue', freelancer: 'indigo',
}

export default function Badge({ tone, status, children, className = '' }) {
  const t = TONES[tone || STATUS_TONE[status] || 'gray']
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${t} ${className}`}>
      {children ?? labelize(status)}
    </span>
  )
}
