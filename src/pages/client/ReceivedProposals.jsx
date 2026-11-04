import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Inbox, Check, X, Clock, DollarSign, Filter } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, EmptyState, Avatar, SkillTags } from '../../components/ui/Display.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Form.jsx'
import { useConfirm } from '../../components/ui/Modal.jsx'
import { money, dateTimeFmt } from '../../utils/format.js'

export default function ReceivedProposals() {
  const { user, jobs, proposals, userById, jobById, actions } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(null)
  const [ask, dialog] = useConfirm()
  const jobFilter = params.get('job') || ''

  const myJobs = jobs.filter((j) => j.clientId === user.id)
  const myIds = myJobs.map((j) => j.id)
  const rows = proposals
    .filter((p) => myIds.includes(p.jobId) && p.status !== 'withdrawn' && (!jobFilter || p.jobId === jobFilter) && (!status || p.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const accept = async (p) => {
    const f = userById(p.freelancerId)
    if (!(await ask({ title: 'Accept this proposal?', message: `${f.name} will be hired for ${money(p.amount)}. All other pending proposals for this job will be declined and a project will be created.`, confirmLabel: 'Accept & start project' }))) return
    setBusy(p.id)
    const project = await actions.acceptProposal(p.id)
    setBusy(null)
    if (project) navigate('/client/projects')
  }
  const reject = async (p) => {
    if (!(await ask({ title: 'Reject proposal?', message: `Reject the proposal from ${userById(p.freelancerId).name}?`, confirmLabel: 'Reject', danger: true }))) return
    setBusy(p.id); await actions.rejectProposal(p.id); setBusy(null)
  }

  return (
    <div>
      <PageHeader title="Received proposals" subtitle="Review bids from freelancers and hire the best fit." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Select aria-label="Filter by job" value={jobFilter} onChange={(e) => (e.target.value ? setParams({ job: e.target.value }) : setParams({}))} placeholder="All jobs" options={myJobs.map((j) => ({ value: j.id, label: j.title }))} />
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['pending', 'accepted', 'rejected']} />
      </div>

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={jobFilter || status ? Filter : Inbox} title="No proposals found" message="Proposals from freelancers will appear here once they respond to your jobs." action={<Button to="/client/jobs/new" variant="secondary">Post a job</Button>} /></div>
      ) : (
        <div className="space-y-4">
          {rows.map((p) => {
            const f = userById(p.freelancerId)
            const job = jobById(p.jobId)
            return (
              <article key={p.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar name={f?.name} size="lg" />
                    <div>
                      <p className="text-lg font-semibold">{f?.name}</p>
                      <p className="text-sm text-slate-500">{f?.title} {f?.location && `· ${f.location}`}</p>
                      <div className="mt-2"><SkillTags skills={f?.skills} max={4} /></div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold">{money(p.amount)}</p>
                    <p className="inline-flex items-center gap-1 text-sm text-slate-500"><Clock className="h-3.5 w-3.5" />{p.deliveryDays} days</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">For <Link className="font-medium text-brand-600 hover:underline" to={`/client/jobs/${job?.id}`}>{job?.title}</Link> · Submitted {dateTimeFmt(p.createdAt)}</p>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{p.coverLetter}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Badge status={p.status} />
                  {p.status === 'pending' && job?.status === 'open' && (
                    <div className="flex gap-2">
                      <Button variant="secondary" icon={X} loading={busy === p.id} onClick={() => reject(p)}>Reject</Button>
                      <Button variant="success" icon={Check} loading={busy === p.id} onClick={() => accept(p)}>Accept proposal</Button>
                    </div>
                  )}
                  {p.status === 'accepted' && <Button to="/client/projects" variant="soft" size="sm"><DollarSign className="h-4 w-4" />View project</Button>}
                </div>
              </article>
            )
          })}
        </div>
      )}
      {dialog}
    </div>
  )
}
