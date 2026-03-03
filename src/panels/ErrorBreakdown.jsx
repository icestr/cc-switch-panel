import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { COLORS, TIP, AXIS } from '../lib/chart-theme';

const TYPE_LABELS = {
  rate_limit: '限流',
  timeout: '超时',
  conn_fail: '连接失败',
  bad_gateway: '网关错误',
  server_error: '服务端错误',
  other: '其他',
};

const TYPE_COLORS = {
  rate_limit: COLORS.warning,
  timeout: COLORS.danger,
  conn_fail: '#f472b6',
  bad_gateway: COLORS.secondary,
  server_error: COLORS.primary,
  other: '#55555e',
};

export default function ErrorBreakdown({ days, tick }) {
  const { data } = useRpc('getErrorBreakdown', { days }, tick);

  if (!data) return <div className="card"><h3>错误分类</h3><div className="loading">加载中...</div></div>;

  const total = data.byType.reduce((s, t) => s + t.count, 0);

  return (
    <div className="card">
      <h3>错误分类</h3>
      <div style={{ marginBottom: 14 }}>
        {data.byType.map(t => (
          <div key={t.errorType} className="provider-row">
            <span className="provider-name" style={{ color: TYPE_COLORS[t.errorType] || '#8b8b96' }}>
              {TYPE_LABELS[t.errorType] || t.errorType}
            </span>
            <div className="provider-bar-wrap">
              <div className="provider-bar" style={{
                width: (t.count / (total || 1) * 100) + '%',
                background: TYPE_COLORS[t.errorType] || '#55555e',
              }} />
            </div>
            <span className="provider-stat">{t.count}</span>
          </div>
        ))}
      </div>

      {data.timeline.length > 1 && (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data.timeline}>
            <XAxis dataKey="date" tick={AXIS} tickFormatter={v => v.slice(5)} />
            <YAxis tick={AXIS} />
            <Tooltip contentStyle={TIP} />
            <Bar dataKey="rateLimit" stackId="1" fill={TYPE_COLORS.rate_limit} name="限流" />
            <Bar dataKey="timeout" stackId="1" fill={TYPE_COLORS.timeout} name="超时" />
            <Bar dataKey="badGateway" stackId="1" fill={TYPE_COLORS.bad_gateway} name="网关" />
            <Bar dataKey="serverError" stackId="1" fill={TYPE_COLORS.server_error} name="服务端" />
            <Bar dataKey="other" stackId="1" fill={TYPE_COLORS.other} name="其他" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}