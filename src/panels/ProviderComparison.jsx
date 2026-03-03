import { useRpc } from '../hooks/useRpc';
import { fmtUsd, fmtMs, fmtPct } from '../lib/format';
import { COLORS } from '../lib/chart-theme';

export default function ProviderComparison({ days, tick }) {
  const { data } = useRpc('getProviderComparison', { days }, tick);

  if (!data) return <div className="card"><h3>服务商对比</h3><div className="loading">加载中...</div></div>;

  const maxReqs = Math.max(...data.map(d => d.requests));

  return (
    <div className="card">
      <h3>服务商对比</h3>
      {data.map(p => (
        <div key={p.providerName} className="provider-row">
          <span className="provider-name">{p.providerName}</span>
          <div className="provider-bar-wrap">
            <div
              className="provider-bar"
              style={{
                width: (p.requests / maxReqs * 100) + '%',
                background: p.errorRate > 5 ? COLORS.danger : COLORS.primary,
              }}
            />
          </div>
          <span className="provider-stat">{p.requests}</span>
          <span className="provider-stat" style={{ color: COLORS.primary }}>{fmtUsd(p.cost)}</span>
          <span className="provider-stat" style={{
            color: p.errorRate > 5 ? COLORS.danger : p.errorRate > 2 ? COLORS.warning : COLORS.success
          }}>
            {fmtPct(p.errorRate)}
          </span>
        </div>
      ))}
    </div>
  );
}