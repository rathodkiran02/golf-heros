import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { email, password, full_name } = await request.json()

  // Step 1: Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Step 2: Insert into our users table
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name,
      role: 'subscriber'
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Signup successful', user: authData.user })
}