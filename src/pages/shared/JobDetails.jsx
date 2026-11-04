import { Link, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, DollarSign, Award, MapPin, Users, Pencil, Send, LogIn, CheckCircle2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { Avatar, EmptyState, SkillTags, Spinner } from '../../components/ui/Display.jsx'
import { budgetRange, dateFmt } from '../../utils/format.js'
import { SearchX } from 'lucide-react'

// Shared by public (/jobs/:id), freelancer and client route trees.
export default function JobDetails() {
  const { id } = useParams()
  const location = useLocation()
  const { jobs, proposals, user, userById, booting } = useApp()
  if (booting) return <Spinner />
  const job = jobs.find((j) => j.id === id)

  const backTo = user?.role === 'freelancer' ? '/freelancer/jobs' : user?.role === 'client' ? '/client/jobs' : user?.role === 'admin' ? '/admin/jobs' : '/jobs'
  if (!job) return <div className="card mx-auto max-w-xl"><EmptyState icon={SearchX} title="Job not found" message="This job may have been removed." action={<Button to={backTo}>Back to jobs</Button>} /></div>

  const client = userById(job.clientId)
  const jobProposals = proposals.filter((p) => p.jobId === job.id && p.status !== 'withdrawn')
  const proposalTotal = job.proposalCount ?? jobProposals.length
  const myProposal = user && jobProposals.find((p) => p.freelancerId === user.id)
  const isOwner = user?.id === job.clientId
  const isPublic = !location.pathname.startsWith('/client') && !location.pathname.startsWith('/freelancer')

  const body = (
    <div className={isPublic ? 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8' : ''}>
      <Link to={backTo} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" />Back to jobs</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2"><Badge status={job.status} /><Badge tone="gray">{job.category}</Badge></div>
            <h1 className="mt-3 text-2xl font-bold leading-snug">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">Posted {dateFmt(job.createdAt)}</p>
            <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{job.description}</p>
            <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Skills required</h2>
            <SkillTags skills={job.skills} max={20} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card space-y-4 p-6">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><DollarSign className="h-4 w-4 text-brand-600" /><span className="text-slate-500">Budget</span><b className="ml-auto">{budgetRange(job)}</b></li>
              <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-brand-600" /><span className="text-slate-500">Duration</span><b className="ml-auto">{job.duration}</b></li>
              <li className="flex items-center gap-3"><Award className="h-4 w-4 text-brand-600" /><span className="text-slate-500">Experience</span><b className="ml-auto">{job.experience}</b></li>
              <li className="flex items-center gap-3"><Users className="h-4 w-4 text-brand-600" /><span className="text-slate-500">Proposals</span><b className="ml-auto">{proposalTotal}</b></li>
              <li className="flex items-center gap-3"><Calendar className="h-4 w-4 text-brand-600" /><span className="text-slate-500">Posted</span><b className="ml-auto">{dateFmt(job.createdAt)}</b></li>
            </ul>

            <div className="border-t border-slate-100 pt-4">
              {!user && (
                <>
                  <Button to="/login" state={{ from: `/freelancer/jobs/${job.id}` }} icon={LogIn} className="w-full">Log in to apply</Button>
                  <p className="mt-2 text-center text-xs text-slate-500">New here? <Link className="font-medium text-brand-600" to="/register">Create a free account</Link></p>
                </>
              )}
              {user?.role === 'freelancer' && (
                myProposal ? (
                  <div className="space-y-2 text-center">
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" />You applied ({myProposal.status})</p>
                    <Button to="/freelancer/proposals" variant="secondary" className="w-full">View my proposals</Button>
                  </div>
                ) : job.status === 'open' ? (
                  <Button to={`/freelancer/jobs/${job.id}/apply`} icon={Send} className="w-full">Submit a proposal</Button>
                ) : <p className="text-center text-sm text-slate-500">This job is no longer accepting proposals.</p>
              )}
              {isOwner && (
                <div className="space-y-2">
                  <Button to={`/client/jobs/${job.id}/edit`} icon={Pencil} variant="secondary" className="w-full">Edit job</Button>
                  <Button to={`/client/proposals?job=${job.id}`} className="w-full">View {proposalTotal} proposals</Button>
                </div>
              )}
              {user?.role === 'client' && !isOwner && <p className="text-center text-sm text-slate-500">Only freelancers can apply for jobs.</p>}
              {user?.role === 'admin' && <p className="text-center text-sm text-slate-500">Viewing as administrator.</p>}
            </div>
          </div>

          {client && (
            <div className="card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">About the client</h2>
              <div className="flex items-center gap-3">
                <Avatar name={client.name} />
                <div><p className="font-semibold">{client.company || client.name}</p><p className="text-xs text-slate-500">{client.name}</p></div>
              </div>
              {client.location && <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4 text-slate-400" />{client.location}</p>}
              <p className="mt-2 text-sm text-slate-500">Member since {dateFmt(client.joinedAt)}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
  return body
}
