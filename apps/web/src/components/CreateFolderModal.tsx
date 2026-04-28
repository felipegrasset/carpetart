'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateFolderModal({ token, onClose }: { token: string; onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    onClose()
    router.push(`/dashboard/folders/${data.folder.id}`)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold mb-6">New Concept Folder</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Concept name (e.g. Noir Lighting)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400 resize-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
