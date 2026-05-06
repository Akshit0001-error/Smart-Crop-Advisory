import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import DashboardPage     from './pages/DashboardPage'
import CropAdvisoryPage  from './pages/CropAdvisoryPage'
import DiseaseDetectionPage from './pages/DiseaseDetectionPage'
import HistoryPage       from './pages/HistoryPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard"        element={<DashboardPage />} />
                  <Route path="/crop-advisory"    element={<CropAdvisoryPage />} />
                  <Route path="/disease-detection" element={<DiseaseDetectionPage />} />
                  <Route path="/history"          element={<HistoryPage />} />
                  <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          <Route index element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
