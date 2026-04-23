'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight text-emerald-400">
          Golf Heroes
        </span>
        <div className="flex gap-4">
          {user ? (
            <Link href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-full text-sm font-medium transition">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="text-gray-300 hover:text-white px-4 py-2 text-sm transition">
                Log in
              </Link>
              <Link href="/login?from=/subscribe"
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-full text-sm font-medium transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-4">
          Golf · Giving · Winning
        </span>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-4xl mb-6">
          Play golf.<br />
          <span className="text-emerald-400">Change lives.</span><br />
          Win prizes.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Enter your golf scores every month, get entered into our prize draw,
          and automatically donate to a charity you believe in. All in one place.
        </p>
        <Link href="/login?from=/subscribe"
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-lg px-10 py-4 rounded-full font-semibold transition">
          Start your membership
        </Link>
        <p className="text-gray-600 text-sm mt-4">Monthly or yearly plans available</p>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-gray-400 text-center mb-14">Three simple steps. Real impact.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Subscribe',
                desc: 'Choose a monthly or yearly plan. A portion of your fee goes straight to your chosen charity.',
                color: 'text-emerald-400'
              },
              {
                step: '02',
                title: 'Enter your scores',
                desc: 'Log your last 5 golf scores in Stableford format. Your scores are your draw entries.',
                color: 'text-emerald-400'
              },
              {
                step: '03',
                title: 'Win every month',
                desc: 'Match 3, 4, or all 5 numbers in our monthly draw. Jackpot rolls over if unclaimed.',
                color: 'text-emerald-400'
              }
            ].map((item) => (
              <div key={item.step} className="bg-gray-800 rounded-2xl p-8">
                <span className="text-4xl font-bold text-gray-700">{item.step}</span>
                <h3 className={`text-xl font-bold mt-3 mb-2 ${item.color}`}>{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE POOL */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How prizes are split</h2>
          <p className="text-gray-400 mb-12">Every subscriber contributes to the pool. Here is how it is distributed.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { match: '5 numbers', share: '40%', label: 'Jackpot', rollover: true, bg: 'bg-emerald-900 border-emerald-600' },
              { match: '4 numbers', share: '35%', label: 'Major prize', rollover: false, bg: 'bg-gray-800 border-gray-600' },
              { match: '3 numbers', share: '25%', label: 'Prize', rollover: false, bg: 'bg-gray-800 border-gray-600' },
            ].map((tier) => (
              <div key={tier.match} className={`${tier.bg} border rounded-2xl p-8`}>
                <p className="text-2xl font-bold text-emerald-400">{tier.share}</p>
                <p className="text-lg font-semibold mt-1">{tier.label}</p>
                <p className="text-gray-400 text-sm mt-2">Match {tier.match}</p>
                {tier.rollover && (
                  <span className="inline-block mt-3 text-xs bg-emerald-800 text-emerald-300 px-3 py-1 rounded-full">
                    Rolls over if unclaimed
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITY */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">
            Real impact
          </span>
          <h2 className="text-3xl font-bold mt-3 mb-6">
            Every subscription gives back
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">
            At least 10% of every subscription goes directly to your chosen charity.
            You pick who benefits. You can give more if you want. No middlemen, no delay.
          </p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { stat: '10%+', label: 'Of every subscription to charity' },
              { stat: 'Monthly', label: 'Prize draws for all subscribers' },
              { stat: 'You choose', label: 'Which charity receives your share' },
            ].map((s) => (
              <div key={s.stat} className="bg-gray-800 rounded-xl p-6">
                <p className="text-2xl font-bold text-emerald-400">{s.stat}</p>
                <p className="text-gray-400 text-sm mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to play with purpose?</h2>
        <p className="text-gray-400 mb-8">Join golfers who compete, give, and win every month.</p>
        <Link href="/login?from=/subscribe"
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-lg px-10 py-4 rounded-full font-semibold transition">
          Join Golf Heroes
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-8 px-8 flex justify-between items-center text-gray-600 text-sm">
        <span className="text-emerald-400 font-semibold">Golf Heroes</span>
        <span>Golf · Giving · Winning</span>
      </footer>

    </div>
  )
}