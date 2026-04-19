export default function ScoreBar({ value }) {
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-full bg-white/10 rounded-full h-2 mt-1">
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  )
}
