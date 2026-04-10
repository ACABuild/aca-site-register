'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Plus, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewJobPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    job_number: '',
    name: '',
    address: '',
    description: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.job_number || !form.name || !form.address) {
      setError('Job number, name and address are required.')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const { id } = await res.json()
      router.push(`/admin/jobs/${id}`)
    } else {
      const { error: msg } = await res.json()
      setError(msg || 'Failed to create job.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin/jobs" className="btn-ghost inline-flex items-center gap-1 mb-5 text-sm">
        <ChevronLeft size={16} /> Back to Jobs
      </Link>

      <h1 className="text-2xl font-extrabold text-carbon mb-1">New Job</h1>
      <p className="text-tan text-sm mb-6">Create a site to generate its QR code.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-semibold text-carbon mb-1.5">
            Job Number <span className="text-red-500">*</span>
          </label>
          <input className="input-field" placeholder="e.g. 308"
            value={form.job_number}
            onChange={e => setForm(f => ({ ...f, job_number: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-carbon mb-1.5">
            Job Name / Client <span className="text-red-500">*</span>
          </label>
          <input className="input-field" placeholder="e.g. Adam & Tamar Renovation"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-carbon mb-1.5">
            Site Address <span className="text-red-500">*</span>
          </label>
          <input className="input-field" placeholder="e.g. 12 Smith Street, Bondi NSW 2026"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-carbon mb-1.5">Description (optional)</label>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Brief description of works…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        {error && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18}/> Create Job &amp; Generate QR Code</>}
        </button>
      </form>
    </div>
  )
}
