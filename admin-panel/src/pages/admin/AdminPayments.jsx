import { useState, useEffect, useMemo } from 'react'
import { api } from '../../utils/api'
import { Search, Calendar, FileText, ArrowUpRight, DollarSign, CreditCard, Activity, ArrowRightLeft } from 'lucide-react'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const data = await api.get('/api/admin/payments', token)
      setPayments(data)
    } catch (e) { console.error('Failed to load payments') }
  }

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = (p.transactionId || '').toLowerCase().includes(search.toLowerCase()) || 
                            (p.booking?.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (p.booking?.worker?.name || '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || p.paymentStatus === statusFilter
      return matchesSearch && matchesStatus
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [payments, search, statusFilter])

  const getTotalRevenue = () => payments.filter(p => p.paymentStatus === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0)
  const getPendingAmount = () => payments.filter(p => p.paymentStatus === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0)
  const getSuccessRate = () => {
    if (payments.length === 0) return 0
    const success = payments.filter(p => p.paymentStatus === 'SUCCESS').length
    return Math.round((success / payments.length) * 100)
  }

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor all platform transactions and revenue streams</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-indigo-100 font-bold uppercase tracking-wider text-xs mb-1">Total Revenue</p>
              <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                <span className="text-2xl text-indigo-200">Rs</span>
                {getTotalRevenue().toLocaleString()}
              </h2>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm border border-white/10">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Pending Clearance</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                <span className="text-xl text-slate-400">Rs</span>
                {getPendingAmount().toLocaleString()}
              </h2>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
              <ClockIcon className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Success Rate</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                {getSuccessRate()}<span className="text-xl text-slate-400">%</span>
              </h2>
            </div>
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-100 dark:border-teal-500/20">
              <Activity className="w-6 h-6 text-teal-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === status 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Transactions' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search TXN ID or Customer name..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parties Involved</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method & Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No transactions found</p>
                    <p className="text-sm mt-1">Adjust your search or status filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.paymentId} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider select-all">{p.transactionId}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            Booking: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">#{p.bookingId.substring(0,8)}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">C</span>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {p.booking?.customer?.name || 'Unknown User'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-900/40 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-[10px] font-bold text-teal-600 dark:text-teal-400">W</span>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {p.booking?.worker?.name || 'Unassigned Worker'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                          <CreditCardIcon type={p.paymentMethod} />
                          {p.paymentMethod}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 ml-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <p className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                          <span className="text-sm text-slate-400 font-medium mr-0.5">Rs</span>
                          {p.amount.toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                          ${p.paymentStatus === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                            p.paymentStatus === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 
                            'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                          {p.paymentStatus}
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

function ClockIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}

function CreditCardIcon({ type }) {
  if (type === 'card' || type === 'stripe') return <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
  return <svg className="w-3.5 h-3.5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
}
