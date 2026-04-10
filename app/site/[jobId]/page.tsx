'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TRADE_TYPES, DOC_TYPES, formatDate } from '@/lib/utils'
import {
  CheckCircle, Upload, Camera, ChevronRight, ChevronLeft,
  AlertCircle, Loader2, X, FileText, Image as ImageIcon,
  HardHat, ClipboardList, User, LogOut
} from 'lucide-react'
import type { Job } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────
type Step = 'details' | 'induction' | 'documents' | 'photos' | 'complete'

type FormData = {
  full_name: string
  company_name: string
  trade_type: string
  abn: string
  phone: string
  email: string
  licence_number: string
}

type Induction = {
  site_rules_read: boolean
  swms_acknowledged: boolean
  ppe_confirmed: boolean
  emergency_aware: boolean
  induction_completed: boolean
}

type UploadedFile = {
  doc_type: string
  file: File
  preview?: string
  uploading?: boolean
  uploaded?: boolean
  url?: string
  error?: string
}

// ─── Step indicator ───────────────────────────────────────────
const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'details',   label: 'Details',   icon: <User size={16} /> },
  { key: 'induction', label: 'Induction', icon: <HardHat size={16} /> },
  { key: 'documents', label: 'Docs',      icon: <FileText size={16} /> },
  { key: 'photos',    label: 'Photos',    icon: <Camera size={16} /> },
  { key: 'complete',  label: 'Done',      icon: <CheckCircle size={16} /> },
]

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.key === current)
  return (
    <div className="flex items-center justify-center gap-1 py-4 px-4">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
            ${i < idx  ? 'bg-sepia text-cream' : ''}
            ${i === idx ? 'bg-sepia text-cream ring-4 ring-sepia/20 scale-110' : ''}
            ${i > idx  ? 'bg-tan/30 text-tan' : ''}
          `}>
            {i < idx ? <CheckCircle size={14} /> : step.icon}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-0.5 mx-0.5 ${i < idx ? 'bg-sepia' : 'bg-tan/30'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function SiteSignIn() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('details')
  const [signinId, setSigninId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<FormData>({
    full_name: '', company_name: '', trade_type: '',
    abn: '', phone: '', email: '', licence_number: '',
  })

  const [induction, setInduction] = useState<Induction>({
    site_rules_read: false, swms_acknowledged: false,
    ppe_confirmed: false, emergency_aware: false, induction_completed: false,
  })

  const [docs, setDocs] = useState<UploadedFile[]>([])
  const [photos, setPhotos] = useState<UploadedFile[]>([])

  // Load job details
  useEffect(() => {
    async function loadJob() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        setError('This site is not found or is no longer active.')
      } else {
        setJob(data)
      }
      setLoading(false)
    }
    loadJob()
  }, [jobId])

  // ── Step 1: Submit personal details ─────────────────────────
  async function submitDetails() {
    if (!form.full_name || !form.company_name || !form.trade_type || !form.phone) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setSubmitting(true)

    const { data, error } = await supabase
      .from('signins')
      .insert({
        job_id: jobId,
        ...form,
        status: 'on_site',
        induction_completed: false,
      })
      .select('id')
      .single()

    setSubmitting(false)
    if (error || !data) {
      setError('Failed to sign in. Please try again.')
      return
    }
    setSigninId(data.id)
    setStep('induction')
  }

  // ── Step 2: Submit induction ─────────────────────────────────
  async function submitInduction() {
    if (!Object.values(induction).every(Boolean)) {
      setError('Please acknowledge all induction items to continue.')
      return
    }
    setError('')
    setSubmitting(true)

    await supabase
      .from('signins')
      .update({ ...induction })
      .eq('id', signinId)

    setSubmitting(false)
    setStep('documents')
  }

  // ── File upload helper ────────────────────────────────────────
  async function uploadFile(file: File, bucket: 'documents' | 'photos', folder: string) {
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  }

  // ── Step 3: Upload documents ──────────────────────────────────
  function addDoc(docType: string, file: File) {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    setDocs(prev => [...prev.filter(d => d.doc_type !== docType || docType === 'other'),
      { doc_type: docType, file, preview }])
  }

  async function submitDocuments() {
    setError('')
    setSubmitting(true)

    for (const doc of docs) {
      setDocs(prev => prev.map(d => d.file === doc.file ? { ...d, uploading: true } : d))
      try {
        const url = await uploadFile(doc.file, 'documents', `${jobId}/${signinId}`)
        await supabase.from('documents').insert({
          signin_id: signinId,
          job_id: jobId,
          doc_type: doc.doc_type,
          file_name: doc.file.name,
          file_url: url,
          file_size: doc.file.size,
        })
        setDocs(prev => prev.map(d => d.file === doc.file ? { ...d, uploading: false, uploaded: true, url } : d))
      } catch {
        setDocs(prev => prev.map(d => d.file === doc.file ? { ...d, uploading: false, error: 'Upload failed' } : d))
      }
    }

    setSubmitting(false)
    setStep('photos')
  }

  // ── Step 4: Upload photos ─────────────────────────────────────
  function addPhoto(file: File) {
    const preview = URL.createObjectURL(file)
    setPhotos(prev => [...prev, { doc_type: 'photo', file, preview }])
  }

  async function submitPhotos() {
    setError('')
    setSubmitting(true)

    for (const photo of photos) {
      setPhotos(prev => prev.map(p => p.file === photo.file ? { ...p, uploading: true } : p))
      try {
        const url = await uploadFile(photo.file, 'photos', `${jobId}/${signinId}`)
        const takenAt = (photo.file as any).lastModifiedDate
          ? new Date((photo.file as any).lastModifiedDate).toISOString()
          : new Date().toISOString()

        await supabase.from('photos').insert({
          signin_id: signinId,
          job_id: jobId,
          file_name: photo.file.name,
          file_url: url,
          file_size: photo.file.size,
          taken_at: takenAt,
          uploaded_at: new Date().toISOString(),
        })
        setPhotos(prev => prev.map(p => p.file === photo.file ? { ...p, uploading: false, uploaded: true, url } : p))
      } catch {
        setPhotos(prev => prev.map(p => p.file === photo.file ? { ...p, uploading: false, error: 'Upload failed' } : p))
      }
    }

    setSubmitting(false)
    setStep('complete')
  }

  // ── Sign out ───────────────────────────────────────────────────
  async function signOut() {
    if (!signinId) return
    await supabase.from('signins')
      .update({ signed_out_at: new Date().toISOString(), status: 'signed_out' })
      .eq('id', signinId)
    setStep('complete')
  }

  // ── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-sepia" size={40} />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-6">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-carbon mb-2">Site Not Found</h1>
          <p className="text-tan">This QR code is no longer active or the site has been completed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-8">
      {/* Header */}
      <div className="bg-sepia text-cream px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <HardHat size={22} className="text-tan" />
          <span className="text-tan text-sm font-semibold tracking-wide uppercase">ACA Build</span>
        </div>
        <h1 className="text-2xl font-extrabold leading-tight">{job.name}</h1>
        <p className="text-tan text-sm mt-1">{job.address}</p>
        <p className="text-tan/60 text-xs mt-0.5">Job #{job.job_number}</p>
      </div>

      <StepIndicator current={step} />

      <div className="px-4 max-w-lg mx-auto">

        {/* ── STEP 1: Details ──────────────────────────────────── */}
        {step === 'details' && (
          <div>
            <h2 className="text-xl font-bold text-carbon mb-1">Sign In</h2>
            <p className="text-tan text-sm mb-5">Enter your details to access this site.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">Full Name <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="John Smith"
                  value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">Company Name <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="Smith Electrical Pty Ltd"
                  value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">Trade Type <span className="text-red-500">*</span></label>
                <select className="input-field"
                  value={form.trade_type} onChange={e => setForm(f => ({ ...f, trade_type: e.target.value }))}>
                  <option value="">Select your trade…</option>
                  {TRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">Phone <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="0400 000 000" type="tel"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">Email</label>
                <input className="input-field" placeholder="john@example.com" type="email"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">Licence Number</label>
                <input className="input-field" placeholder="e.g. EC12345"
                  value={form.licence_number} onChange={e => setForm(f => ({ ...f, licence_number: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-carbon mb-1">ABN</label>
                <input className="input-field" placeholder="12 345 678 901"
                  value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertCircle size={14}/>{error}</p>}

            <button className="btn-primary mt-6" onClick={submitDetails} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : <span className="flex items-center justify-center gap-2">Continue <ChevronRight size={18}/></span>}
            </button>
          </div>
        )}

        {/* ── STEP 2: Induction ────────────────────────────────── */}
        {step === 'induction' && (
          <div>
            <h2 className="text-xl font-bold text-carbon mb-1">Site Induction</h2>
            <p className="text-tan text-sm mb-5">Please acknowledge each item below before entering the site.</p>

            <div className="space-y-3">
              {[
                { key: 'site_rules_read',      label: 'I have read and understood the site rules and conditions of entry.' },
                { key: 'swms_acknowledged',    label: 'I have a current SWMS (Safe Work Method Statement) for the works I will carry out.' },
                { key: 'ppe_confirmed',         label: 'I will wear appropriate PPE at all times on site (hard hat, hi-vis, boots).' },
                { key: 'emergency_aware',       label: 'I am aware of the emergency procedures and assembly point for this site.' },
                { key: 'induction_completed',   label: 'I confirm I have completed this site induction and my details are correct.' },
              ].map(item => (
                <label key={item.key} className={`
                  flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${induction[item.key as keyof Induction]
                    ? 'border-sepia bg-sepia/5'
                    : 'border-tan/30 bg-white hover:border-tan'}
                `}>
                  <div className={`
                    w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all
                    ${induction[item.key as keyof Induction] ? 'bg-sepia border-sepia' : 'border-tan/40'}
                  `}>
                    {induction[item.key as keyof Induction] && <CheckCircle size={14} className="text-cream" />}
                  </div>
                  <input type="checkbox" className="hidden"
                    checked={induction[item.key as keyof Induction]}
                    onChange={e => setInduction(i => ({ ...i, [item.key]: e.target.checked }))} />
                  <span className="text-sm text-carbon leading-snug">{item.label}</span>
                </label>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertCircle size={14}/>{error}</p>}

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setStep('details')}>
                <ChevronLeft size={18} className="inline mr-1" /> Back
              </button>
              <button className="btn-primary" onClick={submitInduction} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : <span className="flex items-center justify-center gap-2">Continue <ChevronRight size={18}/></span>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Documents ────────────────────────────────── */}
        {step === 'documents' && (
          <div>
            <h2 className="text-xl font-bold text-carbon mb-1">Upload Documents</h2>
            <p className="text-tan text-sm mb-5">Upload your licence and insurance. Photo or PDF is fine.</p>

            <div className="space-y-3">
              {DOC_TYPES.map(dt => {
                const uploaded = docs.find(d => d.doc_type === dt.value)
                return (
                  <div key={dt.value} className={`
                    card border-2 transition-all
                    ${uploaded ? 'border-sepia/40 bg-sepia/5' : 'border-tan/20'}
                  `}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-carbon text-sm">{dt.label}</span>
                        {dt.required && <span className="text-red-500 text-xs ml-1">*</span>}
                      </div>
                      {uploaded && !uploaded.uploading && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> Added
                        </span>
                      )}
                      {uploaded?.uploading && (
                        <Loader2 size={14} className="animate-spin text-sepia" />
                      )}
                    </div>
                    {uploaded?.preview && (
                      <img src={uploaded.preview} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                    )}
                    {!uploaded?.preview && uploaded && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-tan">
                        <FileText size={14} /> {uploaded.file.name}
                      </div>
                    )}
                    <label className={`
                      flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-dashed
                      cursor-pointer text-sm font-medium transition-all
                      ${uploaded ? 'border-tan/30 text-tan' : 'border-sepia/30 text-sepia hover:border-sepia hover:bg-sepia/5'}
                    `}>
                      <Upload size={15} />
                      {uploaded ? 'Replace file' : 'Tap to upload'}
                      <input type="file" className="hidden" accept="image/*,.pdf"
                        onChange={e => e.target.files?.[0] && addDoc(dt.value, e.target.files[0])} />
                    </label>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-tan mt-3">* Required. You can still continue without optional documents.</p>
            {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertCircle size={14}/>{error}</p>}

            <div className="flex gap-3 mt-5">
              <button className="btn-secondary" onClick={() => setStep('induction')}>
                <ChevronLeft size={18} className="inline mr-1" /> Back
              </button>
              <button className="btn-primary" onClick={submitDocuments} disabled={submitting}>
                {submitting
                  ? <Loader2 className="animate-spin mx-auto" size={18} />
                  : <span className="flex items-center justify-center gap-2">
                      {docs.length === 0 ? 'Skip →' : <><Upload size={16}/> Upload & Continue</>}
                    </span>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Photos ───────────────────────────────────── */}
        {step === 'photos' && (
          <div>
            <h2 className="text-xl font-bold text-carbon mb-1">Work Photos</h2>
            <p className="text-tan text-sm mb-5">Take or upload photos of your work. Timestamps are recorded automatically.</p>

            {/* Camera capture */}
            <label className="btn-primary flex items-center justify-center gap-2 cursor-pointer mb-3">
              <Camera size={18} /> Take Photo
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files?.[0] && addPhoto(e.target.files[0])} />
            </label>

            <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer mb-5">
              <ImageIcon size={18} /> Upload from Gallery
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => Array.from(e.target.files || []).forEach(f => addPhoto(f))} />
            </label>

            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-5">
                {photos.map((p, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-tan/20">
                    {p.preview && <img src={p.preview} alt="" className="w-full h-full object-cover" />}
                    {p.uploading && (
                      <div className="absolute inset-0 bg-carbon/50 flex items-center justify-center">
                        <Loader2 className="animate-spin text-cream" size={24} />
                      </div>
                    )}
                    {p.uploaded && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
                        <CheckCircle size={12} className="text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-carbon/70 to-transparent p-2">
                      <p className="text-white text-xs">
                        {new Date(p.file.lastModified).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button className="absolute top-2 left-2 bg-carbon/50 rounded-full p-0.5"
                      onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}>
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => setStep('documents')}>
                <ChevronLeft size={18} className="inline mr-1" /> Back
              </button>
              <button className="btn-primary" onClick={submitPhotos} disabled={submitting}>
                {submitting
                  ? <Loader2 className="animate-spin mx-auto" size={18} />
                  : <span className="flex items-center justify-center gap-2">
                      {photos.length === 0 ? 'Skip →' : <><Upload size={16}/> Upload & Finish</>}
                    </span>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Complete ─────────────────────────────────── */}
        {step === 'complete' && (
          <div className="text-center pt-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-carbon mb-2">You&apos;re signed in!</h2>
            <p className="text-tan mb-1">Welcome to {job.name}</p>
            <p className="text-tan/60 text-sm mb-8">{formatDate(new Date().toISOString())}</p>

            <div className="card text-left mb-5">
              <h3 className="font-bold text-carbon mb-3">Sign-in Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-tan">Name</span><span className="font-semibold">{form.full_name}</span></div>
                <div className="flex justify-between"><span className="text-tan">Company</span><span className="font-semibold">{form.company_name}</span></div>
                <div className="flex justify-between"><span className="text-tan">Trade</span><span className="font-semibold">{form.trade_type}</span></div>
                <div className="flex justify-between"><span className="text-tan">Documents</span><span className="font-semibold text-green-600">{docs.length} uploaded</span></div>
                <div className="flex justify-between"><span className="text-tan">Photos</span><span className="font-semibold text-green-600">{photos.length} uploaded</span></div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">
              <strong>Remember:</strong> Sign out when you leave the site so the register stays accurate.
            </div>

            <button className="btn-secondary flex items-center justify-center gap-2" onClick={signOut}>
              <LogOut size={18} /> Sign Out of Site
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
