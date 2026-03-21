import { useState, useEffect, useMemo } from 'react'
import { api } from '../../utils/api'
import { LogIn, LogOut, Search, Activity, UserCircle2, Shield, Briefcase, Calendar } from 'lucide-react'

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL') // ALL, LOGIN, LOGOUT
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const data = await api.get('/api/admin/activity', token)
      setLogs(data)
    } catch (e) { console.error(e) }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = l.user.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.user.email.toLowerCase().includes(search.toLowerCase())
      const matchFilter = activeFilter === 'ALL' || l.action === activeFilter
      return matchSearch && matchFilter
    })
  }, [logs, search, activeFilter])

  const getRoleIcon = (role) => {
    if (role === 'ADMIN') return <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
    if (role === 'WORKER') return <Briefcase className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
    return <UserCircle2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
  }

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Activity Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor authentication events across the platform</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
          {['ALL', 'LOGIN', 'LOGOUT'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === filter 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {filter === 'ALL' ? 'All Activity' : filter.charAt(0) + filter.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client IP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No activity logs found</p>
                    <p className="text-sm mt-1">Logs will appear here when users authenticate.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      {log.action === 'LOGIN' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                          <LogIn className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Sign In</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          <LogOut className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {log.user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{log.user.name}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                              ${log.user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 
                                log.user.role === 'WORKER' ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400' : 
                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                              {getRoleIcon(log.user.role)}
                              {log.user.role}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{log.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        {log.ipAddress || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
