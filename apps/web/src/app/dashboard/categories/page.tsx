'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface Category {
  id: string
  name: string
  description?: string
  pdfStatus: string
  _count: { images: number }
  project: { id: string; name: string }
}

export default function CategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    if (token) fetchCategories()
  }, [token])

  async function fetchCategories() {
    setLoading(true)
    const res = await fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setCategories(data.categories || [])
    setLoading(false)
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDesc(cat.description || '')
  }

  async function saveEdit(id: string) {
    await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
    })
    setEditingId(null)
    fetchCategories()
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Eliminar categoría "${name}" y todas sus imágenes?`)) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchCategories()
  }

  // Group by project
  const byProject = categories.reduce<Record<string, { project: Category['project']; cats: Category[] }>>(
    (acc, cat) => {
      const key = cat.project.id
      if (!acc[key]) acc[key] = { project: cat.project, cats: [] }
      acc[key].cats.push(cat)
      return acc
    },
    {}
  )

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categorías</h1>
        <p className="text-gray-500 text-sm mt-1">Todas las categorías agrupadas por proyecto</p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No hay categorías aún.</p>
          <Link href="/dashboard" className="mt-3 underline text-gray-400 hover:text-white inline-block">
            Ir a proyectos
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.values(byProject).map(({ project, cats }) => (
            <div key={project.id}>
              <div className="flex items-center gap-2 mb-3">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="text-sm font-semibold text-gray-300 hover:text-white transition"
                >
                  {project.name}
                </Link>
                <span className="text-gray-700 text-xs">({cats.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                {cats.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-800 bg-gray-900"
                  >
                    {editingId === cat.id ? (
                      <div className="flex-1 flex gap-2 flex-wrap">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-sm focus:outline-none focus:border-gray-400"
                        />
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Descripción (opcional)"
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-sm focus:outline-none focus:border-gray-400"
                        />
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-gray-400 hover:text-white text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0">{cat._count.images} imágenes</span>
                        <Link
                          href={`/dashboard/images?categoryId=${cat.id}`}
                          className="text-xs px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500 transition flex-shrink-0"
                        >
                          Ver imágenes
                        </Link>
                        <button
                          onClick={() => startEdit(cat)}
                          className="text-xs text-gray-500 hover:text-white transition flex-shrink-0"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id, cat.name)}
                          className="text-xs text-gray-600 hover:text-red-400 transition flex-shrink-0"
                        >
                          ✕
                        </button>
                      </>
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
