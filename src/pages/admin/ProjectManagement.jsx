import { useState } from 'react'
import { FolderKanban, RefreshCw } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, DataTable, EmptyState, SearchBox, ProgressBar } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { UpdateProjectModal } from '../shared/MyProjects.jsx'
import { PROJECT_STATUSES } from '../../services/index.js'
import { money, dateFmt, labelize } from '../../utils/format.js'

export default function ProjectManagement() {
  const { projects, userById } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)

  const rows = projects.filter((p) => (!status || p.status === status) && p.title.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div>
      <PageHeader title="Project management" subtitle={`${projects.length} projects across the platform.`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search projects" /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={PROJECT_STATUSES.map((s) => ({ value: s, label: labelize(s) }))} />
      </div>
      <DataTable rows={rows} empty={<EmptyState icon={FolderKanban} title="No projects found" message="Projects are created when a client accepts a proposal." />}
        columns={[
          { header: 'Project', render: (p) => <span className="block max-w-xs font-medium text-slate-900">{p.title}</span> },
          { header: 'Client', render: (p) => userById(p.clientId)?.name },
          { header: 'Freelancer', render: (p) => userById(p.freelancerId)?.name },
          { header: 'Budget', render: (p) => <b>{money(p.budget)}</b> },
          { header: 'Progress', className: 'min-w-[9rem]', render: (p) => <ProgressBar value={p.progress} /> },
          { header: 'Due', render: (p) => dateFmt(p.dueDate) },
          { header: 'Status', render: (p) => <Badge status={p.status} /> },
          { header: 'Action', render: (p) => <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setEditing(p)}>Update</Button> },
        ]} />
      {editing && <UpdateProjectModal project={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
