/* Local San Diego Painting — the color studio.
   A Spanish-style San Diego home drawn in code. Each paintable surface is a
   path; paint is rolled onto that surface's own layer and clipped to it, so
   it only lands where the "tape" allows. Details (roof tile, glass, plants,
   shadows) sit in an SVG overlay above the canvas. */
(() => {
  const host = document.querySelector('[data-studio]');
  if (!host) return;
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const overlay = host.querySelector('[data-overlay]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VW = 1200, VH = 700;

  /* ---------- palette (our own names; screen approximations) ---------- */
  const COLORS = [
    { name: 'Cabrillo White', hex: '#f4f1ea' },
    { name: 'Torrey Mist', hex: '#e2e7e0' },
    { name: 'Pacific Fog', hex: '#c5d0d3' },
    { name: 'Coronado Sand', hex: '#e6d6b8' },
    { name: 'Old Town Adobe', hex: '#d3a37a' },
    { name: 'Sunset Cliffs Coral', hex: '#dc7c5f' },
    { name: 'Balboa Sage', hex: '#92a68d' },
    { name: 'La Jolla Cove', hex: '#5b95aa' },
    { name: 'North Park Teal', hex: '#2e6a6d' },
    { name: 'Mission Olive', hex: '#69693f' },
    { name: 'Point Loma Navy', hex: '#24334f' },
    { name: 'Gaslamp Black', hex: '#24211f' },
    { name: 'Mission Oak Stain', hex: '#7a4a2a' },
  ];
  const byName = Object.fromEntries(COLORS.map((c) => [c.name, c]));

  /* ---------- geometry ---------- */
  const arch = (x1, y1, x2, y2) => { const r = (x2 - x1) / 2; return `M${x1} ${y2}V${y1 + r}A${r} ${r} 0 0 1 ${x2} ${y1 + r}V${y2}Z`; };
  const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const WINDOWS = [[450, 280, 540, 400], [720, 280, 810, 400], [600, 290, 670, 372], [440, 440, 560, 560], [720, 440, 840, 560], [920, 430, 1020, 550]];
  const GARAGE = 'M170 600V470Q270 446 370 470V600Z';
  const DOOR = arch(595, 440, 675, 600);

  const SURFACES = [
    { id: 'body', label: 'Stucco', before: '#c7bca8', path: [rect(120, 380, 300, 220), rect(400, 230, 460, 370), rect(860, 380, 220, 220)].join('') },
    { id: 'trim', label: 'Trim', before: '#a19a8b', path: [rect(100, 380, 340, 16), rect(380, 230, 500, 16), rect(840, 380, 260, 16), 'M158 600V462Q270 434 382 462V600Z', arch(580, 425, 690, 600),
        ...WINDOWS.map(([a, b, c, d]) => arch(a - 12, b - 12, c + 12, d + 6) + rect(a - 18, d + 4, c - a + 36, 12))].join('') },
    { id: 'garage', label: 'Garage', before: '#b1a796', path: GARAGE },
    { id: 'door', label: 'Front door', before: '#6c6053', path: DOOR },
  ];
  SURFACES.forEach((s) => { s.p2d = new Path2D(s.path); s.color = null; });

  /* ---------- overlay: roof, glass, details, plants, shadows ---------- */
  const glass = WINDOWS.map(([a, b, c, d]) => {
    const mid = (a + c) / 2;
    return `<path d="${arch(a, b, c, d)}" fill="url(#glass)"/>
      <path d="${arch(a, b, c, d)}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
      <path d="M${mid} ${b + 4}V${d}M${a} ${(b + d) / 2 + 10}H${c}" stroke="#2b2b2b" stroke-width="3"/>
      <path d="M${a + 8} ${d - 8}L${a + 30} ${b + (c - a) / 2}" stroke="rgba(255,255,255,.35)" stroke-width="6" stroke-linecap="round"/>`;
  }).join('');
  overlay.innerHTML = `
    <defs>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb8c8"/><stop offset=".55" stop-color="#3d5568"/><stop offset="1" stop-color="#1d2a35"/></linearGradient>
      <pattern id="tiles" width="22" height="14" patternUnits="userSpaceOnUse"><rect width="22" height="14" fill="#b4573a"/><path d="M0 14 Q11 2 22 14" fill="#c86a48"/><path d="M0 14 Q11 2 22 14" fill="none" stroke="#8a3b25" stroke-width="1.4"/></pattern>
      <linearGradient id="eave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f9a5a"/><stop offset="1" stop-color="#5d7a3e"/></linearGradient>
      <radialGradient id="shrub" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#6f9150"/><stop offset="1" stop-color="#36522c"/></radialGradient>
    </defs>
    <path d="M100 380L440 380L400 318L140 318Z" fill="url(#tiles)"/>
    <path d="M380 230L880 230L800 146L460 146Z" fill="url(#tiles)"/>
    <path d="M840 380L1100 380L1060 318L880 318Z" fill="url(#tiles)"/>
    <path d="M100 380L440 380M380 230L880 230M840 380L1100 380" stroke="#7a3320" stroke-width="3"/>
    <rect x="120" y="396" width="300" height="30" fill="url(#eave)"/>
    <rect x="400" y="246" width="460" height="34" fill="url(#eave)"/>
    <rect x="860" y="396" width="220" height="30" fill="url(#eave)"/>
    <rect x="410" y="360" width="440" height="14" fill="#000" opacity=".08"/>
    ${glass}
    <g stroke="rgba(0,0,0,.22)" stroke-width="2"><path d="M178 500H362M176 530H364M176 560H364"/></g>
    <g stroke="rgba(0,0,0,.25)" stroke-width="2"><path d="M635 452V600M615 470V600M655 470V600"/></g>
    <circle cx="662" cy="530" r="5" fill="#c9a24a" stroke="#6b5420"/>
    <path d="M572 240 V200 h14 v40z" fill="#3b2a20" opacity=".0"/>
    <rect x="0" y="600" width="1200" height="100" fill="url(#lawn)"/>
    <path d="M590 600 L680 600 L760 700 L510 700 Z" fill="#d8cdb8"/>
    <path d="M590 600 L680 600 L760 700 L510 700 Z" fill="none" stroke="rgba(0,0,0,.12)"/>
    <rect x="160" y="600" width="220" height="100" fill="#cfc6b5"/>
    <ellipse cx="640" cy="603" rx="560" ry="8" fill="#000" opacity=".18"/>
    <g fill="url(#shrub)">
      <ellipse cx="440" cy="596" rx="46" ry="30"/><ellipse cx="500" cy="600" rx="40" ry="24"/>
      <ellipse cx="760" cy="598" rx="52" ry="30"/><ellipse cx="830" cy="602" rx="40" ry="22"/>
      <ellipse cx="950" cy="600" rx="60" ry="28"/><ellipse cx="1040" cy="602" rx="44" ry="22"/>
      <ellipse cx="128" cy="598" rx="40" ry="26"/>
    </g>
    <g class="palm">
      <path d="M1126 640 C1120 520 1132 400 1146 300" stroke="#7a5d3b" stroke-width="14" fill="none" stroke-linecap="round"/>
      <g fill="#3f6b3a"><path d="M1146 300 C1090 280 1050 300 1030 330 C1080 300 1120 306 1146 304Z"/><path d="M1146 300 C1170 250 1210 240 1240 250 C1200 262 1170 280 1148 304Z"/><path d="M1146 300 C1120 250 1080 236 1050 240 C1090 252 1124 276 1144 304Z"/><path d="M1146 300 C1196 290 1230 310 1244 340 C1210 312 1174 306 1148 304Z"/><path d="M1146 300 C1150 260 1140 226 1124 210 C1150 232 1156 268 1150 302Z"/></g>
    </g>`;

  /* ---------- canvas & layers ---------- */
  let scale = 1, dpr = 1;
  const layers = new Map();
  const makeLayer = () => { const c = document.createElement('canvas'); return { c, x: c.getContext('2d') }; };
  SURFACES.forEach((s) => layers.set(s.id, makeLayer()));

  const weather = (l, s) => {
    // the "before": tired paint with stains, chalking and a few peels
    const g = l.x;
    g.save(); g.clip(s.p2d);
    g.fillStyle = s.before; g.fill(s.p2d);
    let seed = s.id.length * 977;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 140; i++) {
      const x = 100 + rnd() * 1000, y = 140 + rnd() * 470, r = 6 + rnd() * 40;
      g.fillStyle = rnd() < .7 ? `rgba(80,70,55,${.04 + rnd() * .07})` : `rgba(255,255,255,${.05 + rnd() * .08})`;
      g.beginPath(); g.ellipse(x, y, r, r * (.4 + rnd()), rnd() * 3, 0, Math.PI * 2); g.fill();
    }
    // water streaks under sills
    WINDOWS.forEach(([a, , c, d]) => { const grad = g.createLinearGradient(0, d + 16, 0, d + 80); grad.addColorStop(0, 'rgba(70,60,45,.22)'); grad.addColorStop(1, 'rgba(70,60,45,0)'); g.fillStyle = grad; g.fillRect(a + 6, d + 16, c - a - 12, 64); });
    g.restore();
  };

  const resetLayers = () => {
    SURFACES.forEach((s) => {
      const l = layers.get(s.id);
      l.c.width = canvas.width; l.c.height = canvas.height;
      l.x.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      weather(l, s);
      s.color = null;
    });
  };

  const resize = () => {
    const w = host.clientWidth;
    dpr = Math.min(devicePixelRatio || 1, 2);
    scale = w / VW;
    // only carry paint over if the layer has been set up before (a fresh canvas is 300×150, not blank-but-painted)
    const oldLayers = [...layers.values()].map((l) => (l.ready ? l.c : null));
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * VH / VW * dpr);
    SURFACES.forEach((s, i) => {
      const l = layers.get(s.id);
      const old = oldLayers[i];
      const copy = old ? (() => { const t = document.createElement('canvas'); t.width = old.width; t.height = old.height; t.getContext('2d').drawImage(old, 0, 0); return t; })() : null;
      l.c.width = canvas.width; l.c.height = canvas.height;
      l.x.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      if (copy) { l.x.save(); l.x.setTransform(1, 0, 0, 1, 0, 0); l.x.drawImage(copy, 0, 0, canvas.width, canvas.height); l.x.restore(); }
      else weather(l, s);
      l.ready = true;
    });
    dirty = true;
  };

  let dirty = true;
  let showBefore = false;
  const beforeLayers = new Map();
  const render = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    SURFACES.forEach((s) => ctx.drawImage((showBefore ? beforeLayers.get(s.id) : layers.get(s.id)).c, 0, 0));
    // light falls from the upper left; the walls round off toward the right
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.save();
    const all = new Path2D(SURFACES[0].path + SURFACES[1].path);
    ctx.clip(all);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(100, 140, 1100, 620);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#f1ede6'); g.addColorStop(1, '#d8d1c6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.restore();
    dirty = false;
  };
  const loop = () => { requestAnimationFrame(loop); if (dirty) render(); };

  /* ---------- the roller ---------- */
  const cursor = document.createElement('div');
  cursor.className = 'roller-cursor';
  cursor.innerHTML = '<i class="rc-cover"></i><i class="rc-arm"></i><i class="rc-handle"></i>';
  host.appendChild(cursor);

  let surface = SURFACES[0];
  let color = byName['Cabrillo White'];
  const setCursorColor = () => cursor.style.setProperty('--paint', color.hex);

  const stamp = (l, x, y, hex, ang) => {
    const g = l.x;
    g.save();
    g.clip(surface === null ? new Path2D() : currentClip);
    g.translate(x, y);
    g.rotate(ang);
    g.fillStyle = hex;
    g.fillRect(-55, -9, 110, 18);
    // roller stipple: slightly lighter and darker flecks so it reads as paint
    for (let i = 0; i < 10; i++) {
      g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)';
      g.fillRect(-55 + Math.random() * 110, -9 + Math.random() * 18, 2 + Math.random() * 5, 1 + Math.random() * 2);
    }
    // a wet, slightly ragged leading edge
    g.fillStyle = hex;
    for (let i = -55; i < 55; i += 6) g.fillRect(i, -11 + Math.random() * 3, 6, 3);
    g.restore();
  };
  let currentClip = surface.p2d;

  const strokeTo = (from, to) => {
    const l = layers.get(surface.id);
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 5));
    // the roller cylinder stays perpendicular to the direction of travel
    const ang = dist > .5 ? Math.atan2(dy, dx) + Math.PI / 2 : 0;
    for (let i = 1; i <= steps; i++) stamp(l, from[0] + dx * i / steps, from[1] + dy * i / steps, color.hex, ang);
    surface.color = color;
    dirty = true;
    updateRecipe();
  };

  const toView = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * VH]; };
  const moveCursor = (e) => {
    const r = host.getBoundingClientRect();
    cursor.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
  };
  let last = null;
  const hint = document.querySelector('[data-studio-hint]');
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); last = toView(e); strokeTo(last, [last[0], last[1] + .1]); hint.classList.add('gone'); cursor.classList.add('down'); });
  canvas.addEventListener('pointermove', (e) => { moveCursor(e); if (!last) return; const p = toView(e); strokeTo(last, p); last = p; });
  const end = () => { last = null; cursor.classList.remove('down'); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerenter', () => cursor.classList.add('on'));
  canvas.addEventListener('pointerleave', () => cursor.classList.remove('on'));

  /* ---------- automatic rolling: passes across the surface ---------- */
  const bbox = (s) => {
    const nums = s.path.match(/-?\d+(\.\d+)?/g).map(Number);
    const xs = [], ys = [];
    // good enough: sample the absolute coordinates that appear as pairs
    const re = /([MLHVQAZ])([^MLHVQAZ]*)/gi; let m, cx = 0, cy = 0;
    while ((m = re.exec(s.path))) {
      const v = (m[2].match(/-?\d+(\.\d+)?/g) || []).map(Number);
      const c = m[1];
      if (c === 'M' || c === 'L') { cx = v[0]; cy = v[1]; }
      else if (c === 'H') cx = v[0]; else if (c === 'V') cy = v[0];
      else if (c === 'h') cx += v[0]; else if (c === 'v') cy += v[0];
      else if (c === 'Q') { cx = v[2]; cy = v[3]; } else if (c === 'A') { cx = v[5]; cy = v[6]; }
      xs.push(cx); ys.push(cy);
    }
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys) - 60, y1: Math.max(...ys) };
  };

  let busy = Promise.resolve();
  const autoRoll = (s, c, ms = 1100) => {
    busy = busy.then(() => new Promise((resolve) => {
      surface = s; currentClip = s.p2d; color = c; setCursorColor(); syncUi();
      const b = bbox(s);
      const lane = 80;
      const lanes = Math.max(1, Math.ceil((b.x1 - b.x0) / lane));
      const pts = [];
      for (let i = 0; i <= lanes; i++) {
        const x = b.x0 + i * lane + lane / 2;
        const down = i % 2 === 0;
        pts.push([x, down ? b.y0 : b.y1], [x, down ? b.y1 : b.y0]);
      }
      if (reduce) { for (let i = 1; i < pts.length; i++) strokeTo(pts[i - 1], pts[i]); return resolve(); }
      const total = pts.length - 1;
      const start = performance.now();
      let prev = pts[0];
      cursor.classList.add('on', 'auto');
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms) * total;
        const i = Math.max(0, Math.min(total - 1, Math.floor(t)));
        const k = Math.min(1, t - i);
        if (!pts[i] || !pts[i + 1]) { cursor.classList.remove('auto'); return resolve(); }
        const p = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
        strokeTo(prev, p); prev = p;
        const r = canvas.getBoundingClientRect(), hr = host.getBoundingClientRect();
        cursor.style.transform = `translate(${r.left - hr.left + p[0] / VW * r.width}px, ${r.top - hr.top + p[1] / VH * r.height}px)`;
        if (t < total) requestAnimationFrame(step);
        else { cursor.classList.remove('auto'); resolve(); }
      };
      requestAnimationFrame(step);
    }));
    return busy;
  };

  /* ---------- UI ---------- */
  const surfacesEl = document.querySelector('[data-surfaces]');
  const swatchesEl = document.querySelector('[data-swatches]');
  const swatchName = document.querySelector('[data-swatch-name]');
  surfacesEl.innerHTML = SURFACES.map((s) => `<button type="button" role="radio" data-surface="${s.id}">${s.label}</button>`).join('');
  swatchesEl.innerHTML = COLORS.map((c) => `<button type="button" role="radio" class="swatch" style="--c:${c.hex}" data-color="${c.name}" aria-label="${c.name}"></button>`).join('');
  const syncUi = () => {
    surfacesEl.querySelectorAll('button').forEach((b) => { const on = b.dataset.surface === surface.id; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    swatchesEl.querySelectorAll('button').forEach((b) => { const on = b.dataset.color === color.name; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    swatchName.innerHTML = `<i style="background:${color.hex}"></i>${color.name}`;
  };
  surfacesEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; surface = SURFACES.find((s) => s.id === b.dataset.surface); currentClip = surface.p2d; syncUi(); });
  swatchesEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; color = byName[b.dataset.color]; setCursorColor(); syncUi(); });

  const LOOKS = [
    { name: 'Spanish revival', set: { body: 'Cabrillo White', trim: 'Gaslamp Black', garage: 'Mission Oak Stain', door: 'Mission Oak Stain' } },
    { name: 'Coastal cottage', set: { body: 'Torrey Mist', trim: 'Cabrillo White', garage: 'Cabrillo White', door: 'La Jolla Cove' } },
    { name: 'Desert modern', set: { body: 'Coronado Sand', trim: 'Mission Olive', garage: 'Mission Olive', door: 'Sunset Cliffs Coral' } },
    { name: 'Harbor navy', set: { body: 'Point Loma Navy', trim: 'Cabrillo White', garage: 'Cabrillo White', door: 'Old Town Adobe' } },
  ];
  const looksEl = document.querySelector('[data-looks]');
  looksEl.innerHTML = LOOKS.map((l, i) => `<button type="button" data-look="${i}">${Object.values(l.set).map((n) => `<i style="background:${byName[n].hex}"></i>`).join('')}<span>${l.name}</span></button>`).join('');
  looksEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    hint.classList.add('gone');
    const look = LOOKS[+b.dataset.look];
    SURFACES.forEach((s) => autoRoll(s, byName[look.set[s.id]], s.id === 'body' ? 1300 : 700));
  });
  document.querySelector('[data-fill]').addEventListener('click', () => { hint.classList.add('gone'); autoRoll(surface, color); });
  document.querySelector('[data-reset]').addEventListener('click', () => { resetLayers(); dirty = true; updateRecipe(); });

  const compare = document.querySelector('[data-compare]');
  const holdOn = () => { showBefore = true; dirty = true; compare.setAttribute('aria-pressed', 'true'); };
  const holdOff = () => { showBefore = false; dirty = true; compare.setAttribute('aria-pressed', 'false'); };
  compare.addEventListener('pointerdown', holdOn);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => compare.addEventListener(ev, holdOff));
  compare.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); holdOn(); } });
  compare.addEventListener('keyup', holdOff);

  /* ---------- the recipe follows the visitor to the quote form ---------- */
  const recipeEl = document.querySelector('[data-recipe]');
  const recipeCopy = document.querySelector('[data-recipe-copy]');
  const recipeField = document.querySelector('[data-recipe-field]');
  const updateRecipe = () => {
    const used = SURFACES.filter((s) => s.color);
    const html = used.map((s) => `<li><i style="background:${s.color.hex}"></i><b>${s.label}</b> ${s.color.name}</li>`).join('');
    recipeEl.innerHTML = html || '<li class="empty">Roll some paint and your colors appear here.</li>';
    if (recipeCopy) { recipeCopy.innerHTML = html; recipeField.hidden = !used.length; }
    window.lsdRecipe = used.map((s) => `${s.label}: ${s.color.name}`);
  };

  /* ---------- go ---------- */
  new ResizeObserver(resize).observe(host);
  resize();
  // keep a clean "before" set for the compare button
  SURFACES.forEach((s) => { const l = makeLayer(); beforeLayers.set(s.id, l); });
  const buildBefore = () => SURFACES.forEach((s) => { const l = beforeLayers.get(s.id); l.c.width = canvas.width; l.c.height = canvas.height; l.x.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0); weather(l, s); });
  buildBefore();
  new ResizeObserver(buildBefore).observe(host);
  setCursorColor(); syncUi(); updateRecipe();
  requestAnimationFrame(loop);

  window.lsdStudio = { autoRoll, SURFACES, byName, LOOKS };
})();
