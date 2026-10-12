/* Local San Diego Painting — motion */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

  /* ---------- nav ---------- */
  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });

  /* =========================================================
     HERO — one roller pass paints the page, then the tape comes off
     ========================================================= */
  const hero = $('.hero');
  const painted = $('[data-painted]');
  const roller = $('[data-roller]');
  const tapes = $$('[data-tape]');
  const coat = $('[data-coat]');
  // a ragged, slightly drippy wet edge, fixed per load so it doesn't shimmer
  const EDGE = Array.from({ length: 64 }, (_, i) => ({ j: Math.random() * 10 - 5, drip: Math.random() < .12 ? 8 + Math.random() * 46 : 0 }));

  const renderHero = (p) => {
    const H = hero.querySelector('.hero-stage').clientHeight;
    const roll = smooth(p / .82);
    const edgeY = -30 + roll * (H + 90);
    const pts = ['0% 0%', '100% 0%'];
    for (let i = EDGE.length - 1; i >= 0; i--) {
      const x = (i / (EDGE.length - 1)) * 100;
      pts.push(`${x.toFixed(2)}% ${(edgeY + EDGE[i].j + EDGE[i].drip * roll).toFixed(1)}px`);
    }
    painted.style.clipPath = `polygon(${pts.join(',')})`;
    roller.style.transform = `translateY(${edgeY - 26}px)`;
    roller.style.opacity = p > .84 ? Math.max(0, 1 - (p - .84) / .08) : 1;
    coat.textContent = roll >= 1 ? 'Done · cleaned up' : roll > 0 ? 'Rolling coat 1' : 'Primed and taped';
    // tape peels away from one corner once the paint is on
    const peel = smooth((p - .84) / .14);
    tapes.forEach((t, i) => {
      const dir = [[1, -1], [-1, 1], [-1, -1], [1, 1]][i];
      t.style.transform = peel ? `translate(${dir[0] * peel * 140}px, ${dir[1] * peel * 120}px) rotate(${dir[0] * peel * 18}deg)` : '';
      t.style.opacity = 1 - peel;
    });
    hero.classList.toggle('done', roll >= 1);
  };

  /* =========================================================
     PROCESS — one patch of wall, from tired to finished
     ========================================================= */
  const wall = $('[data-wall]');
  const wallCanvas = $('.wall-canvas');
  const wctx = wallCanvas.getContext('2d');
  const wallLabel = $('[data-wall-label]');
  const steps = $$('[data-steps] li');
  let WW = 1, WH = 1;
  const seedRand = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const fitWall = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    WW = wall.clientWidth; WH = wall.clientHeight;
    wallCanvas.width = WW * d; wallCanvas.height = WH * d;
    wctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const renderWall = (p) => {
    const r = seedRand(42);
    const stage = Math.min(4, Math.floor(p * 5));
    const local = clamp(p * 5 - stage);
    wctx.clearRect(0, 0, WW, WH);
    // weathered stucco
    wctx.fillStyle = '#c8bda8'; wctx.fillRect(0, 0, WW, WH);
    for (let i = 0; i < 220; i++) { wctx.fillStyle = r() < .6 ? `rgba(70,60,45,${r() * .08})` : `rgba(255,255,255,${r() * .1})`; wctx.beginPath(); wctx.arc(r() * WW, r() * WH, 3 + r() * 30, 0, 7); wctx.fill(); }
    const cracks = Array.from({ length: 5 }, () => { const x = r() * WW, y = r() * WH; return [[x, y], ...Array.from({ length: 6 }, (_, k) => [x + (r() - .3) * 40 * (k + 1), y + (r() - .5) * 26 * (k + 1)])]; });
    const patches = cracks.map((c) => c[2]);
    const drawCracks = (alpha) => { wctx.strokeStyle = `rgba(60,48,36,${alpha})`; wctx.lineWidth = 1.6; cracks.forEach((c) => { wctx.beginPath(); c.forEach(([x, y], i) => (i ? wctx.lineTo(x, y) : wctx.moveTo(x, y))); wctx.stroke(); }); };
    drawCracks(stage >= 2 ? Math.max(0, .7 - local * .7) * (stage === 2 ? 1 : 0) : .7);
    // 02 protect: tape on the edges, plastic over the floor
    if (stage >= 1) {
      const t = stage === 1 ? smooth(local / .7) : 1;
      wctx.fillStyle = '#3d7bd9';
      wctx.fillRect(0, 0, WW * t, 18); wctx.fillRect(WW - 18, 0, 18, WH * t);
      wctx.fillStyle = 'rgba(220,235,245,.55)'; wctx.fillRect(0, WH - 46 * t, WW, 46 * t);
    }
    // 03 prep: spackle on the cracks, then primer rolled over everything
    if (stage >= 2) {
      const t = stage === 2 ? local : 1;
      wctx.fillStyle = '#f2efe9';
      patches.forEach(([x, y], i) => { if (t > i / patches.length * .5) { wctx.beginPath(); wctx.ellipse(x, y, 54, 30, .3, 0, 7); wctx.fill(); } });
      const pw = smooth((t - .45) / .55) * WW;
      wctx.fillStyle = '#ece8e0'; wctx.fillRect(18, 18, Math.max(0, pw - 18), WH - 64);
    }
    // 04 paint: two coats of the finish color
    if (stage >= 3) {
      const t = stage === 3 ? local : 1;
      const ph = smooth(t) * (WH - 64);
      wctx.fillStyle = '#5b95aa'; wctx.fillRect(18, 18, WW - 36, ph);
      if (ph > 0 && ph < WH - 64) { wctx.fillStyle = '#5b95aa'; for (let x = 18; x < WW - 18; x += 8) wctx.fillRect(x, 18 + ph, 8, 2 + Math.sin(x * .3) * 3 + 3); }
    }
    // 05 walkthrough: tape off, plastic gone, a raking light passes over
    if (stage >= 4) {
      wctx.clearRect(0, 0, WW, WH);
      wctx.fillStyle = '#5b95aa'; wctx.fillRect(0, 0, WW, WH);
      const lx = (-.3 + local * 1.6) * WW;
      const g = wctx.createLinearGradient(lx - 160, 0, lx + 160, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      wctx.fillStyle = g; wctx.fillRect(0, 0, WW, WH);
    }
    const labels = ['Weathered stucco', 'Taped and covered', 'Patched and primed', 'Two coats · La Jolla Cove', 'Done right the first time'];
    wallLabel.textContent = labels[stage];
    steps.forEach((s, i) => s.classList.toggle('is-on', i === stage));
  };

  /* =========================================================
     FOOTER — wet paint you can touch
     ========================================================= */
  const footer = $('[data-drips]');
  const dc = $('.drip-canvas');
  const dctx = dc.getContext('2d');
  let FW = 1, FH = 1, FD = 1;
  const fitFooter = () => { FD = Math.min(devicePixelRatio || 1, 2); FW = footer.clientWidth; FH = footer.clientHeight; dc.width = FW * FD; dc.height = FH * FD; dctx.setTransform(FD, 0, 0, FD, 0, 0); band = false; };
  const PALETTE = ['#d8372b', '#1f4fd8', '#5b95aa', '#dc7c5f', '#24334f', '#e6d6b8'];
  const pickColor = () => {
    const recipe = window.lsdStudio && window.lsdStudio.SURFACES.filter((s) => s.color).map((s) => s.color.hex);
    const visible = (hex) => { const n = parseInt(hex.slice(1), 16); return (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255 < .78; };
    const pool = (recipe && recipe.length ? recipe.concat(['#d8372b']) : PALETTE).filter(visible);
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const drips = [];
  const spawn = (x, y, color, size = 1) => {
    dctx.fillStyle = color;
    dctx.beginPath(); dctx.arc(x, y, 9 * size + Math.random() * 8 * size, 0, 7); dctx.fill();
    for (let i = 0; i < 3; i++) { dctx.beginPath(); dctx.arc(x + (Math.random() - .5) * 40 * size, y + (Math.random() - .5) * 30 * size, 2 + Math.random() * 4, 0, 7); dctx.fill(); }
    if (Math.random() < .75) drips.push({ x: x + (Math.random() - .5) * 10, y, r: 3 + Math.random() * 4 * size, v: 10 + Math.random() * 30, life: 1.4 + Math.random() * 3, color });
  };
  let band = false;
  const paintBand = () => {
    // a freshly painted stripe along the top edge, already starting to run
    const c = '#d8372b';
    dctx.fillStyle = c;
    dctx.fillRect(0, 0, FW, 26);
    for (let x = 6; x < FW; x += 18 + Math.random() * 40) {
      dctx.beginPath(); dctx.arc(x, 26, 6 + Math.random() * 6, 0, 7); dctx.fill();
      if (Math.random() < .55) drips.push({ x, y: 30, r: 3 + Math.random() * 4, v: 8 + Math.random() * 22, life: 2 + Math.random() * 5, color: c });
    }
    band = true;
  };
  let lastSpawn = 0;
  footer.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastSpawn < 26) return;
    lastSpawn = now;
    const r = footer.getBoundingClientRect();
    spawn(e.clientX - r.left, e.clientY - r.top, pickColor(), .8);
  }, { passive: true });
  footer.addEventListener('pointerdown', (e) => { const r = footer.getBoundingClientRect(); const c = pickColor(); for (let i = 0; i < 4; i++) spawn(e.clientX - r.left + (Math.random() - .5) * 30, e.clientY - r.top + (Math.random() - .5) * 30, c, 1.6); }, { passive: true });
  let footerOn = false;
  new IntersectionObserver(([e]) => { footerOn = e.isIntersecting; if (footerOn && !band) paintBand(); }, { threshold: .15 }).observe(footer);
  let lastT = performance.now();
  const dripTick = (now) => {
    requestAnimationFrame(dripTick);
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    if (!footerOn || reduce) return;
    if (Math.random() < .02) spawn(Math.random() * FW, 40 + Math.random() * FH * .5, pickColor(), .7);
    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i];
      d.life -= dt;
      d.v = Math.min(70, d.v + 18 * dt) * (d.life < .6 ? .9 : 1);
      const ny = d.y + d.v * dt;
      dctx.strokeStyle = d.color; dctx.lineWidth = d.r * 2; dctx.lineCap = 'round';
      dctx.beginPath(); dctx.moveTo(d.x, d.y); dctx.lineTo(d.x + Math.sin(ny * .05) * .3, ny); dctx.stroke();
      d.y = ny; d.r *= 1 - dt * .05;
      if (d.life <= 0 || d.y > FH + 20) {
        dctx.fillStyle = d.color; dctx.beginPath(); dctx.arc(d.x, d.y, d.r * 1.35, 0, 7); dctx.fill();
        drips.splice(i, 1);
      }
    }
  };
  requestAnimationFrame(dripTick);

  /* =========================================================
     QUOTE FORM (front-end; see note in the report)
     ========================================================= */
  const form = $('[data-quote]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = $('[data-status]');
    const name = form.elements.name, phone = form.elements.phone;
    const ok = name.value.trim() && phone.value.replace(/\D/g, '').length >= 10;
    [name, phone].forEach((el) => el.closest('.field').classList.toggle('bad', !el.value.trim() || (el === phone && phone.value.replace(/\D/g, '').length < 10)));
    if (!ok) { status.textContent = 'Please add your name and a phone number we can call.'; status.classList.add('err'); return; }
    status.classList.remove('err');
    status.textContent = `Thanks, ${name.value.trim().split(' ')[0]}. Chad's team will call you to set up a free estimate.`;
    form.reset();
  });

  /* ---------- go ---------- */
  new ResizeObserver(fitWall).observe(wall); fitWall();
  new ResizeObserver(fitFooter).observe(footer); fitFooter();

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add('rm');
    renderHero(1); renderWall(.99);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const lenis = window.Lenis ? new Lenis({ lerp: .1 }) : null;
  window.__lenis = lenis;
  if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); const t = id === '#top' ? 0 : $(id);
    if (t === null) return; e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: id === '#top' ? 0 : -70, duration: 1.4 }) : t.scrollIntoView();
  }));

  renderHero(0);
  gsap.from('.hero-copy > *', { y: 30, opacity: 0, duration: 1.2, stagger: .1, ease: 'expo.out', delay: .15 });
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => renderHero(s.progress), onRefresh: (s) => renderHero(s.progress) });

  ScrollTrigger.create({ trigger: '.process', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => renderWall(s.progress * .999), onRefresh: (s) => renderWall(s.progress * .999) });

  // trust counter
  const counter = $('[data-count]');
  ScrollTrigger.create({ trigger: '.trust', start: 'top 85%', once: true, onEnter: () => {
    const o = { v: 0 };
    gsap.to(o, { v: +counter.dataset.count, duration: 2, ease: 'expo.out', onUpdate: () => { counter.textContent = Math.round(o.v).toLocaleString(); } });
  } });

  // the fan deck opens as it arrives
  const chips = $$('.chip');
  const fanTl = gsap.timeline({ scrollTrigger: { trigger: '.fan', start: 'top 85%', end: 'center 55%', scrub: 1 } });
  chips.forEach((c, i) => {
    const n = chips.length, k = i - (n - 1) / 2;
    fanTl.fromTo(c, { rotation: 0, x: 0, y: 40 }, { rotation: () => (innerWidth > 900 ? k * 7 : 0), x: () => (innerWidth > 900 ? k * 6 : 0), y: () => (innerWidth > 900 ? Math.abs(k) * Math.abs(k) * 6 : 0), ease: 'none' }, 0);
  });

  // the work strip drifts sideways
  const track = $('[data-work]');
  gsap.fromTo(track, { x: () => innerWidth * .05 }, { x: () => -(track.scrollWidth - innerWidth * .95), ease: 'none', scrollTrigger: { trigger: '.work', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });

  // neighborhood line art draws in left to right
  $$('.hood img').forEach((img, i) => gsap.fromTo(img, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power2.inOut', delay: i * .12, scrollTrigger: { trigger: '.hood-grid', start: 'top 80%', once: true } }));

  // section reveals
  $$('.kicker, h2, .lede, .family-photo, .quote-form').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // studio: roll a first look in when the visitor arrives, so it's obvious what it does
  ScrollTrigger.create({ trigger: '.studio-app', start: 'top 60%', once: true, onEnter: () => {
    const st = window.lsdStudio; if (!st) return;
    st.autoRoll(st.SURFACES[0], st.byName['Cabrillo White'], 1500);
  } });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
