import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Wrench, LayoutDashboard, Users, FileText, Tags, CreditCard, LogOut, Shield, Menu, X, Sun, Moon, Activity, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users & Workers', icon: Users },
  { path: '/admin/activity', label: 'Activity Logs', icon: Activity },
  { path: '/admin/blogs', label: 'Manage Blogs', icon: FileText },
  { path: '/admin/categories', label: 'Service Categories', icon: Tags },
  { path: '/admin/payments', label: 'Transactions', icon: CreditCard },
  { path: '/admin/bookings', label: 'Manage Bookings', icon: Calendar },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  // Security Check: Kick out non-admins
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role !== 'ADMIN') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const handleLogout = async () => {
    try {
      if (localStorage.getItem('serviceHubToken')) {
        await api('/api/activity/logout', localStorage.getItem('serviceHubToken'), 'POST')
      }
    } catch (e) { console.warn("Failed to log out activity but clearing local session", e) }
    logout()
    navigate('/login')
  }

  // Prevent render if not admin (avoids flash of admin content before redirect kicks in)
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans tracking-tight transition-colors duration-300">
      
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 h-full w-72 bg-slate-900 dark:bg-black text-slate-300 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5 text-white group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-wide">Admin<span className="font-normal text-indigo-400">Hub</span></span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <span className="font-bold text-indigo-400">{user.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-400' : 'opacity-70'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2 shrink-0">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            {isDark ? <Sun className="w-4.5 h-4.5 opacity-70" /> : <Moon className="w-4.5 h-4.5 opacity-70" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors group"
          >
            <LogOut className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors duration-300 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] dark:shadow-none">
        
        {/* Top Header Mobile Toggle */}
        <header className="h-16 lg:hidden flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-lg tracking-tight">Admin<span className="font-normal text-slate-900 dark:text-white">Hub</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto animate-page">
            <Outlet />
          </div>
        </main>
      </div>
      
    </div>
  )
}
