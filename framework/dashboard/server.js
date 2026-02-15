const express = require('express');
const path = require('path');
const db = require('../lib/db');
const features = require('../lib/features');

const app = express();
const projectRoot = process.env.FRAMEWORK_PROJECT_ROOT || process.cwd();
const port = parseInt(process.env.FRAMEWORK_PORT || '3333', 10);

db.open(projectRoot);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SSE endpoint for live updates
const clients = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

function broadcast(event, data) {
  const msg = 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n';
  clients.forEach(c => c.write(msg));
}

// Poll DB for changes every 2 seconds
let lastState = '';
setInterval(() => {
  try {
    const all = features.list(projectRoot);
    const state = JSON.stringify(all);
    if (state !== lastState) {
      lastState = state;
      broadcast('features', all);
    }
  } catch (e) {
    // DB may be locked by agent, skip this tick
  }
}, 2000);

// API endpoints
app.get('/api/features', (req, res) => {
  const all = features.list(projectRoot, {
    status: req.query.status,
    assignedTo: req.query.assigned
  });
  res.json(all);
});

app.get('/api/features/:id', (req, res) => {
  const f = features.get(projectRoot, req.params.id);
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json(f);
});

app.patch('/api/features/:id', (req, res) => {
  const f = features.update(projectRoot, req.params.id, req.body);
  if (!f) return res.status(404).json({ error: 'Not found' });
  broadcast('feature-updated', f);
  res.json(f);
});

app.get('/api/status', (req, res) => {
  const all = features.list(projectRoot);
  const counts = {};
  for (const f of all) {
    counts[f.status] = (counts[f.status] || 0) + 1;
  }
  res.json({
    total: all.length,
    complete: all.filter(f => f.status === 'complete').length,
    counts
  });
});

// OpenSpec changes grouped by change_id with progress
app.get('/api/openspec/changes', (req, res) => {
  const all = features.list(projectRoot);
  const changes = {};
  for (const f of all) {
    if (!f.openspec_change_id) continue;
    if (!changes[f.openspec_change_id]) {
      changes[f.openspec_change_id] = { name: f.openspec_change_id, features: [], complete: 0, total: 0 };
    }
    var entry = changes[f.openspec_change_id];
    entry.features.push({ id: f.id, status: f.status, description: f.description });
    entry.total++;
    if (f.status === 'complete') entry.complete++;
  }
  res.json(Object.values(changes));
});

app.get('/api/config', (req, res) => {
  const d = db.get(projectRoot);
  const rows = d.prepare('SELECT key, value FROM config').all();
  const config = {};
  for (const r of rows) config[r.key] = r.value;
  res.json(config);
});

app.listen(port, '127.0.0.1', () => {
  console.log('Dashboard running at http://localhost:' + port);
  console.log('Project: ' + projectRoot);
});
