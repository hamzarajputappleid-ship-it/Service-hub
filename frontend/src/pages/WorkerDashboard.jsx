import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { getSocket } from '../utils/socket'
import {
  Briefcase, CalendarDays, CheckCircle, XCircle,
  AlertCircle, Clock, LogOut, Star, Edit3, Save, X
} from 'lucide-react'

const STATUS_CONFIG = {
  PENDING:     { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock,        label: 'Pending' },
  CONFIRMED:   { color: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300',   icon: CheckCircle,  label: 'Confirmed' },
  IN_PROGRESS: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: AlertCircle,  label: 'In Progress' },
  COMPLETED:   { color: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300',  icon: CheckCircle,  label: 'Completed' },
  REJECTED:    { color: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300',    icon: XCircle,      label: 'Rejected' },
  CANCELLED:   { color: 'bg-slate-100  text-slate-600  dark:bg-slate-700     dark:text-slate-300',  icon: XCircle,      label: 'Cancelled' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

function WorkerBookingCard({ booking, onUpdateStatus }) {
  const scheduledDate = booking.scheduledDateTime
    ? new Date(booking.scheduledDateTime).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Date not set'

  const actions = {
    PENDING:     [{ label: 'Confirm', status: 'CONFIRMED', style: 'bg-blue-500 text-white hover:bg-blue-600' }, { label: 'Reject', status: 'REJECTED', style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800' }],
    CONFIRMED:   [{ label: 'Start Job', status: 'IN_PROGRESS', style: 'bg-purple-500 text-white hover:bg-purple-600' }],
    IN_PROGRESS: [{ label: 'Mark Complete', status: 'COMPLETED', style: 'bg-green-500 text-white hover:bg-green-600' }],
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{booking.serviceCategory || 'Service Request'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Client: <span className="font-medium text-slate-700 dark:text-slate-200">{booking.customer?.name || 'Unknown'}</span>
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <CalendarDays className="w-4 h-4" />
            {scheduledDate}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {booking.specialInstructions && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-600">
          "{booking.specialInstructions}"
        </p>
      )}

      {(actions[booking.status] || []).length > 0 && (
        <div className="mt-5 flex gap-3 flex-wrap">
          {(actions[booking.status] || []).map(action => (
            <button
              key={action.status}
              onClick={() => onUpdateStatus(booking.bookingId, action.status)}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition active:scale-95 ${action.style}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkerDashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [activeTab, setActiveTab] = useState('bookings')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    Promise.all([
      api.get('/api/bookings', token),
      api.get('/api/workers/profile', token),
    ]).then(([bookingData, profileData]) => {
      setBookings(Array.isArray(bookingData) ? bookingData : [])
      setProfile(profileData)
      setProfileForm(profileData || {})
    }).finally(() => setIsLoading(false))

    // Socket listeners for real-time booking notifications
    const socket = getSocket(token)
    socket.on('booking_created', (newBooking) => {
      // Only add if it's assigned to this worker
      if (newBooking.workerId === user?.userId) {
        setBookings(prev => [newBooking, ...prev])
      }
    })

    socket.on('booking_status_updated', (updated) => {
      setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? { ...b, ...updated } : b))
    })

    return () => {
      socket.off('booking_created')
      socket.off('booking_status_updated')
    }
  }, [token, navigate])

  const handleUpdateStatus = async (bookingId, status) => {
    await api.patch(`/api/bookings/${bookingId}/status`, { status }, token)
    setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status } : b))
  }

  const handleSaveProfile = async () => {
    const updated = await api.put('/api/workers/profile', profileForm, token)
    setProfile(updated)
    setEditMode(false)
  }

  const handleLogout = () => { logout(); navigate('/') }

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)
  const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']

  const stats = {
    total:    bookings.length,
    pending:  bookings.filter(b => b.status === 'PENDING').length,
    done:     bookings.filter(b => b.status === 'COMPLETED').length,
    rating:   profile?.ratingAverage > 0 ? profile.ratingAverage.toFixed(1) : '—',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Worker Hub, <span className="text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0] || 'Pro'}</span> 🛠️
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your bookings and profile.</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.total,   accent: 'text-slate-900 dark:text-white' },
          { label: 'Pending',  value: stats.pending, accent: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Completed',value: stats.done,    accent: 'text-green-600 dark:text-green-400' },
          { label: 'Rating',   value: stats.rating,  accent: 'text-primary-600 dark:text-primary-400', icon: Star },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 text-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
            {stat.icon && <stat.icon className="w-4 h-4 mx-auto mb-1 fill-current text-yellow-500" />}
            <p className={`text-2xl font-extrabold ${stat.accent}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800 rounded-2xl w-fit">
        {['bookings', 'profile'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl capitalize transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'bookings' ? '📋 Bookings' : '⚙️ Profile'}
          </button>
        ))}
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === s
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>

          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No bookings in this category.</p>
            </div>
          ) : (
            filtered.map(b => <WorkerBookingCard key={b.bookingId} booking={b} onUpdateStatus={handleUpdateStatus} />)
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Worker Profile</h2>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 px-4 py-1.5 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="inline-flex items-center gap-1.5 text-sm bg-primary-500 text-white px-4 py-1.5 rounded-full hover:bg-primary-600 transition">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => { setEditMode(false); setProfileForm(profile || {}) }} className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { key: 'serviceCategory', label: 'Service Category', placeholder: 'e.g. Plumbing' },
              { key: 'serviceArea',     label: 'Service Area',     placeholder: 'e.g. New York, NY' },
              { key: 'pricing',         label: 'Pricing Info',     placeholder: 'e.g. $50/hr or starts from $100' },
              { key: 'availability',    label: 'Availability',     placeholder: 'e.g. Mon-Fri 9am-5pm' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{field.label}</label>
                {editMode ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    placeholder={field.placeholder}
                    value={profileForm[field.key] || ''}
                    onChange={e => setProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-600">
                    {profile?.[field.key] || <span className="text-slate-400 italic">Not set</span>}
                  </p>
                )}
              </div>
            ))}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills & Expertise</label>
              {editMode ? (
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
                  placeholder="Describe your skills, experience and expertise..."
                  value={profileForm.skills || ''}
                  onChange={e => setProfileForm(prev => ({ ...prev, skills: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-600 min-h-[72px]">
                  {profile?.skills || <span className="text-slate-400 italic">No description added yet.</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
