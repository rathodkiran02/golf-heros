'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState([])
  const [draws, setDraws] = useState([])
  const [drawMonth, setDrawMonth] = useState('2026-04')
  const [drawResult, setDrawResult] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user && session) checkAdminAndFetch()
  }, [user, loading])

  async function checkAdminAndFetch() {
    const token = session.access_token
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.status === 403) { router.push('/dashboard'); return }
    const data = await res.json()
    setUsers(data.users || [])

    const drawsRes = await fetch('/api/draws')
    const drawsData = await drawsRes.json()
    setDraws(drawsData.draws || [])
  }

  async function runDraw() {
    const token = session.access_token
    const res = await fetch('/api/draws/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ draw_month: drawMonth, draw_type: 'random', subscription_fee: 10 })
    })
    const data = await res.json()
    setDrawResult(data)
    setMessage(data.error || 'Draw simulated successfully!')
  }

  async function publishDraw(draw_id) {
    const token = session.access_token
    await fetch(`/api/draws/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ draw_id })
    })
    setMessage('Draw published!')
    checkAdminAndFetch()
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">⛳ Golf Heroes — Admin</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-white">
          ← Back to Dashboard
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {message && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Draw Engine */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Draw Engine</h2>

          <div className="flex gap-3 mb-4">
            <input
              type="month"
              value={drawMonth}
              onChange={e => setDrawMonth(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={runDraw}
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-lg transition-colors"
            >
              Run Draw
            </button>
          </div>

          {drawResult && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-gray-400">Draw ID: <span className="text-white">{drawResult.draw_id}</span></p>
              <p className="text-gray-400">Winning Numbers: <span className="text-green-400 font-bold">{drawResult.winning_numbers?.join(', ')}</span></p>
              <p className="text-gray-400">Total Entries: <span className="text-white">{drawResult.total_entries}</span></p>
              <p className="text-gray-400">Winners Found: <span className="text-white">{drawResult.winners}</span></p>
              <p className="text-gray-400">Prize Pool: <span className="text-white">£{drawResult.prize_pool}</span></p>
              {drawResult.draw_id && (
                <button
                  onClick={() => publishDraw(drawResult.draw_id)}
                  className="mt-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Publish Results
                </button>
              )}
            </div>
          )}
        </div>

        {/* Past Draws */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Published Draws</h2>
          {draws.length === 0 ? (
            <p className="text-gray-500 text-sm">No published draws yet.</p>
          ) : (
            <div className="space-y-3">
              {draws.map(d => (
                <div key={d.id} className="bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{d.draw_month}</p>
                    <p className="text-gray-500 text-sm">
                      Numbers: {d.winning_numbers?.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm">£{d.total_prize_pool}</p>
                    <p className="text-gray-500 text-xs">{d.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{u.full_name || 'No name'}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}