import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [ready, setReady]     = useState(false)

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setReady(true); return }
    authAPI.profile()
      .then(({ data }) => setUser(data))
      .catch(() => { clearSession() })
      .finally(() => setReady(true))
  }, [])

  function saveSession(tokens, userData) {
    localStorage.setItem('access_token',  tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function clearSession() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, password })
      saveSession(data.tokens, data.user)
      return { ok: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const { data } = await authAPI.register(payload)
      saveSession(data.tokens, data.user)
      return { ok: true }
    } catch (err) {
      const errs = err.response?.data || {}
      const msg  = Object.values(errs).flat().join(' ') || 'Registration failed.'
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => { clearSession() }, [])

  return (
    <AuthContext.Provider value={{ user, loading, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
