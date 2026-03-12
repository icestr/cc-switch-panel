import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { fmtTokens, fmtUsd } from '../lib/format';
import { COLORS, PALETTE, TIP, AXIS, LEGEND_STYLE } from '../lib/chart-theme';

const APP_COLORS = {
  claude: COLORS.accent,
  codex: COLORS.secondary,
  gemini: COLORS.success,
};

const APP_LABELS = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
};

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const label = APP_LABELS[d.name] || d.name;
  return (
    <div style={{ ...TIP, padding: 10, minWidth: 120 }}>
      <div style={{ color: d.payload.fill, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>{fmtUsd(d.value)}</div>
    </div>
  );
}

export default function ClientDistro({ days, tick }) {
  const { data } = useRpc('getClientDistro', { days }, tick);

  if (!data) return <div className="card"><h3>客户端分布</h3><div className="loading">加载中...</div></div>;

  const totalCost = data.summary.reduce((s, d) => s + (d.cost || 0), 0);

  return (
    <div className="card">
      <h3>客户端分布</h3>

      <div className="client-distro-layout">
        <div className="client-distro-chart">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.summary} dataKey="cost" nameKey="app_type" cx="50%" cy="50%"
                innerRadius={40} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                {data.summary.map((d) => (
                  <Cell key={d.app_type} fill={APP_COLORS[d.app_type] || PALETTE[0]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="client-distro-stats">
          {data.summary.map(d => (
            <div key={d.app_type} className="client-stat-row">
              <span className="client-stat-dot" style={{ background: APP_COLORS[d.app_type] }} />
              <span className="client-stat-name">{APP_LABELS[d.app_type] || d.app_type}</span>
              <span className="client-stat-val">{d.count}</span>
              <span className="client-stat-val" style={{ color: COLORS.primary }}>{fmtUsd(d.cost)}</span>
              <span className="client-stat-val">{totalCost ? (d.cost / totalCost * 100).toFixed(1) + '%' : '--'}</span>
            </div>
          ))}
        </div>
      </div>

      {data.daily.length > 1 && (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data.daily}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} />
            <Tooltip contentStyle={TIP} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="claude" stackId="1" fill={APP_COLORS.claude} name="Claude" />
            <Bar dataKey="codex" stackId="1" fill={APP_COLORS.codex} name="Codex" />
            <Bar dataKey="gemini" stackId="1" fill={APP_COLORS.gemini} name="Gemini" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
