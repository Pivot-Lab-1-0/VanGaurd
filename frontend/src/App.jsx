import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar         from './components/shared/Navbar'
import ProtectedRoute from './components/shared/ProtectedRoute'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import ReportProblem  from './pages/ReportProblem'
import VolunteerView  from './pages/VolunteerView'

function RoleRedirect() {
  const user = useAuthStore(s => s.user)
  if (!user)                     return <Navigate to="/login"     replace />
  if (user.role === 'ngo')       return <Navigate to="/dashboard" replace />
  if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />
  return                                <Navigate to="/report"    replace />
}

export default function App() {
  const user = useAuthStore(s => s.user)

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Vanguard</h1>
              <p className="text-lg text-gray-600 mb-8">Verified Impact Pipeline</p>
              <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Get Started
              </a>
            </div>
          </div>
        } />
        <Route path="/login" element={
          user ? <RoleRedirect /> : <Login />
        } />

        {/* NGO command center */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Villager + NGO */}
        <Route path="/report" element={
          <ProtectedRoute allowedRoles={['villager', 'ngo']}>
            <ReportProblem />
          </ProtectedRoute>
        } />

        {/* Volunteer + NGO */}
        <Route path="/volunteer" element={
          <ProtectedRoute allowedRoles={['volunteer', 'ngo']}>
            <VolunteerView />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </div>
  )
}
