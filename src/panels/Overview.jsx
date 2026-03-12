import { useRpc } from '../hooks/useRpc';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { fmtTokens, fmtUsd, fmtPct, shortModel } from '../lib/format';
import { COLORS, TIP, AXIS, LABEL_STYLE } from '../lib/chart-theme';

const allHours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

function HourTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...TIP, padding: 10, minWidth: 80 }}>
      <div style={{ color: '#8b8b96', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>{payload[0].value} reqs</div>
    </div>
  );
}

function HourMiniChart({ data }) {
  const map = Object.fromEntries((data || []).map(d => [d.hour, d]));
  const filled = allHours.map(h => ({
    hour: h + ':00',
    requests: map[h]?.requests || 0,
    cost: map[h]?.cost || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={48}>
      <BarChart data={filled} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis dataKey="hour" hide />
        <Tooltip content={<HourTip />} />
        <Bar dataKey="requests" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DailyTokenTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...TIP, padding: 10, minWidth: 100 }}>
      <div style={{ color: '#8b8b96', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>{fmtTokens(payload[0].value)}</div>
    </div>
  );
}

function DailyTokenMini({ data }) {
  if (!data || data.length < 2) return null;
  const recent = data.slice(-7).map(d => ({
    date: d.date.slice(5),
    total: (d.input || 0) + (d.output || 0) + (d.cacheRead || 0) + (d.cacheCreation || 0),
  }));
  const todayDate = recent[recent.length - 1]?.date;
  return (
    <div className="daily-token-mini">
      <span className="today-label">近日 Token</span>
      <ResponsiveContainer width="100%" height={64}>
        <BarChart data={recent} margin={{ top: 16, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tick={AXIS} />
          <YAxis hide />
          <Tooltip content={<DailyTokenTip />} />
          <Bar dataKey="total" radius={[2, 2, 0, 0]}>
            {recent.map((d, i) => (
              <Cell key={i} fill={d.date === todayDate ? COLORS.primary : COLORS.muted} fillOpacity={d.date === todayDate ? 1 : 0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Overview({ days, tick }) {
  const { data: today } = useRpc('getTodayDetail', {}, tick);
  const { data: period } = useRpc('getOverview', { days }, tick);
  const { data: tokenDaily } = useRpc('getTokenUsage', { days: 7 }, tick);

  if (!today || !period)
    return <div className="today-hero"><span className="today-loading">加载中...</span></div>;

  const cacheHitRate = today.cacheReadTokens && today.inputTokens
    ? (100 * today.cacheReadTokens / (today.cacheReadTokens + today.inputTokens)).toFixed(1)
    : null;

  return (
    <div className="today-hero">
      <div className="today-kpis">
        <div className="today-kpis-left">
          <div className="today-kpi">
            <span className="today-label">今日 Token</span>
            <span className="kpi-value kpi-value--xl">{fmtTokens(today.totalTokens)}</span>
          </div>
          <div className="today-kpi">
            <span className="today-label">今日费用</span>
            <span className="kpi-value kpi-value--lg">{fmtUsd(today.cost)}</span>
          </div>
          <div className="today-kpi">
            <span className="today-label">请求数</span>
            <span className="kpi-value kpi-value--md">{today.requests}</span>
          </div>
          {cacheHitRate && (
            <div className="today-kpi">
              <span className="today-label">缓存命中</span>
              <span className="kpi-value kpi-value--md kpi-value--success">{cacheHitRate}%</span>
            </div>
          )}
        </div>
        <DailyTokenMini data={tokenDaily} />
      </div>

      <div className="today-breakdown">
        <div className="today-token-split">
          <div className="split-row"><span className="split-k">输入</span><span className="split-v">{fmtTokens(today.inputTokens)}</span></div>
          <div className="split-row"><span className="split-k">输出</span><span className="split-v">{fmtTokens(today.outputTokens)}</span></div>
          <div className="split-row"><span className="split-k">缓存读取</span><span className="split-v">{fmtTokens(today.cacheReadTokens)}</span></div>
          <div className="split-row"><span className="split-k">缓存写入</span><span className="split-v">{fmtTokens(today.cacheCreationTokens)}</span></div>
        </div>
        <div className="today-models">
          {today.byModel.map(m => (
            <div key={m.model} className="model-row">
              <span className="model-name">{shortModel(m.model)}</span>
              <span className="model-tokens">{fmtTokens(m.tokens)}</span>
              <span className="model-cost">{fmtUsd(m.cost)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="today-hour-chart">
        <HourMiniChart data={today.byHour} />
      </div>

      <div className="period-strip">
        <span>7d: {fmtUsd(period.totalCost)}</span>
        <span>{fmtTokens(period.totalTokens)} tokens</span>
        <span>{Number(period.totalRequests).toLocaleString()} reqs</span>
        <span>err {fmtPct(period.errorRate)}</span>
        <span>avg {period.avgLatency}ms</span>
      </div>
    </div>
  );
}