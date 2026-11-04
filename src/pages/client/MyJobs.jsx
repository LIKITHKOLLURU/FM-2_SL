import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Pencil, Trash2, Eye, XCircle, RotateCcw, PlusCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, DataTable, EmptyState, SearchBox } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { budgetRange, dateFmt } from '../../utils/format.js'

export default function MyJobs() {
  const { user, jobs, proposals, projects, actions } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [ask, dialog] = useConfirm()

  const mine = jobs.filter((j) => j.clientId === user.id)
  const rows = mine.filter((j) => (!status || j.status === status) && j.title.toLowerCase().includes(q.trim().toLowerCase()))

  const remove = async (job) => {
    if (projects.some((p) => p.jobId === job.id)) return actions.deleteJob(job.id) // service explains why it fails
    if (await ask({ title: 'Delete job?', message: `"${job.title}" and all of its proposals will be permanently removed.`, confirmLabel: 'Delete job', danger: true })) actions.deleteJob(job.id)
  }
  const toggle = async (job) => {
    const closing = job.status === 'open'
    if (await ask({ title: closing ? 'Close job?' : 'Reopen job?', message: closing ? 'The job will no longer accept new proposals.' : 'The job will accept proposals again.', confirmLabel: closing ? 'Close job' : 'Reopen' }))
      actions.setJobStatus(job.id, closing ? 'closed' : 'open')
  }

  return (
    <div>
      <PageHeader title="My jobs" subtitle="Manage the jobs you have posted." actions={<Button to="/client/jobs/new" icon={PlusCircle}>Post a job</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search your jobs" /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['open', 'in_progress', 'completed', 'closed']} />
      </div>
      <DataTable rows={rows}
        empty={<EmptyState icon={Briefcase} title={mine.length ? 'No jobs match your filters' : 'You have not posted any jobs'} message="Post a job to start receiving proposals from talented freelancers." action={!mine.length && <Button to="/client/jobs/new">Post your first job</Button>} />}
        columns={[
          { header: 'Job', render: (j) => <div className="max-w-xs"><Link to={`/client/jobs/${j.id}`} className="font-medium text-slate-900 hover:text-brand-700">{j.title}</Link><p className="text-xs text-slate-500">{j.category} · Posted {dateFmt(j.createdAt)}</p></div> },
          { header: 'Budget', render: (j) => budgetRange(j) },
          { header: 'Proposals', render: (j) => <Link className="font-medium text-brand-600 hover:underline" to={`/client/proposals?job=${j.id}`}>{proposals.filter((p) => p.jobId === j.id && p.status !== 'withdrawn').length}</Link> },
          { header: 'Status', render: (j) => <Badge status={j.status} /> },
          { header: 'Actions', render: (j) => (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" to={`/client/jobs/${j.id}`} aria-label="View" title="View"><Eye className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" to={`/client/jobs/${j.id}/edit`} aria-label="Edit" title="Edit"><Pencil className="h-4 w-4" /></Button>
              {(j.status === 'open' || j.status === 'closed') && <Button size="sm" variant="ghost" onClick={() => toggle(j)} title={j.status === 'open' ? 'Close' : 'Reopen'} aria-label="Toggle status">{j.status === 'open' ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}</Button>}
              <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => remove(j)} title="Delete" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ) },
        ]} />
      {dialog}
    </div>
  )
}
