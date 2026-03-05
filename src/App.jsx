import { useState, useCallback } from 'react';
import { useRpc } from './hooks/useRpc';
import Overview from './panels/Overview';
import CostTrend from './panels/CostTrend';
import CacheEfficiency from './panels/CacheEfficiency';
import RouteAnalysis from './panels/RouteAnalysis';
import ProviderComparison from './panels/ProviderComparison';
import ModelDistro from './panels/ModelDistro';
import TokenUsage from './panels/TokenUsage';
import Latency from './panels/Latency';
import ErrorBreakdown from './panels/ErrorBreakdown';
import ActivityHeatmap from './panels/ActivityHeatmap';
import SessionInsights from './panels/SessionInsights';
import ConversationDailySummary from './panels/ConversationDailySummary';
import ClientDistro from './panels/ClientDistro';
import ProviderHealth from './panels/ProviderHealth';

const RANGES = [
  { label: '7天', value: 7 },
  { label: '14天', value: 14 },
  { label: '30天', value: 30 },
  { label: '全部', value: 0 },
];

function Section({ title, children }) {
  return (
    <section className="dashboard-section">
      {title && <h2 className="section-title">{title}</h2>}
      <div className="section-content">
        {children}
      </div>
    </section>
  );
}

function ProcessIndicator({ tick }) {
  const { data } = useRpc('getActiveProcesses', {}, tick, 10000);
  if (!data) return null;
  const active = data.filter(p => p.count > 0);
  if (!active.length) return null;

  return (
    <div className="process-indicator">
      {active.map(p => (
        <span key={p.name} className="process-badge">
          <span className="process-dot" />
          {p.name} <span className="process-count">{p.count}</span>
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [days, setDays] = useState(7);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <h1>cc-switch</h1>
          <ProcessIndicator tick={tick} />
        </div>
        <div className="controls">
          {RANGES.map(r => (
            <button key={r.value} className={days === r.value ? 'active' : ''} onClick={() => setDays(r.value)}>
              {r.label}
            </button>
          ))}
          <button className="refresh-btn" onClick={refresh}>刷新</button>
        </div>
      </header>

      <Overview days={days} tick={tick} />

      <Section title="费用与用量">
        <div className="grid-2">
          <CostTrend days={days} tick={tick} />
          <CacheEfficiency days={days} tick={tick} />
        </div>
        <div className="grid-2-equal mt-3">
          <TokenUsage days={days} tick={tick} />
          <ModelDistro days={days} tick={tick} />
        </div>
      </Section>

      <Section title="路由与服务商">
        <div className="grid-2-equal">
          <RouteAnalysis days={days} tick={tick} />
          <ProviderComparison days={days} tick={tick} />
        </div>
        <div className="grid-2-equal mt-3">
          <ClientDistro days={days} tick={tick} />
          <ProviderHealth tick={tick} />
        </div>
      </Section>

      <Section title="稳定性与性能">
        <div className="grid-2-equal">
          <ErrorBreakdown days={days} tick={tick} />
          <Latency days={days} tick={tick} />
        </div>
      </Section>

      <Section title="会话与活动">
        <SessionInsights days={days} tick={tick} />
        <ConversationDailySummary days={days} tick={tick} />
        <ActivityHeatmap days={days} tick={tick} />
      </Section>
    </div>
  );
}
