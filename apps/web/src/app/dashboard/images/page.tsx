'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import AddImagePanel from '@/components/AddImagePanel'

interface Project { id: string; name: string }
interface Category { id: string; name: string; project: { id: string; name: string } }
interface Image {
  id: string
  sourceUrl: string
  storedUrl?: string
  description?: string
  status: string
  sortOrder: number
  createdAt: string
  category: { id: string; name: string; project: { id: string; name: string } }
}

function ImagesPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initProject = params.get('projectId') || ''
  const initCategory = params.get('categoryId') || ''
  const initAdd = params.get('add') === '1'

  const [token, setToken] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [filterProject, setFilterProject] = useState(initProject)
  const [filterCategory, setFilterCategory] = useState(initCategory)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(initAdd)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfTitle, setPdfTitle] = useState('Custom Selection')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setToken(data.session.access_token)
    })
  }, [router])

  useEffect(() => { if (token) { fetchProjects(); fetchCategories() } }, [token])
  useEffect(() => { if (token) fetchImages() }, [token, filterProject, filterCategory])

  // When project filter changes, reset category filter and refetch categories
  useEffect(() => {
    if (!filterProject) return
    setFilterCategory('')
    if (token) fetchCategories(filterProject)
  }, [filterProject])

  async function fetchProjects() {
    const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setProjects(data.projects || [])
  }

  async function fetchCategories(projectId?: string) {
    const qs = projectId ? `?projectId=${projectId}` : ''
    const res = await fetch(`/api/categories${qs}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setCategories(data.categories || [])
  }

  async function fetchImages() {
    setLoading(true)
    const qs = new URLSearchParams()
    if (filterCategory) qs.set('categoryId', filterCategory)
    else if (filterProject) qs.set('projectId', filterProject)
    const res = await fetch(`/api/images?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setImages(data.images || [])
    setSelected(new Set())
    setLoading(false)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const visible = filtered.map((i) => i.id)
    if (visible.every((id) => selected.has(id))) {
      setSelected((prev) => { const n = new Set(prev); visible.forEach((id) => n.delete(id)); return n })
    } else {
      setSelected((prev) => { const n = new Set(prev); visible.forEach((id) => n.add(id)); return n })
    }
  }

  async function generateSelectionPdf() {
    if (!token || selected.size === 0) return
    setGeneratingPdf(true)
    setPdfUrl(null)
    const res = await fetch('/api/images/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ imageIds: Array.from(selected), title: pdfTitle }),
    })
    const data = await res.json()
    if (data.pdfUrl) setPdfUrl(data.pdfUrl)
    setGeneratingPdf(false)
  }

  async function deleteImage(id: string) {
    if (!token) return
    await fetch(`/api/images/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchImages()
  }

  const filtered = images.filter((img) => {
    if (filterStatus && img.status !== filterStatus) return false
    return true
  })

  const visibleIds = filtered.map((i) => i.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Images</h1>
          <p className="text-gray-400 text-sm mt-1">{images.length} total · {filtered.length} shown · {selected.size} selected</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowAdd(true); setPdfUrl(null) }}
            className="px-5 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 text-sm transition">
            + Add Image
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.project.name} / {c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="downloading">Downloading</option>
          <option value="stored">Stored</option>
          <option value="error">Error</option>
        </select>
        {(filterProject || filterCategory || filterStatus) && (
          <button onClick={() => { setFilterProject(''); setFilterCategory(''); setFilterStatus('') }}
            className="px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition">
            Clear filters
          </button>
        )}
      </div>

      {/* Selection actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <input
            type="text" value={pdfTitle} onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="PDF title"
            className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-sm focus:outline-none"
          />
          <button onClick={generateSelectionPdf} disabled={generatingPdf}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 text-sm transition">
            {generatingPdf ? 'Generating PDF...' : 'Generate PDF from selection'}
          </button>
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-green-700 text-green-400 hover:border-green-500 text-sm transition">
              Download PDF
            </a>
          )}
          <button onClick={() => setSelected(new Set())} className="text-gray-500 hover:text-white text-sm">Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 py-12 text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 py-20 text-center">No images found. Try adjusting filters or add some images.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="rounded bg-gray-700 border-gray-600 cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left w-16">Preview</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((img) => (
                <ImageRow
                  key={img.id}
                  img={img}
                  selected={selected.has(img.id)}
                  onToggle={() => toggleSelect(img.id)}
                  onDelete={() => deleteImage(img.id)}
                  token={token!}
                  onUpdated={fetchImages}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Image panel */}
      {showAdd && (
        <AddImagePanel
          token={token!}
          projects={projects}
          categories={categories}
          defaultCategoryId={filterCategory}
          defaultProjectId={filterProject}
          onClose={() => setShowAdd(false)}
          onAdded={fetchImages}
          onCategoryCreated={() => fetchCategories(filterProject || undefined)}
        />
      )}
    </div>
  )
}

function ImageRow({ img, selected, onToggle, onDelete, token, onUpdated }: {
  img: Image; selected: boolean; onToggle: () => void; onDelete: () => void; token: string; onUpdated: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(img.description || '')

  async function saveDesc() {
    await fetch(`/api/images/${img.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description: desc }),
    })
    setEditing(false)
    onUpdated()
  }

  const statusColors: Record<string, string> = {
    pending: 'text-gray-400',
    downloading: 'text-yellow-400',
    stored: 'text-green-400',
    error: 'text-red-400',
  }

  return (
    <tr className={`hover:bg-gray-900/50 transition ${selected ? 'bg-gray-900/70' : ''}`}>
      <td className="px-4 py-3">
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="rounded bg-gray-700 border-gray-600 cursor-pointer" />
      </td>
      <td className="px-4 py-3">
        {img.storedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.storedUrl} alt="" className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 rounded bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
            {img.status === 'error' ? '!' : '…'}
          </div>
        )}
      </td>
      <td className="px-4 py-3 max-w-[200px]">
        {editing ? (
          <div className="flex gap-2 items-center">
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
              autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveDesc(); if (e.key === 'Escape') setEditing(false) }}
              className="flex-1 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none"
            />
            <button onClick={saveDesc} className="text-green-400 text-xs">Save</button>
            <button onClick={() => setEditing(false)} className="text-gray-500 text-xs">✕</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-left w-full group">
            <span className="text-gray-300 group-hover:text-white">
              {img.description || <span className="text-gray-600 italic">Add description…</span>}
            </span>
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{img.category.project.name}</td>
      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{img.category.name}</td>
      <td className="px-4 py-3">
        <span className={`font-medium ${statusColors[img.status] || 'text-gray-400'}`}>{img.status}</span>
        {img.status === 'error' && (
          <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="block text-xs text-gray-600 hover:text-gray-400 truncate max-w-[140px]" title={img.sourceUrl}>
            {img.sourceUrl}
          </a>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {img.storedUrl && (
            <a href={img.storedUrl} target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-white text-xs">View</a>
          )}
          <button onClick={onDelete} className="text-gray-600 hover:text-red-400 text-xs">Delete</button>
        </div>
      </td>
    </tr>
  )
}

export default function ImagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>}>
      <ImagesPageInner />
    </Suspense>
  )
}
