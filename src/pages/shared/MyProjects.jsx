import { useState } from 'react'
import { FolderKanban, Calendar, RefreshCw, Wallet } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, EmptyState, Avatar, ProgressBar } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { PROJECT_STATUSES } from '../../services/index.js'
import { money, dateFmt, labelize } from '../../utils/format.js'
import { getCurrentISTDate } from '../../utils/datetime.js'

export function UpdateProjectModal({ project, onClose }) {
  const { actions } = useApp()
  const [status, setStatus] = useState(project.status)
  const [progress, setProgress] = useState(project.progress)
  const [saving, setSaving] = useState(false)
  const locked = status === 'completed' || status === 'not_started'

  const save = async () => {
    setSaving(true)
    const ok = await actions.updateProject(project.id, { status, progress: Number(progress) })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <Modal open onClose={onClose} title="Update project" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={save}>Save update</Button></>}>
      <p className="mb-4 text-sm font-medium text-slate-700">{project.title}</p>
      <div className="space-y-5">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={PROJECT_STATUSES.map((s) => ({ value: s, label: labelize(s) }))} />
        <div>
          <label className="mb-1.5 flex justify-between text-sm font-medium text-slate-700">Progress <span className="text-brand-700">{locked ? (status === 'completed' ? 100 : 0) : progress}%</span></label>
          <input type="range" min="0" max="99" step="5" disabled={locked} value={locked ? 0 : progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-brand-600 disabled:opacity-40" />
          {locked && <p className="mt-1 text-xs text-slate-500">Progress is set automatically for this status.</p>}
        </div>
        {status === 'completed' && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Marking this project as completed will notify the client that the final payment is due.</p>}
      </div>
    </Modal>
  )
}

// Used by both /client/projects and /freelancer/projects.
export default function MyProjects() {
  const { user, projects, payments, userById } = useApp()
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const isFreelancer = user.role === 'freelancer'

  const mine = projects.filter((p) => (isFreelancer ? p.freelancerId === user.id : p.clientId === user.id))
  const rows = mine.filter((p) => !status || p.status === status)

  return (
    <div>
      <PageHeader title="My projects" subtitle={isFreelancer ? 'Update progress so your clients stay informed.' : 'Track the work your freelancers are delivering.'} />
      <div className="mb-5 max-w-xs"><Select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={PROJECT_STATUSES.map((s) => ({ value: s, label: labelize(s) }))} /></div>

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={FolderKanban} title={mine.length ? 'No projects match this status' : 'No projects yet'}
          message={isFreelancer ? 'Once a client accepts your proposal, the project will appear here.' : 'Accept a proposal to automatically create a project.'}
          action={<Button to={isFreelancer ? '/freelancer/jobs' : '/client/proposals'}>{isFreelancer ? 'Browse jobs' : 'Review proposals'}</Button>} /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map((p) => {
            const other = userById(isFreelancer ? p.clientId : p.freelancerId)
            const pays = payments.filter((x) => x.projectId === p.id)
            const paid = pays.filter((x) => x.status === 'paid').reduce((s, x) => s + x.amount, 0)
            const overdue = p.status !== 'completed' && p.dueDate < getCurrentISTDate()
            return (
              <article key={p.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold leading-snug">{p.title}</h3>
                  <Badge status={p.status} />
                </div>
                <div className="mt-3 flex items-center gap-2.5 text-sm">
                  <Avatar name={other?.name} size="sm" />
                  <div><p className="font-medium">{other?.name}</p><p className="text-xs text-slate-500">{isFreelancer ? 'Client' : 'Freelancer'}</p></div>
                </div>
                <ProgressBar value={p.progress} className="mt-5" />
                <dl className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div><dt className="text-xs text-slate-500">Budget</dt><dd className="font-semibold">{money(p.budget)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Paid</dt><dd className="font-semibold text-emerald-600">{money(paid)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Due</dt><dd className={`font-semibold ${overdue ? 'text-red-600' : ''}`}>{dateFmt(p.dueDate)}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Calendar className="h-3.5 w-3.5" />Started {dateFmt(p.startedAt)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" to={`/${user.role}/payments`} icon={Wallet}>Payments</Button>
                    {isFreelancer && <Button size="sm" icon={RefreshCw} onClick={() => setEditing(p)}>Update status</Button>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {editing && <UpdateProjectModal project={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
