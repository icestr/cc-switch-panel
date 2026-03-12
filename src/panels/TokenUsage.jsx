import { useMemo } from 'react';
import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fmtTokens } from '../lib/format';
import { COLORS, TIP, AXIS, LEGEND_STYLE } from '../lib/chart-theme';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{ ...TIP, padding: 12, minWidth: 160 }}>
      <div style={{ marginBottom: 8, color: '#e8e8ec', fontWeight: 600, fontSize: 12 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 11, padding: '2px 0' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtTokens(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #2a2a32', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', gap: 20, fontWeight: 700, color: '#e8e8ec' }}>
        <span>合计</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtTokens(total)}</span>
      </div>
    </div>
  );
}

export default function TokenUsage({ days, tick }) {
  const { data } = useRpc('getTokenUsage', { days }, tick);

  const stats = useMemo(() => {
    if (!data || !data.length) return null;
    const total = data.reduce((s, d) => s + (d.input || 0) + (d.output || 0) + (d.cacheRead || 0) + (d.cacheCreation || 0), 0);
    const avg = Math.round(total / data.length);
    return { total, avg };
  }, [data]);

  return (
    <div className="card">
      <h3>Token 用量</h3>
      {stats && (
        <div className="token-usage-kpis">
          <div className="token-usage-kpi">
            <span className="token-usage-kpi-label">总计</span>
            <span className="token-usage-kpi-value">{fmtTokens(stats.total)}</span>
          </div>
          <div className="token-usage-kpi">
            <span className="token-usage-kpi-label">日均</span>
            <span className="token-usage-kpi-value">{fmtTokens(stats.avg)}</span>
          </div>
        </div>
      )}
      {!data ? <div className="loading">加载中...</div> : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} tickFormatter={fmtTokens} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="output" stackId="1" fill={COLORS.primary} name="输出" radius={[0, 0, 0, 0]} />
            <Bar dataKey="input" stackId="1" fill={COLORS.secondary} name="输入" />
            <Bar dataKey="cacheRead" stackId="1" fill={COLORS.success} name="缓存读取" />
            <Bar dataKey="cacheCreation" stackId="1" fill={COLORS.warning} name="缓存写入" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
