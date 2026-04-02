import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import WorkerDashboard from './pages/WorkerDashboard'
import Messages from './pages/Messages'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import NotFound from './pages/NotFound'
import About from './pages/About'
import Blog from './pages/Blog'
import ReportIssue from './pages/ReportIssue'
import WorkerProfile from './pages/WorkerProfile'
import Search from './pages/Search'

function DashboardRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-80 text-slate-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  // Admins go to the new Admin Panel router (on port 5174)
  if (user.role === 'ADMIN') {
    window.location.href = 'http://localhost:5174/'
    return null
  }
  return user.role === 'WORKER' ? <Navigate to="/worker-dashboard" replace /> : <Navigate to="/customer-dashboard" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main User App Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="customer-dashboard" element={<CustomerDashboard />} />
            <Route path="worker-dashboard" element={<WorkerDashboard />} />
            <Route path="search" element={<Search />} />
            <Route path="messages" element={<Messages />} />
            <Route path="payment" element={<Payment />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="about" element={<About />} />
            <Route path="blog" element={<Blog />} />
            <Route path="report-issue" element={<ReportIssue />} />
            <Route path="worker/:id" element={<WorkerProfile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
