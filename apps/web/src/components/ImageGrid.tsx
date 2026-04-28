'use client'

interface Image {
  id: string
  sourceUrl: string
  storedUrl?: string
  status: string
  sortOrder: number
  mimeType?: string
}

export default function ImageGrid({
  images,
  token,
  onDeleted,
}: {
  images: Image[]
  token: string
  onDeleted: () => void
}) {
  if (images.length === 0) {
    return (
      <p className="text-gray-500 text-center py-16">
        No images yet. Paste a URL above to add the first one.
      </p>
    )
  }

  async function handleDelete(id: string) {
    await fetch(`/api/images/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onDeleted()
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {images.map((img) => (
        <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-800 aspect-square">
          {img.storedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.storedUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <StatusIndicator status={img.status} />
            </div>
          )}
          <button
            onClick={() => handleDelete(img.id)}
            className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
          >
            Remove
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-gray-300 truncate opacity-0 group-hover:opacity-100 transition">
            {img.sourceUrl}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusIndicator({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Queued...',
    downloading: 'Downloading...',
    stored: 'Ready',
    error: 'Error',
  }
  const colors: Record<string, string> = {
    pending: 'text-gray-400',
    downloading: 'text-yellow-400',
    stored: 'text-green-400',
    error: 'text-red-400',
  }
  return (
    <span className={`text-sm font-medium ${colors[status] || 'text-gray-400'}`}>
      {labels[status] || status}
    </span>
  )
}
