import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET - list all published draws
export async function GET() {
  const { data: draws, error } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ draws })
}