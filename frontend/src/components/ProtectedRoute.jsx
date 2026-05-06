import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 12,
        color: 'var(--green-600)',
      }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>Loading…</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
