import { Users, Briefcase, FolderKanban, Wallet, RotateCcw, TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, StatCard, DataTable, Avatar } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { ChartCard, MoneyBars, DonutChart, paymentsByMonth } from '../../components/shared/Charts.jsx'
import { money, dateFmt } from '../../utils/format.js'

export default function AdminDashboard() {
  const { users, jobs, projects, payments, proposals, actions } = useApp()
  const [ask, dialog] = useConfirm()
  const volume = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const byRole = ['client', 'freelancer'].map((r) => ({ name: r + 's', value: users.filter((u) => u.role === r).length }))
  const byProject = ['not_started', 'in_progress', 'in_review', 'on_hold', 'completed'].map((s) => ({ name: s.replace('_', ' '), value: projects.filter((p) => p.status === s).length }))
  const recent = [...users].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 5)

  const reset = async () => {
    if (await ask({ title: 'Reset demo data?', message: 'All changes will be discarded and the original demo data restored. You will stay signed in.', confirmLabel: 'Reset data', danger: true })) actions.resetDemo()
  }

  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="Platform health and activity overview."
        actions={<Button variant="secondary" icon={RotateCcw} onClick={reset}>Reset demo data</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={Users} hint={`${users.filter((u) => u.status === 'suspended').length} suspended`} />
        <StatCard label="Jobs" value={jobs.length} icon={Briefcase} tone="violet" hint={`${jobs.filter((j) => j.status === 'open').length} open · ${proposals.length} proposals`} />
        <StatCard label="Projects" value={projects.length} icon={FolderKanban} tone="blue" hint={`${projects.filter((p) => p.status === 'completed').length} completed`} />
        <StatCard label="Payment volume" value={money(volume)} icon={Wallet} tone="green" hint={`${money(pending)} pending`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartCard title="Platform revenue flow" subtitle="Paid volume by month"><MoneyBars data={paymentsByMonth(payments)} /></ChartCard></div>
        <ChartCard title="Users by role"><DonutChart data={byRole} /></ChartCard>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Projects by status"><DonutChart data={byProject} /></ChartCard>
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><TrendingUp className="h-5 w-5 text-brand-600" />Newest members</h2>
          <DataTable rows={recent} columns={[
            { header: 'User', render: (u) => <div className="flex items-center gap-2"><Avatar name={u.name} size="sm" /><div><p className="font-medium">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div> },
            { header: 'Role', render: (u) => <Badge status={u.role} className="capitalize" /> },
            { header: 'Joined', render: (u) => dateFmt(u.joinedAt) },
          ]} />
        </section>
      </div>
      {dialog}
    </div>
  )
}
