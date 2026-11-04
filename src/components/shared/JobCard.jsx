import { Link } from 'react-router-dom'
import { Clock, MapPin, Users, DollarSign, CheckCircle2 } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import { Avatar, SkillTags } from '../ui/Display.jsx'
import { budgetRange, timeAgo } from '../../utils/format.js'

export default function JobCard({ job, client, proposalCount = 0, to, applied }) {
  return (
    <article className="card group p-5 transition hover:border-brand-300 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={to} className="block text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-700">{job.title}</Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeAgo(job.createdAt)}</span>
            <span>{job.category}</span>
            <span>{job.experience} level</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge status={job.status} />
          {applied && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Applied</span>}
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{job.description}</p>
      <div className="mt-3"><SkillTags skills={job.skills} /></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2.5">
          {client && <Avatar name={client.name} size="sm" />}
          <div className="text-xs">
            <p className="font-medium text-slate-800">{client?.company || client?.name}</p>
            {client?.location && <p className="inline-flex items-center gap-1 text-slate-500"><MapPin className="h-3 w-3" />{client.location}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1 text-slate-500"><Users className="h-4 w-4" />{proposalCount}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-900"><DollarSign className="h-4 w-4 text-brand-600" />{budgetRange(job).replaceAll('$', '')}</span>
        </div>
      </div>
    </article>
  )
}
