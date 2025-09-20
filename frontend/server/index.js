/**
 * Simple server proxy for local development.
 * - GET /api/providers -> returns list of configured providers
 * - POST /api/providers -> add a provider (admin)
 * - GET /api/models/status -> pings provider endpoints and returns availability
 * - POST /api/proxy/generate -> forwards generation request to provider based on model id
 *
 * Note: This server is for local development only. In production, implement secure server with
 * proper authentication, secret management and rate-limiting.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const STORE = path.join(__dirname, 'providers.json');
function readProviders() {
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return []; }
}
function writeProviders(list) { fs.writeFileSync(STORE, JSON.stringify(list, null, 2)); }

// admin check: if ADMIN_TOKEN set, require header x-admin-token to match
function isAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true; // dev mode open
  return req.headers['x-admin-token'] === token;
}

app.get('/api/providers', (req, res) => {
  const list = readProviders();
  res.json({ providers: list });
});

app.post('/api/providers', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
  const { id, label, baseUrl, apiKey } = req.body;
  if (!id || !baseUrl) return res.status(400).json({ error: 'missing id or baseUrl' });
  const list = readProviders();
  list.push({ id, label, baseUrl, apiKey: apiKey ? '***masked***' : null, rawApiKey: apiKey ? apiKey : null });
  writeProviders(list);
  res.json({ ok: true });
});

// ping providers for availability
app.get('/api/models/status', async (req, res) => {
  const list = readProviders();
  const results = await Promise.all(list.map(async p => {
    try {
      const start = Date.now();
      const r = await fetch(p.baseUrl, { method: 'HEAD', timeout: 2000 });
      const latency = Date.now() - start;
      return { id: p.id, label: p.label, available: r.ok, latency };
    } catch (e) {
      return { id: p.id, label: p.label, available: false, latency: null };
    }
  }));
  res.json({ models: results });
});

// Proxy generation: select provider by model id prefix
app.post('/api/proxy/generate', async (req, res) => {
  const { model, input } = req.body;
  if (!model || !input) return res.status(400).json({ error: 'missing model or input' });
  const list = readProviders();
  const provider = list.find(p => model.startsWith(p.id.split('/')[0]) || model === p.id) || list[0];
  if (!provider) return res.status(500).json({ error: 'no provider configured' });

  try {
    // Example forwarding: POST to provider.baseUrl with JSON { model, input }
    const resp = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': provider.rawApiKey ? `Bearer ${provider.rawApiKey}` : '' },
      body: JSON.stringify({ model, input })
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'proxy_error', detail: e.message });
  }
});

// Ensure providers file exists
if (!fs.existsSync(STORE)) writeProviders([
  { id: 'openai/gpt-oss-120b', label: 'OpenAI GPT-OSS 120B', baseUrl: 'https://api.example.com/generate' },
  { id: 'openai/gpt-oss-20b', label: 'OpenAI GPT-OSS 20B', baseUrl: 'https://api.example.com/generate' },
  { id: 'deepseek/deepseek-r1-0528', label: 'DeepSeek R1', baseUrl: 'https://api.example.com/deepseek' },
  { id: 'microsoft/mai-ds-r1', label: 'Microsoft MAI-DS R1', baseUrl: 'https://api.example.com/microsoft' }
]);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Proxy server listening on http://localhost:${port}`));
