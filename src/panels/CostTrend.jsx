import { useRpc } from '../hooks/useRpc';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtUsd4 } from '../lib/format';
import { COLORS, TIP, AXIS } from '../lib/chart-theme';

export default function CostTrend({ days, tick }) {
  const { data } = useRpc('getCostTrend', { days }, tick);

  return (
    <div className="card">
      <h3>费用趋势</h3>
      {!data ? <div className="loading">加载中...</div> : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} tickFormatter={v => '$' + v.toFixed(0)} width={50} />
            <Tooltip contentStyle={TIP} formatter={v => [fmtUsd4(v)]} labelStyle={{ color: '#8b8b96' }} />
            <Area type="monotone" dataKey="outputCost" stackId="1" fill={COLORS.primary} stroke={COLORS.primary} fillOpacity={0.4} name="输出" />
            <Area type="monotone" dataKey="inputCost" stackId="1" fill={COLORS.secondary} stroke={COLORS.secondary} fillOpacity={0.25} name="输入" />
            <Area type="monotone" dataKey="cacheCost" stackId="1" fill={COLORS.success} stroke={COLORS.success} fillOpacity={0.15} name="缓存" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
