import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Globe, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useISTClock } from '../../hooks/useISTClock.js'
import { getCurrentISTDate } from '../../utils/datetime.js'
import { isEmail } from '../../utils/validators.js'
import { SOCIAL_LINKS } from '../../config/social.js'
import Logo from './Logo.jsx'

/* Brand glyphs (lucide-react 1.x no longer ships brand icons), drawn to match Lucide's stroke style. */
const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'h-[18px] w-[18px]', 'aria-hidden': true }
const LinkedinIcon = () => <svg {...svg}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
const InstagramIcon = () => <svg {...svg}><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
const FacebookIcon = () => <svg {...svg}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
const XIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>

const SOCIALS = [
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedinIcon },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'x', label: 'X', Icon: XIcon },
].filter((s) => SOCIAL_LINKS[s.key])

const linkCls = 'inline-flex min-h-[32px] items-center text-sm text-slate-300 transition hover:translate-x-0.5 hover:text-white focus-visible:text-white focus-visible:outline-none'

// Pages that don't exist yet render as clearly-marked, non-clickable text (no dead links).
function SoonItem({ children }) {
  return (
    <span className="inline-flex min-h-[32px] cursor-default items-center gap-2 text-sm text-slate-500" aria-disabled="true" title="Coming soon">
      {children}
      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 ring-1 ring-white/10">Soon</span>
    </span>
  )
}

function Column({ title, items }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider !text-white">{title}</h3>
      <ul className="space-y-1.5">{items.map((c, i) => <li key={i}>{c}</li>)}</ul>
    </nav>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    if (!email.trim()) return setFeedback({ type: 'error', text: 'Please enter your email address.' })
    if (!isEmail(email)) return setFeedback({ type: 'error', text: 'Enter a valid email address, e.g. name@company.com.' })
    // No newsletter service exists yet, so nothing is sent or stored. Say so honestly.
    setFeedback({ type: 'info', text: 'Email looks valid, but newsletter signup is not connected yet, so nothing was saved. Preview only.' })
  }

  return (
    <form onSubmit={submit} noValidate className="w-full lg:max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFeedback(null) }}
            placeholder="Enter your email" aria-label="Email address" aria-invalid={feedback?.type === 'error'} autoComplete="email"
            className="h-11 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </div>
        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-brand-400 hover:to-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
          Subscribe <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 min-h-[20px] text-xs" role="status" aria-live="polite">
        {feedback?.type === 'error' && <p className="flex items-start gap-1.5 text-red-300"><AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />{feedback.text}</p>}
        {feedback?.type === 'info' && <p className="flex items-start gap-1.5 text-amber-200"><Info className="mt-px h-3.5 w-3.5 shrink-0" />{feedback.text}</p>}
        {feedback?.type === 'success' && <p className="flex items-start gap-1.5 text-emerald-300"><CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />{feedback.text}</p>}
        {!feedback && <p className="text-slate-500">Demo form: validation only, no emails are collected yet.</p>}
      </div>
    </form>
  )
}

export default function Footer() {
  const { user } = useApp()
  const clock = useISTClock()
  const year = getCurrentISTDate().slice(0, 4)

  // Guests hitting a dashboard route are sent to login and returned to it afterwards (see ProtectedRoute/Login).
  const findFreelancers = user?.role === 'client' ? '/client/proposals' : user ? null : '/register?role=client'
  const buildProfile = user?.role === 'freelancer' ? '/freelancer/profile' : user ? null : '/register?role=freelancer'

  return (
    <footer className="bg-gradient-to-b from-[#14143f] to-[#0a0a24] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter band */}
        <div className="flex flex-col gap-6 border-b border-white/10 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <h2 className="text-2xl font-bold !text-white">Stay ahead with FreelanceHub</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Get the latest opportunities, freelance insights and platform updates.</p>
          </div>
          <Newsletter />
        </div>

        {/* Link columns */}
        <div className="grid gap-10 py-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">FreelanceHub connects talented professionals with businesses, helping turn great ideas into successful projects.</p>
            {SOCIALS.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label="Social media">
                {SOCIALS.map(({ key, label, Icon }) => (
                  <li key={key}>
                    <a href={SOCIAL_LINKS[key]} target="_blank" rel="noopener noreferrer" aria-label={`FreelanceHub on ${label}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-violet-500 hover:text-white hover:ring-violet-400">
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-8">
            <Column title="For Clients" items={[
              findFreelancers ? <Link className={linkCls} to={findFreelancers}>Find Freelancers</Link> : <SoonItem>Find Freelancers</SoonItem>,
              <Link className={linkCls} to="/client/jobs/new">Post a Job</Link>,
              <Link className={linkCls} to="/client/projects">Manage Projects</Link>,
              <Link className={linkCls} to="/client/payments">Payment Tracking</Link>,
            ]} />
            <Column title="For Freelancers" items={[
              <Link className={linkCls} to="/jobs">Browse Jobs</Link>,
              <Link className={linkCls} to="/freelancer/proposals">Submit Proposals</Link>,
              <Link className={linkCls} to="/freelancer/projects">My Projects</Link>,
              buildProfile ? <Link className={linkCls} to={buildProfile}>Build Your Profile</Link> : <SoonItem>Build Your Profile</SoonItem>,
            ]} />
            <Column title="Company" items={[
              <SoonItem>About Us</SoonItem>,
              <Link className={linkCls} to="/#how-it-works">How It Works</Link>,
              <SoonItem>Contact Us</SoonItem>,
              <SoonItem>Careers</SoonItem>,
            ]} />
            <Column title="Resources" items={[
              <SoonItem>Help Center</SoonItem>,
              <SoonItem>FAQs</SoonItem>,
              <SoonItem>Terms &amp; Conditions</SoonItem>,
              <SoonItem>Privacy Policy</SoonItem>,
            ]} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {year} FreelanceHub. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li><SoonItem>Privacy Policy</SoonItem></li>
            <li><SoonItem>Terms &amp; Conditions</SoonItem></li>
            <li className="inline-flex items-center gap-1.5" title="Indian Standard Time, Asia/Kolkata, UTC+05:30">
              <Globe className="h-3.5 w-3.5 text-violet-300" />India · {clock.time}
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
