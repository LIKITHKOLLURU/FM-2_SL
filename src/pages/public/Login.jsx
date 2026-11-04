import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Search, Users, KanbanSquare, TrendingUp, CheckCircle2, Star } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { Input } from '../../components/ui/Form.jsx'
import Button from '../../components/ui/Button.jsx'
import GoogleButton from '../../components/ui/GoogleButton.jsx'
import Logo from '../../components/layout/Logo.jsx'
import { validateLogin } from '../../utils/validators.js'
import { roleHome } from '../../utils/navigation.js'

const HIGHLIGHTS = [
  { icon: Search, title: 'Discover Opportunities', text: 'Find projects that match your skills and ambitions.' },
  { icon: Users, title: 'Connect with Talent', text: 'Work with skilled professionals across different industries.' },
  { icon: KanbanSquare, title: 'Manage Projects', text: 'Collaborate, track progress and manage payments in one place.' },
]

function BrandPanel() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 px-6 py-12 text-white sm:px-12 lg:flex lg:flex-col lg:justify-center lg:px-16">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <h2 className="text-3xl font-bold leading-tight !text-white sm:text-4xl">Your next opportunity starts here.</h2>
        <p className="mt-4 leading-relaxed text-brand-100">Connect with talented professionals, discover exciting projects, and turn great ideas into successful collaborations.</p>

        {/* Dashboard-inspired visual: hidden on small phones to keep the page compact */}
        <div className="relative my-9 hidden h-44 sm:block" aria-hidden="true">
          <div className="absolute left-0 top-0 w-60 rounded-2xl bg-white p-4 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">Active project</p><span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">In progress</span></div>
            <p className="mt-2 text-sm font-semibold">Brand identity package</p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 w-[72%] rounded-full bg-gradient-to-r from-brand-500 to-violet-500" /></div>
            <p className="mt-1.5 text-[11px] text-slate-500">72% complete</p>
          </div>
          <div className="absolute right-0 top-8 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 text-slate-800 shadow-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50"><TrendingUp className="h-5 w-5 text-emerald-600" /></span>
            <div><p className="text-[11px] text-slate-500">Earned this month</p><p className="text-base font-bold">$4,250</p></div>
          </div>
          <div className="absolute bottom-0 left-16 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-slate-800 shadow-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-xs font-medium">Proposal accepted</span>
            <span className="ml-1 flex">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</span>
          </div>
        </div>

        <ul className="mt-8 space-y-5 sm:mt-0">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25"><Icon className="h-5 w-5" /></span>
              <div><h3 className="font-semibold !text-white">{title}</h3><p className="mt-0.5 text-sm text-brand-100">{text}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Login() {
  const { user, actions } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (user) return <Navigate to={roleHome(user.role)} replace />

  const goHome = (u) => {
    const from = location.state?.from
    navigate(from && from.startsWith(`/${u.role}`) ? from : roleHome(u.role), { replace: true })
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateLogin(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    const u = await actions.login(form)
    setLoading(false)
    if (u) goHome(u)
  }

  const onGoogle = async (credential) => {
    setGoogleLoading(true)
    const result = await actions.googleAuth({ credential })
    setGoogleLoading(false)
    if (result === 'ROLE_REQUIRED') navigate('/register', { replace: true })
    else if (result) goHome(result)
  }

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }) }

  return (
    <div className="grid min-h-screen overflow-x-hidden lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <h1 className="mt-10 text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-slate-500">Sign in to continue to your dashboard.</p>
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <Input label="Email" type="email" icon={Mail} value={form.email} onChange={set('email')} error={errors.email} placeholder="you@company.com" autoComplete="email" />
            <Input label="Password" type="password" icon={Lock} value={form.password} onChange={set('password')} error={errors.password} placeholder="Your password" autoComplete="current-password" />
            <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
          <GoogleButton text="signin_with" loading={googleLoading} onCredential={onGoogle} />

          <p className="mt-6 text-center text-sm text-slate-500">New to FreelanceHub? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></p>
        </div>
      </div>
      <BrandPanel />
    </div>
  )
}
