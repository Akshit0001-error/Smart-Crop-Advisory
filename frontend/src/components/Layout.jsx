import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/crop-advisory',
    label: 'Crop Advisory',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M12 22V12M12 12C12 7 7 3 3 3c0 4 3 8 9 9M12 12c0-5 5-9 9-9c0 4-3 8-9 9" />
      </svg>
    ),
  },
  {
    to: '/disease-detection',
    label: 'Disease Detection',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v3m0 3v.01" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebar = (
    <aside className="sidebar" onClick={() => setMobileOpen(false)}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M12 22V12M12 12C12 7 7 3 3 3c0 4 3 8 9 9M12 12c0-5 5-9 9-9c0 4-3 8-9 9" />
          </svg>
        </div>
        <div>
          <div className="brand-name">KhetSmart</div>
          <div className="brand-sub">Crop Advisory System</div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `nav-item ${isActive ? 'nav-item--active' : ''}`
          }>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* User pill */}
        <div className="user-pill">
          <div className="user-avatar">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <div className="sidebar-wrap desktop-only">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="sidebar-wrap mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="main-wrap">
        {/* Mobile topbar */}
        <div className="mobile-topbar mobile-only">
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="brand-name" style={{ fontSize: 16 }}>KhetSmart</span>
          <div className="user-avatar sm">{user?.username?.[0]?.toUpperCase() ?? 'U'}</div>
        </div>

        <main className="main-content">
          {children}
        </main>
      </div>

      <style>{`
        .app-shell {
          display: flex;
          min-height: 100vh;
          background: var(--gray-50);
        }
        .sidebar-wrap { width: 260px; flex-shrink: 0; }
        .sidebar {
          width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          background: var(--green-950);
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow-y: auto;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .brand-icon {
          width: 40px; height: 40px;
          background: var(--green-600);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--white);
          flex-shrink: 0;
        }
        .brand-name { font-family: var(--font-display); font-size: 18px; color: var(--white); font-weight: 700; }
        .brand-sub  { font-size: 11px; color: rgba(255,255,255,.4); margin-top: 1px; }

        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: rgba(255,255,255,.55);
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition);
        }
        .nav-item:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.85); }
        .nav-item--active { background: var(--green-700); color: var(--white); }
        .nav-icon { width: 18px; height: 18px; flex-shrink: 0; }

        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,.07); display: flex; flex-direction: column; gap: 10px; }
        .user-pill { display: flex; align-items: center; gap: 10px; }
        .user-avatar {
          width: 34px; height: 34px;
          background: var(--green-600);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--white); font-size: 14px; font-weight: 700;
          flex-shrink: 0;
        }
        .user-avatar.sm { width: 30px; height: 30px; font-size: 12px; }
        .user-info { overflow: hidden; }
        .user-name  { font-size: 13px; font-weight: 600; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-email { font-size: 11px; color: rgba(255,255,255,.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .logout-btn { color: rgba(255,255,255,.5); width: 100%; justify-content: flex-start; padding-left: 12px; }
        .logout-btn:hover { color: var(--white); background: rgba(255,255,255,.06); }

        .main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .main-content { flex: 1; padding: 32px; max-width: 1100px; }

        .mobile-topbar {
          display: none;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--green-950);
          color: var(--white);
          justify-content: space-between;
          position: sticky; top: 0; z-index: 10;
        }
        .mobile-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,.5);
        }
        .mobile-sidebar { position: relative; z-index: 101; }

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-topbar { display: flex; }
          .main-content { padding: 20px 16px; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  )
}
