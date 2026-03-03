import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOME = process.env.USERPROFILE || process.env.HOME || '';

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function startOfLocalDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function toLocalDateKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function compactText(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;
  const marker = '\n--- Content from referenced files ---';
  const idx = text.indexOf(marker);
  if (idx > 0) text = text.slice(0, idx);

  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  if (text.length > 180) return text.slice(0, 180) + '...';
  return text;
}

function isNoisePrompt(text) {
  if (!text) return true;
  if (text.startsWith('/')) return true;
  if (text === '继续' || text === '继续。') return true;
  if (text.includes('# AGENTS.md instructions')) return true;
  if (text.includes('You are Codex, a coding agent based on GPT-5')) return true;
  return false;
}

function normalizeProjectPath(project) {
  if (!project || typeof project !== 'string') return '未识别项目';
  const clean = project.replace(/\\/g, '/').replace(/\/+$/, '');
  const name = basename(clean);
  return name || clean || '未识别项目';
}

function extractCodexUserText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  const texts = [];
  for (const item of content) {
    if (!item) continue;
    if (typeof item === 'string') {
      texts.push(item);
      continue;
    }
    if (typeof item.text === 'string') texts.push(item.text);
  }
  return texts.join('\n');
}

function extractGeminiUserText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  const texts = [];
  for (const item of content) {
    if (!item) continue;
    if (typeof item === 'string') {
      texts.push(item);
      continue;
    }
    if (typeof item.text === 'string') texts.push(item.text);
  }
  return texts.join('\n');
}

function collectFilesRecursive(rootDir, fileMatcher) {
  if (!existsSync(rootDir)) return [];

  const files = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.isFile() && fileMatcher(entry.name, full)) {
        files.push(full);
      }
    }
  }

  return files;
}

function listCodexSessionFiles(sinceTs) {
  const root = join(HOME, '.codex', 'sessions');
  if (!existsSync(root)) return [];

  if (!sinceTs) {
    return collectFilesRecursive(root, (name) => name.endsWith('.jsonl'));
  }

  const files = [];
  const today = startOfLocalDay(Date.now());
  for (let ts = startOfLocalDay(sinceTs); ts <= today; ts += DAY_MS) {
    const d = new Date(ts);
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dir = join(root, y, m, day);
    if (!existsSync(dir)) continue;
    files.push(...collectFilesRecursive(dir, (name) => name.endsWith('.jsonl')));
  }
  return files;
}

function listGeminiSessionFiles() {
  const root = join(HOME, '.gemini', 'tmp');
  if (!existsSync(root)) return [];

  return collectFilesRecursive(
    root,
    (name, full) => name.startsWith('session-') && name.endsWith('.json') && basename(dirname(full)) === 'chats'
  );
}

function buildGeminiProjectMap() {
  const map = new Map();
  const root = join(HOME, '.gemini', 'history');
  if (!existsSync(root)) return map;

  let dirs = [];
  try {
    dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return map;
  }

  for (const dir of dirs) {
    const key = dir.name;
    const rootFile = join(root, key, '.project_root');
    if (!existsSync(rootFile)) continue;
    try {
      const fullPath = readFileSync(rootFile, 'utf8').trim();
      if (fullPath) map.set(key, fullPath);
    } catch {
      continue;
    }
  }
  return map;
}

function parseClaudeEvents(sinceTs) {
  const events = [];
  const historyPath = join(HOME, '.claude', 'history.jsonl');
  if (!existsSync(historyPath)) return events;

  let content = '';
  try {
    content = readFileSync(historyPath, 'utf8');
  } catch {
    return events;
  }

  for (const line of content.split('\n')) {
    const row = safeParseJson(line);
    if (!row) continue;

    const ts = Number(row.timestamp);
    if (!Number.isFinite(ts)) continue;
    if (sinceTs && ts < sinceTs) continue;

    const prompt = compactText(row.display);
    if (isNoisePrompt(prompt)) continue;

    events.push({
      app: 'claude',
      ts,
      sessionId: row.sessionId || '',
      project: normalizeProjectPath(row.project),
      prompt,
    });
  }

  return events;
}

function parseCodexEvents(sinceTs) {
  const events = [];
  const files = listCodexSessionFiles(sinceTs);

  for (const file of files) {
    let content = '';
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    let sessionId = '';
    let project = '未识别项目';

    for (const line of content.split('\n')) {
      const row = safeParseJson(line);
      if (!row || !row.type) continue;

      if (row.type === 'session_meta') {
        sessionId = row.payload?.id || sessionId;
        project = normalizeProjectPath(row.payload?.cwd || project);
        continue;
      }

      if (row.type !== 'response_item') continue;
      const payload = row.payload;
      if (!payload || payload.type !== 'message' || payload.role !== 'user') continue;

      const ts = Date.parse(row.timestamp || payload.timestamp || '');
      if (!Number.isFinite(ts)) continue;
      if (sinceTs && ts < sinceTs) continue;

      const prompt = compactText(extractCodexUserText(payload.content));
      if (isNoisePrompt(prompt)) continue;

      events.push({
        app: 'codex',
        ts,
        sessionId,
        project,
        prompt,
      });
    }
  }

  return events;
}

function parseGeminiEvents(sinceTs) {
  const events = [];
  const files = listGeminiSessionFiles();
  const projectMap = buildGeminiProjectMap();

  for (const file of files) {
    const fromTs = sinceTs ? startOfLocalDay(sinceTs) - DAY_MS : 0;
    if (fromTs) {
      try {
        const maybeTs = Date.parse(file.match(/session-(\d{4}-\d{2}-\d{2})/)?.[1] || '');
        if (Number.isFinite(maybeTs) && maybeTs < fromTs) continue;
      } catch {
        // ignore
      }
    }

    let data = null;
    try {
      data = safeParseJson(readFileSync(file, 'utf8'));
    } catch {
      data = null;
    }
    if (!data || !Array.isArray(data.messages)) continue;

    const projectRoot = projectMap.get(data.projectHash) || projectMap.get(data.projectName) || data.projectHash || '';
    const project = normalizeProjectPath(projectRoot);

    for (const msg of data.messages) {
      if (!msg || msg.type !== 'user') continue;
      const ts = Date.parse(msg.timestamp || data.startTime || data.lastUpdated || '');
      if (!Number.isFinite(ts)) continue;
      if (sinceTs && ts < sinceTs) continue;

      const prompt = compactText(extractGeminiUserText(msg.content));
      if (isNoisePrompt(prompt)) continue;

      events.push({
        app: 'gemini',
        ts,
        sessionId: data.sessionId || '',
        project,
        prompt,
      });
    }
  }

  return events;
}


function aggregateDaily(events) {
  const dayMap = new Map();
  const totalSessions = new Set();
  const totalProjects = new Set();
  const appTotals = { claude: 0, codex: 0, gemini: 0 };

  for (const event of events) {
    const dayKey = toLocalDateKey(event.ts);
    const sessionKey = event.sessionId
      ? `${event.app}:${event.sessionId}`
      : `${event.app}:${event.project}:${dayKey}:${event.ts}`;

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, {
        date: dayKey,
        prompts: 0,
        apps: { claude: 0, codex: 0, gemini: 0 },
        sessions: new Set(),
        projectDetails: new Map(),
      });
    }

    const day = dayMap.get(dayKey);
    day.prompts += 1;
    day.apps[event.app] += 1;
    day.sessions.add(sessionKey);

    if (!day.projectDetails.has(event.project)) {
      day.projectDetails.set(event.project, {
        name: event.project,
        prompts: 0,
        apps: {},
        recentPrompts: [],
      });
    }
    const proj = day.projectDetails.get(event.project);
    proj.prompts += 1;
    proj.apps[event.app] = (proj.apps[event.app] || 0) + 1;

    if (event.prompt && proj.recentPrompts.length < 2) {
      proj.recentPrompts.push({
        text: event.prompt.length > 80 ? event.prompt.slice(0, 80) + '...' : event.prompt,
        app: event.app,
      });
    }

    totalSessions.add(sessionKey);
    totalProjects.add(event.project);
    appTotals[event.app] += 1;
  }

  const daily = Array.from(dayMap.values())
    .map((day) => ({
      date: day.date,
      prompts: day.prompts,
      sessions: day.sessions.size,
      apps: day.apps,
      projects: Array.from(day.projectDetails.values())
        .sort((a, b) => b.prompts - a.prompts),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    daily,
    totals: {
      prompts: events.length,
      sessions: totalSessions.size,
      projects: totalProjects.size,
      appTotals,
      activeDays: daily.length,
    },
  };
}

function dedupeEvents(events) {
  const seen = new Set();
  const unique = [];
  for (const event of events) {
    const key = `${event.app}|${event.sessionId}|${event.ts}|${event.prompt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(event);
  }
  return unique;
}

export function getConversationDailySummary({ days = 7 } = {}) {
  const now = Date.now();
  const normalizedDays = Number(days) > 0 ? Number(days) : 0;
  const sinceTs = normalizedDays ? startOfLocalDay(now - (normalizedDays - 1) * DAY_MS) : 0;

  const events = dedupeEvents([
    ...parseClaudeEvents(sinceTs),
    ...parseCodexEvents(sinceTs),
    ...parseGeminiEvents(sinceTs),
  ]);

  events.sort((a, b) => b.ts - a.ts);

  const { daily, totals } = aggregateDaily(events);

  return {
    generatedAt: now,
    rangeDays: normalizedDays,
    totals,
    daily,
  };
}
