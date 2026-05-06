import { useState, useEffect } from 'react'
import { cropAPI, diseaseAPI } from '../api/client'

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || ''

export default function HistoryPage() {
  const [tab, setTab]               = useState('crop')
  const [cropHistory,    setCrop]    = useState([])
  const [diseaseHistory, setDisease] = useState([])
  const [loadingCrop,    setLC]      = useState(true)
  const [loadingDisease, setLD]      = useState(true)
  const [expanded,       setExpanded] = useState(null)

  useEffect(() => {
    cropAPI.history()
      .then(({ data }) => setCrop(data))
      .catch(() => {})
      .finally(() => setLC(false))
    diseaseAPI.history()
      .then(({ data }) => setDisease(data))
      .catch(() => {})
      .finally(() => setLD(false))
  }, [])

  function toggleExpand(id) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-sub">Your past analyses and detection records.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar fade-up" style={{ animationDelay: '.03s' }}>
        <button
          className={`tab-btn ${tab === 'crop' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('crop')}
        >
          🌾 Crop Recommendations
          {!loadingCrop && (
            <span className="tab-count">{cropHistory.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === 'disease' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('disease')}
        >
          🔬 Disease Detections
          {!loadingDisease && (
            <span className="tab-count">{diseaseHistory.length}</span>
          )}
        </button>
      </div>

      {/* Crop tab */}
      {tab === 'crop' && (
        <div className="card fade-up" style={{ animationDelay: '.06s', padding: 0, overflow: 'hidden' }}>
          {loadingCrop ? (
            <LoadingSkeleton />
          ) : cropHistory.length === 0 ? (
            <EmptyState text="No crop analyses yet." emoji="🌾" />
          ) : (
            <div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Recommended Crop</th>
                      <th>Confidence</th>
                      <th>N / P / K</th>
                      <th>Temp</th>
                      <th>pH</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropHistory.map((r, i) => (
                      <>
                        <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(r.id)}>
                          <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                          <td>
                            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                              {r.recommended_crop}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90 }}>
                              <div className="progress-track" style={{ flex: 1 }}>
                                <div className="progress-fill" style={{ width: `${(r.confidence * 100).toFixed(0)}%` }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                                {(r.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                            {r.nitrogen} / {r.phosphorus} / {r.potassium}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{r.temperature}°C</td>
                          <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{r.ph}</td>
                          <td style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                            {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <svg
                              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                              style={{ transition: 'transform .2s', transform: expanded === r.id ? 'rotate(180deg)' : 'none', color: 'var(--gray-400)' }}
                            >
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </td>
                        </tr>
                        {expanded === r.id && (
                          <tr key={`exp-${r.id}`}>
                            <td colSpan={8} style={{ background: 'var(--green-50)', padding: '12px 16px' }}>
                              <strong style={{ fontSize: 13, color: 'var(--green-800)' }}>🌤️ Weather Advisory:</strong>
                              {r.weather_advisory ? (
                                <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.8 }}>
                                  {r.weather_advisory.split('\n').filter(Boolean).map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span style={{ fontSize: 13, color: 'var(--gray-500)', marginLeft: 8 }}>No advisory available.</span>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disease tab */}
      {tab === 'disease' && (
        <div className="fade-up" style={{ animationDelay: '.06s' }}>
          {loadingDisease ? (
            <div className="card"><LoadingSkeleton /></div>
          ) : diseaseHistory.length === 0 ? (
            <div className="card"><EmptyState text="No disease detections yet." emoji="🔬" /></div>
          ) : (
            <div className="disease-grid">
              {diseaseHistory.map((d) => (
                <div key={d.id} className="disease-card">
                  {d.image && (
                    <img
                      src={d.image.startsWith('http') ? d.image : `${BACKEND_URL}${d.image}`}
                      alt="Leaf"
                      className="disease-thumb"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  <div className="disease-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span className="badge badge-amber" style={{ textTransform: 'capitalize', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.disease}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Confidence</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-700)' }}>
                          {(d.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{
                          width: `${(d.confidence * 100).toFixed(0)}%`,
                          background: 'var(--amber-400)',
                        }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {d.remedy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
        }
        .page-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; }
        .page-sub   { color: var(--gray-500); font-size: 14px; }

        .tab-bar { display: flex; gap: 4px; background: var(--white); border-radius: var(--radius-md); padding: 4px; box-shadow: var(--shadow-sm); margin-bottom: 20px; border: 1px solid var(--gray-100); width: fit-content; }
        .tab-btn { display: flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 8px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: var(--gray-500); cursor: pointer; transition: all var(--transition); }
        .tab-btn:hover { color: var(--gray-700); background: var(--gray-50); }
        .tab-btn--active { background: var(--green-700); color: var(--white); }
        .tab-count { background: rgba(255,255,255,.25); border-radius: 99px; padding: 1px 7px; font-size: 11px; }
        .tab-btn:not(.tab-btn--active) .tab-count { background: var(--gray-100); color: var(--gray-600); }

        .table-wrap { overflow-x: auto; }

        .disease-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .disease-card { background: var(--white); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); transition: box-shadow var(--transition); }
        .disease-card:hover { box-shadow: var(--shadow-md); }
        .disease-thumb { width: 100%; height: 160px; object-fit: cover; }
        .disease-info  { padding: 14px; }
      `}</style>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />)}
    </div>
  )
}

function EmptyState({ text, emoji }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
      <h3>{text}</h3>
    </div>
  )
}
