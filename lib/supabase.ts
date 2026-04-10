import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://placeholder.supabase.co'
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY     || 'placeholder-service-key'

// Client for browser/trade sign-in (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Admin client (bypasses RLS) – server-side only
export const supabaseAdmin = createClient(supabaseUrl, supabaseService)

export type Job = {
  id: string
  job_number: string
  name: string
  address: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

export type Signin = {
  id: string
  job_id: string
  full_name: string
  company_name: string
  trade_type: string
  abn: string | null
  phone: string
  email: string | null
  licence_number: string | null
  induction_completed: boolean
  swms_acknowledged: boolean
  ppe_confirmed: boolean
  site_rules_read: boolean
  emergency_aware: boolean
  signed_in_at: string
  signed_out_at: string | null
  status: 'on_site' | 'signed_out'
}

export type Document = {
  id: string
  signin_id: string
  job_id: string
  doc_type: 'licence' | 'insurance' | 'swms' | 'scope_of_works' | 'other'
  file_name: string
  file_url: string
  file_size: number | null
  expiry_date: string | null
  uploaded_at: string
}

export type Photo = {
  id: string
  signin_id: string
  job_id: string
  file_name: string
  file_url: string
  file_size: number | null
  caption: string | null
  taken_at: string
  uploaded_at: string
}
