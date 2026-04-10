import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)
import Link from 'next/link'
import { formatDate, timeAgo } from '@/lib/utils'
import {
  HardHat, Users, FileText, AlertTriangle,
  CheckCircle, Clock, Plus, ChevronRight, Camera
} from 'lucide-react'

export const revalidate = 30

async function getDashboardData() {
  const [jobsRes, signinsRes, docsRes] = await Promise.all([
    supabaseAdmin.from('jobs').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('signins').select('*, jobs(name, job_number)').eq('status', 'on_site').order('signed_in_at', { ascending: false }),
    supabaseAdmin.from('documents').select('id, doc_type, signin_id').gte('uploaded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  return {
    jobs: jobsRes.data || [],
    onSite: signinsRes.data || [],
    recentDocs: docsRes.data || [],
  }
}

export default async function AdminDashboard() {
  const { jobs, onSite, recentDocs } = await getDashboardData()

  const activeJobs = jobs.filter(j => j.status === 'active')
  const licenceCount   = recentDocs.filter(d => d.doc_type === 'licence').length
  const insuranceCount = recentDocs.filter(d => d.doc_type === 'insurance').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-carbon">Dashboard</h1>
          <p className="text-tan text-sm">Live site compliance overview</p>
        </div>
        <Link href="/admin/jobs/new" className="bg-sepia text-cream font-semibold px-4 py-2 rounded-xl hover:bg-walnut transition-all flex items-center gap-2 text-sm">
          <Plus size={16} /> New Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Jobs',  value: activeJobs.length,    icon: <HardHat size={20}/>,     color: 'bg-sepia' },
          { label: 'On Site Now',  value: onSite.length,        icon: <Users size={20}/>,       color: 'bg-blue-600' },
          { label: 'Licences (30d)',value: licenceCount,        icon: <FileText size={20}/>,    color: 'bg-green-600' },
          { label: 'Insurance (30d)',value: insuranceCount,     icon: <CheckCircle size={20}/>, color: 'bg-purple-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className={`${s.color} text-white w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-extrabold text-carbon">{s.value}</div>
            <div className="text-tan text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Active jobs list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-carbon flex items-center gap-2"><HardHat size={16}/> Active Jobs</h2>
            <Link href="/admin/jobs" className="text-sepia text-xs font-semibold hover:underline">View all →</Link>
          </div>
          {activeJobs.length === 0 ? (
            <p className="text-tan text-sm text-center py-4">No active jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {activeJobs.slice(0, 5).map(job => (
                <Link key={job.id} href={`/admin/jobs/${job.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-cream transition-all group">
                  <div>
                    <p className="font-semibold text-carbon text-sm">{job.name}</p>
                    <p className="text-tan text-xs">#{job.job_number} · {job.address}</p>
                  </div>
                  <ChevronRight size={16} className="text-tan group-hover:text-sepia transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Currently on site */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-carbon flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              On Site Now
            </h2>
            <span className="badge-green">{onSite.length} active</span>
          </div>
          {onSite.length === 0 ? (
            <p className="text-tan text-sm text-center py-4">No one currently signed in.</p>
          ) : (
            <div className="space-y-2">
              {onSite.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-cream">
                  <div>
                    <p className="font-semibold text-carbon text-sm">{s.full_name}</p>
                    <p className="text-tan text-xs">{s.trade_type} · {(s.jobs as any)?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-tan">{timeAgo(s.signed_in_at)}</p>
                    <span className="badge-green text-xs mt-0.5">On site</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
