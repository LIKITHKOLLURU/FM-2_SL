import { useMemo, useState } from 'react'
import { Wallet, CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, StatCard, DataTable, EmptyState, SearchBox } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { money, dateTimeFmt } from '../../utils/format.js'

// Used by /client/payments and /freelancer/payments.
export default function PaymentTracking() {
  const { user, payments, projectById, userById, actions } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(null)
  const [ask, dialog] = useConfirm()
  const isClient = user.role === 'client'

  const mine = useMemo(() => payments.filter((p) => (isClient ? p.clientId : p.freelancerId) === user.id), [payments, user, isClient])
  const rows = mine
    .filter((p) => (!status || p.status === status) && `${projectById(p.projectId)?.title} ${p.description}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
  const sum = (s) => mine.filter((p) => p.status === s).reduce((t, p) => t + p.amount, 0)

  const pay = async (p) => {
    if (!(await ask({ title: 'Release payment?', message: `Pay ${money(p.amount)} to ${userById(p.freelancerId)?.name} for "${projectById(p.projectId)?.title}"? (Simulated, no real funds move.)`, confirmLabel: `Pay ${money(p.amount)}` }))) return
    setBusy(p.id); await actions.payPayment(p.id); setBusy(null)
  }

  return (
    <div>
      <PageHeader title="Payment tracking" subtitle={isClient ? 'Everything you have paid and what is still due.' : 'Your earnings and upcoming payouts.'} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={isClient ? 'Total paid' : 'Total earned'} value={money(sum('paid'))} icon={CheckCircle2} tone="green" />
        <StatCard label={isClient ? 'Amount due' : 'Pending payout'} value={money(sum('pending'))} icon={Clock} tone="amber" />
        <StatCard label="Transactions" value={mine.length} icon={Wallet} />
      </div>

      <div className="mb-4 mt-6 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search by project or description" /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['paid', 'pending', 'refunded']} />
      </div>

      <DataTable rows={rows}
        empty={<EmptyState icon={Wallet} title="No payment records" message={mine.length ? 'No records match your filters.' : 'Payments will show up once a project starts.'} />}
        columns={[
          { header: 'Project', render: (p) => <div className="max-w-xs"><p className="font-medium text-slate-900">{projectById(p.projectId)?.title}</p><p className="text-xs text-slate-500">{p.description}</p></div> },
          { header: isClient ? 'Freelancer' : 'Client', render: (p) => userById(isClient ? p.freelancerId : p.clientId)?.name },
          { header: 'Date', render: (p) => dateTimeFmt(p.date) },
          { header: 'Amount', render: (p) => <b>{money(p.amount)}</b> },
          { header: 'Status', render: (p) => <Badge status={p.status} /> },
          ...(isClient ? [{ header: 'Action', render: (p) => p.status === 'pending' ? <Button size="sm" icon={CreditCard} loading={busy === p.id} onClick={() => pay(p)}>Pay now</Button> : <span className="text-slate-400">—</span> }] : []),
        ]} />
      {dialog}
    </div>
  )
}
