import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { CATEGORIES, EXPERIENCE_LEVELS } from '../../data/seed.js'
import { SearchBox, EmptyState, Spinner } from '../ui/Display.jsx'
import { Select } from '../ui/Form.jsx'
import Button from '../ui/Button.jsx'
import JobCard from './JobCard.jsx'

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'budget_high', label: 'Budget: high to low' },
  { value: 'budget_low', label: 'Budget: low to high' },
]

// Used by the public "Find Jobs" page and the freelancer "Browse Jobs" page.
export default function JobBrowser({ basePath }) {
  const { jobs, proposals, user, userById, booting } = useApp()
  const [q, setQ] = useState('')
  const [params] = useSearchParams()
  const [category, setCategory] = useState(CATEGORIES.includes(params.get('category')) ? params.get('category') : '')
  const [experience, setExperience] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [sort, setSort] = useState('newest')

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = jobs.filter((j) => j.status === 'open')
    if (term) list = list.filter((j) => [j.title, j.description, j.category, ...j.skills].join(' ').toLowerCase().includes(term))
    if (category) list = list.filter((j) => j.category === category)
    if (experience) list = list.filter((j) => j.experience === experience)
    if (maxBudget) list = list.filter((j) => j.budgetMin <= Number(maxBudget))
    const by = { newest: (a, b) => b.createdAt.localeCompare(a.createdAt), budget_high: (a, b) => b.budgetMax - a.budgetMax, budget_low: (a, b) => a.budgetMin - b.budgetMin }
    return [...list].sort(by[sort])
  }, [jobs, q, category, experience, maxBudget, sort])

  const hasFilters = q || category || experience || maxBudget
  const reset = () => { setQ(''); setCategory(''); setExperience(''); setMaxBudget('') }
  const appliedIds = new Set(proposals.filter((p) => p.freelancerId === user?.id && p.status !== 'withdrawn').map((p) => p.jobId))

  if (booting) return <Spinner label="Loading jobs…" />

  return (
    <div>
      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2"><SearchBox value={q} onChange={setQ} placeholder="Search by title, skill or keyword" /></div>
          <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORIES} placeholder="All categories" />
          <Select aria-label="Experience" value={experience} onChange={(e) => setExperience(e.target.value)} options={EXPERIENCE_LEVELS} placeholder="Any experience" />
          <Select aria-label="Max budget" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Any budget"
            options={[{ value: '500', label: 'Starting under $500' }, { value: '1000', label: 'Starting under $1,000' }, { value: '2500', label: 'Starting under $2,500' }, { value: '5000', label: 'Starting under $5,000' }]} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-500"><SlidersHorizontal className="h-4 w-4" /><b className="text-slate-900">{results.length}</b> open {results.length === 1 ? 'job' : 'jobs'}</span>
          <div className="flex items-center gap-3">
            {hasFilters && <button onClick={reset} className="font-medium text-brand-600 hover:underline">Clear filters</button>}
            <select aria-label="Sort" className="input w-auto py-1.5" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card"><EmptyState icon={SearchX} title="No jobs match your search" message="Try different keywords or clear some filters." action={hasFilters && <Button variant="secondary" onClick={reset}>Clear filters</Button>} /></div>
      ) : (
        <div className="grid gap-4">
          {results.map((j) => (
            <JobCard key={j.id} job={j} client={userById(j.clientId)} to={`${basePath}/${j.id}`}
              proposalCount={j.proposalCount} applied={appliedIds.has(j.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
