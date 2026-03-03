import { useState } from 'react';
import { useRpc } from '../hooks/useRpc';

const APP_LABELS = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
};

function pickRows(days, daily) {
  if (!Array.isArray(daily)) return [];
  if (days === 0) return daily.slice(0, 14);
  return daily.slice(0, days);
}

function ProjectCard({ proj }) {
  const [open, setOpen] = useState(false);
  const hasPrompts = proj.recentPrompts.length > 0;

  return (
    <div className="tl-project" onClick={hasPrompts ? () => setOpen(v => !v) : undefined} style={{ cursor: hasPrompts ? 'pointer' : 'default' }}>
      <div className="tl-project-head">
        <span className="tl-project-name">{proj.name}</span>
        <span className="tl-project-apps">
          {Object.entries(proj.apps).map(([app, count]) => (
            <span key={app} className={`tl-app-badge tl-app-badge--${app}`}>
              {APP_LABELS[app] || app} {count}
            </span>
          ))}
        </span>
        <span className="tl-project-count">{proj.prompts} 条</span>
      </div>
      {open && hasPrompts && (
        <div className="tl-project-prompts">
          {proj.recentPrompts.map((p, i) => (
            <div key={i} className="tl-prompt-line">{p.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConversationDailySummary({ days, tick }) {
  const { data } = useRpc('getConversationDailySummary', { days }, tick, 60000);

  if (!data) {
    return (
      <div className="card">
        <h3>本地对话日报</h3>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const rows = pickRows(days, data.daily);

  return (
    <div className="card">
      <h3>本地对话日报</h3>

      <div className="summary-kpis">
        <div className="summary-kpi">
          <span className="split-k">活跃天数</span>
          <span className="split-v">{data.totals.activeDays}</span>
        </div>
        <div className="summary-kpi">
          <span className="split-k">需求条数</span>
          <span className="split-v">{data.totals.prompts}</span>
        </div>
        <div className="summary-kpi">
          <span className="split-k">会话数</span>
          <span className="split-v">{data.totals.sessions}</span>
        </div>
        <div className="summary-kpi">
          <span className="split-k">项目数</span>
          <span className="split-v">{data.totals.projects}</span>
        </div>
      </div>

      <div className="daily-timeline">
        {rows.length === 0 && <div className="loading">当前范围没有有效对话数据</div>}
        {rows.map((day) => {
          const isToday = day.date === todayKey;
          return (
            <div key={day.date} className={`tl-day${isToday ? ' tl-day--today' : ''}`}>
              <div className="tl-day-header">
                <span className="tl-day-date">{day.date.slice(5)}</span>
                {isToday && <span className="tl-day-badge">今天</span>}
                <span className="tl-day-meta">{day.prompts} 条 / {day.sessions} 会话</span>
              </div>
              <div className="tl-day-body">
                {day.projects.map((proj) => (
                  <ProjectCard key={proj.name} proj={proj} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
