import { supabase, supabaseWithToken } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  // Verify user is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseWithToken(token)

  const { data: userData } = await db
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { draw_month, draw_type, subscription_fee } = await request.json()
  // draw_month format: '2026-04'
  // subscription_fee: amount per subscriber e.g. 10

  // Step 1: Generate 5 winning numbers (1-45)
  const winning_numbers = []
  while (winning_numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!winning_numbers.includes(num)) winning_numbers.push(num)
  }

  // Step 2: Get all users with exactly 5 scores
  const { data: allScores } = await supabase
    .from('scores')
    .select('user_id, score')

  // Group scores by user
  const scoresByUser = {}
  allScores.forEach(({ user_id, score }) => {
    if (!scoresByUser[user_id]) scoresByUser[user_id] = []
    scoresByUser[user_id].push(score)
  })

  // Only users with 5 scores are eligible
  const eligibleUsers = Object.entries(scoresByUser)
    .filter(([_, scores]) => scores.length === 5)

  // Step 3: Calculate prize pool
  const total_prize_pool = eligibleUsers.length * (subscription_fee || 10)
  const jackpot_amount = total_prize_pool * 0.40

  // Step 4: Create the draw record
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .insert({
      draw_month,
      draw_type: draw_type || 'random',
      winning_numbers,
      jackpot_amount,
      total_prize_pool,
      status: 'simulated'
    })
    .select()
    .single()

  if (drawError) return NextResponse.json({ error: drawError.message }, { status: 400 })

  // Step 5: Create draw entries and find winners
  const entries = []
  const winners = []

  for (const [user_id, scores] of eligibleUsers) {
    // Count how many of user's scores match winning numbers
    const match_count = scores.filter(s => winning_numbers.includes(s)).length

    entries.push({
      draw_id: draw.id,
      user_id,
      scores_snapshot: scores,
      match_count
    })

    // Determine winner tier
    if (match_count >= 3) {
      const match_type = match_count === 5 ? '5_match'
        : match_count === 4 ? '4_match'
        : '3_match'

      winners.push({ draw_id: draw.id, user_id, match_type, match_count })
    }
  }

  // Insert all entries
  if (entries.length > 0) {
    await supabase.from('draw_entries').insert(entries)
  }

  // Step 6: Calculate prize amounts and insert winners
  const five_match = winners.filter(w => w.match_type === '5_match')
  const four_match = winners.filter(w => w.match_type === '4_match')
  const three_match = winners.filter(w => w.match_type === '3_match')

  const winnerRows = [
    ...five_match.map(w => ({
      ...w,
      prize_amount: five_match.length > 0
        ? (total_prize_pool * 0.40) / five_match.length : 0
    })),
    ...four_match.map(w => ({
      ...w,
      prize_amount: four_match.length > 0
        ? (total_prize_pool * 0.35) / four_match.length : 0
    })),
    ...three_match.map(w => ({
      ...w,
      prize_amount: three_match.length > 0
        ? (total_prize_pool * 0.25) / three_match.length : 0
    })),
  ]

  if (winnerRows.length > 0) {
    await supabase.from('winners').insert(
      winnerRows.map(({ match_count, ...w }) => w)
    )
  }

  return NextResponse.json({
    message: 'Draw simulated',
    draw_id: draw.id,
    winning_numbers,
    total_entries: entries.length,
    winners: winnerRows.length,
    prize_pool: total_prize_pool
  })
}