import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Trash2, XCircle, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, DataTable, EmptyState, SearchBox } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { CATEGORIES } from '../../data/seed.js'
import { budgetRange, dateFmt } from '../../utils/format.js'

export default function JobManagement() {
  const { jobs, proposals, userById, actions } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [ask, dialog] = useConfirm()

  const rows = jobs.filter((j) => (!status || j.status === status) && (!category || j.category === category) && j.title.toLowerCase().includes(q.trim().toLowerCase()))

  const remove = async (j) => {
    if (await ask({ title: 'Delete job?', message: `"${j.title}" and its proposals will be permanently removed.`, confirmLabel: 'Delete job', danger: true })) actions.deleteJob(j.id)
  }
  const toggle = async (j) => {
    const close = j.status === 'open'
    if (await ask({ title: close ? 'Close job?' : 'Reopen job?', message: close ? 'Freelancers will no longer be able to apply.' : 'Freelancers will be able to apply again.', confirmLabel: close ? 'Close job' : 'Reopen' })) actions.setJobStatus(j.id, close ? 'closed' : 'open')
  }

  return (
    <div>
      <PageHeader title="Job management" subtitle={`${jobs.length} jobs on the platform.`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search jobs" /></div>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All categories" options={CATEGORIES} />
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['open', 'in_progress', 'completed', 'closed']} />
      </div>
      <DataTable rows={rows} empty={<EmptyState icon={Briefcase} title="No jobs found" message="Adjust the search or filters." />}
        columns={[
          { header: 'Job', render: (j) => <div className="max-w-xs"><Link to={`/jobs/${j.id}`} className="font-medium text-slate-900 hover:text-brand-700">{j.title}</Link><p className="text-xs text-slate-500">{j.category}</p></div> },
          { header: 'Client', render: (j) => userById(j.clientId)?.name },
          { header: 'Budget', render: (j) => budgetRange(j) },
          { header: 'Proposals', render: (j) => proposals.filter((p) => p.jobId === j.id && p.status !== 'withdrawn').length },
          { header: 'Posted', render: (j) => dateFmt(j.createdAt) },
          { header: 'Status', render: (j) => <Badge status={j.status} /> },
          { header: 'Actions', render: (j) => (
            <div className="flex gap-1">
              {(j.status === 'open' || j.status === 'closed') && <Button size="sm" variant="secondary" icon={j.status === 'open' ? XCircle : RotateCcw} onClick={() => toggle(j)}>{j.status === 'open' ? 'Close' : 'Reopen'}</Button>}
              <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" aria-label="Delete job" onClick={() => remove(j)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ) },
        ]} />
      {dialog}
    </div>
  )
}
