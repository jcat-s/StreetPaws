import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth'
import AdminNavbar from './components/AdminNavbar'
import AdminDashboard from './pages/AdminDashboard'
import ReportsManagement from './pages/ReportsManagement'
import AdoptionsManagement from './pages/AdoptionsManagement'
import AnimalsManagement from './pages/AnimalsManagement'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import AdminSettings from './pages/AdminSettings'
import AdminLoginModal from './authentication/AdminLoginModal'
import { useState } from 'react'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useAdminAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">Please log in with your admin credentials to access the StreetPaws admin panel.</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Admin Login
            </button>
          </div>
        </div>
        <AdminLoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    )
  }

  return <>{children}</>
}

// Admin Layout Component
const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

// Main Admin App Component
const AdminAppContent = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/reports" element={<ReportsManagement />} />
        <Route path="/adoptions" element={<AdoptionsManagement />} />
        <Route path="/animals" element={<AnimalsManagement />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}

// Root Admin App Component
const AdminApp = () => {
  return (
    <AdminAuthProvider>
      <ProtectedRoute>
        <AdminAppContent />
      </ProtectedRoute>
    </AdminAuthProvider>
  )
}

export default AdminApp

