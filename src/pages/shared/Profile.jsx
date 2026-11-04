import { useState } from 'react'
import { Mail, MapPin, Briefcase, CalendarDays, KeyRound } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { PageHeader, Avatar } from '../../components/ui/Display.jsx'
import { Input, Textarea, TagInput } from '../../components/ui/Form.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { validateProfile } from '../../utils/validators.js'
import { dateFmt } from '../../utils/format.js'

export default function Profile() {
  const { user, actions } = useApp()
  const isFreelancer = user.role === 'freelancer'
  const [form, setForm] = useState({ name: user.name, title: user.title || '', company: user.company || '', location: user.location || '', bio: user.bio || '', skills: user.skills || [], hourlyRate: user.hourlyRate ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr] = useState({})
  const [pwSaving, setPwSaving] = useState(false)

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }) }

  const save = async (e) => {
    e.preventDefault()
    const errs = validateProfile(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    await actions.updateProfile(user.id, { ...form, name: form.name.trim(), hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate) })
    setSaving(false)
  }

  const changePw = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pw.current) errs.current = 'Enter your current password.'
    if (pw.next.length < 8 || !/\d/.test(pw.next) || !/[a-zA-Z]/.test(pw.next)) errs.next = 'Use 8+ characters with letters and a number.'
    if (pw.confirm !== pw.next) errs.confirm = 'Passwords do not match.'
    setPwErr(errs)
    if (Object.keys(errs).length) return
    setPwSaving(true)
    const ok = await actions.changePassword(user.id, { current: pw.current, next: pw.next })
    setPwSaving(false)
    if (ok) setPw({ current: '', next: '', confirm: '' })
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage how you appear to others on FreelanceHub." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-fit p-6 text-center">
          <Avatar name={user.name} size="xl" className="mx-auto" />
          <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.title || 'Add a headline'}</p>
          <Badge status={user.role} className="mt-3 capitalize" />
          <ul className="mt-6 space-y-3 text-left text-sm text-slate-600">
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-slate-400" />{user.email}</li>
            {user.location && <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-slate-400" />{user.location}</li>}
            {user.company && <li className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-slate-400" />{user.company}</li>}
            <li className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-slate-400" />Joined {dateFmt(user.joinedAt)}</li>
          </ul>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={save} noValidate className="card space-y-5 p-6">
            <h2 className="text-lg font-semibold">Personal information</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Full name" required value={form.name} onChange={set('name')} error={errors.name} />
              <Input label="Professional headline" value={form.title} onChange={set('title')} placeholder={isFreelancer ? 'e.g. Full-Stack Developer' : 'e.g. Head of Product'} />
              {!isFreelancer && <Input label="Company" value={form.company} onChange={set('company')} />}
              <Input label="Location" value={form.location} onChange={set('location')} placeholder="City, Country" />
              {isFreelancer && <Input label="Hourly rate (USD)" type="number" min="0" value={form.hourlyRate} onChange={set('hourlyRate')} error={errors.hourlyRate} />}
            </div>
            <Textarea label="About" rows={4} value={form.bio} onChange={set('bio')} placeholder="Tell others about yourself" />
            {isFreelancer && <TagInput label="Skills" value={form.skills} onChange={(skills) => setForm({ ...form, skills })} />}
            <div className="flex justify-end"><Button type="submit" loading={saving}>Save changes</Button></div>
          </form>

          {user.hasPassword === false ? (
            <div className="card p-6 text-sm text-slate-600"><b className="text-slate-900">Signed in with Google.</b> Your account has no FreelanceHub password; manage your credentials in your Google account.</div>
          ) : (
          <form onSubmit={changePw} noValidate className="card space-y-5 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="h-5 w-5 text-brand-600" />Change password</h2>
            <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwErr.current} autoComplete="current-password" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErr.next} autoComplete="new-password" />
              <Input label="Confirm new password" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr.confirm} autoComplete="new-password" />
            </div>
            <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pwSaving}>Update password</Button></div>
          </form>
          )}
        </div>
      </div>
    </div>
  )
}
