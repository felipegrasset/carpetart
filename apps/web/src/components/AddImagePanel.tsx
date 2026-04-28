'use client'
import { useState } from 'react'

interface Project { id: string; name: string }
interface Category { id: string; name: string; project: { id: string; name: string } }

export default function AddImagePanel({
  token,
  projects,
  categories,
  defaultProjectId,
  defaultCategoryId,
  onClose,
  onAdded,
  onCategoryCreated,
}: {
  token: string
  projects: Project[]
  categories: Category[]
  defaultProjectId?: string
  defaultCategoryId?: string
  onClose: () => void
  onAdded: () => void
  onCategoryCreated: () => void
}) {
  const [sourceUrl, setSourceUrl] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(0)

  // Inline category creation
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)

  const filteredCategories = projectId
    ? categories.filter((c) => c.project.id === projectId)
    : categories

  async function createCategory() {
    if (!newCatName.trim() || !projectId) return
    setCreatingCat(true)
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newCatName.trim(), projectId }),
    })
    const data = await res.json()
    setCreatingCat(false)
    if (data.category) {
      onCategoryCreated()
      setCategoryId(data.category.id)
      setShowNewCat(false)
      setNewCatName('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!sourceUrl.trim()) return
    if (!categoryId) { setError('Select a category'); return }
    setLoading(true)
    const res = await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sourceUrl: sourceUrl.trim(),
        description: description.trim() || undefined,
        categoryId,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setSourceUrl('')
    setDescription('')
    setSuccess((n) => n + 1)
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-gray-950 border-l border-gray-800 flex flex-col h-full overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h2 className="text-xl font-bold">Add Image</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6 flex-1">
          {/* Image URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400">Image URL <span className="text-red-400">*</span></label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
              autoFocus
              className="px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400">Description <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              placeholder="Brief annotation for this reference…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
            />
          </div>

          {/* Project */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400">Project <span className="text-red-400">*</span></label>
            <select
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setCategoryId('') }}
              className="px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
            >
              <option value="">— Select project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Category <span className="text-red-400">*</span></label>
              {projectId && (
                <button
                  type="button"
                  onClick={() => setShowNewCat((v) => !v)}
                  className="text-xs text-gray-500 hover:text-white transition"
                >
                  {showNewCat ? 'Cancel' : '+ New category'}
                </button>
              )}
            </div>

            {showNewCat ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCategory() } }}
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
                />
                <button
                  type="button"
                  onClick={createCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm disabled:opacity-50 transition"
                >
                  {creatingCat ? '…' : 'Create'}
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!projectId}
                className="px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-gray-500 text-sm disabled:opacity-40"
              >
                <option value="">— Select category —</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {success > 0 && (
            <p className="text-green-400 text-sm">
              ✓ {success} image{success > 1 ? 's' : ''} added — keeps downloading in background
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition text-sm"
            >
              {loading ? 'Adding…' : 'Add Image'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-lg border border-gray-700 hover:border-gray-500 text-sm transition"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
