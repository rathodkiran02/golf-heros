'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function SubscribePage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [step, setStep] = useState('pricing')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ name: '', card: '', expiry: '', cvv: '' })

  const plans = {
    monthly: { label: 'Monthly', price: '£9.99', period: '/month', total: '£9.99 today' },
    yearly:  { label: 'Yearly',  price: '£7.99', period: '/month', total: '£95.88 today', badge: 'Save 20%' }
  }

  useEffect(() => {
    if (!session) {
      setChecking(false)
      return
    }
    fetch('/api/subscriptions', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.subscription?.status === 'active') {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    })
    .catch(() => setChecking(false))
  }, [session])

  async function handleSubscribe() {
    if (!form.name || !form.card || !form.expiry || !form.cvv) {
      alert('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ plan_type: selectedPlan })
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/dashboard?subscribed=true')
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking subscription status
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p className="text-gray-400">Checking membership status...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">You need to be logged in to subscribe.</p>
          <button onClick={() => router.push('/login')}
            className="bg-emerald-500 px-6 py-2 rounded-full text-sm font-medium">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-12">
          <span className="text-emerald-400 font-semibold text-sm uppercase tracking-widest">
            Membership
          </span>
          <h1 className="text-4xl font-bold mt-2">Choose your plan</h1>
          <p className="text-gray-400 mt-3">Cancel anytime. Charity contribution included.</p>
        </div>

        {step === 'pricing' && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {Object.entries(plans).map(([key, plan]) => (
                <button key={key} onClick={() => setSelectedPlan(key)}
                  className={`relative text-left rounded-2xl p-8 border-2 transition ${
                    selectedPlan === key
                      ? 'border-emerald-500 bg-emerald-950'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                  }`}>
                  {plan.badge && (
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-gray-400 text-sm mb-2">{plan.label}</p>
                  <p className="text-4xl font-bold">{plan.price}
                    <span className="text-gray-500 text-base font-normal">{plan.period}</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-gray-300">
                    <li>✓ Monthly prize draw entry</li>
                    <li>✓ Score tracking dashboard</li>
                    <li>✓ 10%+ to your chosen charity</li>
                    <li>✓ Jackpot rollover eligibility</li>
                  </ul>
                  <p className="text-gray-500 text-xs mt-6">{plan.total}</p>
                </button>
              ))}
            </div>

            <button onClick={() => setStep('checkout')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-full text-lg font-semibold transition">
              Continue with {plans[selectedPlan].label} plan
            </button>
          </>
        )}

        {step === 'checkout' && (
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md mx-auto">
            <button onClick={() => setStep('pricing')}
              className="text-gray-500 text-sm mb-6 hover:text-white transition">
              ← Back to plans
            </button>

            <div className="bg-gray-800 rounded-xl p-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Golf Heroes {plans[selectedPlan].label}</span>
                <span className="font-semibold">{plans[selectedPlan].price}/mo</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Charity contribution (10%)</span>
                <span className="text-emerald-400">Included</span>
              </div>
              <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between font-semibold">
                <span>Total today</span>
                <span>{plans[selectedPlan].total}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Name on card</label>
                <input value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Rathod Kiran"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Card number</label>
                <input value={form.card}
                  onChange={e => setForm({...form, card: e.target.value})}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Expiry</label>
                  <input value={form.expiry}
                    onChange={e => setForm({...form, expiry: e.target.value})}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">CVV</label>
                  <input value={form.cvv}
                    onChange={e => setForm({...form, cvv: e.target.value})}
                    placeholder="123"
                    maxLength={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"/>
                </div>
              </div>
            </div>

            <button onClick={handleSubscribe} disabled={loading}
              className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-4 rounded-full text-lg font-semibold transition">
              {loading ? 'Processing...' : `Pay ${plans[selectedPlan].total}`}
            </button>

            <p className="text-center text-gray-600 text-xs mt-4">
              🔒 Payments processed securely. Test mode active.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}