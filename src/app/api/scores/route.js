import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)  // ← authenticated client

  const { data: scores, error } = await db
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ scores })
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)  // ← authenticated client

  const { score, score_date } = await request.json()

  if (score < 1 || score > 45) {
    return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
  }

  const { data: existingScores } = await db
    .from('scores')
    .select('id, score_date')
    .eq('user_id', user.id)
    .order('score_date', { ascending: true })

  if (existingScores && existingScores.length >= 5) {
    const oldest = existingScores[0]
    await db.from('scores').delete().eq('id', oldest.id)
  }

  const { data, error } = await db
    .from('scores')
    .insert({ user_id: user.id, score, score_date })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Score added', score: data[0] })
}

export async function PATCH(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseWithToken(token)
  const { id, score, score_date } = await request.json()
  if (score < 1 || score > 45) return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
  const { data, error } = await db.from('scores').update({ score, score_date }).eq('id', id).eq('user_id', user.id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ score: data[0] })
}

export async function DELETE(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseWithToken(token)
  const { id } = await request.json()
  const { error } = await db.from('scores').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Deleted' })
}