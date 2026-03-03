import { useRpc } from '../hooks/useRpc';
import { COLORS } from '../lib/chart-theme';

function interpolate(value, max) {
  if (!max || !value) return 'var(--bg-elevated)';
  const t = Math.min(value / max, 1);
  const r = Math.round(139 + (61 - 139) * t);
  const g = Math.round(124 + (214 - 124) * t);
  const b = Math.round(246 + (140 - 246) * t);
  return `rgb(${r},${g},${b})`;
}

export default function ActivityHeatmap({ days, tick }) {
  const { data } = useRpc('getActivityHeatmap', { days }, tick);

  if (!data) return <div className="card"><h3>活跃时段</h3><div className="loading">加载中...</div></div>;

  const dates = [...new Set(data.map(d => d.date))].sort();
  const map = {};
  let max = 0;
  data.forEach(d => {
    const key = d.date + '-' + d.hour;
    map[key] = d.requests;
    if (d.requests > max) max = d.requests;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="card">
      <h3>活跃时段</h3>
      <div className="heatmap-grid">
        {hours.filter(h => h % 2 === 0).map(h => (
          <div key={h} className="heatmap-row">
            <span className="heatmap-label">{String(h).padStart(2, '0')}</span>
            {dates.map(d => (
              <div
                key={d}
                className="heatmap-cell"
                title={`${d} ${h}:00 - ${map[d + '-' + h] || 0} reqs`}
                style={{ background: interpolate(map[d + '-' + h], max) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-date-labels">
        {dates.map((d, i) => (
          <span key={d}>{i % Math.ceil(dates.length / 6) === 0 ? d.slice(5) : ''}</span>
        ))}
      </div>
    </div>
  );
}