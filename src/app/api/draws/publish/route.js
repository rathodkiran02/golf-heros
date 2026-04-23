import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { draw_id } = await request.json()

  const { error } = await supabase
    .from('draws')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', draw_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Draw published' })
}