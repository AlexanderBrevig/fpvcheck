import { RULES } from './rules.js';
import { STRINGS } from './i18n.js';

// ───────────────────────── storage ─────────────────────────
const KEY = 'fpvcheck.v1';
const EMPTY = () => ({ profile: null, quads: [], sites: [], log: [], draft: null });

function load() {
  try { return { ...EMPTY(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return EMPTY(); }
}
let db = load();
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { toast('Kunne ikke lagre / Could not save'); }
}

// ───────────────────────── helpers ─────────────────────────
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
let tmpLang = null;
const lang = () => db.profile?.lang || tmpLang || 'nb';
const t = (k) => STRINGS[lang()][k] ?? STRINGS.nb[k] ?? k;
const L = (obj) => obj[lang()] ?? obj.nb;
const fmtDate = (ts) => new Date(ts).toLocaleDateString(lang() === 'nb' ? 'nb-NO' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (ts) => new Date(ts).toLocaleTimeString(lang() === 'nb' ? 'nb-NO' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const quadById = (id) => db.quads.find((q) => q.id === id);
const siteById = (id) => db.sites.find((s) => s.id === id);

function toast(msg) {
  document.querySelectorAll('.toast').forEach((n) => n.remove());
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}

// base64url for share links (UTF-8 safe)
const b64e = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

// ───────────────────────── geo ─────────────────────────
let AIRPORTS = [];
fetch('data/airports.json').then((r) => r.json()).then((d) => { AIRPORTS = d.airports; render(); }).catch(() => {});

function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function nearest(pos, kinds, n = 1) {
  if (!pos || !AIRPORTS.length) return [];
  return AIRPORTS.filter((a) => kinds.includes(a.k))
    .map((a) => ({ ...a, d: km(pos, a) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, n);
}
function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(5), lon: +p.coords.longitude.toFixed(5), acc: Math.round(p.coords.accuracy) }),
      reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
}

// ───────────────────────── routing ─────────────────────────
const routes = {
  '': viewHome, check: viewCheck, log: viewLog, entry: viewEntry,
  setup: viewSetup, quad: viewQuad, site: viewSite, share: viewShare, import: viewImport, about: viewAbout,
};
function parseHash() {
  const [, name = '', arg = ''] = location.hash.match(/^#\/?([^/]*)\/?(.*)$/) || [];
  return { name, arg: decodeURIComponent(arg) };
}
function go(path) { location.hash = '#/' + path; }

function render() {
  const { name, arg } = parseHash();
  document.documentElement.lang = lang() === 'nb' ? 'nb' : 'en';
  $('#lang').textContent = lang() === 'nb' ? 'EN' : 'NO';
  $('#brand').innerHTML = `${esc(t('appName'))}<small>${esc(t('tagline'))}</small>`;
  const tabs = { '': 'navCheck', check: 'navCheck', log: 'navLog', entry: 'navLog', setup: 'navSetup', quad: 'navSetup', site: 'navSetup', share: 'navSetup', about: 'navAbout' };
  document.querySelectorAll('nav.tabs a').forEach((a) => {
    a.textContent = t(a.dataset.label);
    if (tabs[name] === a.dataset.label) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const view = !db.profile && name !== 'import' && name !== 'about' ? viewWelcome : (routes[name] || viewHome);
  $('#view').innerHTML = view(arg);
  window.scrollTo?.({ top: 0 });
}
window.addEventListener('hashchange', () => { document.body.classList.remove('no-anim'); render(); });

// ───────────────────────── views ─────────────────────────
function profileFields(p = {}) {
  return `
    <label class="field"><span>${t('pilotName')}</span><input type="text" name="name" value="${esc(p.name)}" autocomplete="name" required></label>
    <label class="check"><input type="checkbox" name="member" ${p.member ? 'checked' : ''}> ${t('nlfMember')}</label>
    <label class="field"><span>${t('club')}</span><input type="text" name="club" value="${esc(p.club)}"></label>
    <label class="check"><input type="checkbox" name="mfpv" ${p.mfpv ? 'checked' : ''}> ${t('mfpv')}</label>
    <label class="field"><span>${t('language')}</span>
      <select name="lang"><option value="nb" ${p.lang !== 'en' ? 'selected' : ''}>Norsk</option><option value="en" ${p.lang === 'en' ? 'selected' : ''}>English</option></select></label>`;
}

function viewWelcome() {
  return `
    <h1>${t('welcomeTitle')}</h1>
    <p class="muted">${t('welcomeBody')}</p>
    <form class="card" data-form="profile">${profileFields({ lang: lang() })}
      <button class="btn block hazard" type="submit">${t('save')}</button></form>
    <p class="small muted">${t('disclaimer')}</p>`;
}

function profileChips() {
  const p = db.profile;
  return `<div class="chips">
    <span class="chip ${p.member ? 'go' : 'stop'}">NLF ${p.member ? '✓' : '✗'}</span>
    ${p.club ? `<span class="chip">${esc(p.club)}</span>` : ''}
    <span class="chip ${p.mfpv ? 'go' : 'warn'}">M-FPV ${p.mfpv ? '✓' : '–'}</span></div>`;
}

function todaysOpenEntry() {
  const e = db.log[0];
  return e && e.ok && sameDay(e.ts, Date.now()) ? e : null;
}

function viewHome() {
  const d = db.draft ?? (db.draft = { mode: db.profile.member ? 'solo' : 'spotter', quadId: db.quads[0]?.id ?? null, siteId: null, here: false });
  if (!db.profile.member) d.mode = 'spotter';
  const open = todaysOpenEntry();
  const ready = d.quadId && (d.siteId || d.here);
  return `
    <h1>${esc(db.profile.name)}</h1>
    ${profileChips()}
    ${open ? `
      <h2>${t('nextPack')}</h2>
      <div class="card">
        <div><b>${esc(open.siteName)}</b> · ${esc(open.quad?.name)} · <span class="mono">${open.packs.length} ${t('packs')}</span></div>
        <p class="small muted">${t('nextPackHint')}</p>
        <button class="btn block" data-act="nextPack">+1 ${t('nextPack')}</button>
      </div>` : ''}

    <h2>${t('mode')}</h2>
    <div class="seg" role="group">
      <button data-act="mode" data-v="solo" aria-pressed="${d.mode === 'solo'}" ${db.profile.member ? '' : 'disabled'}>${t('modeSolo')}</button>
      <button data-act="mode" data-v="spotter" aria-pressed="${d.mode === 'spotter'}">${t('modeSpotter')}</button>
    </div>
    ${!db.profile.member ? `<p class="notice warn">${t('soloBlocked')}</p>` : ''}
    ${d.mode === 'spotter' ? `<label class="field"><span>${t('spotterName')}</span><input type="text" data-bind="spotter" value="${esc(d.spotter)}"></label>` : ''}

    <h2>${t('quad')}</h2>
    <div class="pick">
      ${db.quads.map((q) => `<button data-act="pickQuad" data-id="${q.id}" aria-pressed="${d.quadId === q.id}">
        <span>${esc(q.name)}</span><span class="mono">${q.weightG ? q.weightG + ' g' : ''}</span></button>`).join('') || `<p class="muted">${t('noQuads')}</p>`}
    </div>
    <a class="btn ghost block" href="#/quad/new">+ ${t('addQuad')}</a>

    <h2>${t('site')}</h2>
    <div class="pick">
      <button data-act="pickHere" aria-pressed="${!!d.here}"><span>◎ ${t('hereNow')}</span><span class="mono">${d.pos ? `${d.pos.lat}, ${d.pos.lon}` : 'GPS'}</span></button>
      ${db.sites.map((s) => `<button data-act="pickSite" data-id="${s.id}" aria-pressed="${d.siteId === s.id}">
        <span>${esc(s.name)}</span><span class="mono">${siteAirportLabel(s)}</span></button>`).join('')}
    </div>
    <a class="btn ghost block" href="#/site/new">+ ${t('addSite')}</a>

    <div style="height:18px"></div>
    <button class="btn block hazard" data-act="start" ${ready ? '' : 'disabled'}>${t('start')} →</button>`;
}

function siteAirportLabel(s) {
  const [a] = nearest(s, ['airport']);
  return a ? `${a.icao || a.n} ${a.d.toFixed(1)} km` : '';
}

function checkPos(d) {
  if (d.siteId) { const s = siteById(d.siteId); return s && s.lat != null ? s : null; }
  return d.pos || null;
}

function airportHint(pos) {
  if (!pos) return `<div class="hint warn">${t('noPosition')}</div>`;
  const [a] = nearest(pos, ['airport']);
  const near = nearest(pos, ['airfield', 'heliport', 'seaplane'], 1)[0];
  const cls = !a ? '' : a.d < 5 ? 'stop' : a.d < 8 ? 'warn' : 'go';
  return `
    ${a ? `<div class="hint ${cls}">${t('nearestAirport')}: <b>${esc(a.n)}</b> <span class="mono">${a.icao} · ${a.d.toFixed(1)} km</span></div>` : ''}
    ${near && near.d < 5 ? `<div class="hint warn">${t('nearestAirfield')}: <b>${esc(near.n)}</b> <span class="mono">${near.d.toFixed(1)} km</span></div>` : ''}
    <div class="hint">${t('controlledNote')} <a href="${RULES.links.avinorDrone}" target="_blank" rel="noopener">Avinor ↗</a></div>`;
}

function trafficHint(pos) {
  if (!pos) return '';
  const list = nearest(pos, ['airport', 'airfield', 'heliport', 'seaplane'], 3).filter((a) => a.d < 15);
  if (!list.length) return `<div class="hint go">${t('nearestAirfield')}: &gt; 15 km</div>`;
  return `<div class="hint">${list.map((a) => `${esc(a.n)} <span class="mono">${a.d.toFixed(1)} km</span>`).join('<br>')}</div>`;
}

function hintFor(item, d, pos) {
  const q = quadById(d.quadId) || {};
  switch (item.hint) {
    case 'traffic': return trafficHint(pos);
    case 'airport': return airportHint(pos);
    case 'area': { const s = siteById(d.siteId); return s?.notes ? `<div class="hint">${esc(s.notes)}</div>` : ''; }
    case 'permitted': return `<div class="hint"><a href="${RULES.links.naturbase}" target="_blank" rel="noopener">${t('naturbase')} ↗</a> · <a href="${RULES.links.nsm}" target="_blank" rel="noopener">${t('nsm')} ↗</a></div>`;
    case 'weight': {
      if (!q.weightG) return '';
      const ok = q.weightG <= 1000;
      return `<div class="hint ${ok ? 'go' : 'stop'}">${esc(q.name)}: <span class="mono">${q.weightG} g / 1000 g</span></div>`;
    }
    case 'failsafe': return q.name ? `<div class="hint ${q.failsafe ? 'go' : 'warn'}">${esc(q.name)}: ${q.failsafe ? t('failsafeSet') + ' ✓' : '?'}</div>` : '';
    case 'strobe': return q.name ? `<div class="hint ${q.strobe ? 'go' : 'warn'}">${esc(q.name)}: ${q.strobe ? esc(q.strobe) : '?'}</div>` : '';
    default: return '';
  }
}

function itemsFor(mode) { return mode === 'solo' ? RULES.items : RULES.spotter.items; }

function viewCheck() {
  const d = db.draft;
  if (!d || !d.started) { go(''); return ''; }
  const items = itemsFor(d.mode);
  const pos = checkPos(d);
  const answered = items.filter((i) => d.answers[i.n] !== undefined).length;
  const all = answered === items.length;
  const ok = all && items.every((i) => d.answers[i.n] === true);
  const anyNo = items.some((i) => d.answers[i.n] === false);
  const site = siteById(d.siteId);
  const q = quadById(d.quadId);
  return `
    <h1>${d.mode === 'solo' ? RULES.checklist.name.replace('Vedlegg H – ', '') : t('modeSpotter')}</h1>
    <div class="formhead">
      <div class="wide"><b>${t('pilot')}</b><span>${esc(db.profile.name)}</span></div>
      <div><b>${t('place')}</b><span>${esc(site?.name || (pos ? `${pos.lat}, ${pos.lon}` : '…'))}</span></div>
      <div><b>${t('date')}</b><span>${fmtDate(d.startedAt)}</span></div>
      <div><b>${t('quad')}</b><span>${esc(q?.name)}</span></div>
      <div><b>${d.mode === 'spotter' ? t('spotterName') : 'GPS'}</b><span class="mono">${d.mode === 'spotter' ? esc(d.spotter || '–') : pos?.acc ? `±${pos.acc} m` : pos ? '✓' : '–'}</span></div>
    </div>
    ${d.mode === 'solo' ? `<p class="small muted">${esc(L(RULES.checklist.intro))}</p>` : `<p class="small muted">${esc(L(RULES.spotter.rule))}</p>`}
    ${d.mode === 'solo' && !db.profile.mfpv ? `<p class="notice warn"><b>${t('pendingTitle')}:</b> ${esc(L(RULES.pending))}</p>` : ''}
    <div class="progress"><i style="width:${(answered / items.length) * 100}%"></i></div>
    <div>
      ${items.map((i) => {
        const a = d.answers[i.n];
        return `<section class="item ${a === true ? 'is-yes' : a === false ? 'is-no' : ''}">
          <div class="num">${i.n}</div>
          <div>
            <p class="q">${esc(i.nb)}</p>
            ${lang() === 'en' ? `<p class="tr">${esc(i.en)}</p>` : ''}
          </div>
          ${d.mode === 'solo' ? hintFor(i, d, pos) : ''}
          <div class="yn">
            <button class="y" data-act="answer" data-n="${i.n}" data-v="1" aria-pressed="${a === true}">${t('yes')}</button>
            <button class="n" data-act="answer" data-n="${i.n}" data-v="0" aria-pressed="${a === false}">${t('no')}</button>
          </div>
        </section>`;
      }).join('')}
    </div>
    ${anyNo && d.mode === 'solo' ? `
      <div class="result no">
        <div class="stamp">${t('resultNo')}</div>
        <p style="margin-top:14px">${t('resultNoBody')}</p>
        <p class="small">${esc(L(RULES.spotter.rule))}</p>
        <button class="btn block" data-act="toSpotter">${t('switchSpotter')}</button>
      </div>` : ''}
    ${ok ? `
      <div class="result ok">
        <div class="stamp">${d.mode === 'solo' ? t('resultOk') : t('resultOkSpotter')}</div>
        <p class="mono" style="margin-top:14px">${fmtDate(Date.now())} ${fmtTime(Date.now())}</p>
        <button class="btn block hazard" data-act="saveCheck">${t('saveLog')}</button>
      </div>` : ''}
    ${d.mode === 'solo' ? softChecks() : ''}
    <button class="btn ghost block noprint" data-act="abort" style="margin-top:12px">${t('cancel')}</button>`;
}

function softChecks() {
  return `
    <h2>${t('alsoRequired')}</h2>
    <div class="card"><ul class="links">${L(RULES.soloRequirements).map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
    <h2>${t('softChecks')}</h2>
    <div class="card"><ul class="links">
      <li><a href="${RULES.links.fire}" target="_blank" rel="noopener">${t('fire')} ↗</a></li>
      <li><a href="${RULES.links.naturbase}" target="_blank" rel="noopener">${t('naturbase')} ↗</a></li>
      <li><a href="${RULES.links.nsm}" target="_blank" rel="noopener">${t('nsm')} ↗</a></li>
      <li><b>${t('speedRec')}:</b> ${esc(L(RULES.recommendation))}</li>
    </ul></div>`;
}

function viewLog() {
  return `
    <h1>${t('navLog')}</h1>
    ${db.log.length ? db.log.map((e) => `
      <a class="card logrow" href="#/entry/${e.id}">
        <span class="dot ${e.ok ? 'go' : 'stop'}"></span>
        <span><b>${esc(e.siteName)}</b><br><span class="small muted">${esc(e.quad?.name)} · ${e.mode === 'solo' ? t('modeSolo') : t('modeSpotter')}</span></span>
        <span class="mono">${fmtDate(e.ts)}<br>${e.packs.length} ${t('packs')}</span>
      </a>`).join('') : `<p class="muted">${t('logEmpty')}</p>`}
    ${db.log.length ? `<button class="btn ghost block" data-act="exportLog">${t('exportJson')}</button>` : ''}`;
}

function viewEntry(id) {
  const e = db.log.find((x) => x.id === id);
  if (!e) return `<p class="muted">–</p>`;
  const items = itemsFor(e.mode);
  return `
    <div class="sheet">
      <p class="mono small muted">MODELLFLYHÅNDBOKEN · ${e.mode === 'solo' ? `${esc(e.rules.checklist)} v${esc(e.rules.checklistVersion)}` : t('modeSpotter')}</p>
      <h1>${e.mode === 'solo' ? 'Sjekkliste FPV uten utkikksperson' : 'FPV med utkikksperson'}</h1>
      <div class="formhead">
        <div class="wide"><b>Modellflygers navn</b><span>${esc(e.pilot)}</span></div>
        <div><b>Sted</b><span>${esc(e.siteName)}</span></div>
        <div><b>Dato</b><span>${fmtDate(e.ts)}</span></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Sjekkpunkt</th><th>JA</th></tr></thead>
        <tbody>${items.map((i) => `<tr><td class="n">${i.n}</td><td>${esc(i.nb)}</td><td class="ja">${e.answers[i.n] === true ? 'JA' : e.answers[i.n] === false ? 'NEI' : ''}</td></tr>`).join('')}</tbody>
      </table>
      <div class="card small">
        <div><b>${t('quad')}:</b> ${esc(e.quad?.name)} ${e.quad?.weightG ? `<span class="mono">${e.quad.weightG} g</span>` : ''} · ${t('strobe')}: ${esc(e.quad?.strobe || '–')}</div>
        ${e.spotter ? `<div><b>${t('spotterName')}:</b> ${esc(e.spotter)}</div>` : ''}
        ${e.pos ? `<div><b>GPS:</b> <span class="mono">${e.pos.lat}, ${e.pos.lon}${e.pos.acc ? ` ±${e.pos.acc} m` : ''}</span></div>` : ''}
        ${e.airport ? `<div><b>${t('nearestAirport')}:</b> ${esc(e.airport.n)} <span class="mono">${e.airport.d.toFixed(1)} km</span></div>` : ''}
        <div><b>${t('packs')}:</b> <span class="mono">${e.packs.map(fmtTime).join(' · ')}</span></div>
        <div class="muted">${t('rulesVersion')}: ${esc(e.rules.handbook)} v${esc(e.rules.handbookVersion)}</div>
      </div>
    </div>
    <div class="row noprint">
      <button class="btn" data-act="print">${t('print')}</button>
      <button class="btn ghost" data-act="deleteEntry" data-id="${e.id}">${t('delete')}</button>
    </div>`;
}

function viewSetup() {
  return `
    <h1>${t('navSetup')}</h1>
    <form class="card" data-form="profile">${profileFields(db.profile)}
      <button class="btn block" type="submit">${t('save')}</button></form>

    <h2>${t('quad')}</h2>
    ${db.quads.map((q) => `<a class="card logrow" href="#/quad/${q.id}"><span>✈</span><span><b>${esc(q.name)}</b><br><span class="small muted">${esc(q.strobe || '')}</span></span><span class="mono">${q.weightG || '?'} g</span></a>`).join('') || `<p class="muted">${t('noQuads')}</p>`}
    <a class="btn ghost block" href="#/quad/new">+ ${t('addQuad')}</a>

    <h2>${t('site')}</h2>
    ${db.sites.map((s) => `<a class="card logrow" href="#/site/${s.id}"><span>◎</span><span><b>${esc(s.name)}</b><br><span class="small muted">${esc(s.notes || '')}</span></span><span class="mono">${siteAirportLabel(s)}</span></a>`).join('') || `<p class="muted">${t('noSites')}</p>`}
    <a class="btn ghost block" href="#/site/new">+ ${t('addSite')}</a>

    <h2>${t('share')}</h2>
    <a class="btn block" href="#/share">${t('share')} →</a>`;
}

function viewQuad(id) {
  const q = id === 'new' ? { id: 'new', failsafe: true } : quadById(id);
  if (!q) return '–';
  return `
    <h1>${id === 'new' ? t('addQuad') : esc(q.name)}</h1>
    <form class="card" data-form="quad" data-id="${q.id}">
      <label class="field"><span>${t('quad')}</span><input type="text" name="name" value="${esc(q.name)}" required></label>
      <label class="field"><span>${t('weightG')}</span><input type="number" name="weightG" inputmode="numeric" min="1" max="25000" value="${esc(q.weightG)}"></label>
      <label class="field"><span>${t('strobeDesc')}</span><input type="text" name="strobe" value="${esc(q.strobe)}" placeholder="NordBlink, VIFLY…"></label>
      <label class="check"><input type="checkbox" name="failsafe" ${q.failsafe ? 'checked' : ''}> ${t('failsafeSet')}</label>
      <div class="row"><button class="btn" type="submit">${t('save')}</button>
      ${id !== 'new' ? `<button class="btn ghost" type="button" data-act="deleteQuad" data-id="${q.id}">${t('delete')}</button>` : ''}</div>
    </form>`;
}

function viewSite(id) {
  const s = id === 'new' ? { id: 'new' } : siteById(id);
  if (!s) return '–';
  return `
    <h1>${id === 'new' ? t('addSite') : esc(s.name)}</h1>
    <form class="card" data-form="site" data-id="${s.id}">
      <label class="field"><span>${t('site')}</span><input type="text" name="name" value="${esc(s.name)}" required></label>
      <div class="row">
        <label class="field"><span>${t('lat')}</span><input type="number" step="any" name="lat" value="${esc(s.lat)}" inputmode="decimal"></label>
        <label class="field"><span>${t('lon')}</span><input type="number" step="any" name="lon" value="${esc(s.lon)}" inputmode="decimal"></label>
      </div>
      <button class="btn ghost block" type="button" data-act="siteGps">◎ ${t('useGps')}</button>
      <div style="height:12px"></div>
      <label class="field"><span>${t('notes')}</span><textarea name="notes" rows="3">${esc(s.notes)}</textarea></label>
      ${s.lat != null ? airportHint(s) : ''}
      <div style="height:12px"></div>
      <div class="row"><button class="btn" type="submit">${t('save')}</button>
      ${id !== 'new' ? `<button class="btn ghost" type="button" data-act="deleteSite" data-id="${s.id}">${t('delete')}</button>` : ''}</div>
    </form>`;
}

function viewShare() {
  return `
    <h1>${t('share')}</h1>
    <p class="muted">${t('shareHint')}</p>
    <form class="card" data-form="share">
      <h3>${t('quad')}</h3>
      ${db.quads.map((q) => `<label class="check"><input type="checkbox" name="q" value="${q.id}"> ${esc(q.name)}</label>`).join('') || `<p class="muted">${t('noQuads')}</p>`}
      <h3 style="margin-top:12px">${t('site')}</h3>
      ${db.sites.map((s) => `<label class="check"><input type="checkbox" name="s" value="${s.id}" checked> ${esc(s.name)}</label>`).join('') || `<p class="muted">${t('noSites')}</p>`}
      <button class="btn block" type="submit">${t('copyLink')}</button>
    </form>
    <textarea id="shareOut" class="mono" rows="4" readonly hidden></textarea>`;
}

let pendingImport = null;
function viewImport(data) {
  try { pendingImport = JSON.parse(b64d(data)); } catch { pendingImport = null; }
  if (!pendingImport || pendingImport.v !== 1) return `<p class="notice warn">Ugyldig lenke / Invalid link</p>`;
  const { quads = [], sites = [] } = pendingImport;
  return `
    <h1>${t('importTitle')}</h1>
    <p>${t('importBody')}</p>
    <div class="card">
      ${quads.map((q) => `<div>✈ <b>${esc(q.name)}</b> <span class="mono">${esc(q.weightG)} g</span></div>`).join('')}
      ${sites.map((s) => `<div>◎ <b>${esc(s.name)}</b> <span class="mono">${esc(s.lat)}, ${esc(s.lon)}</span></div>`).join('')}
    </div>
    <button class="btn block hazard" data-act="doImport">${t('importDo')}</button>`;
}

function viewAbout() {
  const r = RULES;
  return `
    <h1>${t('navAbout')}</h1>
    <p class="notice">${t('disclaimer')}</p>
    <h2>${t('rulesVersion')}</h2>
    <div class="card"><ul class="links">
      <li><a href="${r.handbook.url}" target="_blank" rel="noopener">${r.handbook.name} v${r.handbook.version}</a> <span class="mono">${r.handbook.validFrom}</span></li>
      <li><a href="${r.checklist.url}" target="_blank" rel="noopener">${r.checklist.name} v${r.checklist.version}</a> <span class="mono">${r.checklist.validFrom}</span></li>
    </ul></div>
    <h2>${t('pendingTitle')}</h2>
    <div class="card"><p>${esc(L(r.pending))}</p><a href="${r.pending.url}" target="_blank" rel="noopener">nlf.no ↗</a></div>
    <h2>Natt / Night</h2>
    <div class="card"><p>${esc(L(r.night))}</p></div>
    <h2>${t('airportData')}</h2>
    <p class="small muted">OurAirports (public domain), hentet 2026-10-14. ${t('controlledNote')}</p>`;
}

// ───────────────────────── actions ─────────────────────────
const actions = {
  mode(el) { db.draft.mode = el.dataset.v; persist(); render(); },
  pickQuad(el) { db.draft.quadId = el.dataset.id; persist(); render(); },
  pickSite(el) { Object.assign(db.draft, { siteId: el.dataset.id, here: false }); persist(); render(); },
  async pickHere() {
    Object.assign(db.draft, { siteId: null, here: true }); persist(); render();
    toast(t('locating'));
    try { db.draft.pos = await locate(); persist(); document.querySelectorAll('.toast').forEach((n) => n.remove()); render(); }
    catch { toast(t('locFailed')); }
  },
  start() {
    Object.assign(db.draft, { started: true, startedAt: Date.now(), answers: {} });
    persist(); go('check');
  },
  answer(el) {
    const n = +el.dataset.n, v = el.dataset.v === '1';
    db.draft.answers[n] = db.draft.answers[n] === v ? undefined : v;
    persist();
    document.body.classList.add('no-anim');
    const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  toSpotter() {
    Object.assign(db.draft, { mode: 'spotter', started: false, answers: {} });
    persist(); go('');
  },
  abort() { db.draft = null; persist(); go(''); },
  saveCheck() {
    const d = db.draft, q = quadById(d.quadId), s = siteById(d.siteId), pos = checkPos(d);
    const [airport] = nearest(pos, ['airport']);
    const items = itemsFor(d.mode);
    const entry = {
      id: uid(), ts: Date.now(), mode: d.mode, pilot: db.profile.name, club: db.profile.club,
      siteName: s?.name || (pos ? `${pos.lat}, ${pos.lon}` : '?'), pos: pos ? { lat: pos.lat, lon: pos.lon, acc: pos.acc } : null,
      airport: airport ? { n: airport.n, icao: airport.icao, d: airport.d } : null,
      quad: q ? { name: q.name, weightG: q.weightG, strobe: q.strobe, failsafe: q.failsafe } : null,
      spotter: d.mode === 'spotter' ? d.spotter || '' : undefined,
      answers: d.answers, ok: items.every((i) => d.answers[i.n] === true), packs: [Date.now()],
      rules: { handbook: RULES.handbook.name, handbookVersion: RULES.handbook.version, checklist: 'Vedlegg H', checklistVersion: RULES.checklist.version },
    };
    db.log.unshift(entry);
    db.draft = { mode: d.mode, quadId: d.quadId, siteId: d.siteId, here: d.here, pos: d.pos, spotter: d.spotter };
    persist(); toast(t('saved')); go('entry/' + entry.id);
  },
  nextPack() { const e = todaysOpenEntry(); if (!e) return; e.packs.push(Date.now()); persist(); toast(`${e.packs.length} ${t('packs')}`); render(); },
  exportLog() {
    const blob = new Blob([JSON.stringify(db.log, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `fpvcheck-log-${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  print() { window.print(); },
  deleteEntry(el) { if (!confirm(t('deleteConfirm'))) return; db.log = db.log.filter((e) => e.id !== el.dataset.id); persist(); go('log'); },
  deleteQuad(el) { if (!confirm(t('deleteConfirm'))) return; db.quads = db.quads.filter((q) => q.id !== el.dataset.id); persist(); go('setup'); },
  deleteSite(el) { if (!confirm(t('deleteConfirm'))) return; db.sites = db.sites.filter((s) => s.id !== el.dataset.id); persist(); go('setup'); },
  async siteGps(el) {
    const f = el.closest('form'); toast(t('locating'));
    try { const p = await locate(); f.lat.value = p.lat; f.lon.value = p.lon; }
    catch { toast(t('locFailed')); }
  },
  doImport() {
    const { quads = [], sites = [] } = pendingImport || {};
    const names = (arr) => new Set(arr.map((x) => x.name));
    const hq = names(db.quads), hs = names(db.sites);
    quads.filter((q) => !hq.has(q.name)).forEach((q) => db.quads.push({ ...pick(q, ['name', 'weightG', 'strobe', 'failsafe']), id: uid() }));
    sites.filter((s) => !hs.has(s.name)).forEach((s) => db.sites.push({ ...pick(s, ['name', 'lat', 'lon', 'notes']), id: uid() }));
    pendingImport = null; persist(); toast(t('importDone')); go(db.profile ? 'setup' : '');
  },
};
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const forms = {
  profile(f) {
    db.profile = { name: f.name.value.trim(), member: f.member.checked, club: f.club.value.trim(), mfpv: f.mfpv.checked, lang: f.lang.value };
    if (db.draft && !db.profile.member) db.draft.mode = 'spotter';
    persist(); toast(t('saved')); go('');
  },
  quad(f) {
    const id = f.dataset.id;
    const q = { name: f.name.value.trim(), weightG: f.weightG.value ? +f.weightG.value : null, strobe: f.strobe.value.trim(), failsafe: f.failsafe.checked };
    if (id === 'new') { const nq = { ...q, id: uid() }; db.quads.push(nq); if (db.draft && !db.draft.quadId) db.draft.quadId = nq.id; }
    else Object.assign(quadById(id), q);
    persist(); history.back();
  },
  site(f) {
    const id = f.dataset.id;
    const num = (v) => (v === '' ? null : +v);
    const s = { name: f.name.value.trim(), lat: num(f.lat.value), lon: num(f.lon.value), notes: f.notes.value.trim() };
    if (id === 'new') db.sites.push({ ...s, id: uid() }); else Object.assign(siteById(id), s);
    persist(); history.back();
  },
  async share(f) {
    const qs = [...f.querySelectorAll('input[name=q]:checked')].map((i) => pick(quadById(i.value), ['name', 'weightG', 'strobe', 'failsafe']));
    const ss = [...f.querySelectorAll('input[name=s]:checked')].map((i) => pick(siteById(i.value), ['name', 'lat', 'lon', 'notes']));
    const url = `${location.origin}${location.pathname}#/import/${b64e(JSON.stringify({ v: 1, quads: qs, sites: ss }))}`;
    const out = $('#shareOut'); out.hidden = false; out.value = url;
    if (navigator.share) { try { await navigator.share({ title: t('appName'), url }); return; } catch { /* fall through to copy */ } }
    try { await navigator.clipboard.writeText(url); toast(t('copied')); } catch { out.select(); }
  },
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  ev.preventDefault();
  actions[el.dataset.act]?.(el);
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form]');
  if (!f) return;
  ev.preventDefault();
  forms[f.dataset.form]?.(f);
});
document.addEventListener('input', (ev) => {
  const el = ev.target.closest('[data-bind]');
  if (!el || !db.draft) return;
  db.draft[el.dataset.bind] = el.value; persist();
});
$('#lang').addEventListener('click', () => {
  const next = lang() === 'nb' ? 'en' : 'nb';
  if (db.profile) { db.profile.lang = next; persist(); } else tmpLang = next;
  render();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
