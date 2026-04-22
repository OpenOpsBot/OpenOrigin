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

function getCronList() {
  return new Promise((resolve) => {
    exec('openclaw cron list --json', { timeout: 8000 }, (err, stdout) => {
      if (err) {
        if (err.message.includes('pairing required')) resolve({ error: 'pairing_required' });
        else resolve({ error: 'exec_error', detail: err.message.slice(0, 200) });
      } else {
        try { resolve(JSON.parse(stdout)); }
        catch (e) { resolve({ error: 'parse_error', detail: stdout.slice(0, 200) }); }
      }
    });
  });
}

function getModelsFromSessions() {
  try {
    const sessions = getSessionsFromFile();
    if (sessions.error) return sessions;
    const map = new Map();
    (sessions.sessions || []).forEach(session => {
      const key = `${session.modelProvider || '?'}:${session.model || '?'}`;
      const existing = map.get(key) || {
        id: key,
        provider: session.modelProvider || '?',
        model: session.model || '?',
        sessionCount: 0,
        lastActiveMs: 0,
        contexts: new Set()
      };
      existing.sessionCount += 1;
      existing.lastActiveMs = Math.max(existing.lastActiveMs, session.ageMs || 0);
      if (session.contextTokens) existing.contexts.add(session.contextTokens);
      map.set(key, existing);
    });
    return {
      models: Array.from(map.values()).map(item => ({
        id: item.id,
        provider: item.provider,
        model: item.model,
        sessionCount: item.sessionCount,
        latestAgeMs: item.lastActiveMs,
        contextTokens: Array.from(item.contexts)
      }))
    };
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
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
  if (req.url === '/api/client-ops') {
    sendJson(readClientOpsData());
    return;
  }
  if (req.url === '/api/models') {
    sendJson(getModelsFromSessions());
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
