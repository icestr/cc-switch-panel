import { useMemo } from 'react';
import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fmtTokens } from '../lib/format';
import { COLORS, TIP, AXIS, LEGEND_STYLE } from '../lib/chart-theme';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={TIP}>
      <div style={{ marginBottom: 6, color: 'var(--text-primary)', fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{fmtTokens(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border-default)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', gap: 16, fontWeight: 600 }}>
        <span>合计</span>
        <span>{fmtTokens(total)}</span>
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
        <div className="token-usage-stats">
          <span><span className="split-k">总计 </span><span className="token-usage-val">{fmtTokens(stats.total)}</span></span>
          <span><span className="split-k">日均 </span><span className="token-usage-val">{fmtTokens(stats.avg)}</span></span>
        </div>
      )}
      {!data ? <div className="loading">加载中...</div> : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} tickFormatter={fmtTokens} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="output" stackId="1" fill={COLORS.primary} name="输出" />
            <Bar dataKey="input" stackId="1" fill={COLORS.secondary} name="输入" />
            <Bar dataKey="cacheRead" stackId="1" fill={COLORS.success} name="缓存读取" />
            <Bar dataKey="cacheCreation" stackId="1" fill={COLORS.warning} name="缓存写入" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
