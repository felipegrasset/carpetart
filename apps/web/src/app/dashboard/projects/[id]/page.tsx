'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description?: string
  pdfStatus: string
  pdfUrl?: string
  _count: { images: number }
}

interface Project {
  id: string
  name: string
  description?: string
  productora?: string
  startDate?: string
  endDate?: string
  status?: string
  categories: Category[]
}

export default function ProjectPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [token, setToken] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [catDesc, setCatDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setToken(data.session.access_token)
    })
  }, [router])

  useEffect(() => { if (token) fetchProject() }, [token])

  async function fetchProject() {
    const res = await fetch(`/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setProject(data.project)
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim() || !token) return
    setCreating(true)
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined, projectId: id }),
    })
    setCreating(false)
    setShowCatForm(false)
    setCatName('')
    setCatDesc('')
    fetchProject()
  }

  async function generateProjectPdf() {
    if (!token) return
    setGeneratingPdf(true)
    const res = await fetch(`/api/projects/${id}/generate-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.pdfUrl) setPdfUrl(data.pdfUrl)
    setGeneratingPdf(false)
  }

  async function deleteProject() {
    if (!token || !confirm('Delete this project and all its categories and images?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    router.push('/dashboard')
  }

  if (!project) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-white text-sm mb-6">&larr; Projects</button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {project.productora && <span className="text-gray-500 text-sm">{project.productora}</span>}
            {project.status && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{project.status}</span>
            )}
          </div>
          {(project.startDate || project.endDate) && (
            <p className="text-gray-600 text-xs mt-1">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '?'}
              {' → '}
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : '?'}
            </p>
          )}
          {project.description && <p className="text-gray-400 mt-2 text-sm">{project.description}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-green-700 text-green-400 hover:border-green-500 text-sm transition">
              Download PDF
            </a>
          )}
          <button onClick={generateProjectPdf} disabled={generatingPdf}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 text-sm transition">
            {generatingPdf ? 'Generating...' : 'Generate Project PDF'}
          </button>
          <Link href={`/dashboard/images?projectId=${id}`}
            className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-sm transition">
            View Images
          </Link>
          <button onClick={() => setShowCatForm(true)}
            className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-sm transition">
            + Category
          </button>
          <button onClick={deleteProject} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
        </div>
      </div>

      {project.categories.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No categories yet.</p>
          <button onClick={() => setShowCatForm(true)} className="mt-3 underline text-gray-400 hover:text-white">Create the first one</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.categories.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} projectId={id} token={token!} onRefresh={fetchProject} />
          ))}
        </div>
      )}

      {showCatForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-6">New Category</h2>
            <form onSubmit={createCategory} className="flex flex-col gap-4">
              <input type="text" placeholder="Category name (e.g. Lighting)" value={catName}
                onChange={(e) => setCatName(e.target.value)} required autoFocus
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400"
              />
              <textarea placeholder="Description (optional)" value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)} rows={2}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCatForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryCard({ cat, projectId, token, onRefresh }: { cat: Category; projectId: string; token: string; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(cat.pdfUrl || null)

  async function generateCategoryPdf() {
    setGenerating(true)
    const res = await fetch(`/api/categories/${cat.id}/generate-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.pdfUrl) setPdfUrl(data.pdfUrl)
    setGenerating(false)
  }

  async function deleteCategory() {
    if (!confirm(`Delete category "${cat.name}" and all its images?`)) return
    await fetch(`/api/categories/${cat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    onRefresh()
  }

  return (
    <div className="p-5 rounded-xl border border-gray-800 bg-gray-900 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{cat.name}</h3>
          {cat.description && <p className="text-gray-400 text-xs mt-0.5">{cat.description}</p>}
          <p className="text-gray-600 text-xs mt-1">{cat._count.images} images</p>
        </div>
        <button onClick={deleteCategory} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link href={`/dashboard/images?projectId=${projectId}&categoryId=${cat.id}`}
          className="px-3 py-1 rounded border border-gray-700 hover:border-gray-500 text-xs transition">
          View Images
        </Link>
        <Link href={`/dashboard/images?categoryId=${cat.id}&add=1`}
          className="px-3 py-1 rounded border border-gray-700 hover:border-gray-500 text-xs transition">
          + Add Image
        </Link>
        <button onClick={generateCategoryPdf} disabled={generating}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-xs transition">
          {generating ? 'Generating...' : 'PDF'}
        </button>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1 rounded border border-green-800 text-green-400 hover:border-green-600 text-xs transition">
            Download
          </a>
        )}
      </div>
    </div>
  )
}
