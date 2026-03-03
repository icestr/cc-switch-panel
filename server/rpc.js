import db from './db.js';
import { getConversationDailySummary } from './conversation-summary.js';

function timeFilter(days, { col = 'created_at', and = false } = {}) {
  const since = days ? Math.floor(Date.now() / 1000) - days * 86400 : 0;
  if (!since) return { clause: '', params: [] };
  return { clause: `${and ? 'AND' : 'WHERE'} ${col} >= ?`, params: [since] };
}

const methods = {};

methods.getOverview = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const stats = db.prepare(`
    SELECT COUNT(*) as totalRequests,
           COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0) as totalCost,
           SUM(input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens) as totalTokens,
           ROUND(100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) as errorRate,
           ROUND(AVG(latency_ms)) as avgLatency
    FROM proxy_request_logs ${clause}
  `).get(...params);

  const todayCost = db.prepare(
    'SELECT COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0) as v FROM proxy_request_logs WHERE created_at >= ?'
  ).get(todayStart).v;

  return { ...stats, todayCost };
};

methods.getTodayDetail = () => {
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const summary = db.prepare(`
    SELECT COUNT(*) as requests,
           COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0) as cost,
           SUM(input_tokens) as inputTokens,
           SUM(output_tokens) as outputTokens,
           SUM(cache_read_tokens) as cacheReadTokens,
           SUM(cache_creation_tokens) as cacheCreationTokens,
           SUM(input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens) as totalTokens
    FROM proxy_request_logs WHERE created_at >= ?
  `).get(todayStart);

  const byModel = db.prepare(`
    SELECT model,
           COUNT(*) as requests,
           SUM(CAST(total_cost_usd AS REAL)) as cost,
           SUM(input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens) as tokens
    FROM proxy_request_logs WHERE created_at >= ?
    GROUP BY model ORDER BY cost DESC
  `).all(todayStart);

  const byHour = db.prepare(`
    SELECT strftime('%H', created_at, 'unixepoch', 'localtime') as hour,
           COUNT(*) as requests,
           SUM(CAST(total_cost_usd AS REAL)) as cost,
           SUM(input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens) as tokens
    FROM proxy_request_logs WHERE created_at >= ?
    GROUP BY hour ORDER BY hour
  `).all(todayStart);

  return { ...summary, byModel, byHour };
};

methods.getCostTrend = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  return db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           SUM(CAST(total_cost_usd AS REAL)) as cost,
           SUM(CAST(input_cost_usd AS REAL)) as inputCost,
           SUM(CAST(output_cost_usd AS REAL)) as outputCost,
           SUM(CAST(cache_read_cost_usd AS REAL) + CAST(cache_creation_cost_usd AS REAL)) as cacheCost,
           COUNT(*) as requests
    FROM proxy_request_logs ${clause}
    GROUP BY date ORDER BY date
  `).all(...params);
};

methods.getModelDistro = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  return db.prepare(`
    SELECT model, COUNT(*) as count,
           SUM(CAST(total_cost_usd AS REAL)) as cost
    FROM proxy_request_logs ${clause}
    GROUP BY model ORDER BY cost DESC
  `).all(...params);
};

methods.getTokenUsage = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  return db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           SUM(input_tokens) as input,
           SUM(output_tokens) as output,
           SUM(cache_read_tokens) as cacheRead,
           SUM(cache_creation_tokens) as cacheCreation
    FROM proxy_request_logs ${clause}
    GROUP BY date ORDER BY date
  `).all(...params);
};

methods.getRouteAnalysis = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  const summary = db.prepare(`
    SELECT request_model,
           COUNT(*) as total,
           SUM(CASE WHEN request_model != model THEN 1 ELSE 0 END) as upgraded,
           ROUND(100.0 * SUM(CASE WHEN request_model != model THEN 1 ELSE 0 END) / COUNT(*), 1) as upgradeRate
    FROM proxy_request_logs ${clause}
    GROUP BY request_model ORDER BY total DESC
  `).all(...params);

  const flows = db.prepare(`
    SELECT request_model as source, model as target, COUNT(*) as value
    FROM proxy_request_logs ${clause}
    GROUP BY request_model, model ORDER BY value DESC
  `).all(...params);

  return { summary, flows };
};

methods.getCacheEfficiency = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  const daily = db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           SUM(cache_read_tokens) as cacheRead,
           SUM(input_tokens) as input,
           SUM(cache_creation_tokens) as cacheCreate,
           ROUND(100.0 * SUM(cache_read_tokens) /
             NULLIF(SUM(cache_read_tokens) + SUM(input_tokens), 0), 1) as hitRate,
           SUM(CAST(cache_read_cost_usd AS REAL)) as cacheReadCost,
           SUM(CAST(input_cost_usd AS REAL)) as inputCost
    FROM proxy_request_logs ${clause}
    GROUP BY date ORDER BY date
  `).all(...params);

  const totals = db.prepare(`
    SELECT SUM(cache_read_tokens) as totalCacheRead,
           SUM(input_tokens) as totalInput,
           SUM(CAST(cache_read_cost_usd AS REAL)) as totalCacheReadCost,
           SUM(CAST(input_cost_usd AS REAL)) as totalInputCost,
           ROUND(100.0 * SUM(cache_read_tokens) /
             NULLIF(SUM(cache_read_tokens) + SUM(input_tokens), 0), 1) as avgHitRate
    FROM proxy_request_logs ${clause}
  `).get(...params);

  return { daily, ...totals };
};

methods.getProviderComparison = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days, { col: 'l.created_at', and: true });

  return db.prepare(`
    SELECT l.provider_id,
           COALESCE(p.name, l.provider_id) as providerName,
           COUNT(*) as requests,
           SUM(CAST(l.total_cost_usd AS REAL)) as cost,
           ROUND(100.0 * SUM(CASE WHEN l.status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) as errorRate,
           ROUND(AVG(l.latency_ms)) as avgLatency,
           ROUND(AVG(l.first_token_ms)) as avgFirstToken
    FROM proxy_request_logs l
    LEFT JOIN providers p ON l.provider_id = p.id
    WHERE 1=1 ${clause}
    GROUP BY l.provider_id ORDER BY requests DESC
  `).all(...params);
};

methods.getErrorBreakdown = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days, { and: true });

  const byType = db.prepare(`
    SELECT CASE
      WHEN status_code = 429 THEN 'rate_limit'
      WHEN status_code = 504 OR error_message LIKE '%超时%' OR error_message LIKE '%timeout%' THEN 'timeout'
      WHEN error_message LIKE '%连接失败%' OR error_message LIKE '%ECONNREFUSED%' THEN 'conn_fail'
      WHEN status_code = 502 THEN 'bad_gateway'
      WHEN status_code = 500 THEN 'server_error'
      ELSE 'other'
    END as errorType,
    COUNT(*) as count
    FROM proxy_request_logs
    WHERE status_code >= 400 ${clause}
    GROUP BY errorType ORDER BY count DESC
  `).all(...params);

  const timeline = db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           SUM(CASE WHEN status_code = 429 THEN 1 ELSE 0 END) as rateLimit,
           SUM(CASE WHEN status_code = 504 OR error_message LIKE '%超时%' THEN 1 ELSE 0 END) as timeout,
           SUM(CASE WHEN status_code = 502 THEN 1 ELSE 0 END) as badGateway,
           SUM(CASE WHEN status_code = 500 THEN 1 ELSE 0 END) as serverError,
           SUM(CASE WHEN status_code >= 400 AND status_code NOT IN (429,500,502,504) THEN 1 ELSE 0 END) as other
    FROM proxy_request_logs
    WHERE status_code >= 400 ${clause}
    GROUP BY date ORDER BY date
  `).all(...params);

  return { byType, timeline };
};

methods.getLatencyStats = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  return db.prepare(`
    SELECT model,
           ROUND(AVG(latency_ms)) as avgLatency,
           ROUND(AVG(first_token_ms)) as avgFirstToken,
           COUNT(*) as count
    FROM proxy_request_logs ${clause}
    GROUP BY model ORDER BY avgLatency DESC
  `).all(...params);
};

methods.getActivityHeatmap = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  return db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           CAST(strftime('%H', created_at, 'unixepoch', 'localtime') AS INTEGER) as hour,
           COUNT(*) as requests,
           SUM(CAST(total_cost_usd AS REAL)) as cost
    FROM proxy_request_logs ${clause}
    GROUP BY date, hour ORDER BY date, hour
  `).all(...params);
};

methods.getSessionInsights = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  const top = db.prepare(`
    SELECT session_id,
           COUNT(*) as requests,
           SUM(CAST(total_cost_usd AS REAL)) as cost,
           MIN(created_at) as startTime,
           MAX(created_at) as endTime,
           SUM(input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens) as tokens
    FROM proxy_request_logs ${clause}
    GROUP BY session_id ORDER BY cost DESC LIMIT 10
  `).all(...params);

  const agg = db.prepare(`
    SELECT COUNT(*) as totalSessions,
           ROUND(AVG(cost), 4) as avgCost,
           ROUND(AVG(requests)) as avgRequests
    FROM (
      SELECT session_id,
             SUM(CAST(total_cost_usd AS REAL)) as cost,
             COUNT(*) as requests
      FROM proxy_request_logs ${clause}
      GROUP BY session_id
    )
  `).get(...params);

  const dailySessions = db.prepare(`
    SELECT date(MIN(created_at), 'unixepoch', 'localtime') as date,
           COUNT(DISTINCT session_id) as sessions
    FROM proxy_request_logs ${clause}
    GROUP BY date(created_at, 'unixepoch', 'localtime')
    ORDER BY date
  `).all(...params);

  return {
    top,
    dailySessions,
    totalSessions: agg.totalSessions || 0,
    avgCost: +(agg.avgCost || 0),
    avgRequests: Math.round(agg.avgRequests || 0),
  };
};

methods.getErrorStats = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  return db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           COUNT(*) as total,
           SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors,
           ROUND(100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) as errorRate
    FROM proxy_request_logs ${clause}
    GROUP BY date ORDER BY date
  `).all(...params);
};

methods.getClientDistro = ({ days = 7 }) => {
  const { clause, params } = timeFilter(days);

  const summary = db.prepare(`
    SELECT app_type,
           COUNT(*) as count,
           SUM(CAST(total_cost_usd AS REAL)) as cost,
           SUM(input_tokens + output_tokens) as tokens,
           ROUND(AVG(latency_ms)) as avgLatency,
           ROUND(100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) as errorRate
    FROM proxy_request_logs ${clause}
    GROUP BY app_type ORDER BY cost DESC
  `).all(...params);

  const daily = db.prepare(`
    SELECT date(created_at, 'unixepoch', 'localtime') as date,
           SUM(CASE WHEN app_type = 'claude' THEN 1 ELSE 0 END) as claude,
           SUM(CASE WHEN app_type = 'codex' THEN 1 ELSE 0 END) as codex,
           SUM(CASE WHEN app_type = 'gemini' THEN 1 ELSE 0 END) as gemini
    FROM proxy_request_logs ${clause}
    GROUP BY date ORDER BY date
  `).all(...params);

  return { summary, daily };
};

methods.getProviderHealth = () => {
  return db.prepare(`
    SELECT ph.provider_id,
           ph.app_type,
           ph.is_healthy,
           ph.consecutive_failures,
           ph.last_success_at,
           ph.last_failure_at,
           ph.last_error,
           ph.updated_at,
           COALESCE(p.name, ph.provider_id) as providerName
    FROM provider_health ph
    LEFT JOIN providers p ON ph.provider_id = p.id
    ORDER BY ph.is_healthy ASC, ph.consecutive_failures DESC
  `).all();
};

methods.getConversationDailySummary = ({ days = 7 }) => {
  return getConversationDailySummary({ days });
};

export function dispatch(method, params) {
  if (!methods[method]) return { error: { code: -1, message: 'Unknown method: ' + method } };
  try {
    return { result: methods[method](params || {}) };
  } catch (e) {
    return { error: { code: -32603, message: e.message } };
  }
}
