import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { getSocket } from '../utils/socket'
import {
  CalendarDays, Clock, CheckCircle, XCircle, AlertCircle,
  Search, LogOut, User, Plus, Star, CreditCard
} from 'lucide-react'

const STATUS_CONFIG = {
  PENDING:     { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock,        label: 'Pending' },
  CONFIRMED:   { color: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300',   icon: CheckCircle,  label: 'Confirmed' },
  IN_PROGRESS: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: AlertCircle,  label: 'In Progress' },
  COMPLETED:   { color: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300',  icon: CheckCircle,  label: 'Completed' },
  REJECTED:    { color: 'bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300',    icon: XCircle,      label: 'Rejected' },
  CANCELLED:   { color: 'bg-slate-100  text-slate-600  dark:bg-slate-700     dark:text-slate-300',  icon: XCircle,      label: 'Cancelled' },
}

function ReviewModal({ isOpen, onClose, onSubmit, booking }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-black mb-2 dark:text-white">Leave a Review</h2>
        <p className="text-sm text-slate-500 mb-6">How was your experience with {booking.worker?.user?.name}?</p>
        
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`transition-all ${rating >= star ? 'text-yellow-400 scale-110' : 'text-slate-200 dark:text-slate-700'}`}
            >
              <Star className="w-10 h-10 fill-current" />
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          placeholder="Write your feedback here..."
          className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-6 resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
          <button 
            onClick={() => onSubmit(rating, comment)}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 transition active:scale-95"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
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

function BookingCard({ booking, onCancel, onReview }) {
  const scheduledDate = booking.scheduledDateTime
    ? new Date(booking.scheduledDateTime).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Date not set'

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {booking.worker?.serviceCategory || 'Service'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Worker: <span className="font-medium text-slate-700 dark:text-slate-200">{booking.worker?.user?.name || 'Unknown'}</span>
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

      <div className="mt-5 flex gap-3 flex-wrap">
        {booking.status === 'PENDING' && (
          <button
            onClick={() => onCancel(booking.bookingId)}
            className="text-sm font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-1.5 rounded-full transition"
          >
            Cancel Booking
          </button>
        )}
        {booking.status === 'CONFIRMED' && (
          <Link
            to={`/payment?bookingId=${booking.bookingId}&amount=${booking.estimatedCost || 5000}`}
            className="text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 px-4 py-1.5 rounded-full transition inline-flex items-center gap-1.5 active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" /> Pay Now (PKR)
          </Link>
        )}
        {booking.status === 'COMPLETED' && !booking.rating && (
          <button
            onClick={() => onReview(booking)}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-4 py-1.5 rounded-full transition inline-flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Leave a Review
          </button>
        )}
        {booking.status === 'COMPLETED' && booking.rating && (
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
             <CheckCircle className="w-3 h-3" /> Review Left
          </span>
        )}
      </div>
    </div>
  )
}

export default function CustomerDashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isReviewModalOpen, setReviewModalOpen] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    
    // Fetch initial list
    api.get('/api/bookings', token)
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setIsLoading(false))

    // Socket listeners for real-time status updates
    const socket = getSocket(token)
    socket.on('booking_status_updated', (updated) => {
      setBookings(prev => prev.map(b => b.bookingId === updated.bookingId ? { ...b, ...updated } : b))
    })

    return () => {
      socket.off('booking_status_updated')
    }
  }, [token, navigate])

  const handleCancel = async (bookingId) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status: 'CANCELLED' }, token)
      setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status: 'CANCELLED' } : b))
    } catch (e) { alert('Failed to cancel: ' + e.message) }
  }

  const handleReviewSubmit = async (ratingScore, reviewText) => {
    try {
      const response = await api.post(`/api/ratings`, {
        bookingId: selectedBooking.bookingId,
        ratingScore,
        reviewText
      }, token)
      
      // Update local state to reflect the new rating
      setBookings(prev => prev.map(b => 
        b.bookingId === selectedBooking.bookingId ? { ...b, rating: response } : b
      ))
      setReviewModalOpen(false)
    } catch (e) { alert('Failed to submit review: ' + e.message) }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)
  const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

  const stats = {
    total:  bookings.length,
    active: bookings.filter(b => ['PENDING','CONFIRMED','IN_PROGRESS'].includes(b.status)).length,
    done:   bookings.filter(b => b.status === 'COMPLETED').length,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hey, <span className="text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here are your bookings and activity.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Book a Pro
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings', value: stats.total, accent: 'text-slate-900 dark:text-white' },
          { label: 'Active',         value: stats.active, accent: 'text-blue-600 dark:text-blue-400' },
          { label: 'Completed',      value: stats.done,   accent: 'text-green-600 dark:text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 text-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
            <p className={`text-3xl font-extrabold ${stat.accent}`}>{stat.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === s
                ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-300'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No bookings found.</p>
            <Link to="/" className="text-primary-500 hover:underline text-sm mt-2 block">Find a professional →</Link>
          </div>
        ) : (
          filtered.map(booking => (
            <BookingCard 
              key={booking.bookingId} 
              booking={booking} 
              onCancel={handleCancel} 
              onReview={(b) => { setSelectedBooking(b); setReviewModalOpen(true) }}
            />
          ))
        )}
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        booking={selectedBooking || {}}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}
