import { useState } from 'react'
import { Wallet, CheckCircle2, Clock, Undo2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, StatCard, DataTable, EmptyState, SearchBox } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { money, dateTimeFmt } from '../../utils/format.js'

export default function PaymentManagement() {
  const { payments, projectById, userById, actions } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [ask, dialog] = useConfirm()

  const sum = (s) => payments.filter((p) => p.status === s).reduce((t, p) => t + p.amount, 0)
  const rows = payments
    .filter((p) => (!status || p.status === status) && `${projectById(p.projectId)?.title} ${userById(p.clientId)?.name} ${userById(p.freelancerId)?.name}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))

  const markPaid = async (p) => { if (await ask({ title: 'Mark as paid?', message: `Record ${money(p.amount)} as paid.`, confirmLabel: 'Mark paid' })) actions.payPayment(p.id) }
  const refund = async (p) => { if (await ask({ title: 'Refund payment?', message: `Refund ${money(p.amount)} to ${userById(p.clientId)?.name}?`, confirmLabel: 'Refund', danger: true })) actions.refundPayment(p.id) }

  return (
    <div>
      <PageHeader title="Payment management" subtitle="Monitor and manage all transactions." />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Paid" value={money(sum('paid'))} icon={CheckCircle2} tone="green" />
        <StatCard label="Pending" value={money(sum('pending'))} icon={Clock} tone="amber" />
        <StatCard label="Refunded" value={money(sum('refunded'))} icon={Undo2} tone="violet" />
        <StatCard label="Transactions" value={payments.length} icon={Wallet} />
      </div>
      <div className="mb-4 mt-6 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search by project, client or freelancer" /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['paid', 'pending', 'refunded']} />
      </div>
      <DataTable rows={rows} empty={<EmptyState icon={Wallet} title="No payment records" message="Adjust the search or filters." />}
        columns={[
          { header: 'Project', render: (p) => <div className="max-w-xs"><p className="font-medium text-slate-900">{projectById(p.projectId)?.title}</p><p className="text-xs text-slate-500">{p.description}</p></div> },
          { header: 'Client', render: (p) => userById(p.clientId)?.name },
          { header: 'Freelancer', render: (p) => userById(p.freelancerId)?.name },
          { header: 'Date', render: (p) => dateTimeFmt(p.date) },
          { header: 'Amount', render: (p) => <b>{money(p.amount)}</b> },
          { header: 'Status', render: (p) => <Badge status={p.status} /> },
          { header: 'Action', render: (p) => p.status === 'pending' ? <Button size="sm" onClick={() => markPaid(p)}>Mark paid</Button> : p.status === 'paid' ? <Button size="sm" variant="secondary" onClick={() => refund(p)}>Refund</Button> : <span className="text-slate-400">—</span> },
        ]} />
      {dialog}
    </div>
  )
}
