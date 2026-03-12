import { useRpc } from '../hooks/useRpc';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fmtUsd4, shortModel } from '../lib/format';
import { PALETTE, TIP, LEGEND_STYLE } from '../lib/chart-theme';

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ ...TIP, padding: 10, minWidth: 120 }}>
      <div style={{ color: d.payload.fill, fontWeight: 600, marginBottom: 4 }}>{shortModel(d.name)}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>{fmtUsd4(d.value)}</div>
    </div>
  );
}

export default function ModelDistro({ days, tick }) {
  const { data } = useRpc('getModelDistro', { days }, tick);

  return (
    <div className="card">
      <h3>模型分布</h3>
      {!data ? <div className="loading">加载中...</div> : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="cost" nameKey="model" cx="50%" cy="50%"
              innerRadius={50} outerRadius={80} paddingAngle={2} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend wrapperStyle={LEGEND_STYLE} formatter={shortModel} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
