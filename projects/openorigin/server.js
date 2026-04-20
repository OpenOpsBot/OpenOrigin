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

// ---- OpenClaw Real Data APIs ----

// Fast: read sessions file directly (ms vs 8s via CLI)
function getSessionsFromFile() {
  try {
    const sessionsPath = '/Users/ze/.openclaw/agents/main/sessions/sessions.json';
    const raw = fs.readFileSync(sessionsPath, 'utf8');
    const allSessions = JSON.parse(raw);

    // Summarize - extract only what we need for the dashboard
    const summarized = {
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
    return summarized;
  } catch (e) {
    return { error: 'read_error', detail: e.message };
  }
}

// Fast: health endpoint (no gateway pairing needed)
function getHealth() {
  return new Promise((resolve) => {
    exec('openclaw health --json', { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) {
        resolve({ error: 'health_error', detail: err.message.slice(0, 200) });
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ error: 'parse_error', detail: stdout.slice(0, 200) });
        }
      }
    });
  });
}

// Requires gateway pairing
function getCronList() {
  return new Promise((resolve) => {
    exec('openclaw cron list --json', { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) {
        if (err.message.includes('pairing required')) {
          resolve({ error: 'pairing_required' });
        } else {
          resolve({ error: 'exec_error', detail: err.message.slice(0, 200) });
        }
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ error: 'parse_error', detail: stdout.slice(0, 200) });
        }
      }
    });
  });
}

// ---- HTTP Server ----

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const sendJson = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  if (req.url === '/api/health') {
    getHealth().then(data => sendJson(data)).catch(e => sendJson({ error: 'server_error' }, 500));
    return;
  }

  if (req.url === '/api/sessions') {
    // Use fast file read instead of slow CLI
    const data = getSessionsFromFile();
    sendJson(data);
    return;
  }

  if (req.url === '/api/cron') {
    getCronList().then(data => sendJson(data)).catch(e => sendJson({ error: 'server_error' }, 500));
    return;
  }

  // Static files
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);
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
