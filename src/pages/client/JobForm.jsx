import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, EmptyState } from '../../components/ui/Display.jsx'
import { Input, Select, Textarea, TagInput } from '../../components/ui/Form.jsx'
import Button from '../../components/ui/Button.jsx'
import { CATEGORIES, EXPERIENCE_LEVELS } from '../../data/seed.js'
import { validateJob } from '../../utils/validators.js'

const BLANK = { title: '', description: '', category: '', budgetMin: '', budgetMax: '', duration: '', experience: 'Intermediate', skills: [] }

// Handles both "Post Job" (/client/jobs/new) and "Edit Job" (/client/jobs/:id/edit).
export default function JobForm() {
  const { id } = useParams()
  const { user, jobs, actions, booting } = useApp()
  const navigate = useNavigate()
  const existing = id ? jobs.find((j) => j.id === id) : null
  const [form, setForm] = useState(() => (existing ? { ...BLANK, ...existing } : BLANK))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  if (id && !booting && (!existing || existing.clientId !== user.id))
    return <div className="card"><EmptyState title="Job not found" message="You can only edit jobs you posted." action={<Button to="/client/jobs">Back to my jobs</Button>} /></div>

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }) }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateJob(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const payload = { title: form.title.trim(), description: form.description.trim(), category: form.category, budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax), duration: form.duration.trim(), experience: form.experience, skills: form.skills }
    const result = existing ? await actions.updateJob(existing.id, payload) : await actions.createJob(user.id, payload)
    setSaving(false)
    if (result) navigate('/client/jobs')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={existing ? 'Edit job' : 'Post a job'} subtitle={existing ? 'Update the details of your job listing.' : 'Describe your project to attract the right freelancers.'} />
      <form onSubmit={submit} noValidate className="card space-y-5 p-6">
        <Input label="Job title" required value={form.title} onChange={set('title')} error={errors.title} placeholder="e.g. Build a responsive marketing website" maxLength={120} />
        <Textarea label="Description" required rows={8} value={form.description} onChange={set('description')} error={errors.description} hint={`${form.description.trim().length} characters (minimum 50)`} placeholder="Describe the scope, deliverables and any requirements…" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Category" required value={form.category} onChange={set('category')} error={errors.category} options={CATEGORIES} placeholder="Select a category" />
          <Select label="Experience level" value={form.experience} onChange={set('experience')} options={EXPERIENCE_LEVELS} />
          <Input label="Minimum budget (USD)" required type="number" min="0" value={form.budgetMin} onChange={set('budgetMin')} error={errors.budgetMin} />
          <Input label="Maximum budget (USD)" required type="number" min="0" value={form.budgetMax} onChange={set('budgetMax')} error={errors.budgetMax} />
          <Input label="Expected duration" required value={form.duration} onChange={set('duration')} error={errors.duration} placeholder="e.g. 3-4 weeks" className="sm:col-span-2" />
        </div>
        <TagInput label="Skills required" required value={form.skills} onChange={(skills) => { setForm({ ...form, skills }); setErrors({ ...errors, skills: undefined }) }} error={errors.skills} hint="Press Enter to add each skill" />
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button variant="secondary" to="/client/jobs">Cancel</Button>
          <Button type="submit" loading={saving}>{existing ? 'Save changes' : 'Publish job'}</Button>
        </div>
      </form>
    </div>
  )
}
