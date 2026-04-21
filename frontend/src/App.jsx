import { useState, useEffect } from 'react'
import ScoreBar from './ScoreBar'
import WatchlistCard from './WatchlistCard'
import ScoreChart from './ScoreChart'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function MetricCard({ label, value, max, description }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-sm font-mono text-white">{value}</span>
      </div>
      <ScoreBar value={pct} />
      <p className="text-xs text-white/40 mt-2">{description}</p>
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
  const [ticker, setTicker]         = useState('')
  const [result, setResult]         = useState(null)
  const [history, setHistory]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [loadingCards, setLoadingCards] = useState(new Set())
  const [watchlist, setWatchlist]   = useState(() => {
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

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col items-center px-4 py-16">

      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-2">CorrLabX</h1>
        <p className="text-white/40 text-sm">
          Market inefficiency scanner for low-cap equities
        </p>
      </div>

      <div className="flex gap-2 w-full max-w-md mb-8">
        <input
          type="text"
          placeholder="Enter ticker (e.g. SNDL)"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-white/90 disabled:opacity-40 transition-all"
        >
          {loading ? '...' : 'Analyze'}
        </button>
      </div>

      {watchlist.length > 0 && (
        <div className="w-full max-w-md mb-10">
          <p className="text-xs text-white/30 mb-3 uppercase tracking-widest">Watchlist</p>
          <div className="grid grid-cols-2 gap-3">
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
        </div>
      )}

      {error && (
        <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm space-y-1">
          <p className="text-red-400 font-semibold">Analysis failed</p>
          <p className="text-red-400/70">{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-white/30 text-sm animate-pulse">
          Running analysis — this may take a minute...
        </div>
      )}

      {result && (
        <div className="w-full max-w-md space-y-4">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-white/40 text-sm mb-1">{result.ticker}</p>
            <p className={`text-7xl font-bold font-mono ${scoreClass}`}>
              {result.inefficiency}
            </p>
            <p className="text-white/30 text-sm mt-1">/ 100</p>
            <div className="mt-3">
              <ScoreBar value={result.inefficiency} />
            </div>
            <p className={`text-sm font-semibold mt-3 ${scoreClass}`}>
              {scoreLabel}
            </p>
            <button
              onClick={addToWatchlist}
              disabled={isInWatchlist}
              className="mt-4 text-sm px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-default transition-all"
            >
              {isInWatchlist ? 'In Watchlist' : '+ Add to Watchlist'}
            </button>
          </div>

          <ScoreChart history={history} />

          <div className="space-y-3">
            <MetricCard
              label="Autocorrelation"
              value={result.components.autocorrelation}
              max={0.20}
              description="How much past returns predict future returns. Higher = stronger pattern."
            />
            <MetricCard
              label="Volatility Clustering"
              value={result.components.volatility_clustering}
              max={0.20}
              description="Whether big moves cluster together. Higher = more predictable bursts."
            />
            <MetricCard
              label="ARIMA Edge"
              value={result.components.arima_edge}
              max={0.05}
              description="How much the model beats random guessing. Higher = stronger signal."
            />
          </div>

          {result.forward_return !== undefined && (() => {
            const pct = (result.forward_return * 100).toFixed(2)
            const positive = result.forward_return >= 0
            return (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Forward Return (test period)</p>
                    <p className={`text-2xl font-mono font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{pct}%
                    </p>
                  </div>
                  <p className="text-xs text-white/30 max-w-[140px] text-right">
                    Actual price change over the 20% held-out window
                  </p>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Latest Close</p>
              <p className="text-xl font-mono font-semibold">
                ${result.price.latest_close}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Volume</p>
              <p className="text-xl font-mono font-semibold">
                {result.price.volume.toLocaleString()}
              </p>
            </div>
          </div>

          <p className="text-xs text-white/20 text-center pt-2">
            Not financial advice. Scores reflect historical pattern strength only.
          </p>

        </div>
      )}
    </div>
  )
}

export default App
