'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  jobId: string
  currentStatus: string
}

export default function JobStatusToggle({ jobId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setLoading(true)
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setStatus(newStatus)
    setLoading(false)
    router.refresh()
  }

  const colors: Record<string, string> = {
    active:    'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    archived:  'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${colors[status] || colors.active} appearance-none`}
    >
      <option value="active">● Active</option>
      <option value="completed">✓ Completed</option>
      <option value="archived">○ Archived</option>
    </select>
  )
}
