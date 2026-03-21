import { useState, useEffect, useMemo } from 'react'
import { api } from '../../utils/api'
import { Plus, Edit2, Trash2, Search, X, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react'

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5
      ${type === 'success' ? 'bg-teal-500 text-white shadow-teal-500/25' : 'bg-rose-500 text-white shadow-rose-500/25'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <p className="font-semibold text-sm">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition ml-2"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', icon: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Delete Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  // Toast State
  const [toast, setToast] = useState(null)
  
  const token = localStorage.getItem('serviceHubToken')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await api.get('/api/categories')
      setCategories(data)
    } catch (e) { showToast('Failed to load categories', 'error') }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await api.delete(`/api/categories/${deleteConfirmId}`, token)
      setCategories(prev => prev.filter(c => c.id !== deleteConfirmId))
      showToast('Category deleted successfully')
    } catch (e) { 
      showToast('Failed to delete category', 'error') 
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingId) {
        const updated = await api.put(`/api/categories/${editingId}`, form, token)
        setCategories(prev => prev.map(c => c.id === editingId ? updated : c).sort((a,b) => a.name.localeCompare(b.name)))
        showToast('Category updated successfully')
      } else {
        const created = await api.post('/api/categories', form, token)
        setCategories([...categories, created].sort((a,b) => a.name.localeCompare(b.name)))
        showToast('Category created successfully')
      }
      setIsModalOpen(false)
    } catch (e) { 
      showToast(e.message || 'Failed to save category. Ensure name is unique.', 'error') 
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (cat) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '' })
    setIsModalOpen(true)
  }

  const openNew = () => {
    setEditingId(null)
    setForm({ name: '', description: '', icon: '' })
    setIsModalOpen(true)
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [categories, search])

  return (
    <div className="space-y-8 animate-page">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Service Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage the platform's worker specializations and skills</p>
        </div>
        <button onClick={openNew} className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 text-white font-bold hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> New Category
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-shadow"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No categories found</p>
                    <p className="text-sm mt-1">Adjust your search or add a new service category.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-lg border border-teal-100 dark:border-teal-500/20 shadow-sm">
                          {cat.icon || cat.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-base">{cat.name}</p>
                          <p className="text-xs text-slate-500 sm:hidden mt-0.5 truncate max-w-[200px]">{cat.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-500 truncate max-w-sm">{cat.description || <span className="italic opacity-50">No description provided</span>}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEdit(cat)} 
                          className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(cat.id)} 
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Delete Category?</h3>
            <p className="text-center text-slate-500 mb-8 text-sm">Warning: Deleting a category might affect worker profiles referencing it. Proceed with caution.</p>
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
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {editingId ? 'Edit Category' : 'New Category'}
                  </h2>
                  <p className="text-sm text-slate-500">Define service grouping</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8">
              <form id="cat-form" onSubmit={handleSave} className="space-y-5">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category Name <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g. Plumber, Electrician"
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Display Icon / Emoji</label>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                      {form.icon || (form.name ? form.name.charAt(0) : '?')}
                    </div>
                    <input 
                      value={form.icon} 
                      onChange={e => setForm({...form, icon: e.target.value})} 
                      placeholder="Paste an emoji here (e.g. 🔧, ⚡)"
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition" 
                    />
                  </div>
                  <p className="text-xs text-slate-500 ml-16">Enter an emoji or a Lucide icon string to represent this category visually.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Short Description</label>
                  <textarea 
                    rows={3} 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    placeholder="Briefly describe what this service category entails..."
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition resize-none" 
                  />
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
                form="cat-form" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl font-bold bg-teal-500 text-white hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingId ? 'Save Category' : 'Create Category'}
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
