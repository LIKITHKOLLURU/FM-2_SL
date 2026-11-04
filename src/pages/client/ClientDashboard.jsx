import { Link } from 'react-router-dom'
import { Briefcase, Inbox, FolderKanban, Wallet, PlusCircle, ArrowRight } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, StatCard, DataTable, EmptyState, Avatar, ProgressBar } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { ChartCard, MoneyBars, DonutChart, paymentsByMonth } from '../../components/shared/Charts.jsx'
import { money, dateFmt } from '../../utils/format.js'

export default function ClientDashboard() {
  const { user, jobs, proposals, projects, payments, userById, jobById } = useApp()
  const myJobs = jobs.filter((j) => j.clientId === user.id)
  const myJobIds = myJobs.map((j) => j.id)
  const pending = proposals.filter((p) => myJobIds.includes(p.jobId) && p.status === 'pending')
  const myProjects = projects.filter((p) => p.clientId === user.id)
  const myPayments = payments.filter((p) => p.clientId === user.id)
  const paid = myPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const due = myPayments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  const jobStatus = ['open', 'in_progress', 'completed', 'closed'].map((s) => ({ name: s.replace('_', ' '), value: myJobs.filter((j) => j.status === s).length }))

  return (
    <div>
      <PageHeader title="Client dashboard" subtitle="Your hiring activity at a glance."
        actions={<Button to="/client/jobs/new" icon={PlusCircle}>Post a job</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jobs posted" value={myJobs.length} icon={Briefcase} hint={`${myJobs.filter((j) => j.status === 'open').length} open`} />
        <StatCard label="Pending proposals" value={pending.length} icon={Inbox} tone="amber" hint="Awaiting your review" />
        <StatCard label="Active projects" value={myProjects.filter((p) => p.status !== 'completed').length} icon={FolderKanban} tone="blue" hint={`${myProjects.length} total`} />
        <StatCard label="Total paid" value={money(paid)} icon={Wallet} tone="green" hint={`${money(due)} still due`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartCard title="Spending by month" subtitle="Paid amounts"><MoneyBars data={paymentsByMonth(myPayments)} /></ChartCard></div>
        <ChartCard title="Jobs by status"><DonutChart data={jobStatus} /></ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Latest proposals</h2><Link to="/client/proposals" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">View all <ArrowRight className="h-4 w-4" /></Link></div>
          <DataTable rows={pending.slice(0, 5)} empty={<EmptyState icon={Inbox} title="No pending proposals" message="New proposals will appear here." />}
            columns={[
              { header: 'Freelancer', render: (p) => <div className="flex items-center gap-2"><Avatar name={userById(p.freelancerId)?.name} size="sm" /><span className="font-medium">{userById(p.freelancerId)?.name}</span></div> },
              { header: 'Job', render: (p) => <span className="line-clamp-1 max-w-[12rem]">{jobById(p.jobId)?.title}</span> },
              { header: 'Bid', render: (p) => <b>{money(p.amount)}</b> },
            ]} />
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Active projects</h2><Link to="/client/projects" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">View all <ArrowRight className="h-4 w-4" /></Link></div>
          <DataTable rows={myProjects.filter((p) => p.status !== 'completed').slice(0, 5)} empty={<EmptyState icon={FolderKanban} title="No active projects" message="Accept a proposal to start a project." />}
            columns={[
              { header: 'Project', render: (p) => <span className="line-clamp-1 max-w-[12rem] font-medium">{p.title}</span> },
              { header: 'Status', render: (p) => <Badge status={p.status} /> },
              { header: 'Progress', className: 'min-w-[8rem]', render: (p) => <ProgressBar value={p.progress} /> },
            ]} />
        </section>
      </div>
      <p className="mt-6 text-xs text-slate-400">Latest activity: {dateFmt(myJobs[0]?.createdAt)}</p>
    </div>
  )
}
