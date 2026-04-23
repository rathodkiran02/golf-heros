import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// POST - user selects a charity
export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)
  const { charity_id, contribution_percent } = await request.json()

  // upsert = insert if not exists, update if exists
  const { data, error } = await db
    .from('user_charity_selections')
    .upsert({
      user_id: user.id,
      charity_id,
      contribution_percent: contribution_percent || 10
    }, { onConflict: 'user_id' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Charity selected', selection: data[0] })
}

// GET - get user's current charity selection
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)

  const { data, error } = await db
    .from('user_charity_selections')
    .select('*, charities(*)')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ selection: null })
  return NextResponse.json({ selection: data })
}