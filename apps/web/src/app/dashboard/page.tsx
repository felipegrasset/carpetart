'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  productora?: string
  startDate?: string
  endDate?: string
  status?: string
  createdAt: string
  _count: { categories: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newProductora, setNewProductora] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setToken(data.session.access_token)
    })
  }, [router])

  useEffect(() => {
    if (!token) return
    fetchProjects()
  }, [token])

  async function fetchProjects() {
    const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setProjects(data.projects || [])
    setLoading(false)
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !token) return
    setCreating(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        productora: newProductora.trim() || undefined,
        startDate: newStartDate || undefined,
        endDate: newEndDate || undefined,
        status: newStatus || undefined,
      }),
    })
    const data = await res.json()
    setCreating(false)
    setShowForm(false)
    setNewName('')
    setNewDesc('')
    setNewProductora('')
    setNewStartDate('')
    setNewEndDate('')
    setNewStatus('')
    if (data.project) router.push(`/dashboard/projects/${data.project.id}`)
  }

  if (!token) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">Each project has its own categories and reference images</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/images" className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-sm transition">
            All Images
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
          >
            + New Project
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">No projects yet</p>
          <p className="text-sm">Create a project to start organizing your reference images</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="block p-5 rounded-xl border border-gray-800 hover:border-gray-600 bg-gray-900 transition"
            >
              <h2 className="font-semibold text-lg leading-tight">{p.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {p.productora && <span className="text-gray-500 text-xs">{p.productora}</span>}
                {p.status && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{p.status}</span>}
              </div>
              {(p.startDate || p.endDate) && (
                <p className="text-gray-600 text-xs mt-1">
                  {p.startDate ? new Date(p.startDate).toLocaleDateString() : '?'}
                  {' → '}
                  {p.endDate ? new Date(p.endDate).toLocaleDateString() : '?'}
                </p>
              )}
              {p.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{p.description}</p>}
              <p className="text-gray-600 text-xs mt-3">{p._count.categories} categories</p>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-6">New Project</h2>
            <form onSubmit={createProject} className="flex flex-col gap-4">
              <input
                type="text" placeholder="Project name *" value={newName}
                onChange={(e) => setNewName(e.target.value)} required autoFocus
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Production company" value={newProductora}
                  onChange={(e) => setNewProductora(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 text-sm"
                />
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 text-sm text-gray-300"
                >
                  <option value="">Status (optional)</option>
                  <option value="desarrollo">Desarrollo</option>
                  <option value="preproduccion">Preproducción</option>
                  <option value="rodaje">Rodaje</option>
                  <option value="postpro">Postproducción</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Start date</label>
                  <input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">End date</label>
                  <input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 text-sm" />
                </div>
              </div>
              <textarea
                placeholder="Description (optional)" value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)} rows={2}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
                >
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
