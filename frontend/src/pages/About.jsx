import { Link } from 'react-router-dom'
import { Wrench, Shield, Zap, Star, Users, MapPin, Award, ArrowRight, CheckCircle } from 'lucide-react'

const STATS = [
  { label: 'Registered Workers', value: '500+', icon: Users },
  { label: 'Cities Covered', value: '12', icon: MapPin },
  { label: 'Bookings Completed', value: '3,200+', icon: CheckCircle },
  { label: 'Average Rating', value: '4.8★', icon: Star },
]

const FEATURES = [
  {
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    title: 'Instant Booking',
    desc: 'Search, compare, and book a verified professional within minutes. No waiting, no calls — all done online.'
  },
  {
    icon: Shield,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    title: 'Verified Professionals',
    desc: 'Every worker on ServiceHub goes through a profile verification process. Only skilled, trustworthy pros make it through.'
  },
  {
    icon: Award,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    title: 'Secure Payments (PKR)',
    desc: 'Pay safely in Pakistani Rupees via Stripe. Your money is held securely until the job is done to your satisfaction.'
  },
]

const TEAM = [
  { name: 'Hamza Hanif', role: 'CEO & Founder', initial: 'H', color: 'from-teal-400 to-teal-600' },
  { name: 'Ibaad ur Rehman', role: 'CTO', initial: 'I', color: 'from-purple-400 to-purple-600' },
  { name: 'Farhan Ahmad', role: 'CMO', initial: 'F', color: 'from-blue-400 to-blue-600' },
]

export default function About() {
  return (
    <div className="flex flex-col gap-20 py-8 animate-page">

      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold border border-primary-100 dark:border-primary-800">
          <Wrench className="w-4 h-4" /> About ServiceHub
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pakistan's Most Trusted <span className="gradient-text">Service Platform</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          ServiceHub connects homeowners and businesses with skilled professionals across Pakistan. We're building the future of local service discovery — one booking at a time.
        </p>
        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary-500 text-white font-semibold hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200">
          Join ServiceHub <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-center border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <Icon className="w-7 h-7 text-primary-500 mx-auto mb-3" />
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Our Mission</h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            We started ServiceHub to solve a real problem — finding a reliable plumber, electrician, or web developer in Pakistan shouldn't take days of calling around and hoping for the best.
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Our platform puts trust, transparency, and convenience first. Customers get verified professionals with real reviews. Workers get a steady stream of clients and a professional profile to showcase their skills.
          </p>
          <ul className="space-y-2">
            {['Verified professional profiles', 'Real-time messaging', 'Secure PKR payments via Stripe', 'Ratings & reviews after every job'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className={`${title === 'Verified Professionals' ? 'col-span-2' : ''} bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow`}>
              <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="text-center space-y-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Meet the Team</h2>
          <p className="text-slate-500 dark:text-slate-400">The people building Pakistan's service economy</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {TEAM.map(({ name, role, initial, color }) => (
            <div key={name} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-52 text-center border border-slate-100 dark:border-slate-700 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>{initial}</div>
              <p className="font-bold text-slate-900 dark:text-white">{name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-10 text-center text-white space-y-5">
        <h2 className="text-3xl font-extrabold">Ready to get started?</h2>
        <p className="text-primary-100 max-w-md mx-auto">Join thousands of Pakistanis already using ServiceHub to find and hire professionals.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="px-8 py-3 rounded-full bg-white text-primary-600 font-bold hover:bg-primary-50 transition">
            Sign Up Free
          </Link>
          <Link to="/" className="px-8 py-3 rounded-full border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition">
            Browse Services
          </Link>
        </div>
      </section>
    </div>
  )
}
