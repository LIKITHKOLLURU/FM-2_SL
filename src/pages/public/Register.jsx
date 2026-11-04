import { useRef, useState } from 'react'
import GoogleButton from '../../components/ui/GoogleButton.jsx'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Briefcase, Code2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Input } from '../../components/ui/Form.jsx'
import Button from '../../components/ui/Button.jsx'
import Logo from '../../components/layout/Logo.jsx'
import { validateRegister } from '../../utils/validators.js'
import { roleHome } from '../../utils/navigation.js'

const ROLES = [
  { value: 'client', title: 'I want to hire', text: 'Post jobs and manage projects', icon: Briefcase },
  { value: 'freelancer', title: 'I want to work', text: 'Find jobs and submit proposals', icon: Code2 },
]

export default function Register() {
  const { user, actions } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: params.get('role') === 'freelancer' ? 'freelancer' : 'client' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const roleRef = useRef(form.role)
  roleRef.current = form.role

  if (user) return <Navigate to={roleHome(user.role)} replace />

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }) }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateRegister(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    const u = await actions.register(form)
    setLoading(false)
    if (u) navigate(`${roleHome(u.role)}/profile`, { replace: true })
  }

  // The Google button's callback is registered once, so read the latest role from a ref.
  const onGoogle = async (credential) => {
    setGoogleLoading(true)
    const u = await actions.googleAuth({ credential, role: roleRef.current })
    setGoogleLoading(false)
    if (u && u !== 'ROLE_REQUIRED') navigate(roleHome(u.role), { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center"><Logo /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join FreelanceHub in less than a minute.</p>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <div>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
                {ROLES.map(({ value, title, text, icon: Icon }) => (
                  <button key={value} type="button" role="radio" aria-checked={form.role === value} onClick={() => setForm({ ...form, role: value })}
                    className={`rounded-xl border p-4 text-left transition ${form.role === value ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                    <Icon className={`h-5 w-5 ${form.role === value ? 'text-brand-600' : 'text-slate-400'}`} />
                    <p className="mt-2 text-sm font-semibold">{title}</p>
                    <p className="text-xs text-slate-500">{text}</p>
                  </button>
                ))}
              </div>
              {errors.role && <p className="mt-1.5 text-xs text-red-600">{errors.role}</p>}
            </div>
            <Input label="Full name" icon={User} value={form.name} onChange={set('name')} error={errors.name} placeholder="Jane Cooper" autoComplete="name" />
            <Input label="Email" type="email" icon={Mail} value={form.email} onChange={set('email')} error={errors.email} placeholder="you@company.com" autoComplete="email" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Password" type="password" icon={Lock} value={form.password} onChange={set('password')} error={errors.password} hint="8+ characters with a number" autoComplete="new-password" />
              <Input label="Confirm password" type="password" icon={Lock} value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full">Create account</Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />or sign up with Google<span className="h-px flex-1 bg-slate-200" /></div>
          <p className="mb-3 text-center text-xs text-slate-500">Uses the account type selected above: <b className="capitalize text-slate-700">{form.role}</b></p>
          <GoogleButton text="signup_with" loading={googleLoading} onCredential={onGoogle} />
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
