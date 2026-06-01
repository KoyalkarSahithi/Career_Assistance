import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSelector } from 'react-redux'

import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import QuestionsPage from './pages/QuestionsPage'
import MockInterviewPage from './pages/MockInterviewPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children }) {
  const { token } = useSelector((s) => s.auth)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#f1f1f8',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#16161f' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — inside Layout */}
        <Route
          path="/"
          element={<ProtectedRoute><Layout /></ProtectedRoute>}
        >
          <Route index              element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="upload"     element={<UploadPage />} />
          <Route path="analysis"   element={<AnalysisPage />} />
          <Route path="questions"  element={<QuestionsPage />} />
          <Route path="interview"  element={<MockInterviewPage />} />
          <Route path="profile"    element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
