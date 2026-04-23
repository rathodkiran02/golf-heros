import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET - list all active charities (public, no auth needed)
export async function GET() {
  const { data: charities, error } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ charities })
}