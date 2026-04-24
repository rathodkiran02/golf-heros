'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user && session) fetchAll()
  }, [user, loading])

  async function fetchAll() {
    const token = session.access_token
    const headers = { 'Authorization': `Bearer ${token}` }

    const [scoresRes, subRes, charitiesRes, myCharityRes, winnersRes] = await Promise.all([
      fetch('/api/scores', { headers }),
      fetch('/api/subscriptions', { headers }),
      fetch('/api/charities'),
      fetch('/api/charities/select', { headers }),
      fetch('/api/winners', { headers })
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
  }

  async function submitScore() {
    if (!newScore || !newDate) return
    const token = session.access_token
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ score: parseInt(newScore), score_date: newDate })
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

  async function uploadProof(winnerId, file) {
    if (!file) return
    setUploadingId(winnerId)
    setUploadMessage('')

    try {
      // Upload file to Supabase Storage
      const fileName = `${winnerId}_${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(fileName, file)

      if (uploadError) {
        setUploadMessage('Upload failed: ' + uploadError.message)
        setUploadingId(null)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('winner-proofs')
        .getPublicUrl(fileName)

      const proof_url = urlData.publicUrl

      // Save URL to winners table
      const res = await fetch('/api/winners', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ winner_id: winnerId, proof_url })
      })

      const data = await res.json()
      if (data.error) {
        setUploadMessage('Error saving proof: ' + data.error)
      } else {
        setUploadMessage('Proof uploaded successfully!')
        fetchAll()
      }
    } catch (e) {
      setUploadMessage('Something went wrong')
    } finally {
      setUploadingId(null)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  )

  const pendingWinners = winners.filter(w => w.verification_status === 'pending')
  const approvedWinners = winners.filter(w => w.verification_status === 'approved')

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">⛳ Golf Heroes</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Winner Banner — shows if user has any pending/approved wins */}
        {winners.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-xl font-bold text-yellow-400">You have a winning entry!</h2>
                <p className="text-gray-400 text-sm">
                  Upload your score screenshot as proof to claim your prize.
                </p>
              </div>
            </div>

            {uploadMessage && (
              <p className={`text-sm mb-4 px-4 py-2 rounded-lg ${
                uploadMessage.includes('success')
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {uploadMessage}
              </p>
            )}

            <div className="space-y-4">
              {winners.map(winner => (
                <div key={winner.id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-700">

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-yellow-400 font-bold">
                      {winner.match_type === '5_match' ? '🎯 Jackpot' :
                       winner.match_type === '4_match' ? '🥇 4 Match' : '🥉 3 Match'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      Draw: {winner.draws?.draw_month}
                    </span>
                    {winner.prize_amount && (
                      <span className="text-emerald-400 font-semibold">
                        £{winner.prize_amount}
                      </span>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      winner.verification_status === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : winner.verification_status === 'rejected'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      Verification: {winner.verification_status}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      winner.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      Payment: {winner.payment_status}
                    </span>
                  </div>

                  {/* Proof upload */}
                  {winner.proof_url ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm">✓ Proof submitted</span>
                      <a href={winner.proof_url} target="_blank"
                        className="text-blue-400 text-xs underline">
                        View proof
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">
                        Upload a screenshot of your golf scores as proof:
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingId === winner.id}
                        onChange={e => uploadProof(winner.id, e.target.files[0])}
                        className="text-sm text-gray-400 file:mr-3 file:py-2 file:px-4
                          file:rounded-full file:border-0 file:text-sm file:font-medium
                          file:bg-emerald-500 file:text-white hover:file:bg-emerald-400
                          cursor-pointer"
                      />
                      {uploadingId === winner.id && (
                        <p className="text-yellow-400 text-xs mt-1">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Status */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Subscription</h2>
          {subscription ? (
            <div className="flex items-center gap-3">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                Active — {subscription.plan_type}
              </span>
              <span className="text-gray-500 text-sm">
                Renews {subscription.end_date}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                No active subscription
              </span>
              <button
                onClick={() => router.push('/subscribe')}
                className="text-sm text-green-400 hover:text-green-300">
                Subscribe now →
              </button>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">My Scores</h2>

          <div className="flex gap-3 mb-6">
            <input
              type="number"
              min="1"
              max="45"
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
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          {message && (
            <p className="text-sm text-green-400 mb-4">{message}</p>
          )}

          {scores.length === 0 ? (
            <p className="text-gray-500 text-sm">No scores yet. Add your first score above.</p>
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div key={s.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                    <span className="font-bold text-lg">{s.score}</span>
                    <span className="text-gray-500 text-sm">points</span>
                  </div>
                  <span className="text-gray-500 text-sm">{s.score_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charity */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">My Charity</h2>

          {myCharity && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <p className="text-green-400 font-medium">
                Currently supporting: {myCharity.charities?.name}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Contributing {myCharity.contribution_percent}% of subscription
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charities.map(c => (
              <button
                key={c.id}
                onClick={() => selectCharity(c.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  myCharity?.charity_id === c.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
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