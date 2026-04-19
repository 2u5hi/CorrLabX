import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceDot
} from 'recharts'

const scoreColor = s => s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444'

export default function ScoreChart({ history }) {
  if (!history || history.length === 0) return null

  const data = history.map(h => ({
    date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: h.score
  }))

  const color = scoreColor(data[data.length - 1].score)

  if (data.length === 1) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs text-white/40 mb-3">Score History</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
            <XAxis dataKey="date" stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} width={32} />
            <ReferenceDot
              x={data[0].date}
              y={data[0].score}
              r={5}
              fill={color}
              stroke="none"
              label={{ value: data[0].score, fill: color, fontSize: 12, dy: -12 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-white/40 mb-3">Score History</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
          <YAxis domain={[0, 100]} stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} width={32} />
          <Tooltip
            contentStyle={{ background: '#1a1a1d', border: '1px solid #ffffff20', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#ffffff60' }}
            itemStyle={{ color }}
            formatter={v => [v, 'Score']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
