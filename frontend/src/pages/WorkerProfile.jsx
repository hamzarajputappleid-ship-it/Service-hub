import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  UserCircle, Star, MapPin, BadgeCheck, MessageSquare, 
  Calendar, Briefcase, ChevronLeft, ShieldCheck, Clock,
  X, MapPinned, Info, CreditCard, Banknote
} from 'lucide-react'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'

function BookingModal({ isOpen, onClose, onConfirm, workerName, category }) {
  const [address, setAddress] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [instructions, setInstructions] = useState('')
  const [paymentMode, setPaymentMode] = useState('PAY_LATER')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onConfirm({
      serviceAddress: address,
      scheduledDateTime: dateTime,
      specialInstructions: instructions,
      paymentMode: paymentMode
    })
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Book {workerName}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-primary-500" /> Service Location
              </label>
              <input
                required
                type="text"
                placeholder="Full address where service is needed"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-inner"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" /> Date & Time
                </label>
                <input
                  required
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-inner"
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary-500" /> Special Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Tell the professional more about the job..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-inner resize-none"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Choose Payment Option</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('PAY_LATER')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    paymentMode === 'PAY_LATER' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'
                  }`}
                >
                  <Banknote className={`w-6 h-6 ${paymentMode === 'PAY_LATER' ? 'text-primary-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${paymentMode === 'PAY_LATER' ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500'}`}>Pay Later</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('PAY_NOW')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    paymentMode === 'PAY_NOW' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMode === 'PAY_NOW' ? 'text-primary-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${paymentMode === 'PAY_NOW' ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500'}`}>Pay Now</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-primary-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-t border-slate-100 dark:border-slate-800">
           <p className="text-xs text-slate-400 text-center">By confirming, you agree to our terms of service. You will only pay once the professional confirms the details.</p>
        </div>
      </div>
    </div>
  )
}

export default function WorkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  useEffect(() => {
    api.get(`/api/workers/${id}`)
      .then(data => setWorker(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleMessage = () => {
    if (!user) {
      navigate('/login')
      return
    }
    // Redirect to messages. In a real app, you might want to auto-initiate a conversation
    navigate('/messages', { state: { startWith: worker.userId, name: worker.user?.name } })
  }

  const handleConfirmBooking = async (details) => {
    if (!user) { navigate('/login'); return }
    
    // Extract base price number from worker's string (e.g., "PKR 5,000" -> 5000), default 5000
    const parsedPrice = parseInt(worker.pricing?.replace(/\D/g, ''), 10);
    const baseAmount = !isNaN(parsedPrice) ? parsedPrice : 5000;

    try {
      const response = await api.post('/api/bookings', {
        workerId: worker.userId,
        serviceCategory: worker.serviceCategory,
        estimatedCost: baseAmount,
        ...details
      }, token)
      setIsBookingModalOpen(false)
      
      if (details.paymentMode === 'PAY_NOW') {
        navigate(`/payment?bookingId=${response.bookingId}&amount=${baseAmount}&workerName=${worker.user?.name}`)
      } else {
        navigate('/payment-success', { state: { bookingId: response.bookingId, workerName: worker.user?.name } })
      }
    } catch (err) {
      alert('Failed to create booking: ' + err.message)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      <p className="text-slate-500 animate-pulse">Loading professional profile...</p>
    </div>
  )

  if (error || !worker) return (
    <div className="text-center py-20 px-4">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">!</div>
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Profile Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">We couldn't find the worker profile you're looking for. It might have been removed or the link is incorrect.</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl hover:bg-slate-200 transition-all font-semibold">
        <ChevronLeft className="w-5 h-5" /> Back to Home
      </Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors group">
        <ChevronLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-[2rem] flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl transition-transform duration-500 group-hover:scale-105">
                <UserCircle className="w-20 h-20" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg">
                <BadgeCheck className="w-5 h-5" />
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {worker.user?.name}
            </h1>
            <p className="text-primary-600 dark:text-primary-400 font-semibold mt-1">
              {worker.serviceCategory}
            </p>

            <div className="mt-4 flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-1.5 rounded-2xl font-bold">
              <Star className="w-4 h-4 fill-current" />
              <span>{worker.ratingAverage > 0 ? worker.ratingAverage.toFixed(1) : 'New Pro'}</span>
            </div>

            <div className="w-full mt-8 space-y-3">
              <button 
                onClick={handleMessage}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-4 rounded-3xl font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:-translate-y-1 transition-all active:scale-95"
              >
                <MessageSquare className="w-5 h-5" /> Message Pro
              </button>
              <button 
                onClick={() => user ? setIsBookingModalOpen(true) : navigate('/login')}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-3xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
              >
                <Calendar className="w-5 h-5" /> Book Now
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 underline decoration-primary-500/30 decoration-4 underline-offset-4">
               Service Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 mt-2">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Service Area</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{worker.serviceArea || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Starting From</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{worker.pricing || 'Contact for rates'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Availability</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{worker.availability || 'Weekdays'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 lg:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              About This Professional
            </h2>
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
              {worker.skills || "This professional hasn't added a detailed description yet, but they are ready to help with your project! Click 'Message' to get more information or discuss your needs directly."}
            </div>
            
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-5 rounded-3xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 flex gap-4 items-start">
                  <ShieldCheck className="w-6 h-6 text-primary-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Verified Expert</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Identity and background checked for your safety.</p>
                  </div>
               </div>
               <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 flex gap-4 items-start">
                  <Star className="w-6 h-6 text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Top Rated</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Consistently receives positive feedback from clients.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 lg:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Client Reviews</h2>
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
               <div className="text-5xl">⭐</div>
               <p className="text-sm font-medium">No reviews yet for this professional.</p>
               <p className="text-xs">Be the first to share your experience after booking!</p>
            </div>
          </div>
        </div>

      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        onConfirm={handleConfirmBooking}
        workerName={worker.user?.name}
        category={worker.serviceCategory}
      />
    </div>
  )
}
