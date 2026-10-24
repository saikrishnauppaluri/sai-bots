import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { BOTS, CATEGORIES } from './data.js';

gsap.registerPlugin(ScrollTrigger);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? '';
$('#year').textContent = new Date().getFullYear();

/* ---------- glyphs (each bot's avatar shape) ---------- */
function glyph(shape, color, id) {
  const g = `g-${id}-${Math.random().toString(36).slice(2, 7)}`;
  const paths = {
    hex: '<path d="M32 4 56 18v28L32 60 8 46V18z"/>',
    cloud: '<path d="M20 50a12 12 0 0 1-1.5-23.9A15 15 0 0 1 47 24a11 11 0 0 1-1 26z"/>',
    squircle: '<path d="M32 6c20 0 26 6 26 26s-6 26-26 26S6 52 6 32 12 6 32 6z"/>',
    capsule: '<rect x="6" y="18" width="52" height="28" rx="14"/>',
    dome: '<path d="M8 52V34a24 24 0 0 1 48 0v18z"/>',
    tablet: '<rect x="14" y="6" width="36" height="52" rx="9"/>',
  };
  return `<svg class="glyph" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".55"/></linearGradient></defs><g fill="url(#${g})">${paths[shape] || paths.squircle}</g><circle cx="25" cy="31" r="3.2" fill="#0a0a0f"/><circle cx="39" cy="31" r="3.2" fill="#0a0a0f"/></svg>`;
}

/* ---------- render: marquee, filters, cards ---------- */
const marq = $('#marquee');
const marqItems = BOTS.map((b) => `<span><i style="background:${b.color}"></i><b>${esc(b.name)}</b></span>`).join('');
marq.innerHTML = marqItems + marqItems + marqItems;

const filters = $('#filters');
filters.innerHTML = CATEGORIES.map((c) => {
  const n = c.id === 'all' ? BOTS.length : BOTS.filter((b) => b.cat === c.id).length;
  return `<button class="filter" role="tab" data-cat="${c.id}" aria-selected="${c.id === 'all'}">${c.label}<span class="count">${n}</span></button>`;
}).join('');

const grid = $('#grid');
grid.innerHTML = BOTS.map((b) => `
  <article class="card" data-id="${b.id}" data-cat="${b.cat}" style="--c:${b.color}">
    <div class="card-top">${glyph(b.shape, b.color, b.id)}<span class="tag">${catLabel(b.cat)}</span></div>
    <h3>${esc(b.name)}</h3>
    <p>${esc(b.tagline)}</p>
    <div class="card-foot">
      <a class="card-open" href="${b.url}" target="_blank" rel="noopener" aria-label="Open the ${esc(b.name)} bot template (opens in a new tab)">Open bot <span aria-hidden="true">&#8599;</span></a>
      <button type="button" class="card-more" aria-label="How ${esc(b.name)} works">How it works <span class="arrow" aria-hidden="true">&rarr;</span></button>
    </div>
  </article>`).join('');

/* ---------- quick links: all bots ---------- */
$('#quick-list').innerHTML = BOTS.map((b) => `
  <li style="--c:${b.color}">
    <a class="ql" href="${b.url}" target="_blank" rel="noopener">
      <i aria-hidden="true"></i>
      <span class="ql-text"><b>${esc(b.name)}</b><span>${esc(b.tagline)}</span></span>
      <span class="ql-go">Open bot <span aria-hidden="true">&#8599;</span></span>
    </a>
  </li>`).join('');

/* ---------- modal ---------- */
const modal = $('#modal');
const panel = $('.modal-panel', modal);
const body = $('#modal-body');
let lastFocus = null;
let lenis = null;

function openBot(id, push = true) {
  const b = BOTS.find((x) => x.id === id);
  if (!b) return;
  lastFocus = document.activeElement;
  panel.style.setProperty('--c', b.color);
  body.innerHTML = `
    <div class="m-head">${glyph(b.shape, b.color, b.id + 'm')}<div><p class="eyebrow" style="margin:0 0 8px">${catLabel(b.cat)}</p><h2 id="modal-title">${esc(b.name)}</h2></div></div>
    <p class="m-tagline m-in">${esc(b.tagline)}</p>
    <p class="m-what m-in">${esc(b.what)}</p>
    <div class="m-grid">
      <div class="m-box m-in"><h4>Who it is for</h4><p>${esc(b.who)}</p></div>
      <div class="m-box m-in"><h4>What it does</h4><p>${esc(b.summary)}</p></div>
      <div class="m-box wide m-in"><h4>How it works</h4><ol class="steps">${b.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
      <div class="m-box m-in"><h4>What you get</h4><ul class="ticks">${b.get.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="m-box m-in"><h4>Guardrails</h4><ul class="ticks rules">${b.rules.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    </div>
    <div class="m-actions m-in">
      <a class="btn btn-primary" href="${b.url}" target="_blank" rel="noopener"><span>Use this template</span></a>
      ${b.id === 'plan-to-3d' ? '<a class="btn btn-ghost" href="https://github.com/saikrishnauppaluri/plan-to-3d" target="_blank" rel="noopener"><span>Plugin on GitHub</span></a>' : ''}
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
  if (push) history.replaceState(null, '', '#bot-' + b.id);
  panel.scrollTop = 0;
  if (reduce) {
    gsap.set('.modal-backdrop', { opacity: 1 });
  } else {
    gsap.timeline()
      .to('.modal-backdrop', { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(panel, { y: 60, opacity: 0, scale: 0.96, rotateX: 6 }, { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.7, ease: 'expo.out' }, 0)
      .fromTo($('.m-head .glyph', body), { scale: 0.4, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(2)' }, 0.1)
      .fromTo($$('.m-in', body), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.15)
      .fromTo($$('.steps li', body), { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 0.35);
  }
  panel.focus();
}
function closeBot() {
  if (!modal.classList.contains('open')) return;
  const done = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    lenis?.start();
    history.replaceState(null, '', location.pathname + location.search);
    lastFocus?.focus?.();
  };
  if (reduce) { gsap.set('.modal-backdrop', { opacity: 0 }); done(); return; }
  gsap.timeline({ onComplete: done })
    .to(panel, { y: 40, opacity: 0, scale: 0.97, duration: 0.35, ease: 'power2.in' }, 0)
    .to('.modal-backdrop', { opacity: 0, duration: 0.35 }, 0.05);
}
modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeBot(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBot();
  if (e.key === 'Tab' && modal.classList.contains('open')) {
    const f = $$('a,button', panel); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
grid.addEventListener('click', (e) => {
  if (e.target.closest('a')) return; // "Open bot" goes straight to the template
  const c = e.target.closest('.card'); if (c) openBot(c.dataset.id);
});

/* ---------- filters ---------- */
filters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter'); if (!btn) return;
  $$('.filter', filters).forEach((f) => f.setAttribute('aria-selected', String(f === btn)));
  const cat = btn.dataset.cat;
  const cards = $$('.card', grid);
  const show = cards.filter((c) => cat === 'all' || c.dataset.cat === cat);
  const apply = () => {
    cards.forEach((c) => c.classList.toggle('hidden', !show.includes(c)));
    ScrollTrigger.refresh();
  };
  if (reduce) { apply(); return; }
  gsap.to(cards, { opacity: 0, y: 16, scale: 0.98, duration: 0.22, stagger: 0.015, ease: 'power2.in', onComplete: () => {
    apply();
    gsap.fromTo(show, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.06, ease: 'expo.out', clearProps: 'transform' });
  } });
});

/* ---------- split text helpers ---------- */
function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = [...text].map((c) => c === ' ' ? ' ' : `<span class="ch">${esc(c)}</span>`).join('');
  return $$('.ch', el);
}
function splitWords(el) {
  const label = el.textContent;
  el.setAttribute('aria-label', label);
  el.innerHTML = label.split(' ').map((w) => `<span class="w" aria-hidden="true"><span>${esc(w)}</span></span>`).join(' ');
  return $$('.w>span', el);
}

/* ---------- hero canvas ---------- */
function heroCanvas() {
  const cv = $('#hero-canvas');
  const ctx = cv.getContext('2d');
  let w, h, dpr, nodes = [], dust = [], mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, t = 0, running = true, raf;
  const colors = BOTS.map((b) => b.color);
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = Math.min(w, h) * (w < 700 ? 0.5 : 0.36);
    nodes = colors.map((c, i) => ({ c, a: (i / colors.length) * Math.PI * 2, r: R * (0.75 + (i % 3) * 0.18), s: 0.00018 + (i % 4) * 0.00006, z: 0.6 + (i % 3) * 0.25, size: 5 + (i % 3) * 2.5 }));
    const n = Math.round(Math.min(160, (w * h) / 9000));
    dust = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15 }));
  }
  function frame(dt) {
    t += dt;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2 + (mx - 0.5) * 60, cy = h / 2 + (my - 0.5) * 40;
    // aurora blobs
    for (let i = 0; i < 3; i++) {
      const bx = cx + Math.cos(t * 0.00012 + i * 2.1) * w * 0.25;
      const by = cy + Math.sin(t * 0.00016 + i * 1.7) * h * 0.2;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(w, h) * 0.45);
      const col = ['rgba(255,106,61,', 'rgba(124,92,255,', 'rgba(34,211,238,'][i];
      g.addColorStop(0, col + '0.16)'); g.addColorStop(1, col + '0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    // dust
    for (const p of dust) {
      p.x += p.vx + (mx - 0.5) * p.z * 0.4; p.y += p.vy + (my - 0.5) * p.z * 0.3;
      if (p.x < 0) p.x += w; if (p.x > w) p.x -= w; if (p.y < 0) p.y += h; if (p.y > h) p.y -= h;
      ctx.fillStyle = `rgba(255,255,255,${0.12 + p.z * 0.35})`;
      ctx.fillRect(p.x, p.y, 1 + p.z * 1.2, 1 + p.z * 1.2);
    }
    // orbit rings
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (const k of [0.75, 0.93, 1.11]) { ctx.beginPath(); ctx.ellipse(cx, cy, Math.min(w, h) * 0.36 * k, Math.min(w, h) * 0.36 * k * 0.42, 0, 0, Math.PI * 2); ctx.stroke(); }
    // nodes
    const pts = nodes.map((n) => {
      const a = n.a + t * n.s;
      const x = cx + Math.cos(a) * n.r, y = cy + Math.sin(a) * n.r * 0.42;
      return { x, y, c: n.c, size: n.size * (0.8 + 0.4 * (Math.sin(a) + 1) / 2), depth: (Math.sin(a) + 1) / 2 };
    });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      const max = Math.min(w, h) * 0.5;
      if (d < max) { ctx.strokeStyle = `rgba(255,255,255,${(1 - d / max) * 0.14})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    pts.sort((a, b) => a.depth - b.depth).forEach((p) => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
      g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = (w < 700 ? 0.18 : 0.35) + p.depth * 0.4; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
  }
  let last = performance.now();
  function loop(now) { frame(Math.min(now - last, 50)); last = now; if (running) raf = requestAnimationFrame(loop); }
  size();
  window.addEventListener('resize', size);
  if (reduce) { frame(0); return; }
  window.addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; });
  new IntersectionObserver(([en]) => { const vis = en.isIntersecting; if (vis && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } else if (!vis) { running = false; cancelAnimationFrame(raf); } }).observe(cv);
  raf = requestAnimationFrame(loop);
}
heroCanvas();

/* ---------- motion ---------- */
if (!reduce) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: id === '#top' ? 0 : -40, duration: 1.4 });
  }));

  // progress bar
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  // hero intro
  const chars = $$('.hero-title .split').flatMap(splitChars);
  gsap.timeline({ delay: 0.15 })
    .from(chars, { yPercent: 110, rotate: 8, duration: 1.1, stagger: 0.025, ease: 'expo.out' })
    .from('.hero .reveal-up', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 0.35)
    .from('.nav', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.2);
  gsap.to('.hero-inner', { yPercent: 25, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#hero-canvas', { scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // marquee, speed reacts to scroll velocity
  const mq = gsap.to('#marquee', { xPercent: -33.333, duration: 30, ease: 'none', repeat: -1 });
  let boost = gsap.quickTo(mq, 'timeScale', { duration: 0.6 });
  lenis.on('scroll', ({ velocity }) => { boost(1 + Math.min(Math.abs(velocity) * 0.25, 5) * Math.sign(velocity || 1)); clearTimeout(window.__mq); window.__mq = setTimeout(() => boost(1), 120); });

  // section titles
  $$('.split-words').forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, { yPercent: 105, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.section-sub').forEach((el) => {
    gsap.from(el, { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.from('.filter', { y: 20, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', scrollTrigger: { trigger: '#filters', start: 'top 90%' } });

  // cards: staggered entrance per row
  // cards and quick links: motion only, never hidden. Links stay visible even if ScrollTrigger never fires.
  ScrollTrigger.batch('.card, .quick li', {
    start: 'top 95%', once: true,
    onEnter: (els) => gsap.from(els, { y: 40, duration: 0.9, stagger: 0.06, ease: 'expo.out', clearProps: 'transform' }),
  });

  // principles
  ScrollTrigger.batch('.principle', { start: 'top 90%', once: true, onEnter: (els) => gsap.from(els, { y: 50, duration: 0.9, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' }) });


  // card hover glow + tilt
  if (fine) {
    $$('.card').forEach((c) => {
      const rx = gsap.quickTo(c, 'rotateX', { duration: 0.5, ease: 'power3' });
      const ry = gsap.quickTo(c, 'rotateY', { duration: 0.5, ease: 'power3' });
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
        rx((0.5 - py) * 8); ry((px - 0.5) * 10);
      });
      c.addEventListener('pointerleave', () => { rx(0); ry(0); });
      gsap.set(c, { transformPerspective: 900 });
    });

    // magnetic buttons
    $$('.magnetic').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.35); });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });

    // cursor
    const cur = $('.cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { cur.classList.add('on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerover', (e) => cur.classList.toggle('big', !!e.target.closest('.card')));
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
  }
}

/* failsafe: if any reveal is still hidden after load (ScrollTrigger skipped, tab in background, etc.), show it */
function unhide() {
  $$('.reveal-up, .section-sub, .filter, .card, .quick li, .principle, .nav, .split-words .w>span, .hero-title .ch').forEach((el) => {
    if (parseFloat(getComputedStyle(el).opacity) < 0.99 && !el.closest('.hero-inner[style*="opacity"]')) gsap.set(el, { opacity: 1, y: 0, yPercent: 0, rotate: 0 });
  });
}
window.addEventListener('load', () => setTimeout(unhide, 2500));
setTimeout(unhide, 5000);

/* deep link: #bot-<id> */
const deep = location.hash.match(/^#bot-(.+)$/);
if (deep) setTimeout(() => openBot(deep[1], false), reduce ? 0 : 600);
