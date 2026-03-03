import { useRpc } from '../hooks/useRpc';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Bar } from 'recharts';
import { fmtTokens, fmtUsd, fmtPct } from '../lib/format';
import { COLORS, TIP, AXIS } from '../lib/chart-theme';

export default function CacheEfficiency({ days, tick }) {
  const { data } = useRpc('getCacheEfficiency', { days }, tick);

  if (!data) return <div className="card"><h3>缓存效率</h3><div className="loading">加载中...</div></div>;

  const saved = data.totalCacheRead && data.totalInput
    ? (data.totalCacheRead / 1e6 * 0.003 - (data.totalCacheReadCost || 0)).toFixed(2)
    : null;

  return (
    <div className="card">
      <h3>缓存效率</h3>
      <div style={{ display: 'flex', gap: 32, marginBottom: 16, fontSize: 12 }}>
        <div>
          <span className="split-k">平均命中率 </span>
          <span style={{ color: COLORS.success, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {fmtPct(data.avgHitRate)}
          </span>
        </div>
        {saved && (
          <div>
            <span className="split-k">预估节省 </span>
            <span style={{ color: COLORS.success, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              ~${saved}
            </span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data.daily}>
          <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
          <YAxis yAxisId="rate" tick={AXIS} tickFormatter={v => v + '%'} domain={[0, 100]} />
          <YAxis yAxisId="cost" orientation="right" tick={AXIS} tickFormatter={v => '$' + v.toFixed(0)} />
          <Tooltip contentStyle={TIP} />
          <Bar yAxisId="cost" dataKey="cacheReadCost" fill={COLORS.success} fillOpacity={0.3} name="缓存读取费用" />
          <Line yAxisId="rate" type="monotone" dataKey="hitRate" stroke={COLORS.success} strokeWidth={2} dot={false} name="命中率%" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}