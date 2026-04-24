'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('draws')
  const [users, setUsers] = useState([])
  const [draws, setDraws] = useState([])
  const [winners, setWinners] = useState([])
  const [drawMonth, setDrawMonth] = useState('2026-07')
  const [drawResult, setDrawResult] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user && session) checkAdminAndFetch()
  }, [user, loading])

  async function checkAdminAndFetch() {
    const token = session.access_token
    const headers = { 'Authorization': `Bearer ${token}` }

    const res = await fetch('/api/admin/userlist', { headers })
    if (res.status === 403) { router.push('/dashboard'); return }
    const data = await res.json()
    setUsers(data.users || [])

    const drawsRes = await fetch('/api/draws')
    const drawsData = await drawsRes.json()
    setDraws(drawsData.draws || [])

    const winnersRes = await fetch('/api/admin/winners', { headers })
    const winnersData = await winnersRes.json()
    setWinners(winnersData.winners || [])
  }

  async function runDraw() {
    const token = session.access_token
    const res = await fetch('/api/draws/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ draw_month: drawMonth, draw_type: 'random', subscription_fee: 10 })
    })
    const data = await res.json()
    setDrawResult(data)
    setMessage(data.error || 'Draw simulated successfully!')
    if (!data.error) checkAdminAndFetch()
  }

  async function publishDraw(draw_id) {
    const token = session.access_token
    await fetch('/api/draws/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ draw_id })
    })
    setMessage('Draw published!')
    checkAdminAndFetch()
  }

  async function handleVerification(winner_id, verification_status) {
    const token = session.access_token
    const payment_status = verification_status === 'approved' ? 'paid' : 'pending'
    const res = await fetch('/api/admin/winners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ winner_id, verification_status, payment_status })
    })
    const data = await res.json()
    if (data.error) { setMessage('Error: ' + data.error); return }
    setMessage(`Winner ${verification_status} successfully!`)
    checkAdminAndFetch()
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  )

  const tabs = [
    { id: 'draws', label: 'Draw Engine' },
    { id: 'winners', label: `Winners (${winners.length})` },
    { id: 'users', label: `Users (${users.length})` },
  ]

  const pendingWinners = winners.filter(w => w.verification_status === 'pending')
  const resolvedWinners = winners.filter(w => w.verification_status !== 'pending')

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">⛳ Golf Heroes — Admin</h1>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 hover:text-white">
          ← Back to Dashboard
        </button>
      </div>

      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1 max-w-5xl mx-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {message && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-gray-500 hover:text-white">✕</button>
          </div>
        )}

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Run a Draw</h2>
              <div className="flex gap-3 mb-4">
                <input type="month" value={drawMonth}
                  onChange={e => setDrawMonth(e.target.value)}
                  className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-emerald-500"
                />
                <button onClick={runDraw}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2 rounded-lg transition-colors">
                  Run Draw
                </button>
              </div>
              {drawResult && (
                <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-gray-400">Winning Numbers:
                    <span className="text-emerald-400 font-bold ml-2">
                      {drawResult.winning_numbers?.join(', ')}
                    </span>
                  </p>
                  <p className="text-gray-400">Total Entries:
                    <span className="text-white ml-2">{drawResult.total_entries}</span>
                  </p>
                  <p className="text-gray-400">Winners Found:
                    <span className="text-white ml-2">{drawResult.winners}</span>
                  </p>
                  <p className="text-gray-400">Prize Pool:
                    <span className="text-white ml-2">£{drawResult.prize_pool}</span>
                  </p>
                  {drawResult.draw_id && (
                    <button onClick={() => publishDraw(drawResult.draw_id)}
                      className="mt-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg text-sm">
                      Publish Results
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Published Draws</h2>
              {draws.length === 0 ? (
                <p className="text-gray-500 text-sm">No draws yet.</p>
              ) : (
                <div className="space-y-3">
                  {draws.map(d => (
                    <div key={d.id} className="bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{d.draw_month}</p>
                        <p className="text-gray-500 text-sm">Numbers: {d.winning_numbers?.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 text-sm">£{d.total_prize_pool}</p>
                        <p className="text-gray-500 text-xs">{d.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* WINNERS TAB */}
        {activeTab === 'winners' && (
          <>
            {winners.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <p className="text-gray-500 text-sm">No winners yet.</p>
              </div>
            ) : (
              <>
                {pendingWinners.length > 0 && (
                  <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/30">
                    <h2 className="text-lg font-semibold mb-4 text-yellow-400">
                      Pending Verification ({pendingWinners.length})
                    </h2>
                    <div className="space-y-4">
                      {pendingWinners.map(w => (
                        <div key={w.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                              <p className="font-medium">
                                {w.users?.full_name || 'Unknown'} —
                                <span className="text-gray-400 text-sm ml-1">{w.users?.email}</span>
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Draw: {w.draws?.draw_month} ·
                                <span className="text-yellow-400 ml-1">
                                  {w.match_type === '5_match' ? 'Jackpot' :
                                   w.match_type === '4_match' ? '4 Match' : '3 Match'}
                                </span>
                                <span className="text-emerald-400 ml-2">£{w.prize_amount}</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {w.proof_url ? (
                                <>
                                  <a href={w.proof_url} target="_blank"
                                    className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 hover:bg-blue-500/30">
                                    View Proof
                                  </a>
                                  <button onClick={() => handleVerification(w.id, 'approved')}
                                    className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                                    ✓ Approve
                                  </button>
                                  <button onClick={() => handleVerification(w.id, 'rejected')}
                                    className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30">
                                    ✕ Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-500 bg-gray-700 px-3 py-1 rounded-full">
                                  Awaiting proof
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resolvedWinners.length > 0 && (
                  <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-lg font-semibold mb-4">Resolved Winners</h2>
                    <div className="space-y-3">
                      {resolvedWinners.map(w => (
                        <div key={w.id} className="bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{w.users?.full_name || w.users?.email}</p>
                            <p className="text-gray-500 text-xs">{w.draws?.draw_month} · {w.match_type}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-emerald-400 text-sm">£{w.prize_amount}</span>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              w.verification_status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>{w.verification_status}</span>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              w.payment_status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-gray-600/20 text-gray-400'
                            }`}>{w.payment_status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
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
                  }`}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}