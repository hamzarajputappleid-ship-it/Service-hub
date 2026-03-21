import { useState, useEffect, useMemo } from 'react'
import { api } from '../../utils/api'
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Filter, FileText, ChevronRight, Briefcase } from 'lucide-react'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const data = await api.get('/api/admin/bookings', token) // Admin can see all bookings
      setBookings(data)
    } catch (e) { console.error(e) }
  }

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = (b.customer?.name || '').toLowerCase().includes(search.toLowerCase()) || 
                            (b.worker?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            b.bookingId.toLowerCase().includes(search.toLowerCase()) ||
                            b.serviceCategory.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter
      return matchesSearch && matchesStatus
    }).sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime))
  }, [bookings, search, statusFilter])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
      case 'CANCELLED': 
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30'
      case 'CONFIRMED': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30'
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-3.5 h-3.5" />
      case 'CANCELLED': 
      case 'REJECTED': return <XCircle className="w-3.5 h-3.5" />
      case 'IN_PROGRESS': return <Clock className="w-3.5 h-3.5 animate-pulse" />
      case 'CONFIRMED': return <CheckCircle className="w-3.5 h-3.5" />
      default: return <Clock className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Booking Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor all service bookings across the platform</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar scroll-smooth">
          {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === status 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Bookings' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="relative w-full xl:w-80 flex-shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search category, ID, name..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Booking Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parties Involved</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status & Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No bookings found</p>
                    <p className="text-sm mt-1">Try adjusting your search criteria or status filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.bookingId} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-base">{b.serviceCategory}</p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5 bg-slate-100 dark:bg-slate-800 inline-block px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            #{b.bookingId.slice(0,8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">C</span>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {b.customer?.name || 'Unknown User'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-900/40 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-[10px] font-bold text-teal-600 dark:text-teal-400">W</span>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {b.worker?.name || 'Unassigned Worker'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(b.scheduledDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 ml-[1.125rem]">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(b.scheduledDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(b.status)}`}>
                          {getStatusIcon(b.status)}
                          {b.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                          {b.paymentMode === 'PAY_NOW' ? '💳 Pay Now' : '💵 Pay Later'}
                        </div>
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
