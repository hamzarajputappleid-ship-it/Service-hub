import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Wrench, Sun, Moon, User, LogOut, LayoutDashboard, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ChatbotWidget from './ChatbotWidget'

export default function Layout() {
  const [isDark, setIsDark] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-primary-200">

      {/* Sleek Glassmorphism Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center hover:opacity-90 transition">
              <img src="/logo.png" alt="ServiceHub" className="h-40 w-auto object-contain" />
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-4 sm:gap-5 text-sm font-medium">

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {user ? (
                <>
                  <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/messages" className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
                    <MessageCircle className="w-4 h-4" /> Messages
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200 max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                    aria-label="Logout"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 transition">Log in</Link>
                  <Link to="/register" className="px-5 py-2 rounded-full bg-primary-500 text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all duration-200">
                    Sign up
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 animate-page">
        <Outlet />
      </main>

      {/* Rich Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-8">
                <img src="/logo.png" alt="ServiceHub" className="h-24 w-auto object-contain" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Pakistan's trusted platform to discover, book, and pay for professional services — all in one place.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Services</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                {['Plumber', 'Electrician', 'Web Developer', 'Civil Engineer'].map(s => (
                  <li key={s} className="hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition">{s}</li>
                ))}
              </ul>
            </div>

            {/* Company — now real links */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition">About Us</Link></li>
                <li><Link to="/blog" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition">Blog</Link></li>
                <li><span className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition">Careers</span></li>
                <li><span className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition">Press</span></li>
              </ul>
            </div>

            {/* Support — now real links */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/report-issue" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition">Report an Issue</Link></li>
                <li><span className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition">Help Center</span></li>
                <li><span className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition">Privacy Policy</span></li>
                <li><span className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition">Terms of Service</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <p>© {new Date().getFullYear()} ServiceHub. All rights reserved. Built by Ibaad ur Rehman.</p>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      {/* Groq Ai Ui — floats on every page */}
      <ChatbotWidget />

    </div>
  )
}
