'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface Project {
  id: string
  name: string
  productora?: string
  status?: string
  _count: { categories: number }
}

const STATUS_COLORS: Record<string, string> = {
  desarrollo:    'bg-blue-500',
  preproduccion: 'bg-yellow-500',
  rodaje:        'bg-red-500',
  postpro:       'bg-purple-500',
  entregado:     'bg-green-500',
}

export default function ProductorasPage() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (token) fetchProjects()
  }, [token])

  async function fetchProjects() {
    setLoading(true)
    const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setProjects(data.projects || [])
    setLoading(false)
  }

  function startEdit(project: Project) {
    setEditingId(project.id)
    setEditValue(project.productora || '')
  }

  async function saveEdit(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productora: editValue.trim() || null }),
    })
    setEditingId(null)
    fetchProjects()
  }

  // Group by productora
  const grouped = projects.reduce<Record<string, Project[]>>((acc, p) => {
    const key = p.productora?.trim() || '—'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  // Sort: named productoras first, then "—"
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '—') return 1
    if (b === '—') return -1
    return a.localeCompare(b)
  })

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Productoras</h1>
        <p className="text-gray-500 text-sm mt-1">Proyectos agrupados por productora</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No hay proyectos aún.</p>
          <Link href="/dashboard" className="mt-3 underline text-gray-400 hover:text-white inline-block">
            Ir a proyectos
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortedKeys.map((productora) => (
            <div key={productora}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-300">{productora}</h2>
                <span className="text-gray-700 text-xs">({grouped[productora].length} proyectos)</span>
              </div>
              <div className="flex flex-col gap-2">
                {grouped[productora].map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-800 bg-gray-900"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {p.status && (
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[p.status] || 'bg-gray-600'}`} />
                        )}
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          className="text-sm font-medium hover:text-white transition truncate"
                        >
                          {p.name}
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 ml-3.5">{p._count.categories} categorías</p>
                    </div>

                    {editingId === p.id ? (
                      <div className="flex gap-2 items-center flex-shrink-0">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          placeholder="Nombre de productora"
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(p.id); if (e.key === 'Escape') setEditingId(null) }}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-sm focus:outline-none focus:border-gray-400 w-48"
                        />
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs text-gray-500 hover:text-white transition flex-shrink-0"
                      >
                        Editar productora
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
