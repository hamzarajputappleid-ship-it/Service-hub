import { useState, useEffect } from 'react'
import { Calendar, Tag, ArrowRight, X, Clock } from 'lucide-react'
import { api } from '../utils/api'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await api.get('/api/blogs')
      setPosts(data)
    } catch (e) { console.error('Failed to load blog posts') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-12 py-8 animate-page">
      {/* Header */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold border border-primary-100 dark:border-primary-800">
          <Tag className="w-4 h-4" /> ServiceHub Blog
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Tips, Guides & <span className="gradient-text">Updates</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Helpful articles for homeowners, workers, and everyone in between.</p>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-6 opacity-60 pointer-events-none">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-700"></div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid sm:grid-cols-2 gap-6">
          {posts.map(post => (
            <button
              key={post.id}
              onClick={() => setSelected(post)}
              className="text-left bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 transition-all duration-300 group"
            >
              {/* Cover */}
              <div className="h-36 bg-gradient-to-br from-indigo-400 to-purple-500 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_70%,white,transparent)]" />
              </div>
              <div className="p-6 space-y-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{post.category}</span>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-lg leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{post.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 mt-3 pt-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Read article</span>
                </div>
              </div>
            </button>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
              <p>No blog posts published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal post view */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-page" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl hide-scrollbar" onClick={e => e.stopPropagation()}>
            <div className={`h-40 bg-gradient-to-br ${selected.gradient} rounded-t-3xl relative`}>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${selected.categoryColor}`}>{selected.category}</span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">{selected.title}</h1>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selected.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selected.readTime}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{selected.excerpt}</p>
              <hr className="border-slate-100 dark:border-slate-800" />
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">{selected.body}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
