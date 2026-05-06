import { useState } from 'react'
import { cropAPI } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const DEFAULTS = {
  nitrogen: '', phosphorus: '', potassium: '',
  temperature: '', humidity: '', rainfall: '', ph: '',
  language: 'en',
}

const FIELD_CONFIG = [
  { name: 'nitrogen',    label: 'Nitrogen (N)',    unit: 'kg/ha',   min: 0,   max: 200, placeholder: '0–200', emoji: '🔵' },
  { name: 'phosphorus',  label: 'Phosphorus (P)',  unit: 'kg/ha',   min: 0,   max: 200, placeholder: '0–200', emoji: '🟡' },
  { name: 'potassium',   label: 'Potassium (K)',   unit: 'kg/ha',   min: 0,   max: 300, placeholder: '0–300', emoji: '🟠' },
  { name: 'temperature', label: 'Temperature',     unit: '°C',      min: -10, max: 60,  placeholder: '-10–60', emoji: '🌡️' },
  { name: 'humidity',    label: 'Humidity',        unit: '%',       min: 0,   max: 100, placeholder: '0–100', emoji: '💧' },
  { name: 'rainfall',    label: 'Rainfall',        unit: 'mm',      min: 0,   max: 500, placeholder: '0–500', emoji: '🌧️' },
  { name: 'ph',          label: 'Soil pH',         unit: 'pH',      min: 0,   max: 14,  placeholder: '0–14',  emoji: '⚗️' },
]

const CROP_EMOJI = {
  rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🌿', sugarcane: '🎋',
  jute: '🌿', coffee: '☕', coconut: '🥥', papaya: '🍈', banana: '🍌',
  mango: '🥭', grapes: '🍇', watermelon: '🍉', muskmelon: '🍈', apple: '🍎',
  orange: '🍊', pomegranate: '🍎', lentil: '🫘', blackgram: '🫘', kidneybeans: '🫘',
  chickpea: '🫘', pigeonpeas: '🫘', mothbeans: '🫘', mungbean: '🫘',
}

function getCropEmoji(crop) {
  const key = (crop || '').toLowerCase()
  return CROP_EMOJI[key] || '🌱'
}

export default function CropAdvisoryPage() {
  const { user } = useAuth()
  const [form,    setForm]    = useState({ ...DEFAULTS, language: user?.preferred_language || 'en' })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
    setResult(null)
  }

  function fillExample() {
    setForm({
      nitrogen: 90, phosphorus: 42, potassium: 43,
      temperature: 25, humidity: 82, rainfall: 202.9, ph: 6.5,
      language: form.language,
    })
    setError('')
    setResult(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const payload = {
      nitrogen:    parseFloat(form.nitrogen),
      phosphorus:  parseFloat(form.phosphorus),
      potassium:   parseFloat(form.potassium),
      temperature: parseFloat(form.temperature),
      humidity:    parseFloat(form.humidity),
      rainfall:    parseFloat(form.rainfall),
      ph:          parseFloat(form.ph),
      language:    form.language,
    }

    try {
      const { data } = await cropAPI.predict(payload)
      setResult(data)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : 'Prediction failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Crop Advisory</h1>
          <p className="page-sub">Enter your soil and climate conditions to get AI-powered crop recommendations.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            name="language" value={form.language} onChange={update}
            className="form-input" style={{ width: 'auto' }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>

      <div className="advisory-layout fade-up" style={{ animationDelay: '.05s' }}>
        {/* Form */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gray-900)' }}>
              Soil &amp; Climate Parameters
            </h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={fillExample}>
              Fill Example
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="param-grid">
              {FIELD_CONFIG.map(({ name, label, unit, min, max, placeholder, emoji }) => (
                <div key={name} className="form-group">
                  <label className="form-label">
                    <span style={{ marginRight: 5 }}>{emoji}</span>{label}
                    <span style={{ color: 'var(--gray-400)', marginLeft: 4, textTransform: 'none', fontWeight: 400 }}>
                      ({unit})
                    </span>
                  </label>
                  <input
                    name={name}
                    type="number"
                    step="0.01"
                    min={min}
                    max={max}
                    className="form-input"
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={update}
                    required
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4, padding: '14px' }} disabled={loading}>
              {loading
                ? <><span className="spinner" /> Analysing…</>
                : <><span>🔮</span> Get Crop Recommendation</>}
            </button>
          </form>
        </div>

        {/* Results panel */}
        <div>
          {!result && !loading && (
            <div className="card result-placeholder">
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '48px 24px' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🌱</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gray-600)', marginBottom: 6 }}>
                  Results will appear here
                </div>
                <div style={{ fontSize: 14 }}>
                  Fill in the soil parameters and click &ldquo;Get Crop Recommendation&rdquo;
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3, color: 'var(--green-500)', margin: '0 auto 16px', display: 'block' }} />
              <div style={{ color: 'var(--gray-600)' }}>Running AI model…</div>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
              {/* Hero result */}
              <div className="result-hero">
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>
                    {getCropEmoji(result.recommended_crop)}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>
                    Recommended Crop
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, textTransform: 'capitalize', marginBottom: 16 }}>
                    {result.recommended_crop}
                  </div>
                  <div style={{ marginBottom: 6, fontSize: 14, color: 'rgba(255,255,255,.7)' }}>
                    Model Confidence
                  </div>
                  <div className="progress-track" style={{ background: 'rgba(255,255,255,.2)', height: 10 }}>
                    <div className="progress-fill" style={{ width: `${(result.confidence * 100).toFixed(0)}%`, background: 'var(--green-400)' }} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: 'var(--green-300)' }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Weather advisory */}
              {result.weather_advisory?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12, color: 'var(--gray-900)' }}>
                    🌤️ Weather Advisory
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.weather_advisory.map((tip, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--green-500)', fontSize: 16, marginTop: 1 }}>•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Input summary */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 12, color: 'var(--gray-700)' }}>
                  Parameters Used
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                  {FIELD_CONFIG.map(({ name, label, unit }) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--gray-100)', padding: '5px 0' }}>
                      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{form[name]} {unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
        }
        .page-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; }
        .page-sub   { color: var(--gray-500); font-size: 14px; }

        .advisory-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        .param-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
        .result-placeholder { min-height: 200px; }

        @media (max-width: 900px) {
          .advisory-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .param-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
