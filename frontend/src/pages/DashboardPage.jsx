import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { cropAPI, diseaseAPI } from '../api/client'

const STAT_COLORS = ['var(--green-600)', 'var(--amber-500)', 'var(--green-400)', 'var(--soil-600)']

export default function DashboardPage() {
  const { user } = useAuth()
  const [cropHistory,    setCropHistory]    = useState([])
  const [diseaseHistory, setDiseaseHistory] = useState([])
  const [loadingCrop,    setLoadingCrop]    = useState(true)
  const [loadingDisease, setLoadingDisease] = useState(true)

  useEffect(() => {
    cropAPI.history()
      .then(({ data }) => setCropHistory(data))
      .catch(() => {})
      .finally(() => setLoadingCrop(false))
    diseaseAPI.history()
      .then(({ data }) => setDiseaseHistory(data))
      .catch(() => {})
      .finally(() => setLoadingDisease(false))
  }, [])

  const stats = [
    {
      label: 'Total Crop Analyses',
      value: loadingCrop ? '—' : cropHistory.length,
      icon: '🌾', color: STAT_COLORS[0],
    },
    {
      label: 'Disease Scans',
      value: loadingDisease ? '—' : diseaseHistory.length,
      icon: '🔬', color: STAT_COLORS[1],
    },
    {
      label: 'Latest Crop',
      value: loadingCrop
        ? '—'
        : cropHistory[0]?.recommended_crop ?? 'None yet',
      icon: '🌱', color: STAT_COLORS[2],
    },
    {
      label: 'Account Location',
      value: user?.location || 'Not set',
      icon: '📍', color: STAT_COLORS[3],
    },
  ]

  const recentCrops = cropHistory.slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">
            Welcome, {user?.username} 👋
          </h1>
          <p className="page-sub">
            Here&apos;s an overview of your farm advisory activity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/crop-advisory" className="btn btn-primary">
            + New Analysis
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid fade-up" style={{ animationDelay: '.05s' }}>
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: color + '18', color }}>
              {icon}
            </div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="quick-actions fade-up" style={{ animationDelay: '.1s' }}>
        <Link to="/crop-advisory" className="quick-action-card green">
          <div className="qa-icon">🌾</div>
          <div>
            <div className="qa-title">Crop Advisory</div>
            <div className="qa-desc">Enter soil & climate data to get recommended crop</div>
          </div>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <Link to="/disease-detection" className="quick-action-card amber">
          <div className="qa-icon">🔬</div>
          <div>
            <div className="qa-title">Disease Detection</div>
            <div className="qa-desc">Upload a leaf photo to detect plant diseases</div>
          </div>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      {/* Recent history */}
      <div className="card fade-up" style={{ marginTop: 24, animationDelay: '.15s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gray-900)' }}>
            Recent Crop Recommendations
          </h2>
          <Link to="/history" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {loadingCrop ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : recentCrops.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 22V12M12 12C12 7 7 3 3 3c0 4 3 8 9 9M12 12c0-5 5-9 9-9c0 4-3 8-9 9" />
            </svg>
            <h3>No analyses yet</h3>
            <p style={{ fontSize: 14 }}>
              <Link to="/crop-advisory" style={{ color: 'var(--green-600)' }}>Run your first crop analysis</Link>
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Confidence</th>
                <th>N / P / K</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCrops.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                      {r.recommended_crop}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${(r.confidence * 100).toFixed(0)}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                    {r.nitrogen} / {r.phosphorus} / {r.potassium}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 26px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px;
        }
        .page-sub { color: var(--gray-500); font-size: 14px; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: var(--white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: 20px;
          display: flex; align-items: center; gap: 14px;
          transition: box-shadow var(--transition);
          border: 1px solid var(--gray-100);
        }
        .stat-card:hover { box-shadow: var(--shadow-md); }
        .stat-icon {
          width: 44px; height: 44px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .stat-value {
          font-size: 20px; font-weight: 700; color: var(--gray-900);
          line-height: 1.2; text-transform: capitalize;
          max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .stat-label { font-size: 12px; color: var(--gray-500); margin-top: 2px; }

        .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 0; }
        .quick-action-card {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 20px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform var(--transition), box-shadow var(--transition);
          border: 1.5px solid transparent;
        }
        .quick-action-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .quick-action-card.green {
          background: linear-gradient(135deg, var(--green-50) 0%, var(--green-100) 100%);
          border-color: var(--green-200);
        }
        .quick-action-card.amber {
          background: linear-gradient(135deg, var(--amber-50) 0%, var(--amber-100) 100%);
          border-color: var(--amber-200);
        }
        .qa-icon { font-size: 28px; flex-shrink: 0; }
        .qa-title { font-weight: 700; font-size: 15px; color: var(--gray-900); margin-bottom: 2px; }
        .qa-desc  { font-size: 13px; color: var(--gray-500); }

        @media (max-width: 600px) {
          .quick-actions { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
