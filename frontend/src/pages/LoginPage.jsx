import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const res = await login(form.email, form.password)
    if (res.ok) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-art">
          <div className="auth-art-icon">🌾</div>
          <h1 className="auth-art-title">Grow Smarter<br/>with AI</h1>
          <p className="auth-art-sub">
            Get instant crop recommendations and disease detection powered by machine learning.
          </p>
          <div className="auth-features">
            {['AI-Powered Crop Advice', 'Plant Disease Detection', 'Bilingual Support (EN/HI)', 'Detailed History & Analytics'].map((f) => (
              <div key={f} className="auth-feature-item">
                <span className="auth-feature-check">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box fade-up">
          <div className="auth-logo">
            <div className="brand-icon-sm">🌱</div>
            <span className="brand-name-sm">KhetSmart</span>
          </div>
          <h2 className="auth-heading">Welcome back</h2>
          <p className="auth-desc">Sign in to your account to continue</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 18 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email" name="email" type="email"
                className="form-input"
                placeholder="farmer@example.com"
                value={form.email}
                onChange={update}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={update}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--green-600)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page { display: flex; min-height: 100vh; }
        .auth-left {
          flex: 1;
          background: linear-gradient(145deg, var(--green-950) 0%, var(--green-800) 60%, var(--green-700) 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 48px;
        }
        .auth-art { max-width: 400px; }
        .auth-art-icon { font-size: 56px; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(0,0,0,.3)); }
        .auth-art-title {
          font-family: var(--font-display);
          font-size: 42px;
          color: var(--white);
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .auth-art-sub { color: rgba(255,255,255,.6); font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
        .auth-features { display: flex; flex-direction: column; gap: 10px; }
        .auth-feature-item { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,.8); font-size: 14px; }
        .auth-feature-check {
          width: 22px; height: 22px;
          background: rgba(255,255,255,.15);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0;
        }
        .auth-right {
          width: 480px;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px;
          background: var(--white);
        }
        .auth-box { width: 100%; max-width: 380px; }
        .auth-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
        .brand-icon-sm { font-size: 24px; }
        .brand-name-sm { font-family: var(--font-display); font-size: 20px; color: var(--green-800); font-weight: 700; }
        .auth-heading { font-family: var(--font-display); font-size: 28px; color: var(--gray-900); font-weight: 700; margin-bottom: 6px; }
        .auth-desc { color: var(--gray-500); font-size: 15px; margin-bottom: 28px; }
        .auth-switch { margin-top: 20px; text-align: center; color: var(--gray-500); font-size: 14px; }

        @media (max-width: 900px) {
          .auth-left { display: none; }
          .auth-right { width: 100%; }
        }
      `}</style>
    </div>
  )
}
