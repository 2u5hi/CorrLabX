import ScoreBar from './ScoreBar'

const scoreClass = s => s >= 70 ? 'text-green-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400'

export default function WatchlistCard({ item, onAnalyze, onRemove, isLoading }) {
  return (
    <div
      onClick={() => !isLoading && onAnalyze(item.ticker)}
      className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors relative"
    >
      <button
        onClick={e => { e.stopPropagation(); onRemove(item.ticker) }}
        className="absolute top-3 right-3 text-white/30 hover:text-white/70 text-lg leading-none"
      >
        ×
      </button>

      {isLoading ? (
        <div className="flex items-center justify-center h-16">
          <span className="text-white/30 text-sm animate-pulse">Analyzing...</span>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/40 font-mono mb-2">{item.ticker}</p>
          <p className={`text-3xl font-bold font-mono ${scoreClass(item.inefficiency)}`}>
            {item.inefficiency}
          </p>
          <p className="text-xs text-white/30 mb-2">/ 100</p>
          <ScoreBar value={item.inefficiency} />
          <p className="text-xs text-white/40 font-mono mt-2">${item.price.latest_close}</p>
        </>
      )}
    </div>
  )
}
