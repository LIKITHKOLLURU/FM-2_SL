import { useState } from 'react'
import { Users, Ban, CheckCircle2, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, DataTable, EmptyState, SearchBox, Avatar } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { dateFmt } from '../../utils/format.js'

export default function UserManagement() {
  const { users, user: me, actions } = useApp()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [ask, dialog] = useConfirm()

  const rows = users.filter((u) => (!role || u.role === role) && (!status || u.status === status) && `${u.name} ${u.email} ${u.company}`.toLowerCase().includes(q.trim().toLowerCase()))

  const toggle = async (u) => {
    const suspend = u.status === 'active'
    if (await ask({ title: suspend ? 'Suspend user?' : 'Reactivate user?', message: suspend ? `${u.name} will not be able to sign in until reactivated.` : `${u.name} will be able to sign in again.`, confirmLabel: suspend ? 'Suspend' : 'Reactivate', danger: suspend }))
      actions.setUserStatus(u.id, suspend ? 'suspended' : 'active')
  }
  const remove = async (u) => {
    if (await ask({ title: 'Delete user?', message: `${u.name} and their jobs and proposals will be permanently removed.`, confirmLabel: 'Delete user', danger: true })) actions.deleteUser(u.id)
  }

  return (
    <div>
      <PageHeader title="User management" subtitle={`${users.length} registered accounts.`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search name, email or company" /></div>
        <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="All roles" options={['client', 'freelancer', 'admin']} />
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['active', 'suspended']} />
      </div>
      <DataTable rows={rows} empty={<EmptyState icon={Users} title="No users found" message="Adjust the search or filters." />}
        columns={[
          { header: 'User', render: (u) => <div className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><div><p className="font-medium text-slate-900">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-slate-400">(you)</span>}</p><p className="text-xs text-slate-500">{u.email}</p></div></div> },
          { header: 'Role', render: (u) => <Badge status={u.role} className="capitalize" /> },
          { header: 'Company / Title', render: (u) => u.company || u.title || '—' },
          { header: 'Joined', render: (u) => dateFmt(u.joinedAt) },
          { header: 'Status', render: (u) => <Badge status={u.status} className="capitalize" /> },
          { header: 'Actions', render: (u) => u.role === 'admin' ? <span className="text-slate-400">—</span> : (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={u.status === 'active' ? Ban : CheckCircle2} onClick={() => toggle(u)}>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</Button>
              <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" aria-label="Delete user" onClick={() => remove(u)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ) },
        ]} />
      {dialog}
    </div>
  )
}
