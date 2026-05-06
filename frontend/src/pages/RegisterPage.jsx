import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: '',
    phone: '', location: '', preferred_language: 'en',
  })
  const [error, setError] = useState('')

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    const res = await register(form)
    if (res.ok) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <div className="auth-page" style={{ background: 'var(--soil-50)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card fade-up" style={{ maxWidth: 520, width: '100%', padding: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span style={{ fontSize: 28 }}>🌱</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--green-800)', fontWeight: 700 }}>KhetSmart</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--gray-900)', marginBottom: 4 }}>
          Create an account
        </h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 28, fontSize: 15 }}>
          Start getting smart crop recommendations today.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input name="username" type="text" className="form-input"
                placeholder="ramesh_farmer" value={form.username} onChange={update} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input name="email" type="email" className="form-input"
                placeholder="you@example.com" value={form.email} onChange={update} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input name="password" type="password" className="form-input"
                placeholder="Min 8 characters" value={form.password} onChange={update} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input name="confirm_password" type="password" className="form-input"
                placeholder="Repeat password" value={form.confirm_password} onChange={update} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone" type="tel" className="form-input"
                placeholder="+91 98765 43210" value={form.phone} onChange={update} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input name="location" type="text" className="form-input"
                placeholder="Village / District" value={form.location} onChange={update} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Preferred Language</label>
            <select name="preferred_language" className="form-input" value={form.preferred_language} onChange={update}>
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--green-600)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
