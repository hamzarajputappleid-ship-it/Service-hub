import { useState, useEffect, useMemo } from 'react'
import { api } from '../../utils/api'
import { Search, ShieldAlert, CheckCircle, Ban, Clock, Users, Shield, Briefcase, UserCircle2, AlertCircle, CheckCircle2, X } from 'lucide-react'

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5
      ${type === 'success' ? 'bg-indigo-500 text-white shadow-indigo-500/25' : 'bg-rose-500 text-white shadow-rose-500/25'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <p className="font-semibold text-sm">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition ml-2"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [activeRole, setActiveRole] = useState('ALL')
  const [toast, setToast] = useState(null)
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/admin/users', token)
      setUsers(data)
    } catch (e) { showToast('Failed to load users', 'error') }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const toggleStatus = async (userId, currentStatus) => {
    // Optimistic UI update
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setUsers(prev => prev.map(u => u.userId === userId ? { ...u, status: newStatus } : u))
    
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: newStatus }, token)
      showToast(`User account ${newStatus.toLowerCase()} successfully`)
    } catch (e) { 
      // Revert on failure
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, status: currentStatus } : u))
      showToast('Failed to update status', 'error') 
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = activeRole === 'ALL' || u.role === activeRole
      return matchSearch && matchRole
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [users, search, activeRole])

  const isOnline = (lastActiveAt) => {
    if (!lastActiveAt) return false
    const minsSinceActive = (new Date() - new Date(lastActiveAt)) / 1000 / 60
    return minsSinceActive < 15
  }

  const getRoleIcon = (role) => {
    if (role === 'ADMIN') return <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
    if (role === 'WORKER') return <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
    return <UserCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
  }

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage, suspend, and review all accounts</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
          {['ALL', 'CUSTOMER', 'WORKER', 'ADMIN'].map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeRole === role 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {role === 'ALL' ? 'All Users' : role.charAt(0) + role.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search matching names, emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Online Presence</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Restrict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No users found</p>
                    <p className="text-sm mt-1">Try adjusting your search criteria or role filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const online = isOnline(u.lastActiveAt)
                  return (
                    <tr key={u.userId} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group ${u.status === 'SUSPENDED' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                            ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                              u.role === 'WORKER' ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {u.name}
                              {u.status === 'SUSPENDED' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 uppercase">Suspended</span>}
                            </p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border
                          ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30' : 
                            u.role === 'WORKER' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/30' : 
                            'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                          {getRoleIcon(u.role)}
                          {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {online ? (
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              Online Now
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border border-slate-400 dark:border-slate-500" />
                              Offline
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {u.lastActiveAt ? `Last active: ${new Date(u.lastActiveAt).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}` : 'Never logged in'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'ADMIN' ? (
                          <button
                            onClick={() => toggleStatus(u.userId, u.status)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border
                              ${u.status === 'ACTIVE' 
                                ? 'text-rose-600 bg-white border-rose-200 hover:bg-rose-50 dark:bg-transparent dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10' 
                                : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/20'}`}
                          >
                            {u.status === 'ACTIVE' ? <><Ban className="w-4 h-4" /> Suspend</> : <><CheckCircle className="w-4 h-4" /> Activate</>}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 opacity-50 uppercase tracking-widest px-4">Protected</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
