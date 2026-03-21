import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Admin Panel Imports
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminActivityLogs from './pages/admin/AdminActivityLogs'
import AdminBlogs from './pages/admin/AdminBlogs'
import AdminCategories from './pages/admin/AdminCategories'
import AdminPayments from './pages/admin/AdminPayments'
import AdminBookings from './pages/admin/AdminBookings'
import AdminLogin from './pages/admin/AdminLogin'

// Add a login guard specific to the admin app
function AdminGuard({ children }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    // If we have a token in localStorage, it's still loading the user state
    if (localStorage.getItem('serviceHubToken')) {
      return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading Admin...</div>
    }
  }
  
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          {/* Redirect root to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          
          {/* Secure Admin Panel Layout */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="activity" element={<AdminActivityLogs />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="bookings" element={<AdminBookings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
