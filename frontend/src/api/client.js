import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach access token to every request ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-refresh on 401 ───────────────────────────────────────────────────
let isRefreshing = false
let queue = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          queue.push({ resolve, reject })
        ).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      isRefreshing = true
      const refresh = localStorage.getItem('refresh_token')

      if (!refresh) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        // Backend URL: /api/auth/token/refresh/ (SimpleJWT default)
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        })
        const newAccess = data.access
        localStorage.setItem('access_token', newAccess)
        // ROTATE_REFRESH_TOKENS=True → backend issues a new refresh token
        // and invalidates the old one. Save it or the next refresh will 401.
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh)
        }
        queue.forEach((p) => p.resolve(newAccess))
        queue = []
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr))
        queue = []
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register/', data),
  login:    (data) => api.post('/api/auth/login/',    data),
  profile:  ()     => api.get('/api/auth/profile/'),
}

// ── Crop ──────────────────────────────────────────────────────────────────
export const cropAPI = {
  predict: (data) => api.post('/api/predict-crop/', data),
  // Backend route: /api/recommendation-history/ (not /api/history/)
  history: ()     => api.get('/api/recommendation-history/'),
}

// ── Disease ───────────────────────────────────────────────────────────────
export const diseaseAPI = {
  detect: (formData) =>
    api.post('/api/detect-disease/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  history: () => api.get('/api/disease-history/'),
}

export default api
