import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtTokens, fmtUsd } from '../lib/format';
import { COLORS, TIP, AXIS } from '../lib/chart-theme';

export default function SessionInsights({ days, tick }) {
  const { data } = useRpc('getSessionInsights', { days }, tick);

  if (!data) return <div className="card"><h3>会话洞察</h3><div className="loading">加载中...</div></div>;

  return (
    <div className="card">
      <h3>会话洞察</h3>

      <div style={{ display: 'flex', gap: 32, marginBottom: 16, fontSize: 12 }}>
        <div>
          <span className="split-k">会话总数 </span>
          <span className="split-v">{data.totalSessions}</span>
        </div>
        <div>
          <span className="split-k">平均费用 </span>
          <span className="split-v" style={{ color: COLORS.primary }}>{fmtUsd(data.avgCost)}</span>
        </div>
        <div>
          <span className="split-k">平均请求 </span>
          <span className="split-v">{data.avgRequests}</span>
        </div>
      </div>

      {data.dailySessions.length > 1 && (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data.dailySessions}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} />
            <Tooltip contentStyle={TIP} />
            <Bar dataKey="sessions" fill={COLORS.secondary} radius={[2, 2, 0, 0]} name="会话数" />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div style={{ marginTop: 14, fontSize: 11, color: '#8b8b96', fontFamily: 'var(--font-title)' }}>
        Top 会话 (按费用)
      </div>
      <div className="session-list">
        {data.top.map(s => (
          <div key={s.session_id} className="session-row">
            <span className="session-id">{s.session_id.slice(0, 8)}</span>
            <span className="session-stat">{s.requests} reqs</span>
            <span className="session-stat">{fmtTokens(s.tokens)}</span>
            <span className="session-cost">{fmtUsd(s.cost)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}