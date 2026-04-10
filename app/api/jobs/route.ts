import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)

// GET /api/jobs  — list all jobs (admin)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/jobs  — create a new job
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { job_number, name, address, description } = body

  if (!job_number || !name || !address) {
    return NextResponse.json({ error: 'job_number, name and address are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({ job_number, name, address, description: description || null })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
