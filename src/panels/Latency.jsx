import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { shortModel } from '../lib/format';
import { COLORS, TIP, AXIS } from '../lib/chart-theme';

export default function Latency({ days, tick }) {
  const { data } = useRpc('getLatencyStats', { days }, tick);

  return (
    <div className="card">
      <h3>延迟分布 (ms)</h3>
      {!data ? <div className="loading">加载中...</div> : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" tick={AXIS} />
            <YAxis type="category" dataKey="model" tick={AXIS} width={120}
              tickFormatter={shortModel} />
            <Tooltip contentStyle={TIP}
              formatter={v => [v + 'ms']} labelFormatter={shortModel} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b8b96' }} />
            <Bar dataKey="avgLatency" fill={COLORS.primary} name="平均延迟" />
            <Bar dataKey="avgFirstToken" fill={COLORS.success} name="首Token" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
