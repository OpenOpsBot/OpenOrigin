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

function readClientOpsData() {
  try {
    return JSON.parse(fs.readFileSync(CLIENT_OPS_PATH, 'utf8'));
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
}

// ---- OpenClaw Real Data APIs ----
function getSessionsFromFile() {
  try {
    const sessionsPath = '/Users/ze/.openclaw/agents/main/sessions/sessions.json';
    const raw = fs.readFileSync(sessionsPath, 'utf8');
    const allSessions = JSON.parse(raw);
    return {
      path: sessionsPath,
      count: Object.keys(allSessions).length,
      sessions: Object.entries(allSessions).map(([key, s]) => ({
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
        } : null
      }))
    };
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
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

function getCronList() {
  return new Promise((resolve) => {
    exec('openclaw cron list --json', { timeout: 8000 }, (err, stdout, stderr) => {
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
          nextOffset: parsed.nextOffset ?? null
        });
      } catch (e) {
        resolve({ error: 'parse_error', detail: (stdout || '').slice(0, 200) });
      }
    });
  });
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
});
