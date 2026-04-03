import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import { Wrench, Mail, Lock, User, ArrowRight, Briefcase, UserCircle } from 'lucide-react'
import { api } from '../utils/api'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ purpose: 'CUSTOMER', name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const data = await api.post('/api/auth/register', {
        role: formData.purpose,
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      if (data.message && !data.token) throw new Error(data.message || 'Registration failed')
      
      login({ id: data.userId, name: data.name, email: data.email, role: data.role }, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary-600">
          <Wrench className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 transition">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors duration-300">
          
          {/* Subtle gradient background decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600" />

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Purpose Toggle / Segmented Control */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">I am looking to...</label>
              <div className="flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-700/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, purpose: 'CUSTOMER'})}
                  className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                    formData.purpose === 'CUSTOMER' 
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-500' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Hire a Pro
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, purpose: 'WORKER'})}
                  className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                    formData.purpose === 'WORKER' 
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-500' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Find Work
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition"
                  placeholder="••••••••"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center w-full">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setIsLoading(true);
                  setError('');
                  try {
                    const data = await api.post('/api/auth/google', { token: credentialResponse.credential });
                    login({ id: data.userId, name: data.name, email: data.email, role: data.role }, data.token);
                    navigate('/dashboard');
                  } catch(err) {
                    setError(err.message || 'Error communicating with Google Login');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onError={() => {
                  setError('Google Authentication Failed');
                }}
                shape="pill"
                size="large"
                text="signup_with"
                logo_alignment="center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
