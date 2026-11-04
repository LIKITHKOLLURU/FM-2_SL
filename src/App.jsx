import { Route, Routes } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import JobBrowser from './components/shared/JobBrowser.jsx'

import Landing from './pages/public/Landing.jsx'
import FindJobs from './pages/public/FindJobs.jsx'
import Login from './pages/public/Login.jsx'
import Register from './pages/public/Register.jsx'

import JobDetails from './pages/shared/JobDetails.jsx'
import MyProjects from './pages/shared/MyProjects.jsx'
import PaymentTracking from './pages/shared/PaymentTracking.jsx'
import Profile from './pages/shared/Profile.jsx'
import NotFound from './pages/shared/NotFound.jsx'

import ClientDashboard from './pages/client/ClientDashboard.jsx'
import MyJobs from './pages/client/MyJobs.jsx'
import JobForm from './pages/client/JobForm.jsx'
import ReceivedProposals from './pages/client/ReceivedProposals.jsx'

import FreelancerDashboard from './pages/freelancer/FreelancerDashboard.jsx'
import SubmitProposal from './pages/freelancer/SubmitProposal.jsx'
import MyProposals from './pages/freelancer/MyProposals.jsx'
import { PageHeader, ErrorState } from './components/ui/Display.jsx'
import { useApp } from './context/AppContext.jsx'

import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import UserManagement from './pages/admin/UserManagement.jsx'
import JobManagement from './pages/admin/JobManagement.jsx'
import ProjectManagement from './pages/admin/ProjectManagement.jsx'
import PaymentManagement from './pages/admin/PaymentManagement.jsx'

const BrowseJobs = () => (
  <>
    <PageHeader title="Browse jobs" subtitle="Find open projects that match your skills." />
    <JobBrowser basePath="/freelancer/jobs" />
  </>
)

export default function App() {
  const { loadError, booting, reload } = useApp()
  if (loadError && !booting)
    return <div className="flex min-h-screen items-center justify-center"><ErrorState message={loadError} onRetry={reload} /></div>
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/jobs" element={<FindJobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Client */}
      <Route path="/client" element={<ProtectedRoute role="client" />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="jobs" element={<MyJobs />} />
          <Route path="jobs/new" element={<JobForm />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="jobs/:id/edit" element={<JobForm />} />
          <Route path="proposals" element={<ReceivedProposals />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="payments" element={<PaymentTracking />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Freelancer */}
      <Route path="/freelancer" element={<ProtectedRoute role="freelancer" />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<FreelancerDashboard />} />
          <Route path="jobs" element={<BrowseJobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="jobs/:id/apply" element={<SubmitProposal />} />
          <Route path="proposals" element={<MyProposals />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="payments" element={<PaymentTracking />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin" />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="jobs" element={<JobManagement />} />
          <Route path="projects" element={<ProjectManagement />} />
          <Route path="payments" element={<PaymentManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
