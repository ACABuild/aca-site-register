import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/jobs/[id]  — update job status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const allowed = ['active', 'completed', 'archived']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/jobs/[id]  — archive a job
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ status: 'archived' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
