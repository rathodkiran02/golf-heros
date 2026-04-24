'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [charities, setCharities] = useState([])

  useEffect(() => {
    fetch('/api/charities')
      .then(r => r.json())
      .then(d => setCharities(d.charities || []))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/50 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">⛳ Golf Heroes</h1>
        <div className="flex gap-3">
          {user ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-full text-sm transition-colors">
              My Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors">
                Sign In
              </button>
              <button
                onClick={() => router.push('/login')}
                className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-full text-sm transition-colors">
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Monthly draw now open
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Play Golf.<br />
          <span className="text-green-400">Change Lives.</span><br />
          Win Big.
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Every score you enter puts you in the monthly prize draw.
          Every subscription funds a charity you believe in.
          Golf has never felt this good.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={() => router.push('/login')}
            className="bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-full text-lg transition-all hover:scale-105">
            Join the Draw →
          </button>
          <button
            onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
            className="border border-gray-700 hover:border-gray-500 text-white px-8 py-4 rounded-full text-lg transition-colors">
            How it works
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 md:gap-16 text-center">
          {[
            { value: '£2,400', label: 'Prize pool this month' },
            { value: '10%+', label: 'Goes to charity' },
            { value: '5', label: 'Scores to enter' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-black text-green-400">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-green-400 text-sm font-medium text-center mb-3 uppercase tracking-widest">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            Three simple steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Subscribe',
                desc: 'Choose monthly or yearly. A portion automatically goes to your chosen charity.',
                icon: '💳'
              },
              {
                step: '02',
                title: 'Enter Your Scores',
                desc: 'Submit your last 5 Stableford golf scores. These become your draw numbers.',
                icon: '⛳'
              },
              {
                step: '03',
                title: 'Win & Give',
                desc: 'Monthly draw matches your scores to winning numbers. Win prizes, fund causes.',
                icon: '🏆'
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-green-500/30 transition-colors">
                <div className="text-4xl mb-4">{item.icon}</div>
                <p className="text-green-400 text-xs font-bold mb-2 uppercase tracking-widest">
                  Step {item.step}
                </p>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-green-400 text-sm font-medium mb-3 uppercase tracking-widest">
            Prize structure
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-16">
            How prizes are split
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { match: '5 Match', share: '40%', label: 'Jackpot', color: 'green', rollover: true },
              { match: '4 Match', share: '35%', label: 'Major Prize', color: 'blue', rollover: false },
              { match: '3 Match', share: '25%', label: 'Prize', color: 'purple', rollover: false },
            ].map((tier, i) => (
              <div key={i} className={`bg-gray-900 rounded-2xl p-6 border ${
                i === 0 ? 'border-green-500/50' : 'border-gray-800'
              }`}>
                <p className="text-2xl font-black mb-1">{tier.match}</p>
                <p className={`text-4xl font-black mb-2 ${
                  i === 0 ? 'text-green-400' : i === 1 ? 'text-blue-400' : 'text-purple-400'
                }`}>{tier.share}</p>
                <p className="text-gray-400 text-sm">{tier.label}</p>
                {tier.rollover && (
                  <p className="text-xs text-green-400/70 mt-2">
                    Jackpot rolls over if unclaimed
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charities */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-green-400 text-sm font-medium text-center mb-3 uppercase tracking-widest">
            Make an impact
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4">
            Choose your cause
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            Every subscription automatically donates to the charity you choose. Min 10%, you decide how much.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {charities.map(c => (
              <div key={c.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-green-500/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-lg flex-shrink-0">
                    🤝
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.is_featured && (
                        <span className="text-xs text-yellow-400">★ Featured</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">{c.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-gray-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to play with<br />
            <span className="text-green-400">purpose?</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Join Golf Heroes today. Enter your scores, support a cause, and get in the draw.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-green-500 hover:bg-green-400 text-black font-black px-10 py-5 rounded-full text-xl transition-all hover:scale-105">
            Start Playing →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 px-6 py-8 text-center">
        <p className="text-gray-600 text-sm">
          © 2026 Golf Heroes · digitalheroes.co.in · Golf. Charity. Prizes.
        </p>
      </footer>

    </div>
  )
}