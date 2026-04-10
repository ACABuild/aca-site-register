import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'
import { Plus, ChevronRight, HardHat, CheckCircle, Archive } from 'lucide-react'

export const revalidate = 30

export default async function JobsPage() {
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  const active    = jobs?.filter(j => j.status === 'active')    || []
  const completed = jobs?.filter(j => j.status === 'completed') || []
  const archived  = jobs?.filter(j => j.status === 'archived')  || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-carbon">All Jobs</h1>
          <p className="text-tan text-sm">{jobs?.length || 0} jobs total</p>
        </div>
        <Link href="/admin/jobs/new" className="bg-sepia text-cream font-semibold px-4 py-2 rounded-xl hover:bg-walnut transition-all flex items-center gap-2 text-sm">
          <Plus size={16} /> New Job
        </Link>
      </div>

      {[
        { label: 'Active',    icon: <HardHat size={15}/>,     color: 'text-sepia',   jobs: active },
        { label: 'Completed', icon: <CheckCircle size={15}/>, color: 'text-green-600', jobs: completed },
        { label: 'Archived',  icon: <Archive size={15}/>,     color: 'text-gray-500', jobs: archived },
      ].map(group => group.jobs.length > 0 && (
        <div key={group.label} className="mb-6">
          <h2 className={`font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-1.5 ${group.color}`}>
            {group.icon} {group.label} ({group.jobs.length})
          </h2>
          <div className="space-y-2">
            {group.jobs.map(job => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}
                className="card flex items-center justify-between hover:shadow-md transition-all group">
                <div>
                  <p className="font-bold text-carbon">{job.name}</p>
                  <p className="text-tan text-sm">#{job.job_number}</p>
                  <p className="text-tan/70 text-xs mt-0.5">{job.address}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xs text-tan/60">Created {formatDateShort(job.created_at)}</p>
                  <ChevronRight size={18} className="text-tan group-hover:text-sepia transition-colors mt-1 ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {(!jobs || jobs.length === 0) && (
        <div className="card text-center py-12">
          <HardHat size={40} className="text-tan mx-auto mb-3" />
          <p className="font-semibold text-carbon">No jobs yet</p>
          <p className="text-tan text-sm mb-4">Create your first job to generate a QR code.</p>
          <Link href="/admin/jobs/new" className="btn-primary inline-flex items-center gap-2 w-auto px-6">
            <Plus size={16} /> Create First Job
          </Link>
        </div>
      )}
    </div>
  )
}
