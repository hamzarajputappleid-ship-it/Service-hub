import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import {
  Search, Star, ArrowRight, UserCircle,
  Wrench, Zap, Globe, HardHat, Paintbrush, Scissors,
  Truck, BookOpen, Camera, ChefHat, HeartPulse, Home as HomeIcon,
  Leaf, Monitor, Shield, Sofa, Car, Baby, Dumbbell, PenTool
} from 'lucide-react'

// Reusable Highlighter Component for font aesthetics
const Highlight = ({ children }) => (
  <span className="relative inline-block px-2 mx-1 mt-1 font-bold text-slate-900 dark:text-white z-10 before:absolute before:-inset-1 before:bg-primary-300/40 before:rounded-lg before:-skew-x-6 before:-z-10">
    {children}
  </span>
)

// Full catalogue of service categories with dedicated icons & accent colors
const ALL_CATEGORIES = [
  { name: 'Plumber',          icon: Wrench,      color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'Electrician',      icon: Zap,         color: 'text-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { name: 'Web Developer',    icon: Globe,       color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { name: 'Civil Engineer',   icon: HardHat,     color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { name: 'Painter',          icon: Paintbrush,  color: 'text-pink-500',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { name: 'Barber & Salon',   icon: Scissors,    color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'Moving & Delivery',icon: Truck,       color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-700/50' },
  { name: 'Tutor',            icon: BookOpen,    color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { name: 'Photographer',     icon: Camera,      color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { name: 'Catering & Chef',  icon: ChefHat,     color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { name: 'Healthcare',       icon: HeartPulse,  color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
  { name: 'Home Renovation',  icon: HomeIcon,    color: 'text-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { name: 'Gardening',        icon: Leaf,        color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-900/20' },
  { name: 'IT Support',       icon: Monitor,     color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { name: 'Security',         icon: Shield,      color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-700/50' },
  { name: 'Interior Design',  icon: Sofa,        color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
  { name: 'Auto Mechanic',    icon: Car,         color: 'text-zinc-500',    bg: 'bg-zinc-100 dark:bg-zinc-800' },
  { name: 'Babysitter',       icon: Baby,        color: 'text-pink-400',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { name: 'Personal Trainer', icon: Dumbbell,    color: 'text-lime-600',    bg: 'bg-lime-50 dark:bg-lime-900/20' },
  { name: 'Graphic Designer', icon: PenTool,     color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-900/20' },
]

export default function Home() {
  const [workers, setWorkers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    api.get('/api/workers')
      .then(data => setWorkers(Array.isArray(data) ? data : []))
      .catch(() => setWorkers([]))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredCategories = ALL_CATEGORIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-16 py-8">
      
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-8 mt-10">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-800 dark:text-white transition-colors duration-300">
          Find the perfect <Highlight>professional</Highlight> for any job.
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
          Connect with trusted experts in your area. From plumbing to web design, easily 
          discover, book, and review top-rated talent with a <Highlight>guaranteed</Highlight> smooth experience.
        </p>
        
        {/* Search Bar (Highly Rounded) */}
        <div className="relative max-w-xl mx-auto mt-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 text-lg transition-all"
            placeholder="What service do you need?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Categories Grid (Highly Rounded Components) */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-bold tracking-tight">Popular <Highlight>Categories</Highlight></h2>
        </div>
        
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="min-w-[160px] h-36 bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse snap-start"></div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-4 px-2 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {filteredCategories.length > 0 ? filteredCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <div
                  key={cat.name}
                  className="snap-start shrink-0 w-40 group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-xl hover:scale-110 hover:-translate-y-2 hover:border-primary-300 dark:hover:border-primary-500 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-700/30 dark:to-slate-800" />
                  {/* Colored icon background circle */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 z-10 ${cat.bg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-7 h-7 ${cat.color}`} />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-center text-sm z-10 leading-snug">{cat.name}</span>
                </div>
              )
            }) : (
              <div className="w-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                No categories match "<strong>{searchQuery}</strong>"
              </div>
            )}
          </div>
        )}
      </section>

      {/* Featured Pro Workers Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Featured <Highlight>Pros</Highlight></h2>
        
        <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {isLoading ? (
             [...Array(3)].map((_, i) => (
              <div key={i} className="shrink-0 w-[85vw] sm:w-[400px] h-64 bg-slate-200 rounded-3xl animate-pulse snap-center"></div>
            ))
          ) : workers.slice(0, 6).map((worker) => (
            <div key={worker.userId} className="snap-center shrink-0 w-[85vw] sm:w-[400px] flex flex-col p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center text-slate-400 dark:text-slate-300">
                    <UserCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{worker.user?.name || 'Unknown Pro'}</h3>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 inline-block px-2 py-0.5 rounded-lg mt-1">
                      {worker.serviceCategory}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-xl font-bold text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {worker.ratingAverage > 0 ? worker.ratingAverage.toFixed(1) : 'New'}
                </div>
              </div>

              <div className="mt-4 flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {worker.skills || "This professional hasn't added a description to their profile yet."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                    {worker.pricing || 'Rate not set'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                <span className="text-sm text-slate-500 dark:text-slate-400">{worker.serviceArea || 'Remote / Local'}</span>
                <Link to={'/worker/' + worker.workerId} className="flex items-center text-primary-600 font-semibold group-hover:text-primary-800 transition-colors">
                  View Profile <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
