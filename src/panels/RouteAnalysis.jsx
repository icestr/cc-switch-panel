import { useRpc } from '../hooks/useRpc';
import { shortModel, fmtPct } from '../lib/format';
import { COLORS } from '../lib/chart-theme';

export default function RouteAnalysis({ days, tick }) {
  const { data } = useRpc('getRouteAnalysis', { days }, tick);

  if (!data) return <div className="card"><h3>模型路由</h3><div className="loading">加载中...</div></div>;

  return (
    <div className="card">
      <h3>模型路由</h3>
      <table className="route-table">
        <thead>
          <tr>
            <th>请求模型</th>
            <th className="num">总量</th>
            <th className="num">升级数</th>
            <th className="num">升级率</th>
          </tr>
        </thead>
        <tbody>
          {data.summary.map(r => (
            <tr key={r.request_model}>
              <td>{shortModel(r.request_model)}</td>
              <td className="num">{r.total}</td>
              <td className="num">{r.upgraded}</td>
              <td className="num highlight">{fmtPct(r.upgradeRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, fontSize: 11, color: '#8b8b96' }}>
        <div style={{ marginBottom: 6, fontFamily: 'var(--font-title)' }}>路由流向 (Top 10)</div>
        {data.flows.slice(0, 10).map((f, i) => {
          const same = f.source === f.target;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', fontFamily: 'var(--font-mono)' }}>
              <span style={{ minWidth: 100 }}>{shortModel(f.source)}</span>
              <span style={{ color: same ? '#55555e' : COLORS.warning }}>{same ? '=' : '\u2192'}</span>
              <span style={{ minWidth: 100, color: same ? '#55555e' : '#e8e8ec' }}>{shortModel(f.target)}</span>
              <span style={{ marginLeft: 'auto', color: '#55555e' }}>{f.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}