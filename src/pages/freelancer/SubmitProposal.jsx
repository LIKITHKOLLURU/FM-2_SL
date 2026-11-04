import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, EmptyState, SkillTags } from '../../components/ui/Display.jsx'
import { Input, Textarea } from '../../components/ui/Form.jsx'
import Button from '../../components/ui/Button.jsx'
import { validateProposal } from '../../utils/validators.js'
import { budgetRange, money } from '../../utils/format.js'

export default function SubmitProposal() {
  const { id } = useParams()
  const { user, jobs, proposals, actions, userById, booting } = useApp()
  const navigate = useNavigate()
  const job = jobs.find((j) => j.id === id)
  const [form, setForm] = useState({ amount: '', deliveryDays: '', coverLetter: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  if (booting) return null
  if (!job) return <div className="card"><EmptyState title="Job not found" action={<Button to="/freelancer/jobs">Browse jobs</Button>} /></div>
  const already = proposals.some((p) => p.jobId === job.id && p.freelancerId === user.id && p.status !== 'withdrawn')
  if (job.status !== 'open' || already)
    return <div className="card"><EmptyState title={already ? 'You already applied to this job' : 'This job is closed to new proposals'} action={<Button to={already ? '/freelancer/proposals' : '/freelancer/jobs'}>{already ? 'View my proposals' : 'Browse jobs'}</Button>} /></div>

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }) }
  const submit = async (e) => {
    e.preventDefault()
    const errs = validateProposal(form, job)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const ok = await actions.submitProposal(user.id, { jobId: job.id, ...form })
    setSaving(false)
    if (ok) navigate('/freelancer/proposals')
  }

  const fee = Number(form.amount) * 0.1
  return (
    <div className="mx-auto max-w-4xl">
      <Link to={`/freelancer/jobs/${job.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" />Back to job</Link>
      <PageHeader title="Submit a proposal" subtitle="Stand out with a clear, tailored offer." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} noValidate className="card space-y-5 p-6 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Your proposed budget (USD)" required type="number" min="1" value={form.amount} onChange={set('amount')} error={errors.amount} hint={`Client budget: ${budgetRange(job)}`} />
            <Input label="Delivery time (days)" required type="number" min="1" value={form.deliveryDays} onChange={set('deliveryDays')} error={errors.deliveryDays} />
          </div>
          <Textarea label="Cover letter" required rows={9} value={form.coverLetter} onChange={set('coverLetter')} error={errors.coverLetter} hint={`${form.coverLetter.trim().length} characters (minimum 50)`} placeholder="Introduce yourself, explain why you are a great fit and outline your approach…" />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button variant="secondary" to={`/freelancer/jobs/${job.id}`}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit proposal</Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applying for</p>
            <h2 className="mt-2 font-semibold leading-snug">{job.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{userById(job.clientId)?.company}</p>
            <div className="mt-3"><SkillTags skills={job.skills} /></div>
          </div>
          <div className="card p-5 text-sm">
            <p className="mb-3 font-semibold">Earnings estimate</p>
            <div className="flex justify-between py-1"><span className="text-slate-500">Your bid</span><b>{money(form.amount)}</b></div>
            <div className="flex justify-between py-1"><span className="text-slate-500">Platform fee (10%)</span><span>-{money(fee)}</span></div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-500">You receive</span><b className="text-emerald-600">{money(Number(form.amount) - fee)}</b></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
