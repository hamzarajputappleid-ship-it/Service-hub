import { useState, useEffect } from 'react'
import { Users, Briefcase, Calendar, CheckCircle, TrendingUp, TrendingDown, Sparkles, Activity } from 'lucide-react'
import { api } from '../../utils/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    api.get('/api/admin/stats', token).then(setStats).catch(console.error)
  }, [token])

  if (!stats) return (
    <div className="space-y-6">
      <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>)}
      </div>
    </div>
  )

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.totalUsers, growth: stats.growthRates?.users || 0, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' },
    { label: 'Verified Workers', value: stats.totalWorkers, growth: stats.growthRates?.workers || 0, icon: Briefcase, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-100 dark:border-teal-500/20' },
    { label: 'Total Bookings', value: stats.totalBookings, growth: stats.growthRates?.bookings || 0, icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
    { label: 'Completed Jobs', value: stats.bookingsByStatus?.find(s => s.status === 'COMPLETED')?._count || 0, growth: stats.growthRates?.completedJobs || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
  ]

  // Build doughnut data
  const statusLabels = (stats.bookingsByStatus || []).map(s => s.status)
  const statusCounts = (stats.bookingsByStatus || []).map(s => s._count)
  const STATUS_COLORS = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', IN_PROGRESS: '#8b5cf6',
    COMPLETED: '#10b981', CANCELLED: '#94a3b8', REJECTED: '#ef4444'
  }

  const isDarkMode = document.documentElement.classList.contains('dark')

  const doughnutData = {
    labels: statusLabels.length ? statusLabels : ['No Data'],
    datasets: [{
      data: statusCounts.length ? statusCounts : [1],
      backgroundColor: statusLabels.length
        ? statusLabels.map(s => STATUS_COLORS[s] || '#94a3b8')
        : ['#e2e8f0'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }

  // Bar chart
  const barData = {
    labels: statusLabels.length ? statusLabels : ['No Data'],
    datasets: [{
      label: 'Bookings',
      data: statusCounts.length ? statusCounts : [0],
      backgroundColor: statusLabels.length
        ? statusLabels.map(s => (STATUS_COLORS[s] || '#94a3b8') + 'e6')
        : ['#e2e8f0'],
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 40,
    }]
  }

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
        bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: { label: ctx => ` ${ctx.parsed.y ?? ctx.parsed} bookings` } 
      }
    },
    scales: { 
      x: { 
        grid: { display: false },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { family: 'inherit', weight: 600 } }
      }, 
      y: { 
        beginAtZero: true, 
        grid: { color: isDarkMode ? '#334155' : '#f1f5f9', drawBorder: false },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { family: 'inherit' }, stepSize: 1 }
      } 
    }
  }

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { 
        position: 'right', 
        labels: { 
          color: isDarkMode ? '#94a3b8' : '#475569',
          padding: 20, 
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'inherit', size: 12, weight: 600 } 
        } 
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
        bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
      }
    }
  }

  return (
    <div className="space-y-8 animate-page">
      
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span className="text-indigo-100 font-bold tracking-wider text-sm uppercase">Overview</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Platform Dashboard</h1>
            <p className="text-indigo-100 max-w-xl text-sm sm:text-base">Monitor real-time statistics, track user growth, and manage service bookings across the entire ServiceHub ecosystem.</p>
          </div>
          <div className="hidden lg:flex items-center gap-4 bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
             <Activity className="w-8 h-8 text-emerald-400" />
             <div>
               <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider mb-0.5">System Status</p>
               <p className="font-bold flex items-center gap-2">
                 <span className="relative flex h-2.5 w-2.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                 </span>
                 All Systems Operational
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map(({ label, value, growth, icon: Icon, color, bg, border }) => {
          const isPositive = growth >= 0;
          return (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center border ${border} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} 
                  {isPositive ? '+' : ''}{growth}%
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value.toLocaleString()}</p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Booking Volume</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Distribution across all booking states</p>
          </div>
          <div className="h-72">
            <Bar data={barData} options={chartOpts} />
          </div>
        </div>

        {/* Doughnut chart */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Status Breakdown</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Relative share of each status</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="h-64 w-full">
              <Doughnut data={doughnutData} options={doughnutOpts} />
            </div>
            {/* Center Text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2 lg:-ml-[100px]">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalBookings}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
