import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fmtTokens } from '../lib/format';
import { COLORS, TIP, AXIS } from '../lib/chart-theme';

export default function TokenUsage({ days, tick }) {
  const { data } = useRpc('getTokenUsage', { days }, tick);

  return (
    <div className="card">
      <h3>Token 用量</h3>
      {!data ? <div className="loading">加载中...</div> : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} tickFormatter={fmtTokens} />
            <Tooltip contentStyle={TIP} formatter={v => [fmtTokens(v)]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b8b96' }} />
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
