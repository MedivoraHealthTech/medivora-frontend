import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ requiredRole = null, redirectTo = '/login' }) {
  const { isAuthenticated, role, loading, initialized } = useAuth()

  if (loading || !initialized) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f8fc', fontFamily: 'var(--font)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(0,175,239,0.2)',
            borderTopColor: '#00AFEF',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: 13, color: '#666' }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />
  if (requiredRole && role !== requiredRole) return <Navigate to={redirectTo} replace />
  if (!requiredRole && role === 'doctor') return <Navigate to="/doctor" replace />
  return <Outlet />
}
