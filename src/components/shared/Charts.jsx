import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { money } from '../../utils/format.js'
import { istMonthKey, formatMonthKey } from '../../utils/datetime.js'

const COLORS = ['#4f46e5', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
    </div>
  )
}

export function MoneyBars({ data, dataKey = 'amount' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#eef2ff' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <Bar dataKey={dataKey} fill="#4f46e5" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ data }) {
  const filtered = data.filter((d) => d.value > 0)
  if (!filtered.length) return <div className="flex h-full items-center justify-center text-sm text-slate-400">No data yet</div>
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Groups payments by IST calendar month (e.g. "Nov 26") for paid totals.
export function paymentsByMonth(payments, status = 'paid') {
  const map = new Map()
  payments.filter((p) => p.status === status && p.date).forEach((p) => {
    const key = istMonthKey(p.date)
    map.set(key, (map.get(key) || 0) + p.amount)
  })
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, amount]) => ({ name: formatMonthKey(k), amount }))
}
