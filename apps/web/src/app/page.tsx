'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LandingPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (session) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [session, loading, router])

  return null
}
