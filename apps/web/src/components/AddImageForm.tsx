'use client'
import { useState } from 'react'

export default function AddImageForm({
  folderId,
  token,
  onAdded,
}: {
  folderId: string
  token: string
  onAdded: () => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/folders/${folderId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sourceUrl: url.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setUrl('')
    setLoading(false)
    onAdded()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="url"
        placeholder="Paste image URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition whitespace-nowrap"
      >
        {loading ? 'Adding...' : 'Add Image'}
      </button>
      {error && <p className="text-red-400 text-sm self-center">{error}</p>}
    </form>
  )
}
