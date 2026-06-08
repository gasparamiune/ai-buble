// AI BUBLE — free/mechanical cloud refresh.
// Runs in GitHub Actions (Node 20+, global fetch, zero npm deps).
// Pulls live-ish prices from Yahoo Finance (keyless) and, IF a TAVILY_API_KEY
// secret is set, a few recent headlines. Rewrites data.json; workflow commits it.

import { readFileSync, writeFileSync } from 'node:fs';

const DATA_FILE = new URL('../data.json', import.meta.url);

const TICKERS = [
  { sym: 'NVDA', name: 'NVIDIA',       tag: 'core' },
  { sym: 'MSFT', name: 'Microsoft',    tag: 'core' },
  { sym: 'GOOGL', name: 'Alphabet',    tag: 'core' },
  { sym: 'AMZN', name: 'Amazon',       tag: 'core' },
  { sym: 'META', name: 'Meta',         tag: 'core' },
  { sym: 'CRWV', name: 'CoreWeave',    tag: 'periphery' },
  { sym: 'ALAB', name: 'Astera Labs',  tag: 'periphery' },
  { sym: 'ARM',  name: 'ARM',          tag: 'periphery' },
  { sym: 'TSLA', name: 'Tesla',        tag: 'periphery' },
  { sym: 'LITE', name: 'Lumentum',     tag: 'periphery' },
  { sym: 'BE',   name: 'Bloom Energy', tag: 'periphery' },
  { sym: 'PLTR', name: 'Palantir',     tag: 'periphery' },
];

async function quote(t) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t.sym}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
    if (!m) throw new Error('no meta');
    const price = (m.regularMarketPrice != null) ? +(+m.regularMarketPrice).toFixed(2) : null;
    const prev = (m.chartPreviousClose != null) ? m.chartPreviousClose : m.previousClose;
    const change = (price != null && prev) ? +(((price - prev) / prev) * 100).toFixed(2) : null;
    const date = m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString().slice(0, 10) : null;
    return { name: t.name, sym: t.sym, tag: t.tag, price, change, date };
  } catch (e) {
    console.error('price', t.sym, 'failed:', e.message);
    return { name: t.name, sym: t.sym, tag: t.tag, price: null, change: null, date: null };
  }
}

async function getPrices() {
  return Promise.all(TICKERS.map(quote));
}

async function getHeadlines() {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null; // optional — skipped if the secret isn't set
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'AI bubble hyperscaler capex OpenAI funding CoreWeave credit latest',
        max_results: 5, search_depth: 'basic', time_range: 'week',
      }),
    });
    if (!res.ok) { console.error('tavily HTTP ' + res.status); return null; }
    const j = await res.json();
    return (j.results || []).slice(0, 5).map(r => ({ title: r.title, url: r.url }));
  } catch (e) { console.error('tavily failed:', e.message); return null; }
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  try { data.prices = await getPrices(); console.log('prices:', data.prices.filter(p => p.price != null).length, 'of', data.prices.length); }
  catch (e) { console.error('price fetch failed:', e.message); }
  const hl = await getHeadlines();
  if (hl) { data.headlines = hl; console.log('headlines:', hl.length); }
  data.meta = data.meta || {};
  data.meta.lastUpdated = new Date().toISOString();
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log('data.json updated at', data.meta.lastUpdated);
}

main().catch(e => { console.error(e); process.exit(1); });
