import { useState, useEffect, useMemo } from 'react'
import { api } from '../../utils/api'
import { Plus, Edit2, Trash2, Search, X, Eye, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

// Simple Markdown Previewer for the modal
const MarkdownPreview = ({ content }) => {
  // Very basic parser for bold, italic, lists, and headers
  const parseMarkdown = (text) => {
    let parsed = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 my-2 bg-slate-50 dark:bg-slate-800/50 italic">$1</blockquote>')
      .replace(/\n\n/gim, '<br/><br/>')
    return { __html: parsed }
  }

  return (
    <div 
      className="prose dark:prose-invert prose-sm max-w-none p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[300px]"
      dangerouslySetInnerHTML={parseMarkdown(content || '*No content yet...*')}
    />
  )
}

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5
      ${type === 'success' ? 'bg-indigo-500 text-white shadow-indigo-500/25' : 'bg-rose-500 text-white shadow-rose-500/25'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <p className="font-semibold text-sm">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition ml-2"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', excerpt: '', category: '', body: '' })
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Delete Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  // Toast State
  const [toast, setToast] = useState(null)
  
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const data = await api.get('/api/blogs')
      setBlogs(data)
    } catch (e) { showToast('Failed to load blogs', 'error') }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await api.delete(`/api/blogs/${deleteConfirmId}`, token)
      setBlogs(prev => prev.filter(b => b.id !== deleteConfirmId))
      showToast('Blog deleted successfully')
    } catch (e) { 
      showToast('Failed to delete blog', 'error') 
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingId) {
        const updated = await api.put(`/api/blogs/${editingId}`, form, token)
        setBlogs(prev => prev.map(b => b.id === editingId ? updated : b))
        showToast('Blog updated successfully')
      } else {
        const created = await api.post('/api/blogs', form, token)
        setBlogs([created, ...blogs])
        showToast('Blog published successfully')
      }
      setIsModalOpen(false)
    } catch (e) { 
      showToast('Failed to save blog', 'error') 
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (blog) => {
    setEditingId(blog.id)
    setForm({ title: blog.title, excerpt: blog.excerpt, category: blog.category, body: blog.body })
    setIsPreviewMode(false)
    setIsModalOpen(true)
  }

  const openNew = () => {
    setEditingId(null)
    setForm({ title: '', excerpt: '', category: '', body: '' })
    setIsPreviewMode(false)
    setIsModalOpen(true)
  }

  // Derived state for filters
  const categories = useMemo(() => {
    const cats = new Set(blogs.map(b => b.category).filter(Boolean))
    return ['All', ...Array.from(cats)].sort()
  }, [blogs])

  const filteredBlogs = useMemo(() => {
    return blogs.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || 
                            b.excerpt.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'All' || b.category === activeCategory
      return matchesSearch && matchesCategory
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [blogs, search, activeCategory])

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Blog Articles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage content, announcements, and guides</p>
        </div>
        <button onClick={openNew} className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 text-white font-bold hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> New Article
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles or excerpts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Article Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Published on</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No articles found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or create a new article.</p>
                  </td>
                </tr>
              ) : (
                filteredBlogs.map(blog => (
                  <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white max-w-sm truncate">{blog.title}</p>
                      <p className="text-sm text-slate-500 truncate max-w-sm mt-0.5">{blog.excerpt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                        {blog.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEdit(blog)} 
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(blog.id)} 
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Delete Article?</h3>
            <p className="text-center text-slate-500 mb-8">This action cannot be undone. The article will be permanently removed.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="flex-1 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 py-3 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/25 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {editingId ? 'Edit Article' : 'New Article'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Craft beautifully formatted content</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto hide-scrollbar flex-1">
              <form id="blog-form" onSubmit={handleSave} className="space-y-6">
                
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Article Title</label>
                    <input 
                      required 
                      value={form.title} 
                      onChange={e => setForm({...form, title: e.target.value})} 
                      placeholder="e.g. 10 Tips for Hiring a Plumber"
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category Tag</label>
                    <input 
                      required 
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value})} 
                      placeholder="e.g. Guides"
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Short Excerpt</label>
                  <textarea 
                    required 
                    rows={2} 
                    value={form.excerpt} 
                    onChange={e => setForm({...form, excerpt: e.target.value})} 
                    placeholder="A quick summary that appears on the blog cards..."
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-none" 
                  />
                </div>

                {/* Editor / Preview Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Content</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button 
                        type="button" 
                        onClick={() => setIsPreviewMode(false)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${!isPreviewMode ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <span className="flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5"/> Write</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsPreviewMode(true)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${isPreviewMode ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Preview</span>
                      </button>
                    </div>
                  </div>
                  
                  {isPreviewMode ? (
                    <MarkdownPreview content={form.body} />
                  ) : (
                    <textarea 
                      required 
                      rows={12} 
                      value={form.body} 
                      onChange={e => setForm({...form, body: e.target.value})} 
                      placeholder="Write your article in Markdown. Use # for headings, ** for bold, etc."
                      className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition" 
                    />
                  )}
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-[2.5rem]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="blog-form" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingId ? 'Save Changes' : 'Publish Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
