import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, CheckCircle, Send } from 'lucide-react'

import { api } from '../utils/api'

const ISSUE_TYPES = [
  { value: 'PAYMENT', label: '💳 Payment Issue' },
  { value: 'BOOKING', label: '📅 Booking Problem' },
  { value: 'WORKER', label: '👷 Worker Complaint' },
  { value: 'ACCOUNT', label: '🔐 Account / Login' },
  { value: 'APP_BUG', label: '🐛 App Bug / Error' },
  { value: 'OTHER', label: '💬 Other' },
]

export default function ReportIssue() {
  const { user } = useAuth()
  const [form, setForm] = useState({ type: '', subject: '', description: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.type || !form.subject || !form.description) {
      setError('Please fill in all fields.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await api.post('/api/support/report', { ...form, userId: user?.userId })
      setTicket(data)
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (ticket) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center animate-page space-y-5">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Ticket Submitted!</h1>
        <p className="text-slate-500 dark:text-slate-400">Our support team will review your report and get back to you within 24 hours.</p>
        <div className="inline-block px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 mb-1">Your Ticket ID</p>
          <p className="font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">{ticket.ticketId}</p>
        </div>
        <button
          onClick={() => { setTicket(null); setForm({ type: '', subject: '', description: '' }) }}
          className="block mx-auto text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2"
        >
          Submit another report
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 animate-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Report an Issue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">We take every report seriously. We'll respond within 24 hours.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 space-y-6 shadow-sm">

        {/* Issue Type */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Issue Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISSUE_TYPES.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm(f => ({ ...f, type: value }))}
                className={`px-3 py-2.5 rounded-2xl border text-sm text-left transition-all
                  ${form.type === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subject *</label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={form.subject}
            onChange={handleChange}
            placeholder="Short summary of your issue"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description *</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the issue in detail — what happened, when, and any relevant booking/payment IDs..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Report</>
          )}
        </button>

        <p className="text-xs text-center text-slate-400">
          {user ? `Reporting as ${user.name} (${user.email})` : 'Reporting anonymously — log in to track your ticket status.'}
        </p>
      </form>
    </div>
  )
}
