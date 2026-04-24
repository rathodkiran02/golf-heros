import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET - all winners for admin
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)

  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await db
    .from('winners')
    .select(`
      *,
      users (full_name, email),
      draws (draw_month, winning_numbers)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ winners: data })
}

// PATCH - admin approves or rejects
export async function PATCH(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)

  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { winner_id, verification_status, payment_status } = await request.json()

  const updateData = { verification_status }
  if (payment_status) updateData.payment_status = payment_status

  const { data, error } = await db
    .from('winners')
    .update(updateData)
    .eq('id', winner_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ winner: data })
}