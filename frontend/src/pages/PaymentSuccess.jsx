import { useNavigate, useLocation, Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, Home, Calendar, MessageSquare } from 'lucide-react'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const { bookingId, amount, workerName } = location.state || {}

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 text-center space-y-8 animate-in zoom-in-95 duration-500">
        
        <div className="relative">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div className="absolute top-0 right-1/4 animate-ping bg-green-400 w-4 h-4 rounded-full opacity-20"></div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payment Successful!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Thank you for choosing ServiceHub. Your booking with <span className="font-bold text-slate-700 dark:text-slate-200">{workerName || 'the professional'}</span> is confirmed.
          </p>
        </div>

        {amount && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Amount Paid</p>
            <p className="text-2xl font-black text-primary-600 dark:text-primary-400">PKR {amount}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 pt-4">
          <button
            onClick={() => navigate('/customer-dashboard')}
            className="group w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex gap-3">
             <Link 
               to="/"
               className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold py-4 rounded-2xl transition hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
             >
               <Home className="w-4 h-4" /> Home
             </Link>
             <button 
               onClick={() => navigate('/messages')}
               className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl transition hover:opacity-90 flex items-center justify-center gap-2"
             >
               <MessageSquare className="w-4 h-4" /> Chat
             </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
           <p className="text-xs text-slate-400">
             Booking ID: <span className="font-mono text-slate-500">{bookingId || 'N/A'}</span>
           </p>
        </div>
      </div>
    </div>
  )
}
