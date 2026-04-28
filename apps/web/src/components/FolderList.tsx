'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Folder {
  id: string
  name: string
  description?: string
  status: string
  pdfUrl?: string
  createdAt: string
  _count: { images: number }
}

export default function FolderList({ token }: { token: string }) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchFolders() {
    const res = await fetch('/api/folders', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setFolders(data.folders || [])
    setLoading(false)
  }

  useEffect(() => { fetchFolders() }, [])

  if (loading) return <p className="text-gray-400">Loading folders...</p>
  if (folders.length === 0) return (
    <p className="text-gray-500 text-center py-20">
      No folders yet. Create one to start building your reference collection.
    </p>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {folders.map((folder) => (
        <Link
          key={folder.id}
          href={`/dashboard/folders/${folder.id}`}
          className="block p-5 rounded-xl border border-gray-800 hover:border-gray-600 bg-gray-900 transition"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-semibold text-lg">{folder.name}</h2>
            <StatusBadge status={folder.status} />
          </div>
          {folder.description && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{folder.description}</p>
          )}
          <p className="text-gray-500 text-xs mt-3">{folder._count.images} images</p>
        </Link>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-700 text-gray-300',
    generating: 'bg-yellow-900 text-yellow-300',
    ready: 'bg-green-900 text-green-300',
    error: 'bg-red-900 text-red-300',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
