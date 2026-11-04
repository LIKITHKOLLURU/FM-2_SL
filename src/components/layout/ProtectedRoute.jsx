import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Spinner } from '../ui/Display.jsx'
import { roleHome } from '../../utils/navigation.js'

export default function ProtectedRoute({ role }) {
  const { user, booting } = useApp()
  const location = useLocation()

  if (booting) return <Spinner label="Loading your workspace…" className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />
  return <Outlet />
}
