import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { ShieldCheck, CreditCard, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

// Stripe element styling for light/dark modes
const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '16px',
      color: '#1e293b',
      '::placeholder': { color: '#94a3b8' },
      iconColor: '#0ea5e9',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
}

function PKRFormatter(amount) {
  return new Intl.NumberFormat('ur-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount)
}

function CheckoutForm({ bookingId, amount, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const { token } = useAuth()
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [cardholderName, setCardholderName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setStatus('loading')
    setErrorMsg('')

    try {
      // 1. Create PaymentIntent on backend
      const { clientSecret, error: serverError } = await api.post('/api/payments/create-intent', { bookingId, amount }, token)
      if (serverError || !clientSecret) throw new Error(serverError || 'Failed to initialize payment')

      // 2. Confirm payment with Stripe
      const cardNumberElement = elements.getElement(CardNumberElement)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: { name: cardholderName },
        },
      })

      if (error) throw new Error(error.message)

      // 3. Confirm on backend to update DB
      await api.post('/api/payments/confirm', { bookingId, paymentIntentId: paymentIntent.id }, token)

      setStatus('success')
      onSuccess && onSuccess()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Payment failed. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Payment Successful!</h2>
        <p className="text-slate-500 dark:text-slate-400">
          {PKRFormatter(amount)} has been charged. Your booking is confirmed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Amount summary */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-600">
        <span className="text-slate-600 dark:text-slate-300 font-medium">Total Amount</span>
        <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{PKRFormatter(amount)}</span>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cardholder Name</label>
        <input
          type="text"
          value={cardholderName}
          onChange={e => setCardholderName(e.target.value)}
          placeholder="Name as on card"
          required
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
        />
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Card Number</label>
        <div className="flex items-center gap-3 px-4 py-3.5 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500 transition">
          <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="flex-1">
            <CardNumberElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Expiry Date</label>
          <div className="px-4 py-3.5 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500 transition">
            <CardExpiryElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">CVC</label>
          <div className="px-4 py-3.5 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500 transition">
            <CardCvcElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || status === 'loading'}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-3xl bg-primary-500 text-white font-bold text-base hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200 active:scale-95"
      >
        {status === 'loading' ? (
          <><Loader className="w-5 h-5 animate-spin" /> Processing...</>
        ) : (
          <><Lock className="w-5 h-5" /> Pay {PKRFormatter(amount)} Securely</>
        )}
      </button>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <ShieldCheck className="w-4 h-4" />
        Secured by Stripe · 256-bit SSL encryption · PKR
      </div>
    </form>
  )
}

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token } = useAuth()

  const bookingId = searchParams.get('bookingId')
  const amount = parseFloat(searchParams.get('amount') || '0')

  useEffect(() => {
    if (!token) navigate('/login')
    if (!bookingId || !amount) navigate('/dashboard')
  }, [token, bookingId, amount, navigate])

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
          <CreditCard className="w-7 h-7 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Secure Checkout</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Payment processed securely via Stripe</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20">

        <Elements stripe={stripePromise}>
          <CheckoutForm
            bookingId={bookingId}
            amount={amount}
            onSuccess={() => navigate('/dashboard')}
          />
        </Elements>
      </div>
    </div>
  )
}
