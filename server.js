/* ════════════════════════════════════════════════════════════
   PINIT ORDER — server.  Pokretanje:  node server.js
   Nula zavisnosti — samo Node.js (isto kao PINIT server).

   Servira:
     /             → gost / konobar naručuje       (index.html)
     /kuhinja      → ekran u kuhinji               (kuhinja.html)
     /statistika   → statistika smjene             (statistika.html)

   API:
     GET   /api/meni                  → jelovnik + kategorije
     GET   /api/narudzbe?od=TS        → sve narudžbe dana (za kuhinju)
     GET   /api/narudzbe/:id          → jedna narudžba (gost prati status)
     POST  /api/narudzbe              {sto, stavke:[{id,kol}], napomena}
     PATCH /api/narudzbe/:id          {status: 0|1|2|3}
     GET   /api/statistika            → KPI, po satu, top jela, po stolu
     POST  /api/demo                  → napuni dan primjerima (za prikaz)
     POST  /api/reset                 → obriši sve narudžbe

   Podaci: data-order.json pored servera.
   ════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { MENU, KATEGORIJE, SANK } = require('./public/meni.js');

const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data-order.json');
const PUB  = path.join(__dirname, 'public');

/* status: 0 primljeno · 1 u pripremi · 2 spremno · 3 servirano */
let DB = { narudzbe: [], seq: 0, dan: danas() };
try { DB = Object.assign(DB, JSON.parse(fs.readFileSync(DATA, 'utf8'))); } catch (e) {}

let saveT = null;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => fs.writeFile(DATA, JSON.stringify(DB), () => {}), 300);
}
function danas() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function novDan() { if (DB.dan !== danas()) { DB.dan = danas(); DB.seq = 0; save(); } }
function log(m) { console.log(new Date().toLocaleTimeString('bs') + ' · ' + m); }
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}
function readBody(req, cb) {
  let d = '';
  req.on('data', c => { d += c; if (d.length > 2e6) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(d || '{}')); } catch (e) { cb(null); } });
}
const jelo = id => MENU.find(m => m.id === id);

/* ── PROCJENA VREMENA PRIPREME ──────────────────────────────
   Nije fiksan broj iz jelovnika — računa se po narudžbi:
     osnova     = najduže jelo u narudžbi
     dodatno    = +1.2 min za svaku dodatnu porciju (kuhinja radi paralelno)
     zauzetost  = +1.5 min za svaku narudžbu koja je već u redu
   Pića i deserti se ne broje u zauzetost kuhinje.
   ─────────────────────────────────────────────────────────── */
function procjena(stavke) {
  const kuhinjske = stavke.filter(s => SANK.indexOf(jelo(s.id).kat) === -1);
  const set = kuhinjske.length ? kuhinjske : stavke;
  const osnova = Math.max.apply(null, set.map(s => jelo(s.id).prep));
  const porcije = set.reduce((a, s) => a + s.kol, 0);
  const uRedu = DB.narudzbe.filter(n => n.status < 2).length;
  const min = osnova + (porcije - 1) * 1.2 + uRedu * 1.5;
  return Math.max(2, Math.min(45, Math.round(min)));
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  novDan();

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  /* ── JELOVNIK ── */
  if (p === '/api/meni') return json(res, 200, { meni: MENU, kategorije: KATEGORIJE });

  /* ── LISTA NARUDŽBI ── */
  if (p === '/api/narudzbe' && req.method === 'GET') {
    const od = Number(u.searchParams.get('od') || 0);
    return json(res, 200, DB.narudzbe.filter(n => n.ts >= od).slice(-200));
  }

  /* ── JEDNA NARUDŽBA ── */
  let m = p.match(/^\/api\/narudzbe\/(\d+)$/);
  if (m && req.method === 'GET') {
    const n = DB.narudzbe.find(x => String(x.id) === m[1]);
    return n ? json(res, 200, n) : json(res, 404, { error: 'nema narudžbe' });
  }

  /* ── NOVA NARUDŽBA ── */
  if (p === '/api/narudzbe' && req.method === 'POST') {
    return readBody(req, b => {
      if (!b || !Array.isArray(b.stavke) || !b.stavke.length)
        return json(res, 400, { error: 'narudžba je prazna' });

      const stavke = [];
      for (const s of b.stavke) {
        const j = jelo(s.id);
        const kol = Math.max(1, Math.min(20, parseInt(s.kol, 10) || 1));
        if (!j) return json(res, 400, { error: 'nepoznato jelo: ' + s.id });
        stavke.push({ id: j.id, naziv: j.naziv, ic: j.ic, kat: j.kat, kol, cijena: j.cijena, prep: j.prep });
      }
      const eta = procjena(stavke);
      const n = {
        id: Date.now() * 100 + Math.floor(Math.random() * 99),
        broj: ++DB.seq,
        sto: String(b.sto || '—').slice(0, 8),
        stavke,
        napomena: String(b.napomena || '').slice(0, 300),
        ukupno: +stavke.reduce((a, s) => a + s.cijena * s.kol, 0).toFixed(2),
        eta,
        ts: Date.now(),
        status: 0,
        pripremaOd: null, spremnoU: null, serviranoU: null
      };
      DB.narudzbe.push(n); save();
      log('Narudžba #' + n.broj + ' · sto ' + n.sto + ' · ' + n.stavke.length +
          ' stavki · ' + n.ukupno + ' KM · procjena ' + eta + ' min');
      json(res, 200, { ok: true, id: n.id, broj: n.broj, eta });
    });
  }

  /* ── PROMJENA STATUSA ── */
  m = p.match(/^\/api\/narudzbe\/(\d+)$/);
  if (m && req.method === 'PATCH') {
    return readBody(req, b => {
      const n = DB.narudzbe.find(x => String(x.id) === m[1]);
      if (!n) return json(res, 404, { error: 'nema narudžbe' });
      const s = parseInt(b && b.status, 10);
      if (!(s >= 0 && s <= 3)) return json(res, 400, { error: 'status 0-3' });
      n.status = s;
      if (s === 1 && !n.pripremaOd)  n.pripremaOd  = Date.now();
      if (s === 2 && !n.spremnoU)    n.spremnoU    = Date.now();
      if (s === 3 && !n.serviranoU)  n.serviranoU  = Date.now();
      save();
      log('Narudžba #' + n.broj + ' → ' + ['primljeno', 'u pripremi', 'spremno', 'servirano'][s]);
      json(res, 200, { ok: true });
    });
  }

  /* ── STATISTIKA ── */
  if (p === '/api/statistika') {
    const dan0 = new Date(); dan0.setHours(0, 0, 0, 0);
    const sve = DB.narudzbe.filter(n => n.ts >= dan0.getTime());
    const gotove = sve.filter(n => n.spremnoU);

    const trajanja = gotove.map(n => (n.spremnoU - n.ts) / 60000);
    const prosjek = trajanja.length ? trajanja.reduce((a, b) => a + b, 0) / trajanja.length : 0;
    const naVrijeme = gotove.filter(n => (n.spremnoU - n.ts) / 60000 <= n.eta + 1).length;
    const promet = sve.reduce((a, n) => a + n.ukupno, 0);

    const poSatu = Array(24).fill(0);
    sve.forEach(n => poSatu[new Date(n.ts).getHours()]++);

    const jela = {};
    sve.forEach(n => n.stavke.forEach(s => {
      if (!jela[s.id]) jela[s.id] = { id: s.id, naziv: s.naziv, ic: s.ic, kol: 0, promet: 0 };
      jela[s.id].kol += s.kol;
      jela[s.id].promet += s.kol * s.cijena;
    }));
    const top = Object.values(jela).sort((a, b) => b.kol - a.kol);

    const stolovi = {};
    sve.forEach(n => {
      if (!stolovi[n.sto]) stolovi[n.sto] = { sto: n.sto, narudzbi: 0, promet: 0 };
      stolovi[n.sto].narudzbi++;
      stolovi[n.sto].promet += n.ukupno;
    });

    return json(res, 200, {
      narudzbi: sve.length,
      promet: +promet.toFixed(2),
      prosjecanRacun: sve.length ? +(promet / sve.length).toFixed(2) : 0,
      prosjecnaPriprema: +prosjek.toFixed(1),
      planiranaPriprema: gotove.length ? +(gotove.reduce((a, n) => a + n.eta, 0) / gotove.length).toFixed(1) : 0,
      naVrijeme: gotove.length ? Math.round(naVrijeme / gotove.length * 100) : 100,
      gotovih: gotove.length,
      uRadu: sve.filter(n => n.status < 2).length,
      poSatu,
      top: top.slice(0, 8),
      stolovi: Object.values(stolovi).sort((a, b) => b.promet - a.promet)
    });
  }

  /* ── DEMO PODACI ── */
  if (p === '/api/demo' && req.method === 'POST') {
    const sad = Date.now(), poc = new Date(); poc.setHours(11, 0, 0, 0);
    const raspon = Math.max(30 * 60000, sad - poc.getTime());
    for (let i = 0; i < 28; i++) {
      const ts = poc.getTime() + Math.random() * raspon;
      const n = Math.random() < .4 ? 1 : (Math.random() < .7 ? 2 : 3);
      const stavke = [];
      for (let k = 0; k < n; k++) {
        const j = MENU[Math.floor(Math.random() * MENU.length)];
        if (stavke.some(s => s.id === j.id)) continue;
        stavke.push({ id: j.id, naziv: j.naziv, ic: j.ic, kat: j.kat,
                      kol: 1 + Math.floor(Math.random() * 2), cijena: j.cijena, prep: j.prep });
      }
      if (!stavke.length) continue;
      const eta = Math.max.apply(null, stavke.map(s => s.prep)) + 3;
      const stvarno = eta + (Math.random() < .75 ? -Math.random() * 3 : Math.random() * 7);
      DB.narudzbe.push({
        id: Math.floor(ts) * 100 + i, broj: ++DB.seq,
        sto: String(1 + Math.floor(Math.random() * 12)),
        stavke, napomena: '',
        ukupno: +stavke.reduce((a, s) => a + s.cijena * s.kol, 0).toFixed(2),
        eta, ts: Math.floor(ts), status: 3,
        pripremaOd: Math.floor(ts) + 60000,
        spremnoU: Math.floor(ts + stvarno * 60000),
        serviranoU: Math.floor(ts + (stvarno + 2) * 60000)
      });
    }
    save(); log('Demo podaci upisani (28 narudžbi).');
    return json(res, 200, { ok: true });
  }

  /* ── RESET ── */
  if (p === '/api/reset' && req.method === 'POST') {
    DB.narudzbe = []; DB.seq = 0; save(); log('Sve narudžbe obrisane.');
    return json(res, 200, { ok: true });
  }

  /* ── STATIKA ── */
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                 '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
  let f = p === '/' ? 'index.html'
        : p === '/kuhinja' ? 'kuhinja.html'
        : p === '/statistika' ? 'statistika.html'
        : p.slice(1);
  const fp = path.join(PUB, path.normalize(f).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(fp, (e, buf) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 — nema stranice'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, () => {
  const ips = [];
  const ni = os.networkInterfaces();
  for (const k in ni) ni[k].forEach(i => { if (i.family === 'IPv4' && !i.internal) ips.push(i.address); });
  console.log('\n  PINIT ORDER radi na portu ' + PORT);
  console.log('  ─────────────────────────────────────────');
  console.log('  Naručivanje :  http://localhost:' + PORT + '/');
  console.log('  Kuhinja     :  http://localhost:' + PORT + '/kuhinja');
  console.log('  Statistika  :  http://localhost:' + PORT + '/statistika');
  ips.forEach(ip => console.log('  Na mreži    :  http://' + ip + ':' + PORT + '/'));
  console.log('  ─────────────────────────────────────────\n');
});
