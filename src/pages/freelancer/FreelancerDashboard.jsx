import { Link } from 'react-router-dom'
import { Send, FolderKanban, Wallet, Clock, ArrowRight, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, StatCard, DataTable, EmptyState, ProgressBar } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import JobCard from '../../components/shared/JobCard.jsx'
import { ChartCard, MoneyBars, DonutChart, paymentsByMonth } from '../../components/shared/Charts.jsx'
import { money, dateFmt } from '../../utils/format.js'

export default function FreelancerDashboard() {
  const { user, jobs, proposals, projects, payments, userById } = useApp()
  const mineProps = proposals.filter((p) => p.freelancerId === user.id)
  const myProjects = projects.filter((p) => p.freelancerId === user.id)
  const myPays = payments.filter((p) => p.freelancerId === user.id)
  const earned = myPays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pending = myPays.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  const appliedIds = new Set(mineProps.map((p) => p.jobId))
  const recommended = jobs.filter((j) => j.status === 'open' && !appliedIds.has(j.id))
    .map((j) => ({ j, score: j.skills.filter((s) => user.skills.some((u) => u.toLowerCase() === s.toLowerCase())).length }))
    .sort((a, b) => b.score - a.score || b.j.createdAt.localeCompare(a.j.createdAt)).slice(0, 2).map((x) => x.j)

  const propStatus = ['pending', 'accepted', 'rejected'].map((s) => ({ name: s, value: mineProps.filter((p) => p.status === s).length }))

  return (
    <div>
      <PageHeader title="Freelancer dashboard" subtitle="Track proposals, projects and earnings." actions={<Button to="/freelancer/jobs" icon={Search}>Browse jobs</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Proposals sent" value={mineProps.length} icon={Send} hint={`${mineProps.filter((p) => p.status === 'pending').length} pending`} />
        <StatCard label="Active projects" value={myProjects.filter((p) => p.status !== 'completed').length} icon={FolderKanban} tone="blue" hint={`${myProjects.filter((p) => p.status === 'completed').length} completed`} />
        <StatCard label="Total earned" value={money(earned)} icon={Wallet} tone="green" />
        <StatCard label="Pending payout" value={money(pending)} icon={Clock} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartCard title="Earnings by month" subtitle="Paid amounts"><MoneyBars data={paymentsByMonth(myPays)} /></ChartCard></div>
        <ChartCard title="Proposal outcomes"><DonutChart data={propStatus} /></ChartCard>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Active projects</h2><Link to="/freelancer/projects" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Manage <ArrowRight className="h-4 w-4" /></Link></div>
        <DataTable rows={myProjects.filter((p) => p.status !== 'completed')} empty={<EmptyState icon={FolderKanban} title="No active projects" message="Win a proposal to start your next project." />}
          columns={[
            { header: 'Project', render: (p) => <span className="font-medium">{p.title}</span> },
            { header: 'Client', render: (p) => userById(p.clientId)?.name },
            { header: 'Status', render: (p) => <Badge status={p.status} /> },
            { header: 'Progress', className: 'min-w-[10rem]', render: (p) => <ProgressBar value={p.progress} /> },
            { header: 'Due', render: (p) => dateFmt(p.dueDate) },
          ]} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Recommended for you</h2>
        {recommended.length === 0 ? <div className="card"><EmptyState title="You are all caught up" message="No new open jobs to recommend right now." /></div> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recommended.map((j) => <JobCard key={j.id} job={j} client={userById(j.clientId)} to={`/freelancer/jobs/${j.id}`} proposalCount={j.proposalCount} />)}
          </div>
        )}
      </section>
    </div>
  )
}
