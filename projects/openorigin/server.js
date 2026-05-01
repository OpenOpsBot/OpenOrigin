const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;
const STATIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ---- Client Ops Data (local JSON) ----
const CLIENT_OPS_PATH = path.join(STATIC_DIR, 'data', 'client-ops-sample.json');
const OPENCLAW_CONFIG_PATH = '/Users/ze/.openclaw/openclaw.json';
const IDENTITY_PATH = '/Users/ze/.openclaw/workspace/IDENTITY.md';
const MEMORY_DIR = '/Users/ze/.openclaw/workspace/memory';
const AUTOMATION_DIR = path.join(STATIC_DIR, 'automation');
const SYSTEM_REFERENCE_PATH = path.join(STATIC_DIR, 'docs', 'SYSTEM-REFERENCE.md');

const runtimeCache = {
  cron: { value: null, expiresAt: 0, inflight: null },
  automations: { value: null, expiresAt: 0, inflight: null },
  systemReference: { value: null, expiresAt: 0, inflight: null }
};

async function withCache(key, ttlMs, loader) {
  const bucket = runtimeCache[key];
  const now = Date.now();
  if (bucket?.value && bucket.expiresAt > now) return bucket.value;
  if (bucket?.inflight) return bucket.inflight;

  const task = Promise.resolve()
    .then(loader)
    .then(result => {
      if (bucket) {
        bucket.value = result;
        bucket.expiresAt = Date.now() + ttlMs;
      }
      return result;
    })
    .catch(error => {
      if (bucket?.value) return bucket.value;
      throw error;
    })
    .finally(() => {
      if (bucket) bucket.inflight = null;
    });

  if (bucket) bucket.inflight = task;
  return task;
}

function readClientOpsData() {
  try {
    return JSON.parse(fs.readFileSync(CLIENT_OPS_PATH, 'utf8'));
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
}

function stripMarkdownLine(line = '') {
  return String(line)
    .replace(/^[-*]\s+/, '')
    .replace(/^>\s?/, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

function splitSections(markdown = '', level = 3) {
  const lines = String(markdown).split(/\r?\n/);
  const sections = [];
  let current = null;
  const regex = new RegExp(`^#{${level}}\\s+(.+)$`);

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(regex);
    if (heading) {
      current = { heading: heading[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    current.lines.push(rawLine);
  }

  return sections;
}

function normalizeBriefingSections(sections = []) {
  const bucketMap = [
    { key: 'priorities', match: /今日优先级|优先级/ },
    { key: 'nightly', match: /夜间活动|昨夜动态|夜间/ },
    { key: 'todos', match: /待处理事项|待处理|后续事项/ },
    { key: 'attention', match: /需要老板关注|老板关注|需要关注/ }
  ];

  const normalized = {
    priorities: [],
    nightly: [],
    todos: [],
    attention: []
  };

  for (const section of sections) {
    const bucket = bucketMap.find(item => item.match.test(section.heading));
    if (!bucket) continue;
    const items = section.lines
      .map(line => stripMarkdownLine(line))
      .filter(Boolean);
    normalized[bucket.key].push(...items);
  }

  return normalized;
}

function extractDailyBriefingBlock(content = '') {
  const match = String(content).match(/(^|\n)##\s+每日简报\s*\n([\s\S]*?)(?=\n##\s+|$)/);
  return match ? match[2].trim() : '';
}

function getFallbackSummary(content = '') {
  const lines = String(content)
    .split(/\r?\n/)
    .map(line => stripMarkdownLine(line))
    .filter(Boolean)
    .filter(line => !/^#+\s*/.test(line))
    .filter(line => !/^session key:/i.test(line))
    .filter(line => !/^session id:/i.test(line))
    .filter(line => !/^source:/i.test(line))
    .filter(line => !/^conversation summary/i.test(line))
    .filter(line => !/^session:/i.test(line))
    .filter(line => !/^(assistant|user|system):\s*$/i.test(line))
    .filter(line => !/^(assistant|user|system):\s*sender/i.test(line))
    .filter(line => !/^\{.*\}$/i.test(line))
    .filter(line => !/^\[.*\]$/i.test(line))
    .filter(line => !/^```/.test(line))
    .filter(line => !/^(json|markdown|text)$/i.test(line))
    .filter(line => !/^[{}\[\]",:]+$/.test(line))
    .filter(line => !/^".+":\s*/.test(line));

  const preferred = lines.find(line => /[\u4e00-\u9fa5]/.test(line) && line.length >= 8);
  return preferred || lines[0] || '暂无足够数据';
}

function formatBriefingTitle(fileName, date) {
  const suffix = fileName
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-?/, '')
    .trim();

  if (!suffix) return `每日简报 — ${date}`;

  const label = suffix
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ');

  return `${date} · ${label}`;
}

function readMemoryBriefings() {
  try {
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(name => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(name))
      .sort((a, b) => b.localeCompare(a, 'en'));

    const entries = files.map(fileName => {
      const fullPath = path.join(MEMORY_DIR, fileName);
      const content = fs.readFileSync(fullPath, 'utf8');
      const briefBlock = extractDailyBriefingBlock(content);
      const sectionSource = briefBlock || content;
      const sections = splitSections(sectionSource);
      const normalized = normalizeBriefingSections(sections);
      const allItems = Object.values(normalized).flat();
      const date = (fileName.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || fileName.replace(/\.md$/, '');
      const summary = allItems[0] || getFallbackSummary(sectionSource);

      return {
        fileName,
        path: fullPath,
        date,
        title: formatBriefingTitle(fileName, date),
        hasDailyBriefing: !!briefBlock,
        summary,
        sections: normalized,
        rawBriefing: briefBlock,
        rawContent: content
      };
    });

    return {
      entries,
      total: entries.length,
      source: MEMORY_DIR
    };
  } catch (e) {
    return { error: 'memory_read_error', detail: e.message };
  }
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '';
  }
}

function tailLines(filePath, count = 10) {
  const text = readTextSafe(filePath);
  if (!text) return [];
  return text.split(/\r?\n/).filter(Boolean).slice(-count);
}

function headLines(filePath, count = 20) {
  const text = readTextSafe(filePath);
  if (!text) return [];
  return text.split(/\r?\n/).slice(0, count);
}

function formatScheduleDescriptor(schedule) {
  if (!schedule) return '未配置';
  if (schedule.kind === 'cron') return schedule.expr || 'cron';
  if (schedule.kind === 'every') return schedule.value ? `每 ${schedule.value}` : '循环';
  if (schedule.kind === 'at') return schedule.at || '单次';
  return schedule.expr || schedule.kind || '未知';
}

function parseMarkdownBulletTree(lines = []) {
  const root = [];
  const stack = [];

  for (const rawLine of lines) {
    const match = String(rawLine).match(/^(\s*)[-*]\s+(.+)$/);
    if (!match) continue;
    const indent = match[1].replace(/\t/g, '    ').length;
    const node = {
      text: stripMarkdownLine(match[2]),
      children: []
    };

    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();

    if (!stack.length) root.push(node);
    else stack[stack.length - 1].node.children.push(node);

    stack.push({ indent, node });
  }

  return root;
}

function readSystemReferenceRaw() {
  try {
    const raw = fs.readFileSync(SYSTEM_REFERENCE_PATH, 'utf8');
    const stat = fs.statSync(SYSTEM_REFERENCE_PATH);
    const title = (raw.match(/^#\s+(.+)$/m) || [])[1] || 'SYSTEM-REFERENCE';
    const sections = splitSections(raw, 2).map(section => ({
      heading: section.heading,
      items: section.lines
        .map(line => stripMarkdownLine(line))
        .filter(Boolean),
      tree: parseMarkdownBulletTree(section.lines),
      raw: section.lines.join('\n').trim()
    }));

    return {
      title,
      path: SYSTEM_REFERENCE_PATH,
      updatedAt: stat.mtime.toISOString(),
      updatedAtMs: stat.mtimeMs,
      sections,
      raw
    };
  } catch (e) {
    return { error: 'system_reference_read_error', detail: e.message };
  }
}

function readSystemReference() {
  return withCache('systemReference', 5000, () => readSystemReferenceRaw());
}

function getAutomationDefinitions() {
  return [
    {
      name: 'backup-private-repo',
      title: '私有仓库备份',
      kind: 'shell + cron',
      scheduleText: '每 2 小时',
      purpose: '暂存改动、生成提交并 push 到私有 GitHub。',
      output: '备份日志 / Git 提交',
      scriptPath: path.join(AUTOMATION_DIR, 'scripts', 'backup-private-repo.sh'),
      logPath: path.join(AUTOMATION_DIR, 'logs', 'backup-private-repo.log')
    },
    {
      name: 'nightly-self-optimize',
      title: '夜间自我优化',
      kind: 'isolated agent',
      scheduleText: '每天 02:15',
      purpose: '每晚只审计一个领域，做低风险修复。',
      output: '写入 memory / 可选 git 提交',
      scriptPath: path.join(AUTOMATION_DIR, 'scripts', 'nightly-self-optimize.md')
    },
    {
      name: 'daily-briefing',
      title: '每日简报',
      kind: 'isolated agent',
      scheduleText: '每天 08:30',
      purpose: '生成中文 Markdown 每日简报。',
      output: '写入 memory/YYYY-MM-DD.md',
      scriptPath: path.join(AUTOMATION_DIR, 'scripts', 'daily-briefing.md')
    },
    {
      name: 'system-reference-rollup',
      title: '系统文档滚动更新',
      kind: 'isolated agent',
      scheduleText: '每天 23:20',
      purpose: '刷新 docs/SYSTEM-REFERENCE.md 当日状态。',
      output: '更新 SYSTEM-REFERENCE.md',
      scriptPath: path.join(AUTOMATION_DIR, 'scripts', 'system-reference-rollup.md')
    }
  ];
}

function summarizeBackupLog(logPath) {
  const lines = tailLines(logPath, 12);
  const joined = lines.join('\n');
  const lastStart = [...lines].reverse().find(line => line.includes('start backup-private-repo')) || null;
  let status = 'unknown';
  let summary = '暂无日志';

  if (/lock exists, skipping/i.test(joined)) {
    status = 'blocked';
    summary = '最近多次触发，但都被 lock 文件拦住。';
  } else if (/failed/i.test(joined) || /ALERT:/i.test(joined)) {
    status = 'error';
    summary = '最近一次备份失败。';
  } else if (/push complete|backup complete|success/i.test(joined)) {
    status = 'ok';
    summary = '最近一次备份看起来成功。';
  }

  return { status, summary, lastStart, tail: lines };
}

async function getAutomationsOverviewRaw() {
  const definitions = getAutomationDefinitions();
  const cronData = await getCronList();
  const cronJobs = Array.isArray(cronData?.jobs) ? cronData.jobs : [];
  const cronError = cronData?.error ? cronData.detail || cronData.error : null;

  const items = definitions.map(item => {
    const job = cronJobs.find(job => job.name === item.name) || null;
    const base = {
      ...item,
      configured: fs.existsSync(item.scriptPath),
      logExists: item.logPath ? fs.existsSync(item.logPath) : false,
      scriptPreview: headLines(item.scriptPath, 40),
      logPreview: item.logPath ? tailLines(item.logPath, 20) : [],
      cron: job ? {
        enabled: !!job.enabled,
        scheduleText: formatScheduleDescriptor(job.schedule),
        nextRun: job.nextRun || null,
        lastRun: job.lastRun || null,
        state: job.state || null
      } : null,
      status: job?.enabled ? 'ready' : 'pending',
      statusText: job?.enabled ? '已配置' : '待激活',
      runtimeSummary: job?.enabled
        ? `下次执行 ${job.nextRun ? new Date(job.nextRun).toLocaleString('zh-CN', { hour12: false }) : '待定'}`
        : (cronError ? 'cron 状态暂时拿不到' : '还没在 cron 里确认到'),
      blocker: cronError || null
    };

    if (item.name === 'backup-private-repo' && item.logPath) {
      const backup = summarizeBackupLog(item.logPath);
      base.backupLog = backup;
      base.status = backup.status === 'blocked' ? 'blocked' : backup.status === 'error' ? 'error' : base.status;
      base.statusText = backup.status === 'blocked' ? '被锁阻塞' : backup.status === 'error' ? '执行异常' : base.statusText;
      base.runtimeSummary = backup.summary || base.runtimeSummary;
    }

    if (job?.lastRun?.status && ['failed', 'error'].includes(job.lastRun.status)) {
      base.status = 'error';
      base.statusText = '最近失败';
    }

    return base;
  });

  return {
    items,
    total: items.length,
    cronError,
    source: AUTOMATION_DIR,
    generatedAt: new Date().toISOString()
  };
}

function getAutomationsOverview() {
  return withCache('automations', 60000, () => getAutomationsOverviewRaw());
}

// ---- OpenClaw Real Data APIs ----
function getSessionsFromFile() {
  try {
    const sessionsPath = '/Users/ze/.openclaw/agents/main/sessions/sessions.json';
    const raw = fs.readFileSync(sessionsPath, 'utf8');
    const allSessions = JSON.parse(raw);
    const sessionsDir = '/Users/ze/.openclaw/agents/main/sessions/';

    const sessionsList = Object.entries(allSessions).map(([key, s]) => {
      let messageCount = 0;
      if (s.sessionFile) {
        try {
          const lines = fs.readFileSync(sessionsDir + s.sessionFile, 'utf8').trim().split('\n');
          messageCount = lines.filter(l => l.includes('"type":"message"')).length;
        } catch (_) {}
      }

      return {
        key,
        sessionId: s.sessionId,
        updatedAt: s.updatedAt,
        ageMs: Date.now() - s.updatedAt,
        model: s.model || 'MiniMax-M2.7',
        modelProvider: s.modelProvider || 'minimax',
        totalTokens: s.totalTokens,
        contextTokens: s.contextTokens,
        abortedLastRun: s.abortedLastRun,
        kind: s.chatType || (s.origin?.chatType) || 'unknown',
        origin: s.origin ? {
          provider: s.origin.provider,
          surface: s.origin.surface,
          chatType: s.origin.chatType,
          label: s.origin.label
        } : null,
        sessionFile: s.sessionFile || null,
        messageCount,
        title: s.origin?.label || s.origin?.surface || s.key
      };
    });

    const sessions = sessionsList;
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const activeNow = sessions.filter(s => s.updatedAt > fiveMinAgo).length;
    const oldestSession = sessions.reduce((oldest, s) => !oldest || s.updatedAt < oldest.updatedAt ? s : oldest, null);
    const uptimeDays = oldestSession ? Math.max(1, Math.round((Date.now() - oldestSession.updatedAt) / (1000 * 60 * 60 * 24))) : 0;

    return {
      path: sessionsPath,
      count: Object.keys(allSessions).length,
      entries: sessions,
      activeNow,
      uptimeDays
    };
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
}

function getEventsFromSessions() {
  const sessionsData = getSessionsFromFile();
  if (sessionsData.error) return { entries: [] };

  const sessions = sessionsData.entries || [];
  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;

  // Derive events from session lifecycle
  const events = sessions
    .map(s => {
      const age = now - s.updatedAt;
      let eventType = 'session_idle';
      if (age < FIVE_MIN) eventType = 'session_active';
      else if (age < ONE_HOUR) eventType = 'session_recent';
      else if (s.abortedLastRun) eventType = 'session_error';

      return {
        id: s.sessionId || s.key,
        sessionKey: s.key,
        eventType,
        description: s.origin?.label || s.origin?.surface || s.kind || '会话',
        model: s.model,
        timestamp: new Date(s.updatedAt).toISOString(),
        messageCount: 0,
        title: s.origin?.label || s.origin?.surface || s.key
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    entries: events,
    activeNow: sessionsData.activeNow,
    uptimeDays: sessionsData.uptimeDays
  };
}

function getHealth() {
  return new Promise((resolve) => {
    exec('openclaw health --json', { timeout: 8000 }, (err, stdout) => {
      if (err) resolve({ error: 'health_error', detail: err.message.slice(0, 200) });
      else {
        try { resolve(JSON.parse(stdout)); }
        catch (e) { resolve({ error: 'parse_error', detail: stdout.slice(0, 200) }); }
      }
    });
  });
}

function readIdentity() {
  try {
    const raw = fs.readFileSync(IDENTITY_PATH, 'utf8');
    const name = (raw.match(/Name:\*\*(.+?)\*\*/)?.[1] || raw.match(/Name:\*\s*(.+)/)?.[1] || '').replace(/\*/g, '').trim();
    const emoji = (raw.match(/Emoji:\*\*(.+?)\*\*/)?.[1] || raw.match(/Emoji:\*\s*(.+)/)?.[1] || '').replace(/\*/g, '').trim();
    return { name: name.trim(), emoji: emoji.trim() };
  } catch (e) { return { name: '', emoji: '' }; }
}

function getAgentsList() {
  try {
    const raw = fs.readFileSync(OPENCLAW_CONFIG_PATH, 'utf8');
    const cfg = JSON.parse(raw);
    const identity = readIdentity();
    const agents = (cfg?.agents?.list || []).map(a => ({
      id: a.id,
      name: identity.name || a.id,
      emoji: identity.emoji || '',
      workspace: cfg?.agents?.defaults?.workspace || '',
      model: typeof a.model === 'string' ? a.model : (a.model?.primary || ''),
      isDefault: a.isDefault || false,
      providers: [],
      bindingCount: 0
    }));
    if (!agents.length && cfg?.agents?.defaults) {
      agents.push({
        id: 'main',
        name: identity.name || 'main',
        emoji: identity.emoji || '',
        workspace: cfg.agents.defaults.workspace || '',
        model: cfg.agents.defaults.model?.primary || '',
        isDefault: true,
        providers: [],
        bindingCount: 0
      });
    }
    return { agents };
  } catch (e) {
    return { error: 'agents_error', detail: e.message.slice(0, 200) };
  }
}

function getConfiguredModels() {
  try {
    const raw = fs.readFileSync(OPENCLAW_CONFIG_PATH, 'utf8');
    const cfg = JSON.parse(raw);
    const seen = new Set();
    const models = [];

    const pushRef = (ref, extra = {}) => {
      if (!ref || typeof ref !== 'string' || seen.has(ref)) return;
      seen.add(ref);
      const [provider, ...rest] = ref.split('/');
      const modelId = rest.join('/') || provider;
      const providerEntry = cfg?.models?.providers?.[provider] || {};
      const modelEntry = (providerEntry?.models || []).find(m => m.id === modelId) || {};
      models.push({
        ref,
        provider,
        model: modelId,
        name: modelEntry?.name || modelId,
        contextWindow: modelEntry?.contextWindow || null,
        maxTokens: modelEntry?.maxTokens || null,
        reasoning: !!modelEntry?.reasoning,
        multimodal: (modelEntry?.input || []).includes('image'),
        ...extra
      });
    };

    const primary = cfg?.agents?.defaults?.model?.primary;
    if (typeof primary === 'string') pushRef(primary, { role: 'primary' });

    const fallbacks = cfg?.agents?.list || [];
    fallbacks.forEach(agent => {
      const model = agent?.model;
      if (typeof model === 'string') pushRef(model);
      if (typeof model?.primary === 'string') pushRef(model.primary);
      (model?.fallbacks || []).forEach(ref => pushRef(ref, { role: 'fallback' }));
    });

    Object.entries(cfg?.models?.providers || {}).forEach(([provider, providerCfg]) => {
      (providerCfg?.models || []).forEach(entry => {
        if (entry?.id) pushRef(`${provider}/${entry.id}`);
      });
    });

    return { models, source: 'openclaw.json' };
  } catch (e) {
    return { error: 'models_error', detail: e.message.slice(0, 200) };
  }
}

function readSessionHistory(sessionFile) {
  try {
    if (!sessionFile || !fs.existsSync(sessionFile)) {
      return { error: 'not_found', detail: 'session file not found' };
    }
    const raw = fs.readFileSync(sessionFile, 'utf8');
    const lines = raw.trim().split('\n').filter(l => l.trim());
    const messages = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'message' && entry.message) {
          const msg = entry.message;
          messages.push({
            id: entry.id,
            timestamp: entry.timestamp,
            role: msg.role || 'unknown',
            content: Array.isArray(msg.content)
              ? msg.content.map(c => c.text || c.image_url || c.type).filter(Boolean).join(' ')
              : (msg.content || '')
          });
        }
      } catch (e) {}
    }
    return { history: messages, total: messages.length };
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
}

function getCronListRaw() {
  return new Promise((resolve) => {
    exec('openclaw cron list --json', { timeout: 2500 }, (err, stdout, stderr) => {
      if (err) {
        const detail = (stderr || err.message || '').slice(0, 200);
        resolve({ error: 'exec_error', detail });
        return;
      }
      try {
        const parsed = JSON.parse(stdout || '{}');
        const jobs = Array.isArray(parsed.jobs) ? parsed.jobs.map(job => ({
          id: job.id,
          name: job.name,
          description: job.description,
          enabled: !!job.enabled,
          schedule: job.schedule || null,
          payload: job.payload || null,
          nextRun: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
          lastRun: job.state?.lastRunAtMs ? {
            at: new Date(job.state.lastRunAtMs).toISOString(),
            durationMs: job.state?.lastDurationMs || null,
            status: job.state?.lastRunStatus || job.state?.lastStatus || null,
            error: job.state?.lastError || null
          } : null,
          state: job.state || null
        })) : [];
        resolve({
          jobs,
          total: parsed.total ?? jobs.length,
          offset: parsed.offset ?? 0,
          limit: parsed.limit ?? jobs.length,
          hasMore: !!parsed.hasMore,
          nextOffset: parsed.nextOffset ?? null,
          generatedAt: new Date().toISOString()
        });
      } catch (e) {
        resolve({ error: 'parse_error', detail: (stdout || '').slice(0, 200) });
      }
    });
  });
}

function getCronList() {
  return withCache('cron', 60000, () => getCronListRaw());
}

// ---- HTTP Server ----
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const sendJson = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  if (req.url === '/api/health') {
    getHealth().then(data => sendJson(data)).catch(() => sendJson({ error: 'server_error' }, 500));
    return;
  }
  if (req.url === '/api/sessions') {
    sendJson(getSessionsFromFile());
    return;
  }
  if (req.url === '/api/events') {
    sendJson(getEventsFromSessions());
    return;
  }
  if (req.url === '/api/cron') {
    getCronList().then(data => sendJson(data)).catch(() => sendJson({ error: 'server_error' }, 500));
    return;
  }
  if (req.url === '/api/agents') {
    sendJson(getAgentsList());
    return;
  }
  if (req.url === '/api/client-ops') {
    sendJson(readClientOpsData());
    return;
  }
  if (req.url === '/api/models') {
    sendJson(getConfiguredModels());
    return;
  }
  if (req.url === '/api/memory-briefings') {
    sendJson(readMemoryBriefings());
    return;
  }
  if (req.url === '/api/automations') {
    getAutomationsOverview().then(data => sendJson(data)).catch(err => sendJson({ error: 'automation_error', detail: err.message }, 500));
    return;
  }
  if (req.url === '/api/system-reference') {
    readSystemReference().then(data => sendJson(data)).catch(err => sendJson({ error: 'system_reference_error', detail: err.message }, 500));
    return;
  }
  if (req.url.startsWith('/api/session-history?')) {
    const key = new URL(req.url, 'http://localhost').searchParams.get('key');
    if (!key) { sendJson({ error: 'missing_key' }, 400); return; }
    const sessions = getSessionsFromFile();
    const session = sessions.sessions?.find(s => s.key === key);
    if (!session) { sendJson({ error: 'session_not_found' }, 404); return; }
    const historyData = readSessionHistory(session.sessionFile);
    sendJson(historyData);
    return;
  }

  // Static files
  const requestPath = req.url.split('?')[0].split('#')[0];
  let filePath = path.join(STATIC_DIR, requestPath === '/' ? 'index.html' : requestPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`OpenOrigin running at http://localhost:${PORT}`);
  getAutomationsOverview().catch(() => {});
  readSystemReference().catch(() => {});
});
