'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [scores, setScores] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [charities, setCharities] = useState([])
  const [myCharity, setMyCharity] = useState(null)
  const [winners, setWinners] = useState([])
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState('')
  const [message, setMessage] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [userRole, setUserRole] = useState('subscriber')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user && session) fetchAll()
  }, [user, loading])

  async function fetchAll() {
    const token = session.access_token
    const headers = { 'Authorization': `Bearer ${token}` }

    const [scoresRes, subRes, charitiesRes, myCharityRes, winnersRes, profileRes] = await Promise.all([
      fetch('/api/scores', { headers }),
      fetch('/api/subscriptions', { headers }),
      fetch('/api/charities'),
      fetch('/api/charities/select', { headers }),
      fetch('/api/winners', { headers }),
      fetch('/api/admin/users', { headers })
    ])

    const scoresData = await scoresRes.json()
    const subData = await subRes.json()
    const charitiesData = await charitiesRes.json()
    const myCharityData = await myCharityRes.json()
    const winnersData = await winnersRes.json()

    setScores(scoresData.scores || [])
    setSubscription(subData.subscription)
    setCharities(charitiesData.charities || [])
    setMyCharity(myCharityData.selection)
    setWinners(winnersData.winners || [])

    // Check if admin
    if (profileRes.status === 200) {
      const profileData = await profileRes.json()
      if (profileData.users) setUserRole('admin')
    }
  }

  async function subscribe(plan_type) {
    setSubscribing(true)
    const token = session.access_token
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan_type })
    })
    const data = await res.json()
    if (data.error) { setMessage(data.error); setSubscribing(false); return }
    setMessage('Successfully subscribed!')
    setSubscribing(false)
    fetchAll()
  }

  async function submitScore() {
    if (!newScore || !newDate) { setMessage('Please enter both score and date'); return }
    const scoreNum = parseInt(newScore)
    if (scoreNum < 1 || scoreNum > 45) { setMessage('Score must be between 1 and 45'); return }

    const token = session.access_token
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ score: scoreNum, score_date: newDate })
    })
    const data = await res.json()
    if (data.error) { setMessage(data.error); return }
    setMessage('Score added!')
    setNewScore('')
    setNewDate('')
    fetchAll()
  }

  async function selectCharity(charity_id) {
    const token = session.access_token
    await fetch('/api/charities/select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ charity_id, contribution_percent: 10 })
    })
    fetchAll()
  }

  async function handleLogout() {
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  )

  const approvedWinners = winners.filter(w => w.verification_status !== 'rejected')

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/')}>
          ⛳ Golf Heroes
        </h1>
        <div className="flex items-center gap-3">
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-full hover:bg-purple-500/30 transition-colors">
              Admin Panel
            </button>
          )}
          <span className="text-gray-500 text-sm hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Message */}
        {message && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-gray-500 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* Winner Banner */}
        {approvedWinners.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
            <h2 className="text-yellow-400 font-bold text-lg mb-3">🏆 You're a Winner!</h2>
            {approvedWinners.map(w => (
              <div key={w.id} className="flex justify-between items-center bg-yellow-500/5 rounded-xl px-4 py-3 mb-2">
                <div>
                  <p className="text-sm font-medium">
                    {w.match_type === '5_match' ? 'Jackpot' :
                     w.match_type === '4_match' ? '4 Match' : '3 Match'} —
                    Draw {w.draws?.draw_month}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Status: <span className={
                      w.verification_status === 'approved' ? 'text-green-400' : 'text-yellow-400'
                    }>{w.verification_status}</span>
                    {' · '}Payment: <span className={
                      w.payment_status === 'paid' ? 'text-green-400' : 'text-gray-400'
                    }>{w.payment_status}</span>
                  </p>
                </div>
                <span className="text-yellow-400 font-black text-xl">£{w.prize_amount}</span>
              </div>
            ))}
          </div>
        )}

        {/* Subscription */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          {subscription ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                ✓ Active — {subscription.plan_type}
              </span>
              <span className="text-gray-500 text-sm">
                Renews {subscription.end_date}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-4">
                Subscribe to enter monthly draws and support your charity.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => subscribe('monthly')}
                  disabled={subscribing}
                  className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                  Monthly — £10/mo
                </button>
                <button
                  onClick={() => subscribe('yearly')}
                  disabled={subscribing}
                  className="border border-green-500 text-green-400 hover:bg-green-500/10 font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                  Yearly — £100/yr
                  <span className="ml-2 text-xs bg-green-500/20 px-2 py-1 rounded-full">Save 17%</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">My Scores</h2>
            <span className="text-gray-500 text-sm">{scores.length}/5 entered</span>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              type="number" min="1" max="45"
              value={newScore}
              onChange={e => setNewScore(e.target.value)}
              placeholder="Score (1-45)"
              className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-green-500 w-36"
            />
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={submitScore}
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-lg transition-colors">
              Add Score
            </button>
          </div>

          {scores.length === 0 ? (
            <p className="text-gray-500 text-sm">No scores yet. Add your first score above.</p>
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                    <span className="font-bold text-xl">{s.score}</span>
                    <span className="text-gray-500 text-sm">pts</span>
                  </div>
                  <span className="text-gray-500 text-sm">{s.score_date}</span>
                </div>
              ))}
              {scores.length === 5 && (
                <p className="text-green-400 text-xs mt-2 text-center">
                  ✓ All 5 scores entered — you're in the next draw!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Charity */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">My Charity</h2>

          {myCharity && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <p className="text-green-400 font-medium text-sm">
                ✓ Supporting: {myCharity.charities?.name}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {myCharity.contribution_percent}% of your subscription goes to this charity
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charities.map(c => (
              <button
                key={c.id}
                onClick={() => selectCharity(c.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  myCharity?.charity_id === c.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-gray-500 text-xs mt-1">{c.description}</p>
                {c.is_featured && (
                  <span className="text-xs text-yellow-400 mt-2 block">★ Featured</span>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}