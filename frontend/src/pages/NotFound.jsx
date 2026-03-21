import { Link } from 'react-router-dom'
import { Wrench, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-page">
      {/* Huge 404 number */}
      <div className="relative mb-6">
        <p className="text-[140px] sm:text-[180px] font-extrabold text-slate-100 dark:text-slate-800 leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center">
            <Wrench className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
        Page Not Found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        Looks like this page took a day off. The professional you're looking for might have moved or doesn't exist.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white font-semibold hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200"
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  )
}
