'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import AddImageForm from '@/components/AddImageForm'
import ImageGrid from '@/components/ImageGrid'

export default function FolderPage() {
  const router = useRouter()
  const params = useParams()
  const folderId = params.id as string
  const [token, setToken] = useState<string | null>(null)
  const [folder, setFolder] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setToken(data.session.access_token)
    })
  }, [router])

  useEffect(() => {
    if (!token) return
    fetchFolder()
  }, [token])

  async function fetchFolder() {
    const res = await fetch(`/api/folders/${folderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setFolder(data.folder)
  }

  async function handleGeneratePdf() {
    if (!token) return
    setGenerating(true)
    await fetch(`/api/folders/${folderId}/generate-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    await fetchFolder()
    setGenerating(false)
  }

  if (!token || !folder) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-4 text-sm">
        &larr; Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{folder.name}</h1>
          {folder.description && <p className="text-gray-400 mt-1">{folder.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {folder.status === 'ready' && folder.pdfUrl && (
            <a
              href={folder.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-gray-600 hover:border-gray-400 text-sm transition"
            >
              Download PDF
            </a>
          )}
          <button
            onClick={handleGeneratePdf}
            disabled={generating || folder.images?.length === 0}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition text-sm"
          >
            {generating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>

      <AddImageForm folderId={folderId} token={token} onAdded={fetchFolder} />

      <div className="mt-8">
        <ImageGrid images={folder.images || []} token={token} onDeleted={fetchFolder} />
      </div>
    </div>
  )
}
