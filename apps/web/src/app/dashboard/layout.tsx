'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Project {
  id: string
  name: string
  status?: string
}

const STATUS_COLORS: Record<string, string> = {
  desarrollo:    'bg-blue-500',
  preproduccion: 'bg-yellow-500',
  rodaje:        'bg-red-500',
  postpro:       'bg-purple-500',
  entregado:     'bg-green-500',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { token, session, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [collapsed, setCollapsed] = useState(false)

  // Redirect to login if no session
  useEffect(() => {
    if (!loading && !session) router.replace('/login')
  }, [loading, session, router])

  // Load projects for sidebar
  useEffect(() => {
    if (!token) return
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
  }, [token])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const navLink = (href: string, label: string, icon: string) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
          ${active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
      >
        <span className="text-base leading-none">{icon}</span>
        {!collapsed && <span>{label}</span>}
      </Link>
    )
  }

  if (loading || !session) return null

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className={`flex flex-col flex-shrink-0 border-r border-gray-800 bg-gray-950 transition-all duration-200
        ${collapsed ? 'w-14' : 'w-56'}`}>

        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-800">
          {!collapsed && (
            <Link href="/dashboard" className="font-bold text-white text-base tracking-tight">
              CarpetArt
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-white p-1 rounded transition ml-auto"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-1 px-2 py-4">
          {navLink('/dashboard', 'Projects', '◫')}
          {navLink('/dashboard/images', 'All Images', '▦')}
          {navLink('/dashboard/categories', 'Categorías', '❏')}
          {navLink('/dashboard/productoras', 'Productoras', '◈')}
        </nav>

        {/* Projects list */}
        {!collapsed && projects.length > 0 && (
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-2">Projects</p>
            <div className="flex flex-col gap-0.5">
              {projects.map((p) => {
                const active = pathname.startsWith(`/dashboard/projects/${p.id}`)
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition
                      ${active ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/40'}`}
                  >
                    {p.status && (
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[p.status] || 'bg-gray-600'}`} />
                    )}
                    <span className="truncate">{p.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom: sign out */}
        <div className="mt-auto px-2 py-4 border-t border-gray-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800/50 transition w-full"
          >
            <span className="text-base leading-none">⎋</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
