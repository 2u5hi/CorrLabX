import { useState, useEffect } from 'react'
import ScoreBar from './ScoreBar'
import WatchlistCard from './WatchlistCard'
import ScoreChart from './ScoreChart'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function MetricCard({ label, value, max, description }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="rounded-2xl p-4 border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-mono text-white/80">{value}</span>
      </div>
      <ScoreBar value={pct} />
      <p className="text-xs text-white/30 mt-2 leading-relaxed">{description}</p>
    </div>
  )
}

function readHistory(ticker) {
  try { return JSON.parse(localStorage.getItem(`history_${ticker}`)) || [] }
  catch { return [] }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function saveHistory(ticker, score) {
  const existing = readHistory(ticker)
  const today    = todayKey()
  const filtered = existing.filter(h => h.timestamp.slice(0, 10) !== today)
  filtered.push({ timestamp: new Date().toISOString(), score })
  localStorage.setItem(`history_${ticker}`, JSON.stringify(filtered.slice(-30)))
}

function App() {
  const [ticker, setTicker]             = useState('')
  const [result, setResult]             = useState(null)
  const [history, setHistory]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [loadingCards, setLoadingCards] = useState(new Set())
  const [watchlist, setWatchlist]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('corrLabX_watchlist')) || [] }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('corrLabX_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  async function fetchAnalysis(t) {
    const res  = await fetch(`${API_BASE}/analyze/${t}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data
  }

  function applyResult(data) {
    saveHistory(data.ticker, data.inefficiency)
    setResult(data)
    setHistory(readHistory(data.ticker))
    setWatchlist(prev => prev.map(item =>
      item.ticker === data.ticker
        ? { ...item, inefficiency: data.inefficiency, price: data.price }
        : item
    ))
  }

  const analyze = async () => {
    const t = ticker.trim().toUpperCase()
    if (!t) return
    setLoading(true)
    setError(null)
    setResult(null)
    setHistory([])
    try {
      applyResult(await fetchAnalysis(t))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeCard = async (cardTicker) => {
    setLoadingCards(prev => new Set([...prev, cardTicker]))
    try {
      applyResult(await fetchAnalysis(cardTicker))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingCards(prev => {
        const next = new Set(prev)
        next.delete(cardTicker)
        return next
      })
    }
  }

  const addToWatchlist = () => {
    if (!result || watchlist.some(w => w.ticker === result.ticker)) return
    setWatchlist(prev => [...prev, {
      ticker:       result.ticker,
      inefficiency: result.inefficiency,
      price:        result.price
    }])
  }

  const removeFromWatchlist = (t) => setWatchlist(prev => prev.filter(w => w.ticker !== t))

  const isInWatchlist = result && watchlist.some(w => w.ticker === result.ticker)

  const scoreClass = result
    ? result.inefficiency >= 70 ? 'text-green-400'
    : result.inefficiency >= 40 ? 'text-yellow-400'
    : 'text-red-400'
    : ''

  const scoreLabel = result
    ? result.inefficiency >= 70 ? 'Strong Signal'
    : result.inefficiency >= 40 ? 'Moderate Signal'
    : 'Weak Signal'
    : ''

  const scoreGlow = result
    ? result.inefficiency >= 70 ? '#22c55e'
    : result.inefficiency >= 40 ? '#f59e0b'
    : '#ef4444'
    : 'transparent'

  return (
    <div
      className="flex h-screen overflow-hidden text-white"
      style={{
        background: 'radial-gradient(ellipse at 20% 10%, rgba(120,60,220,0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(30,100,220,0.07) 0%, transparent 55%), #07070d'
      }}
    >

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 h-full flex flex-col border-r border-white/[0.06] bg-white/[0.015] backdrop-blur-2xl">

        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <h1 className="text-xl font-bold tracking-tight text-white">CorrLabX</h1>
          <p className="text-xs text-white/30 mt-1">Market inefficiency scanner</p>
        </div>

        {/* Search */}
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Ticker (e.g. SNDL)"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 font-mono"
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full bg-white/90 text-black text-sm font-semibold py-2.5 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Watchlist */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {watchlist.length > 0 ? (
            <>
              <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Watchlist</p>
              <div className="space-y-2">
                {watchlist.map(item => (
                  <WatchlistCard
                    key={item.ticker}
                    item={item}
                    onAnalyze={analyzeCard}
                    onRemove={removeFromWatchlist}
                    isLoading={loadingCards.has(item.ticker)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-white/20 text-center mt-8">No stocks in watchlist</p>
          )}
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">

          {error && (
            <div className="mb-6 rounded-2xl px-5 py-4 border border-red-500/20 bg-red-500/[0.07] backdrop-blur-xl">
              <p className="text-red-400 font-semibold text-sm">Analysis failed</p>
              <p className="text-red-400/60 text-sm mt-0.5">{error}</p>
            </div>
          )}

          {loading && !result && (
            <div className="flex items-center justify-center h-64">
              <p className="text-white/30 text-sm animate-pulse">Running analysis — this may take a moment...</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <p className="text-white/20 text-sm">Enter a ticker in the sidebar and click Analyze</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">

              {/* Score Hero */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-8 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${scoreGlow}22 0%, transparent 65%)` }}
                />
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-mono">{result.ticker}</p>
                <p className={`text-8xl font-bold font-mono ${scoreClass}`}>{result.inefficiency}</p>
                <p className="text-white/20 text-sm mt-1 mb-4">/ 100</p>
                <ScoreBar value={result.inefficiency} />
                <p className={`text-sm font-semibold mt-3 ${scoreClass}`}>{scoreLabel}</p>
                <button
                  onClick={addToWatchlist}
                  disabled={isInWatchlist}
                  className="mt-5 text-xs px-4 py-2 rounded-lg border border-white/15 text-white/45 hover:text-white/75 hover:border-white/30 disabled:opacity-25 disabled:cursor-default transition-all"
                >
                  {isInWatchlist ? 'In Watchlist' : '+ Add to Watchlist'}
                </button>
              </div>

              {/* Score History */}
              <ScoreChart history={history} />

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Autocorrelation"
                  value={result.components.autocorrelation}
                  max={0.20}
                  description="Past returns predicting future returns."
                />
                <MetricCard
                  label="Vol. Clustering"
                  value={result.components.volatility_clustering}
                  max={0.20}
                  description="Whether big moves cluster together."
                />
                <MetricCard
                  label="ARIMA Edge"
                  value={result.components.arima_edge}
                  max={0.05}
                  description="Model accuracy vs. random guessing."
                />
              </div>

              {/* Forward Return + Price + Volume */}
              <div className={`grid gap-3 ${result.forward_return !== undefined ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {result.forward_return !== undefined && (() => {
                  const pct      = (result.forward_return * 100).toFixed(2)
                  const positive = result.forward_return >= 0
                  return (
                    <div className="rounded-2xl p-4 border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Forward Return</p>
                      <p className={`text-2xl font-mono font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
                        {positive ? '+' : ''}{pct}%
                      </p>
                      <p className="text-[10px] text-white/25 mt-1">20% held-out window</p>
                    </div>
                  )
                })()}
                <div className="rounded-2xl p-4 border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Latest Close</p>
                  <p className="text-2xl font-mono font-semibold text-white">${result.price.latest_close}</p>
                </div>
                <div className="rounded-2xl p-4 border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Avg Volume</p>
                  <p className="text-2xl font-mono font-semibold text-white">{result.price.avg_volume.toLocaleString()}</p>
                </div>
              </div>

              {result.reliable === "false" && (
                <div className="rounded-2xl px-5 py-4 border border-yellow-500/20 bg-yellow-500/[0.06] backdrop-blur-xl">
                  <p className="text-yellow-400 text-sm font-semibold">Low Reliability</p>
                  <p className="text-yellow-400/60 text-xs mt-1">
                    Insufficient liquidity or price above threshold. Score may not be meaningful.
                  </p>
                </div>
              )}

              <p className="text-xs text-white/15 text-center pt-2 pb-6">
                Not financial advice. Scores reflect historical pattern strength only.
              </p>

            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
