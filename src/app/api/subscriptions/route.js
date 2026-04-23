import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET - get user's current subscription
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)

  const { data, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (error) return NextResponse.json({ subscription: null })
  return NextResponse.json({ subscription: data })
}

// POST - create a subscription (mocked, no Stripe yet)
export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)
  const { plan_type } = await request.json()

  const start_date = new Date()
  const end_date = new Date()
  if (plan_type === 'yearly') {
    end_date.setFullYear(end_date.getFullYear() + 1)
  } else {
    end_date.setMonth(end_date.getMonth() + 1)
  }

  const { data, error } = await db
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_type,
      status: 'active',
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date.toISOString().split('T')[0],
      stripe_subscription_id: 'mock_' + Date.now()
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Subscribed', subscription: data })
}