import JobBrowser from '../../components/shared/JobBrowser.jsx'
import { PageHeader } from '../../components/ui/Display.jsx'

export default function FindJobs() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Find your next job" subtitle="Search open projects from vetted clients and submit proposals in minutes." />
      <JobBrowser basePath="/jobs" />
    </div>
  )
}
