import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Undo2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, DataTable, EmptyState, SearchBox } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { Modal, useConfirm } from '../../components/ui/Modal.jsx'
import { money, dateTimeFmt } from '../../utils/format.js'

export default function MyProposals() {
  const { user, proposals, jobById, userById, actions } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState(null)
  const [ask, dialog] = useConfirm()

  const mine = proposals.filter((p) => p.freelancerId === user.id)
  const rows = mine.filter((p) => (!status || p.status === status) && (jobById(p.jobId)?.title || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const withdraw = async (p) => {
    if (await ask({ title: 'Withdraw proposal?', message: 'The client will no longer see this proposal. You can apply again later.', confirmLabel: 'Withdraw', danger: true })) actions.withdrawProposal(p.id)
  }

  return (
    <div>
      <PageHeader title="My proposals" subtitle="Follow the status of every bid you have submitted." actions={<Button to="/freelancer/jobs" icon={Send}>Find more jobs</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search by job title" /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['pending', 'accepted', 'rejected', 'withdrawn']} />
      </div>
      <DataTable rows={rows}
        empty={<EmptyState icon={Send} title={mine.length ? 'No proposals match your filters' : 'No proposals yet'} message="Browse open jobs and send your first proposal." action={!mine.length && <Button to="/freelancer/jobs">Browse jobs</Button>} />}
        columns={[
          { header: 'Job', render: (p) => <div className="max-w-xs"><Link className="font-medium hover:text-brand-700" to={`/freelancer/jobs/${p.jobId}`}>{jobById(p.jobId)?.title || 'Deleted job'}</Link><p className="text-xs text-slate-500">{userById(jobById(p.jobId)?.clientId)?.company}</p></div> },
          { header: 'My bid', render: (p) => <b>{money(p.amount)}</b> },
          { header: 'Delivery', render: (p) => `${p.deliveryDays} days` },
          { header: 'Submitted', render: (p) => dateTimeFmt(p.createdAt) },
          { header: 'Status', render: (p) => <Badge status={p.status} /> },
          { header: 'Actions', render: (p) => (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setView(p)}>View</Button>
              {p.status === 'pending' && <Button size="sm" variant="ghost" icon={Undo2} className="!text-red-600 hover:!bg-red-50" onClick={() => withdraw(p)}>Withdraw</Button>}
              {p.status === 'accepted' && <Button size="sm" variant="soft" to="/freelancer/projects">Project</Button>}
            </div>
          ) },
        ]} />

      <Modal open={!!view} onClose={() => setView(null)} title="Proposal details" footer={<Button variant="secondary" onClick={() => setView(null)}>Close</Button>}>
        {view && (
          <div className="space-y-4 text-sm">
            <p className="font-semibold">{jobById(view.jobId)?.title}</p>
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3">
              <div><p className="text-xs text-slate-500">Bid</p><b>{money(view.amount)}</b></div>
              <div><p className="text-xs text-slate-500">Delivery</p><b>{view.deliveryDays} days</b></div>
              <div><p className="text-xs text-slate-500">Status</p><Badge status={view.status} /></div>
            </div>
            <div><p className="mb-1 text-xs font-semibold uppercase text-slate-500">Cover letter</p><p className="whitespace-pre-line leading-relaxed text-slate-700">{view.coverLetter}</p></div>
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  )
}
