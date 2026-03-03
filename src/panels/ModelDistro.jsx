import { useRpc } from '../hooks/useRpc';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fmtUsd4, shortModel } from '../lib/format';
import { PALETTE, TIP } from '../lib/chart-theme';

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
            <Tooltip contentStyle={TIP} formatter={v => [fmtUsd4(v)]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b8b96' }} formatter={shortModel} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
