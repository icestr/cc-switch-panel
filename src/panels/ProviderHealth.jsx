import { useRpc } from '../hooks/useRpc';
import { COLORS } from '../lib/chart-theme';

function timeAgo(isoStr) {
  if (!isoStr) return '--';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + '分钟前';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + '小时前';
  return Math.floor(hours / 24) + '天前';
}

export default function ProviderHealth({ tick }) {
  const { data } = useRpc('getProviderHealth', {}, tick);

  if (!data) return <div className="card"><h3>供应商健康</h3><div className="loading">加载中...</div></div>;

  const healthy = data.filter(d => d.is_healthy).length;
  const total = data.length;

  return (
    <div className="card">
      <h3>供应商健康</h3>

      <div className="health-summary">
        <span className="health-ratio" style={{
          color: healthy === total ? COLORS.success : healthy > 0 ? COLORS.warning : COLORS.danger
        }}>
          {healthy}/{total}
        </span>
        <span className="health-label">在线</span>
      </div>

      <div className="health-list">
        {data.map(d => (
          <div key={`${d.provider_id}-${d.app_type}`} className="health-row">
            <span className={`health-dot ${d.is_healthy ? 'health-dot--ok' : 'health-dot--fail'}`} />
            <span className="health-name">{d.providerName}</span>
            <span className="health-app">{d.app_type}</span>
            {d.consecutive_failures > 0 && (
              <span className="health-failures" style={{ color: COLORS.danger }}>
                {d.consecutive_failures}x
              </span>
            )}
            <span className="health-time">{timeAgo(d.last_success_at || d.updated_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
