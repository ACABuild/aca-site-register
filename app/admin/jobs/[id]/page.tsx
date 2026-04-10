import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateShort, timeAgo, complianceColor } from '@/lib/utils'
import {
  ChevronLeft, Users, FileText, Camera, QrCode,
  CheckCircle, AlertTriangle, XCircle, Clock,
  HardHat, Phone, Mail, Building2, ExternalLink,
  Download
} from 'lucide-react'
import QRCodeSection from '@/components/QRCodeSection'
import JobStatusToggle from '@/components/JobStatusToggle'

export const revalidate = 15

async function getJobData(id: string) {
  const [jobRes, signinsRes] = await Promise.all([
    supabaseAdmin.from('jobs').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('signins')
      .select(`
        *,
        documents (*),
        photos (*)
      `)
      .eq('job_id', id)
      .order('signed_in_at', { ascending: false }),
  ])

  return { job: jobRes.data, signins: signinsRes.data || [] }
}

function ComplianceBadge({ hasLicence, hasInsurance }: { hasLicence: boolean; hasInsurance: boolean }) {
  if (hasLicence && hasInsurance) return <span className="badge-green"><CheckCircle size={11} /> Compliant</span>
  if (hasLicence || hasInsurance) return <span className="badge-yellow"><AlertTriangle size={11} /> Partial</span>
  return <span className="badge-red"><XCircle size={11} /> Missing Docs</span>
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const { job, signins } = await getJobData(params.id)

  if (!job) notFound()

  const onSite    = signins.filter(s => s.status === 'on_site')
  const allPhotos = signins.flatMap(s => (s.photos || []).map((p: any) => ({ ...p, trade: s.full_name, tradeType: s.trade_type })))
  const allDocs   = signins.flatMap(s => (s.documents || []).map((d: any) => ({ ...d, trade: s.full_name })))

  return (
    <div>
      {/* Header */}
      <Link href="/admin/jobs" className="btn-ghost inline-flex items-center gap-1 mb-5 text-sm">
        <ChevronLeft size={16} /> All Jobs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-tan text-sm font-semibold">Job #{job.job_number}</span>
            <JobStatusToggle jobId={job.id} currentStatus={job.status} />
          </div>
          <h1 className="text-2xl font-extrabold text-carbon">{job.name}</h1>
          <p className="text-tan text-sm mt-0.5">{job.address}</p>
          {job.description && <p className="text-tan/70 text-xs mt-1">{job.description}</p>}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Sign-ins', value: signins.length,  icon: <Users size={18}/>,    color: 'bg-sepia' },
          { label: 'On Site Now',    value: onSite.length,   icon: <HardHat size={18}/>,  color: 'bg-green-600' },
          { label: 'Documents',      value: allDocs.length,  icon: <FileText size={18}/>, color: 'bg-blue-600' },
          { label: 'Photos',         value: allPhotos.length,icon: <Camera size={18}/>,   color: 'bg-purple-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className={`${s.color} text-white w-9 h-9 rounded-xl flex items-center justify-center mb-2`}>
              {s.icon}
            </div>
            <div className="text-2xl font-extrabold text-carbon">{s.value}</div>
            <div className="text-tan text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">

        {/* QR Code */}
        <div className="sm:col-span-1">
          <QRCodeSection jobId={job.id} jobName={job.name} jobNumber={job.job_number} />
        </div>

        {/* Trade roster */}
        <div className="sm:col-span-2">
          <div className="card">
            <h2 className="font-bold text-carbon mb-4 flex items-center gap-2">
              <Users size={16}/> Trade Register
            </h2>

            {signins.length === 0 ? (
              <p className="text-tan text-sm text-center py-6">No sign-ins yet. Share the QR code with trades.</p>
            ) : (
              <div className="space-y-3">
                {signins.map(s => {
                  const docs: any[] = s.documents || []
                  const photos: any[] = s.photos || []
                  const hasLicence   = docs.some(d => d.doc_type === 'licence')
                  const hasInsurance = docs.some(d => d.doc_type === 'insurance')

                  return (
                    <details key={s.id} className="group">
                      <summary className="flex items-center justify-between p-3 rounded-xl bg-cream cursor-pointer hover:bg-tan/10 transition-all list-none">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.status === 'on_site' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <p className="font-semibold text-carbon text-sm">{s.full_name}</p>
                            <p className="text-tan text-xs">{s.trade_type} · {s.company_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <ComplianceBadge hasLicence={hasLicence} hasInsurance={hasInsurance} />
                          <span className="text-tan/50 text-xs font-mono group-open:rotate-90 transition-transform inline-block">›</span>
                        </div>
                      </summary>

                      {/* Expanded details */}
                      <div className="px-3 pb-3 mt-2 space-y-3">
                        {/* Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {s.phone && <div className="flex items-center gap-1 text-tan"><Phone size={11}/> {s.phone}</div>}
                          {s.email && <div className="flex items-center gap-1 text-tan"><Mail size={11}/> {s.email}</div>}
                          {s.abn && <div className="flex items-center gap-1 text-tan"><Building2 size={11}/> ABN: {s.abn}</div>}
                          {s.licence_number && <div className="flex items-center gap-1 text-tan"><FileText size={11}/> Lic: {s.licence_number}</div>}
                        </div>

                        {/* Times */}
                        <div className="flex gap-4 text-xs">
                          <div><span className="text-tan">In: </span><span className="font-semibold text-carbon">{formatDate(s.signed_in_at)}</span></div>
                          {s.signed_out_at && <div><span className="text-tan">Out: </span><span className="font-semibold text-carbon">{formatDate(s.signed_out_at)}</span></div>}
                          {!s.signed_out_at && <span className="badge-green text-xs">On site</span>}
                        </div>

                        {/* Induction checklist */}
                        <div className="bg-cream rounded-lg p-2">
                          <p className="text-xs font-semibold text-carbon mb-1.5">Induction</p>
                          <div className="grid grid-cols-2 gap-1">
                            {[
                              ['Site Rules', s.site_rules_read],
                              ['SWMS', s.swms_acknowledged],
                              ['PPE', s.ppe_confirmed],
                              ['Emergency', s.emergency_aware],
                            ].map(([label, done]) => (
                              <div key={label as string} className="flex items-center gap-1 text-xs">
                                {done ? <CheckCircle size={11} className="text-green-600"/> : <XCircle size={11} className="text-red-400"/>}
                                <span className={done ? 'text-carbon' : 'text-red-400'}>{label as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Documents */}
                        {docs.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-carbon mb-1.5">Documents ({docs.length})</p>
                            <div className="space-y-1">
                              {docs.map((d: any) => (
                                <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-sepia hover:underline">
                                  <FileText size={11}/> {d.file_name}
                                  <ExternalLink size={9} className="text-tan"/>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Photos */}
                        {photos.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-carbon mb-1.5">Photos ({photos.length})</p>
                            <div className="grid grid-cols-3 gap-1">
                              {photos.map((p: any) => (
                                <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer"
                                  className="relative aspect-square rounded-lg overflow-hidden bg-tan/20 hover:opacity-90 transition-opacity">
                                  <img src={p.file_url} alt="" className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-carbon/60 p-1">
                                    <p className="text-white text-xs leading-tight">
                                      {new Date(p.taken_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All photos gallery */}
      {allPhotos.length > 0 && (
        <div className="card mt-4">
          <h2 className="font-bold text-carbon mb-4 flex items-center gap-2">
            <Camera size={16}/> All Work Photos ({allPhotos.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {allPhotos.map((p: any) => (
              <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer"
                className="relative aspect-square rounded-xl overflow-hidden bg-tan/20 hover:opacity-90 transition-opacity group">
                <img src={p.file_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-white text-xs font-semibold">{p.trade}</p>
                  <p className="text-white/80 text-xs">{formatDate(p.taken_at)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
