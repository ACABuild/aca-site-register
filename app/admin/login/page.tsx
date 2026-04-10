'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HardHat, Lock, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Incorrect password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sepia flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
            <Image src="/logo.png" alt="ACA Build" width={120} height={60} className="object-contain" />
          </div>
          <h1 className="text-cream text-xl font-extrabold tracking-wide">Site Register</h1>
          <p className="text-tan text-sm mt-1">Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5 text-sepia">
            <Lock size={18} />
            <span className="font-bold text-carbon">Admin Login</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-carbon mb-1.5">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3 flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading || !password}>
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  )
}
