import ScoreBar from './ScoreBar'

const scoreClass = s => s >= 70 ? 'text-green-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400'

export default function WatchlistCard({ item, onAnalyze, onRemove, isLoading }) {
  return (
    <div
      onClick={() => !isLoading && onAnalyze(item.ticker)}
      className="rounded-xl p-3 border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl cursor-pointer hover:bg-white/[0.07] transition-colors relative"
    >
      <button
        onClick={e => { e.stopPropagation(); onRemove(item.ticker) }}
        className="absolute top-2.5 right-2.5 text-white/25 hover:text-white/60 text-base leading-none"
      >
        ×
      </button>

      {isLoading ? (
        <div className="flex items-center h-10">
          <span className="text-white/30 text-xs animate-pulse">Analyzing...</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between pr-5">
            <span className="text-xs font-mono text-white/50">{item.ticker}</span>
            <span className={`text-lg font-bold font-mono ${scoreClass(item.inefficiency)}`}>
              {item.inefficiency}
            </span>
          </div>
          <ScoreBar value={item.inefficiency} />
          <p className="text-[10px] text-white/30 font-mono mt-1.5">${item.price.latest_close}</p>
        </>
      )}
    </div>
  )
}
