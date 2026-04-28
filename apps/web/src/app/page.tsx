import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">CarpetArt</h1>
      <p className="text-gray-400 max-w-md text-lg">
        Paste image URLs, group them by concept, generate a reference PDF for your audiovisual production.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-200 transition"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg border border-gray-600 hover:border-gray-400 transition"
        >
          Dashboard
        </Link>
      </div>
    </main>
  )
}
