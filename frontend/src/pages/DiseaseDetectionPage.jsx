import { useState, useRef } from 'react'
import { diseaseAPI } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const MAX_SIZE_MB = 10

export default function DiseaseDetectionPage() {
  const { user } = useAuth()
  const fileInput = useRef(null)

  const [language,   setLanguage]   = useState(user?.preferred_language || 'en')
  const [imageFile,  setImageFile]  = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [dragging,   setDragging]   = useState(false)

  function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG or PNG).')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_SIZE_MB} MB.`)
      return
    }
    setError('')
    setResult(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  function onInputChange(e) { handleFile(e.target.files[0]) }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setResult(null)
    setError('')
    if (fileInput.current) fileInput.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!imageFile) { setError('Please select an image first.'); return }

    setLoading(true)
    setError('')
    setResult(null)

    const fd = new FormData()
    fd.append('image', imageFile)
    fd.append('language', language)

    try {
      const { data } = await diseaseAPI.detect(fd)
      setResult(data)
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : '')
        || 'Detection failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function severityColor(confidence) {
    if (confidence < 0.4) return 'var(--green-600)'
    if (confidence < 0.7) return 'var(--amber-500)'
    return '#dc2626'
  }

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Disease Detection</h1>
          <p className="page-sub">Upload a leaf photo to identify plant diseases and get treatment advice.</p>
        </div>
        <div>
          <select value={language} onChange={(e) => { setLanguage(e.target.value); setResult(null) }}
            className="form-input" style={{ width: 'auto' }}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>

      <div className="disease-layout fade-up" style={{ animationDelay: '.05s' }}>
        {/* Upload form */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gray-900)', marginBottom: 18 }}>
            Upload Leaf Image
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Drop zone */}
            <div
              className={`drop-zone ${dragging ? 'drop-zone--active' : ''} ${imagePreview ? 'drop-zone--has-image' : ''}`}
              onClick={() => !imagePreview && fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {imagePreview ? (
                <div className="preview-wrap">
                  <img src={imagePreview} alt="Leaf preview" className="preview-img" />
                  <button type="button" className="preview-remove" onClick={(e) => { e.stopPropagation(); clearImage() }}>
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="drop-placeholder">
                  <div className="drop-icon">📷</div>
                  <div className="drop-text">Drag &amp; drop an image here</div>
                  <div className="drop-sub">or click to browse · JPG / PNG · max 10 MB</div>
                </div>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              style={{ display: 'none' }}
              onChange={onInputChange}
            />

            {imageFile && !imagePreview && (
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>
                {imageFile.name}
              </p>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: 14 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 16, padding: 14 }}
              disabled={loading || !imageFile}
            >
              {loading
                ? <><span className="spinner" /> Detecting disease…</>
                : <><span>🔬</span> Detect Disease</>}
            </button>
          </form>

          <div className="alert alert-info" style={{ marginTop: 16 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            <span style={{ fontSize: 13 }}>
              For best results, use a clear close-up photo of the affected leaf in good lighting.
            </span>
          </div>
        </div>

        {/* Result panel */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍃</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--gray-600)', marginBottom: 6 }}>
                  Detection results will appear here
                </div>
                <div style={{ fontSize: 14 }}>Upload a leaf photo and click &ldquo;Detect Disease&rdquo;</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3, color: 'var(--green-500)', margin: '0 auto 16px', display: 'block' }} />
              <div style={{ color: 'var(--gray-600)' }}>Analyzing your leaf image…</div>
              <div style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 6 }}>This may take a few seconds</div>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
              {/* Disease hero */}
              <div className="disease-hero">
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>🌿</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>
                    Detected Disease
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>
                    {result.disease}
                  </div>
                  <div style={{ marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
                    Detection Confidence
                  </div>
                  <div className="progress-track" style={{ background: 'rgba(255,255,255,.2)', height: 10 }}>
                    <div className="progress-fill" style={{
                      width: `${(result.confidence * 100).toFixed(0)}%`,
                      background: severityColor(result.confidence),
                    }} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.9)' }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Remedy */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 10, color: 'var(--gray-900)' }}>
                  💊 Treatment &amp; Remedy
                </h3>
                <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {result.remedy}
                </p>
              </div>

              {/* Message */}
              <div className="alert alert-success">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {result.message}
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

        .disease-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }

        .drop-zone {
          border: 2px dashed var(--gray-300);
          border-radius: var(--radius-md);
          padding: 32px 20px;
          cursor: pointer;
          transition: all var(--transition);
          background: var(--gray-50);
          min-height: 180px;
          display: flex; align-items: center; justify-content: center;
        }
        .drop-zone:hover { border-color: var(--green-400); background: var(--green-50); }
        .drop-zone--active { border-color: var(--green-500); background: var(--green-50); border-style: solid; }
        .drop-zone--has-image { padding: 0; background: var(--gray-900); cursor: default; }
        .drop-placeholder { text-align: center; }
        .drop-icon { font-size: 40px; margin-bottom: 10px; }
        .drop-text { font-size: 15px; font-weight: 600; color: var(--gray-700); margin-bottom: 4px; }
        .drop-sub  { font-size: 13px; color: var(--gray-400); }

        .preview-wrap { width: 100%; position: relative; border-radius: var(--radius-md); overflow: hidden; }
        .preview-img { width: 100%; height: 240px; object-fit: cover; display: block; }
        .preview-remove {
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,.6); color: var(--white);
          border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px;
          cursor: pointer;
        }
        .preview-remove:hover { background: rgba(0,0,0,.8); }

        .disease-hero {
          text-align: center;
          padding: 32px 24px;
          background: linear-gradient(135deg, #1a4620 0%, #2d7a33 100%);
          border-radius: var(--radius-lg);
          color: var(--white);
          position: relative;
          overflow: hidden;
        }
        .disease-hero::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/svg%3E");
        }

        @media (max-width: 900px) { .disease-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
