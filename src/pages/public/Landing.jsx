import { Link } from 'react-router-dom'
import { ArrowRight, Code2, Palette, PenTool, Megaphone, BarChart3, Smartphone, ShieldCheck, Zap, MessageSquareText, Star, CheckCircle2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import JobCard from '../../components/shared/JobCard.jsx'
import { money } from '../../utils/format.js'

const CATS = [
  { name: 'Web Development', icon: Code2 }, { name: 'Mobile Development', icon: Smartphone }, { name: 'Design', icon: Palette },
  { name: 'Writing', icon: PenTool }, { name: 'Marketing', icon: Megaphone }, { name: 'Data & Analytics', icon: BarChart3 },
]
const STEPS = [
  { icon: PenTool, title: 'Post a job', text: 'Describe your project, set a budget and receive tailored proposals within hours.' },
  { icon: MessageSquareText, title: 'Review proposals', text: 'Compare bids, cover letters and delivery times, then accept the best fit.' },
  { icon: Zap, title: 'Track the work', text: 'Follow project progress in real time and release payments as milestones complete.' },
]

export default function Landing() {
  const { jobs, stats: platform, userById } = useApp()
  const open = jobs.filter((j) => j.status === 'open')
  const featured = [...open].sort((a, b) => b.budgetMax - a.budgetMax).slice(0, 3)
  const stats = [
    { label: 'Freelancers', value: platform?.freelancers ?? 0 },
    { label: 'Open jobs', value: platform?.openJobs ?? open.length },
    { label: 'Projects delivered', value: platform?.completedProjects ?? 0 },
    { label: 'Paid to talent', value: money(platform?.paidTotal ?? 0) },
  ]

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Trusted by growing teams worldwide</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">Hire top freelancers.<br /><span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">Get great work done.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">FreelanceHub connects ambitious clients with skilled independent professionals. Post a job, compare proposals, and manage projects and payments in one place.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/register?role=client" size="lg">Hire a freelancer <ArrowRight className="h-4 w-4" /></Button>
              <Button to="/jobs" variant="secondary" size="lg">Find work</Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {['No upfront fees', 'Secure milestone payments', 'Verified talent'].map((t) => <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{t}</li>)}
            </ul>
          </div>

          <div className="relative">
            <div className="card p-5 shadow-pop">
              <div className="mb-4 flex items-center justify-between"><p className="font-semibold">Active project</p><span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">In progress</span></div>
              <p className="text-sm text-slate-600">Node.js REST API for a booking platform</p>
              <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 w-[55%] rounded-full bg-gradient-to-r from-brand-500 to-violet-500" /></div>
              <div className="mt-2 flex justify-between text-xs text-slate-500"><span>55% complete</span><span>Due Oct 30</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Paid</p><p className="text-lg font-bold text-emerald-800">$2,100</p></div>
                <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-700">Pending</p><p className="text-lg font-bold text-amber-800">$2,100</p></div>
              </div>
            </div>
            <div className="card absolute -bottom-6 -left-4 hidden items-center gap-3 p-3 pr-5 shadow-pop sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /></div>
              <div><p className="text-sm font-semibold">4.9 average rating</p><p className="text-xs text-slate-500">from 120+ reviews</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((s) => <div key={s.label} className="text-center"><p className="text-3xl font-extrabold text-brand-700">{s.value}</p><p className="mt-1 text-sm text-slate-500">{s.label}</p></div>)}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center"><h2 className="text-3xl font-bold">Browse by category</h2><p className="mt-2 text-slate-500">Find specialists across the most in-demand fields.</p></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATS.map(({ name, icon: Icon }) => (
            <Link key={name} to={`/jobs?category=${encodeURIComponent(name)}`} className="card group flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white"><Icon className="h-6 w-6" /></span>
              <span className="text-sm font-semibold">{name}</span>
              <span className="text-xs text-slate-500">{open.filter((j) => j.category === name).length} open jobs</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center"><h2 className="text-3xl font-bold">How FreelanceHub works</h2><p className="mt-2 text-slate-500">From idea to delivered project in three simple steps.</p></div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="card relative p-6">
                <span className="absolute right-5 top-4 text-5xl font-extrabold text-slate-100">{i + 1}</span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white"><Icon className="h-6 w-6" /></span>
                <h3 className="relative mt-5 text-lg font-semibold">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div><h2 className="text-3xl font-bold">Featured opportunities</h2><p className="mt-2 text-slate-500">High-value jobs open for proposals right now.</p></div>
          <Link to="/jobs" className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:underline sm:inline-flex">View all jobs <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {featured.map((j) => <JobCard key={j.id} job={j} client={userById(j.clientId)} to={`/jobs/${j.id}`} proposalCount={j.proposalCount} />)}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-3xl bg-gradient-to-br from-brand-700 to-violet-700 p-8 text-white shadow-pop sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold !text-white">Ready to start your next project?</h2>
            <p className="mt-3 text-brand-100">Join FreelanceHub today. It is free to sign up and takes less than a minute.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/register" className="!bg-white !text-brand-700 hover:!bg-brand-50">Create free account</Button>
              <Button to="/login" variant="ghost" className="!text-white hover:!bg-white/10">Try the demo</Button>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[[ShieldCheck, 'Role-based dashboards for clients, freelancers and admins'], [Zap, 'Instant project creation when a proposal is accepted'], [BarChart3, 'Built-in payment tracking and analytics']].map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5"><Icon className="h-5 w-5 shrink-0" />{t}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
