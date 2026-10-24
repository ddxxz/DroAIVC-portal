(() => {
  'use strict';

  /* ============================================================
   * DroAIVC web portal
   * Static data + lazy galleries + interactive trajectory/GRN charts
   * ============================================================ */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const view = $('#view');
  const body = document.body;

  const S = {
    site: null,
    stats: null,
    atlas: null,
    virtual: null,
    interactive: null,
    allFigures: null,
    speciesByKey: new Map(),
    statsBySpecies: new Map(),
    moduleByKey: new Map(),
    tabByKey: new Map(),
    species: localStorage.getItem('droaivc.species') || 'all',
    speciesQuery: '',
    route: { name: 'home', module: null, tab: null },
    atlasModule: null,
    atlasCategory: 'all',
    atlasQuery: '',
    atlasLimit: 36,
    atlasKey: '',
    coverageMetric: 'cells',
    predictionSpecies: null,
    trajMode: 'latent',
    trajTime: 10,
    trajPlaying: false,
    trajTimer: null,
    trajChart: null,
    grnSelected: [],
    grnLimit: 12,
    patternCategory: 'all',
    pertGene: null,
    celloracleDataset: 'all',
    evalContext: 'all',
    gallery: { q: '', scope: 'all', module: 'all', species: 'auto', category: 'all', format: 'all', limit: 36 },
    figureLists: {},
    lightbox: { list: [], index: 0, format: '', zoom: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0 },
    command: { open: false, active: 0, results: [] },
    toastTimer: null,
    loadPromise: {},
  };

  const ICONS = {
    drop: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.7C9.1 6.9 5.8 10.1 5.8 14.1a6.2 6.2 0 0 0 12.4 0C18.2 10.1 14.9 6.9 12 2.7Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="14.3" r="2.2" fill="currentColor" opacity=".55"/></svg>',
    cell: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.4" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="14.6" cy="8.8" r=".9" fill="currentColor"/><circle cx="15.4" cy="14.8" r="1.4" fill="currentColor" opacity=".7"/><path d="M4.4 12.6c2 .6 3.2 1.8 4 3.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></svg>',
    network: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5" cy="6" r="2.1" stroke="currentColor" stroke-width="1.4"/><circle cx="19" cy="7" r="2.1" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="18" r="2.1" stroke="currentColor" stroke-width="1.4"/><path d="M7 7.2 17 7M6.3 8 11 16.2M17.7 8.7 13 16.2" stroke="currentColor" stroke-width="1.2" opacity=".7"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 15.5 10.5 11l3 2.6L20 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="m4 12 8 4.3 8-4.3M4 16.4l8 4.3 8-4.3" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" opacity=".7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2" stroke="currentColor" stroke-width="1.6"/><path d="m15.2 15.2 4.3 4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h5v17H7a2.5 2.5 0 0 0-2.5 2V5.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M19.5 5.5A2.5 2.5 0 0 0 17 3h-5v17h5a2.5 2.5 0 0 1 2.5 2V5.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity=".7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" fill="currentColor"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="6.4" height="6.4" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="13.6" y="4" width="6.4" height="6.4" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="4" y="13.6" width="6.4" height="6.4" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="13.6" y="13.6" width="6.4" height="6.4" rx="1.2" stroke="currentColor" stroke-width="1.4"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6M10 3v5.2L5.7 17a2.2 2.2 0 0 0 2 3.2h8.6a2.2 2.2 0 0 0 2-3.2L14 8.2V3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.2 15h9.6" stroke="currentColor" stroke-width="1.3" opacity=".7"/></svg>',
  };

  /* ---------------- utilities ---------------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtInt = (n) => Number(n || 0).toLocaleString('zh-CN');
  const compact = (n) => {
    n = Number(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e8 ? 1 : 1) + 'M';
    if (n >= 1e5) return (n / 1e3).toFixed(0) + 'k';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'k';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return String(n);
  };
  const pct = (n) => `${(Number(n || 0) * 100).toFixed(Number(n || 0) >= 0.1 ? 0 : 1)}%`;
  const fixed = (n, d = 2) => Number(n || 0).toFixed(d);
  const sci = (n) => {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
    const v = Number(n);
    if (v === 0) return '0';
    if (Math.abs(v) >= 0.01 && Math.abs(v) < 10000) return v.toFixed(3);
    return v.toExponential(2);
  };
  const signed = (n, d = 3) => {
    const v = Number(n);
    if (Number.isNaN(v)) return '—';
    return (v > 0 ? '+' : '') + v.toFixed(d);
  };
  const debounce = (fn, ms = 180) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };
  const encode = (s) => encodeURIComponent(String(s));
  const decode = (s) => { try { return decodeURIComponent(String(s)); } catch { return String(s); } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid = (() => { let i = 0; return (p = 'id') => `${p}-${++i}`; })();

  function toast(msg, ms = 2200) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function showTooltip(html, x, y) {
    const el = $('#tooltip');
    if (!el) return;
    el.innerHTML = html;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.classList.add('show');
  }
  function hideTooltip() {
    const el = $('#tooltip');
    if (el) el.classList.remove('show');
  }

  function signalClass(s) {
    const v = String(s || 'NONE').toUpperCase();
    return v === 'HIGH' ? 'signal-high' : v === 'LOW' ? 'signal-low' : 'signal-none';
  }
  function signalPill(s) {
    const v = String(s || 'NA').toUpperCase();
    const label = v === 'HIGH' ? 'HIGH · 高信号' : v === 'LOW' ? 'LOW · 低信号' : v === 'NONE' ? 'NONE · 无显著' : v;
    return `<span class="signal-pill ${esc(v)}"><span class="signal-dot ${signalClass(v)}"></span>${esc(label)}</span>`;
  }
  function speciesName(key) {
    if (key === 'all') return '全部物种';
    if (key === 'multi' || !key) return '跨物种';
    return S.speciesByKey.get(key)?.name || key;
  }
  function speciesLatin(key) {
    return S.speciesByKey.get(key)?.latin || '';
  }
  function speciesCode(key) {
    if (key === 'all') return 'ALL';
    if (key === 'multi') return '21';
    return S.speciesByKey.get(key)?.code || String(key || '').slice(0, 2).toUpperCase();
  }
  function organName(key) {
    if (!key) return '';
    const map = {
      root: '根', leaf: '叶', shoot: '地上部', shoot_apex: '茎尖', whole_seedling: '全苗',
      whole_plant: '全株', seedling: '幼苗', flower: '花', fruit: '果实', fruit_pod: '果荚',
      seed: '种子', embryo_seed: '胚/种子', embryo: '胚', ovule: '胚珠', fibre: '纤维',
      fiber: '纤维', anther: '花药', pollen: '花粉', callus: '愈伤组织', tuber: '块茎',
      stolon: '匍匐茎', nodule: '根瘤', hypocotyl: '下胚轴', stem: '茎', spike: '穗',
      root_and_leaf: '根和叶', tuber_stolon: '块茎/匍匐茎',
    };
    return map[key] || key.replaceAll('_', ' ');
  }
  function scopeName(rec) {
    if (rec.scope === 'virtual' || rec.module === 'virtual') {
      const tab = S.tabByKey.get(rec.tab);
      return `虚拟细胞 · ${tab?.name || rec.tab || ''}`;
    }
    return S.moduleByKey.get(rec.module)?.name || rec.module || '';
  }
  function modulesForScope() {
    return S.site?.atlas_modules || [];
  }
  function tabs() {
    return S.site?.virtual_tabs || [];
  }
  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }
  function hashFor(path) { return `#/${String(path).replace(/^#?\/?/, '')}`; }
  function go(path) {
    const h = hashFor(path);
    if (location.hash === h) renderRoute();
    else location.hash = h;
  }

  async function loadJSON(name) {
    if (S.loadPromise[name]) return S.loadPromise[name];
    S.loadPromise[name] = fetch(`data/${name}`).then((r) => {
      if (!r.ok) throw new Error(`${name}: ${r.status}`);
      return r.json();
    });
    return S.loadPromise[name];
  }
  async function ensureAtlas() { if (!S.atlas) S.atlas = await loadJSON('atlas.json'); return S.atlas; }
  async function ensureVirtual() { if (!S.virtual) S.virtual = await loadJSON('virtual.json'); return S.virtual; }
  async function ensureInteractive() { if (!S.interactive) S.interactive = await loadJSON('interactive.json'); return S.interactive; }
  async function ensureAllFigures() {
    if (S.allFigures) return S.allFigures;
    await Promise.all([ensureAtlas(), ensureVirtual()]);
    const list = [];
    for (const f of S.atlas.figures) list.push({ ...f, scope: 'atlas' });
    for (const f of S.virtual.figures) list.push({ ...f, scope: 'virtual' });
    list.sort((a, b) => {
      if (a.scope !== b.scope) return a.scope === 'atlas' ? -1 : 1;
      if (a.scope === 'atlas') return (a.sort || 0) - (b.sort || 0);
      return (a.sort || 0) - (b.sort || 0);
    });
    S.allFigures = list;
    return list;
  }

  /* ---------------- image helpers ---------------- */
  function thumbUrl(rec, w = 760) {
    if (rec.thumb) return rec.thumb;
    const base = rec.png || rec.jpg || rec.pdf || rec.svg || '';
    if (!base) return '';
    if (base.endsWith('.svg')) return base;
    return `/thumb/${base.replace(/^\//, '')}?w=${w}`;
  }
  function displaySrc(rec) {
    if (rec.png) return rec.png;
    if (rec.jpg) return rec.jpg;
    if (rec.svg) return rec.svg;
    if (rec.pdf) return `/thumb/${rec.pdf.replace(/^\//, '')}?w=900`;
    return '';
  }
  function fullSrc(rec) {
    return rec.png || rec.jpg || rec.svg || rec.pdf || '';
  }
  function formatLabel(rec) {
    if (!rec.formats) return '';
    return rec.formats.map((x) => x.toUpperCase()).join(' · ');
  }
  function figureBadge(rec) {
    if (rec.summary) return '<span class="fig-badge summary">汇总</span>';
    const fmts = rec.formats || [];
    if (fmts.includes('jpg')) return '<span class="fig-badge">JPG</span>';
    if (fmts.includes('png')) return '<span class="fig-badge">PNG</span>';
    if (fmts.includes('svg')) return '<span class="fig-badge">SVG</span>';
    if (fmts.includes('pdf')) return '<span class="fig-badge">PDF</span>';
    return '';
  }

  function figureCard(rec, listKey, index) {
    const species = rec.species || 'multi';
    const organ = rec.organ || '';
    const src = displaySrc(rec);
    const ar = clamp(Number(rec.ar) || 1.333, 0.9, 3.2);
    const img = src
      ? `<img src="${esc(thumbUrl(rec) || src)}" alt="${esc(rec.title)}" loading="lazy" decoding="async">`
      : `<div class="placeholder"><strong>无预览</strong><span>请打开原始文件</span></div>`;
    return `
      <article class="fig-card" data-fig-list="${esc(listKey)}" data-fig-index="${index}" tabindex="0" role="button" aria-label="打开图件：${esc(rec.title)}">
        <div class="fig-media ${!src ? 'noimg' : ''} ${ar > 2.2 ? 'wide' : ''}">
          <div class="fig-badges">${figureBadge(rec)}</div>
          ${img}
        </div>
        <div class="fig-body">
          <div class="fig-title">${esc(rec.title)}</div>
          <div class="fig-sub">
            <span class="sp">${esc(speciesName(species))}</span>
            ${organ ? `<span>· ${esc(organName(organ))}</span>` : ''}
            <span>· ${esc(rec.category || '')}</span>
          </div>
          <div class="fig-caption">${esc(rec.caption || '')}</div>
          <div class="fig-foot">
            <span class="fig-format">${esc(formatLabel(rec))}</span>
            <span class="fig-open">查看 ↗</span>
          </div>
        </div>
      </article>`;
  }

  function figureGrid(records, listKey, opts = {}) {
    S.figureLists[listKey] = records;
    if (!records.length) return `<div class="empty"><strong>暂无匹配图件</strong><span>尝试切换物种、分析模块或清空检索词。</span></div>`;
    return `<div class="fig-grid">${records.map((r, i) => figureCard(r, listKey, i)).join('')}</div>`;
  }

  /* ---------------- topbar ---------------- */
  function renderTopbar() {
    const top = $('#topbar');
    const nav = [
      ['home', '首页', ''],
      ['atlas', '单细胞图谱', 'atlas'],
      ['virtual', '虚拟细胞', 'virtual'],
      ['gallery', '全图库', 'gallery'],
      ['methods', '方法与数据', 'methods'],
    ];
    top.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="#/" aria-label="DroAIVC 首页">
          <span class="brand-mark">${ICONS.drop}</span>
          <span class="brand-text"><strong>DroAIVC</strong><span>DROUGHT VIRTUAL CELL</span></span>
        </a>
        <nav class="nav" id="main-nav">
          ${nav.map(([key, label, route]) => `<a class="nav-link" data-nav="${route || key}" href="${hashFor(route || '')}">${label}</a>`).join('')}
        </nav>
        <div class="top-actions">
          <button class="search-trigger" data-action="open-command" aria-label="全局搜索">
            ${ICONS.search}<span>搜索</span><kbd>⌘K</kbd>
          </button>
          <button class="species-trigger" data-action="toggle-species" aria-label="选择物种">
            <span class="code" id="species-trigger-code">ALL</span>
            <span class="label" id="species-trigger-label">全部物种</span>
            <span class="caret">▾</span>
          </button>
          <button class="icon-btn mobile-toggle" data-action="toggle-nav" aria-label="打开导航">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>`;
    renderSpeciesPopover();
    updateSpeciesTrigger();
  }

  function renderSpeciesPopover() {
    let root = $('#species-popover');
    if (!root) {
      root = document.createElement('div');
      root.id = 'species-popover';
      root.className = 'species-popover';
      root.hidden = true;
      document.body.appendChild(root);
      document.addEventListener('click', (e) => {
        if (!root.hidden && !root.contains(e.target) && !e.target.closest('[data-action="toggle-species"]')) {
          root.hidden = true;
        }
      });
    }
    const allOption = `
      <button class="species-option ${S.species === 'all' ? 'active' : ''}" data-species-option="all">
        <span class="species-code">ALL</span>
        <span class="meta"><span class="name">全部物种</span><span class="latin">显示全部物种与跨物种汇总</span></span>
      </button>
      <button class="species-option ${S.species === 'multi' ? 'active' : ''}" data-species-option="multi">
        <span class="species-code">21</span>
        <span class="meta"><span class="name">跨物种汇总</span><span class="latin">仅显示 21 物种合并/比较图件</span></span>
      </button>`;
    const rows = S.site.species.map((sp) => {
      const st = S.statsBySpecies.get(sp.key) || {};
      return `
        <button class="species-option ${S.species === sp.key ? 'active' : ''}" data-species-option="${esc(sp.key)}">
          <span class="species-code">${esc(sp.code)}</span>
          <span class="meta">
            <span class="name">${esc(sp.name)} <span style="color:var(--dim);font-size:9px;font-style:italic">${esc(sp.latin)}</span></span>
            <span class="latin">${fmtInt(st.sc_cells)} cells · ${fmtInt(st.bulk_samples)} bulk · ${esc(st.signal || 'NA')}</span>
          </span>
          <span class="signal"><span class="signal-dot ${signalClass(st.signal)}"></span></span>
        </button>`;
    }).join('');
    root.innerHTML = `
      <div class="popover-head">
        <h3>按物种筛选</h3>
        <input class="species-search" id="species-search" type="search" placeholder="搜索中文名 / 拉丁名 / 缩写" value="${esc(S.speciesQuery)}" autocomplete="off">
      </div>
      <div class="species-list" id="species-list">${allOption}${rows}</div>`;
    const input = $('#species-search', root);
    if (input) {
      input.addEventListener('input', () => {
        S.speciesQuery = input.value.trim().toLowerCase();
        filterSpeciesList();
      });
    }
    filterSpeciesList();
  }

  function filterSpeciesList() {
    const root = $('#species-popover');
    if (!root) return;
    const q = S.speciesQuery;
    $$('.species-option', root).forEach((btn) => {
      const key = btn.dataset.speciesOption || '';
      const sp = S.speciesByKey.get(key);
      const text = [key, sp?.name, sp?.latin, sp?.code].filter(Boolean).join(' ').toLowerCase();
      btn.style.display = !q || text.includes(q) ? '' : 'none';
    });
  }

  function updateSpeciesTrigger() {
    const code = $('#species-trigger-code');
    const label = $('#species-trigger-label');
    if (code) code.textContent = speciesCode(S.species);
    if (label) label.textContent = speciesName(S.species);
    $$('.species-option').forEach((b) => b.classList.toggle('active', b.dataset.speciesOption === S.species));
  }

  function setSpecies(key, opts = {}) {
    if (!key) return;
    if (key !== 'all' && key !== 'multi' && !S.speciesByKey.has(key)) return;
    S.species = key;
    localStorage.setItem('droaivc.species', key);
    updateSpeciesTrigger();
    const pop = $('#species-popover');
    if (pop) pop.hidden = true;
    if (opts.navigate) go(opts.navigate);
    else renderRoute();
    if (opts.toast !== false) toast(`已切换物种：${speciesName(key)}`);
  }

  function updateTopbarActive() {
    const name = S.route.name;
    $$('.nav-link').forEach((a) => {
      const k = a.dataset.nav;
      const active = k === name || (name === 'species' && k === 'atlas') || (name === 'gallery' && k === 'gallery');
      a.classList.toggle('active', !!active);
    });
    const nav = $('#main-nav');
    if (nav) nav.classList.remove('open');
  }

  /* ---------------- router ---------------- */
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart, queryPart] = raw.split('?');
    const parts = pathPart.split('/').filter(Boolean).map(decode);
    const params = new URLSearchParams(queryPart || '');
    return { parts, params };
  }

  async function renderRoute() {
    if (!S.site) return;
    stopTrajectory();
    const { parts, params } = parseHash();
    let route = { name: 'home', module: null, tab: null };
    if (parts[0] === 'atlas') {
      route = { name: 'atlas', module: parts[1] || null, tab: null };
      if (parts[1]) {
        S.atlasModule = parts[1];
        S.atlasCategory = params.get('cat') || 'all';
        S.atlasQuery = params.get('q') || '';
      }
    } else if (parts[0] === 'virtual') {
      route = { name: 'virtual', module: null, tab: parts[1] || null };
      if (parts[1]) S.tab = parts[1];
      const sp = params.get('sp');
      if (sp) S.predictionSpecies = sp;
    } else if (parts[0] === 'gallery') {
      route = { name: 'gallery', module: null, tab: null };
      S.gallery.q = params.get('q') || '';
      S.gallery.scope = params.get('scope') || 'all';
      S.gallery.module = params.get('module') || 'all';
      S.gallery.species = params.get('species') || 'auto';
      S.gallery.category = params.get('category') || 'all';
      S.gallery.format = params.get('format') || 'all';
      S.gallery.limit = 36;
    } else if (parts[0] === 'methods') {
      route = { name: 'methods', module: null, tab: null };
    } else if (parts[0] === 'species' && parts[1]) {
      route = { name: 'species', module: null, tab: null, species: parts[1] };
    }
    S.route = route;
    updateTopbarActive();
    updateSpeciesTrigger();
    hideTooltip();
    view.innerHTML = '<div class="boot"><div class="boot-drop"></div><p>正在载入视图…</p></div>';
    try {
      if (route.name === 'home') await renderHome();
      else if (route.name === 'atlas') await (route.module ? renderAtlasModule(route.module) : renderAtlasOverview());
      else if (route.name === 'virtual') await (route.tab ? renderVirtualTab(route.tab) : renderVirtualOverview());
      else if (route.name === 'gallery') await renderGallery();
      else if (route.name === 'methods') renderMethods();
      else if (route.name === 'species') await renderSpecies(route.species);
      else await renderHome();
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="empty"><strong>载入失败</strong><span>${esc(err.message || err)}</span><p style="margin-top:14px"><a class="btn" href="#/">返回首页</a></p></div>`;
    }
    document.title = pageTitle(route);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    animateBars();
    requestAnimationFrame(() => {
      if ($('#constellation-svg')) initConstellation();
      if ($('#traj-canvas')) initTrajectory();
      if ($('#grn-chart')) renderGrnChart();
      if ($('#topology-mini')) renderTopology();
      if ($('#coverage-chart')) renderCoverageChart();
      if ($('#prediction-bar-chart')) renderPredictionChart();
      if ($('#pattern-bar-chart')) renderPatternChart();
    });
  }

  function pageTitle(route) {
    const base = 'DroAIVC · 节水抗旱虚拟细胞';
    if (route.name === 'atlas') return `${route.module ? (S.moduleByKey.get(route.module)?.name || '图谱') + ' · ' : ''}单细胞图谱 · ${base}`;
    if (route.name === 'virtual') return `${route.tab ? (S.tabByKey.get(route.tab)?.name || '虚拟细胞') + ' · ' : ''}虚拟细胞 · ${base}`;
    if (route.name === 'gallery') return `全图库 · ${base}`;
    if (route.name === 'methods') return `方法与数据 · ${base}`;
    if (route.name === 'species') return `${speciesName(route.species)} · ${base}`;
    return base;
  }

  /* ---------------- home ---------------- */
  async function renderHome() {
    const totals = S.site.totals;
    view.innerHTML = `
      <div class="page">
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow">21 species · single-cell × virtual cell</div>
            <h1 class="hero-title">
              <span class="accent">节水抗旱虚拟细胞</span>
              <span class="line2">从单细胞图谱，到干旱响应预测</span>
            </h1>
            <p class="hero-lead">
              汇集 21 个物种的单细胞转录组图谱与干旱/对照 bulk 数据，把质控、注释、轨迹、基因调控网络、细胞通讯与虚拟细胞模型放在同一个可交互门户中。
            </p>
            <div class="hero-actions">
              <a class="btn primary" href="#/atlas">进入单细胞图谱 ${ICONS.arrow}</a>
              <a class="btn ghost" href="#/virtual/prediction">查看 21 物种干旱预测</a>
              <a class="btn ghost" href="#/gallery">检索全图库</a>
            </div>
            <div class="hero-stats">
              <div class="stat"><div class="stat-value">${totals.species}<span class="unit">种</span></div><div class="stat-label">物种覆盖</div></div>
              <div class="stat"><div class="stat-value">${compact(totals.atlas_cells)}<span class="unit">cells</span></div><div class="stat-label">单细胞图谱</div></div>
              <div class="stat"><div class="stat-value">${compact(totals.bulk_samples)}<span class="unit">bulk</span></div><div class="stat-label">干旱/对照样本</div></div>
              <div class="stat"><div class="stat-value">${compact(totals.figures)}<span class="unit">figures</span></div><div class="stat-label">${S.site.mode === 'static' ? '图件索引' : '图件与源表索引'}</div></div>
            </div>
            ${S.site.mode !== 'static' ? `<div class="hero-note">数据生成时间 ${esc(formatDate(S.site.generated_at))} · 图件通过软链接读取，源目录保持不变</div>` : ''}
          </div>
          <div class="constellation" aria-label="21 物种交互星座">
            <div id="constellation-svg"></div>
            <div class="constellation-note">点击物种图标 · 圆环颜色表示干旱信号</div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Explore</div><h2 class="section-title">四个入口，覆盖从图谱到模型</h2></div>
            <a class="btn tiny ghost" href="#/methods">查看数据与方法 ${ICONS.arrow}</a>
          </div>
          <div class="module-grid">
            ${moduleCard('single-cell', '单细胞转录组图谱', '21 物种的质控、降维、聚类、注释、DEG、拟时序、GRN、细胞通讯、细胞状态与 bulk 反卷积。', `${fmtInt(totals.atlas_figures)} 图件`, '#/atlas', ICONS.cell)}
            ${moduleCard('virtual', '节水抗旱虚拟细胞', '正常 → 干旱的单细胞预测、动态细胞状态轨迹、基因网络轨迹与基因扰动效应。', `${fmtInt(totals.virtual_figures)} 图件`, '#/virtual', ICONS.flask)}
            ${moduleCard('pattern', '正常 vs 干旱规律', '跨物种信号强度、细胞状态条件关联、bulk 细胞组成与干旱响应保守性。', '21 物种', '#/virtual/pattern', ICONS.chart)}
            ${moduleCard('gallery', '全图库', S.site.mode === 'static' ? '按物种、模块、类别和关键词检索全部图件；支持在线查看与下载。' : '按物种、模块、类别和关键词检索全部图件；支持 PNG / SVG / PDF 与原始路径复制。', `${fmtInt(totals.figures)} 图件`, '#/gallery', ICONS.grid)}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Pipeline</div><h2 class="section-title">从多物种数据到可交互虚拟细胞</h2><p class="section-desc">上游为 21 物种单细胞图谱；下游把 bulk 干旱上下文、跨物种直系同源映射与 GRN 先验组合成虚拟细胞模型。网站按模块展示每一层的可核查结果。</p></div>
          </div>
          <div class="pipeline">
            ${pipelineStep('01', '多物种数据', '21 物种 scRNA、bulk 干旱/对照与 GRN 先验；统一基因与直系同源群。', '21 species')}
            ${pipelineStep('02', '图谱构建', 'QC、HVG、PCA、Harmony、近邻图、Leiden、marker 与细胞类型注释。', '5.43M cells')}
            ${pipelineStep('03', '调控与通讯', 'pySCENIC regulon、hub TF、CellOracle、LIANA + CellChat 细胞通讯。', 'GRN / communication')}
            ${pipelineStep('04', '跨物种对齐', '直系同源群映射、潜空间对齐与跨物种信号质量评估。', 'orthogroup / UOT')}
            ${pipelineStep('05', '虚拟细胞模型', 'Transformer 编码 + 神经 ODE 轨迹 + 干旱上下文；输出预测与扰动。', 'v8 model')}
            ${pipelineStep('06', '交互与验证', '预测生成、状态轨迹、网络轨迹、规律发现、扰动与模型边界。', 'interactive')}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Coverage</div><h2 class="section-title">21 物种数据覆盖</h2><p class="section-desc">柱状图可切换单细胞数、bulk 样本数与 GRN 边数；点击任一行进入物种档案。</p></div>
            <div class="chart-controls">
              <button class="chip-btn" data-action="coverage-metric" data-value="cells">单细胞数</button>
              <button class="chip-btn" data-action="coverage-metric" data-value="bulk">bulk 样本</button>
              <button class="chip-btn" data-action="coverage-metric" data-value="grn">GRN 边数</button>
            </div>
          </div>
          <div class="chart-card"><div id="coverage-chart"></div></div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Highlights</div><h2 class="section-title">跨物种图谱精选</h2><p class="section-desc">每个分析层选一张跨物种汇总图，点击进入完整模块。</p></div>
            <a class="btn tiny ghost" href="#/atlas">打开图谱总览 ${ICONS.arrow}</a>
          </div>
          <div id="home-highlights"></div>
        </section>

      </div>`;
    renderHighlights();
    renderCoverageChart();
  }

  function moduleCard(key, title, desc, countLabel, href, icon) {
    return `<a class="module-card" href="${esc(href)}">
      <span class="module-icon">${icon}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(desc)}</p>
      <div class="module-meta"><span class="count">${esc(String(countLabel))}</span><span class="arrow">${ICONS.arrow}</span></div>
    </a>`;
  }
  function pipelineStep(n, title, desc, tag) {
    return `<div class="pipeline-step"><div class="step-num">${n}</div><div class="step-body"><h4>${esc(title)}</h4><p>${esc(desc)}</p><span class="tag">${esc(tag)}</span></div></div>`;
  }


  const SPECIES_ICONS = {
    alfalfa: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V32"/><path d="M32 36C23 36 16 29 16 20c9 0 16 7 16 16Z"/><path d="M32 36c9 0 16-7 16-16-9 0-16 7-16 16Z"/><path d="M32 48c-7 0-12-5-12-12 7 0 12 5 12 12Z"/><circle cx="22" cy="14" r="2.2" fill="currentColor" stroke="none"/><circle cx="32" cy="10" r="2.2" fill="currentColor" stroke="none"/><circle cx="42" cy="14" r="2.2" fill="currentColor" stroke="none"/></g>`,
    arabidopsis: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V30"/><path d="M32 38C23 38 16 31 16 22c9 0 16 7 16 16Z"/><path d="M32 38c9 0 16-7 16-16-9 0-16 7-16 16Z"/><path d="M32 48c-7 0-12-5-12-12 7 0 12 5 12 12Z"/><path d="M32 48c7 0 12-5 12-12-7 0-12 5-12 12Z"/><circle cx="32" cy="18" r="2" fill="currentColor" stroke="none"/><circle cx="26" cy="13" r="1.6" fill="currentColor" stroke="none"/><circle cx="38" cy="13" r="1.6" fill="currentColor" stroke="none"/></g>`,
    banana: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 54c-5-14 2-30 14-39 8-6 17-5 22 1-11 2-20 10-25 21-4 8-6 14-11 17Z"/><path d="M34 15C31 29 23 41 12 48"/><path d="M26 27c6 2 12 1 17-2"/><path d="M22 37c5 2 10 1 15-2"/></g>`,
    barley: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V18"/><path d="M32 24c-6 0-9-4-9-9 6 0 9 4 9 9Z"/><path d="M32 24c6 0 9-4 9-9-6 0-9 4-9 9Z"/><path d="M32 34c-6 0-9-4-9-9 6 0 9 4 9 9Z"/><path d="M32 34c6 0 9-4 9-9-6 0-9 4-9 9Z"/><path d="M32 44c-6 0-9-4-9-9 6 0 9 4 9 9Z"/><path d="M32 44c6 0 9-4 9-9-6 0-9 4-9 9Z"/><path d="M32 18 25 5M32 18l7-13"/></g>`,
    broccoli: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V38"/><path d="M32 42c-5 0-9-4-9-9 5 0 9 4 9 9Z"/><path d="M32 42c5 0 9-4 9-9-5 0-9 4-9 9Z"/><circle cx="23" cy="25" r="7"/><circle cx="32" cy="19" r="8"/><circle cx="41" cy="25" r="7"/><circle cx="32" cy="30" r="6"/></g>`,
    cabbage: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="34" r="19"/><path d="M32 15c-7 6-10 15-8 25"/><path d="M32 15c7 6 10 15 8 25"/><path d="M19 28c4 9 11 13 20 13"/><path d="M45 28c-4 9-11 13-20 13"/><path d="M32 53V44"/></g>`,
    cassava: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 32V13M32 32 18 20M32 32l14-12M32 32 16 40M32 32l16 8"/><path d="M32 32c-4-7-4-14 0-19 4 5 4 12 0 19Z"/><path d="M32 32c-7-3-11-9-10-16 6 2 10 8 10 16Z"/><path d="M32 32c7-3 11-9 10-16-6 2-10 8-10 16Z"/><path d="M32 32c-7 4-9 11-5 17 5-3 7-10 5-17Z"/><path d="M32 32c7 4 9 11 5 17-5-3-7-10-5-17Z"/><ellipse cx="32" cy="50" rx="8" ry="6"/></g>`,
    cotton: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V40"/><path d="M32 40c-6 0-10-4-10-10 6 0 10 4 10 10Z"/><path d="M32 40c6 0 10-4 10-10-6 0-10 4-10 10Z"/><circle cx="23" cy="23" r="7"/><circle cx="32" cy="17" r="8"/><circle cx="41" cy="23" r="7"/><circle cx="32" cy="29" r="7"/></g>`,
    grape: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="19" r="4"/><circle cx="25" cy="27" r="4"/><circle cx="39" cy="27" r="4"/><circle cx="21" cy="36" r="4"/><circle cx="32" cy="36" r="4"/><circle cx="43" cy="36" r="4"/><circle cx="26" cy="45" r="4"/><circle cx="38" cy="45" r="4"/><circle cx="32" cy="53" r="4"/><path d="M32 15c-2-7 3-11 9-13"/><path d="M35 10c4-3 9-2 12 2-4 3-9 2-12-2Z"/></g>`,
    kiwifruit: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="36" r="17"/><circle cx="32" cy="36" r="5"/><circle cx="32" cy="23" r="1.7" fill="currentColor" stroke="none"/><circle cx="41" cy="27" r="1.7" fill="currentColor" stroke="none"/><circle cx="45" cy="36" r="1.7" fill="currentColor" stroke="none"/><circle cx="41" cy="45" r="1.7" fill="currentColor" stroke="none"/><circle cx="32" cy="49" r="1.7" fill="currentColor" stroke="none"/><circle cx="23" cy="45" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="36" r="1.7" fill="currentColor" stroke="none"/><circle cx="23" cy="27" r="1.7" fill="currentColor" stroke="none"/><path d="M32 19c0-6 4-10 10-12"/><path d="M38 11c4-3 9-2 12 2-4 3-9 2-12-2Z"/></g>`,
    maize: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V20"/><path d="M25 22c0-7 2-11 7-14 5 3 7 7 7 14v23c0 7-2 11-7 14-5-3-7-7-7-14Z"/><path d="M25 28h14M25 36h14M25 44h14M32 18v36"/><path d="M25 29c-6 2-9 8-9 15 6 0 9-5 11-11"/><path d="M39 29c6 2 9 8 9 15-6 0-9-5-11-11"/></g>`,
    peanut: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 10c8 0 12 7 12 14 0 4-2 7-4 9 2 2 4 5 4 9 0 7-4 12-12 12s-12-5-12-12c0-4 2-7 4-9-2-2-4-5-4-9 0-7 4-14 12-14Z"/><path d="M23 25c5 2 13 2 18 0"/><path d="M23 45c5-2 13-2 18 0"/></g>`,
    potato: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 13c10 0 19 8 19 19s-9 19-19 19-19-8-19-19 9-19 19-19Z"/><circle cx="25" cy="25" r="1.8" fill="currentColor" stroke="none"/><circle cx="39" cy="30" r="1.8" fill="currentColor" stroke="none"/><circle cx="29" cy="39" r="1.8" fill="currentColor" stroke="none"/><path d="M32 13c0-4 3-7 7-8"/></g>`,
    rape: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V31"/><circle cx="32" cy="23" r="4.5"/><circle cx="24" cy="28" r="4.5"/><circle cx="40" cy="28" r="4.5"/><circle cx="27" cy="35" r="4.5"/><circle cx="37" cy="35" r="4.5"/><path d="M32 31c-8 3-12 9-14 16"/><path d="M32 40c6 2 9 7 11 13"/></g>`,
    rice: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V20"/><path d="M32 25c-8 2-12 8-12 15 6 0 10-4 12-11"/><path d="M32 25c8 2 12 8 12 15-6 0-10-4-12-11"/><path d="M32 35c-6 2-9 7-9 13 5 0 8-4 9-9"/><path d="M32 35c6 2 9 7 9 13-5 0-8-4-9-9"/><path d="M32 45c-4 2-6 5-6 9 3 0 5-2 6-5"/><path d="M32 45c4 2 6 5 6 9-3 0-5-2-6-5"/></g>`,
    sorghum: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V30"/><circle cx="32" cy="21" r="11"/><circle cx="26" cy="16" r="1.8" fill="currentColor" stroke="none"/><circle cx="38" cy="16" r="1.8" fill="currentColor" stroke="none"/><circle cx="22" cy="24" r="1.8" fill="currentColor" stroke="none"/><circle cx="42" cy="24" r="1.8" fill="currentColor" stroke="none"/><circle cx="32" cy="28" r="1.8" fill="currentColor" stroke="none"/><path d="M32 32c-4 0-7-3-7-7M32 32c4 0 7-3 7-7"/></g>`,
    soybean: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 40c0-12 9-21 21-21h9c0 12-9 21-21 21Z"/><circle cx="25" cy="33" r="2.4" fill="currentColor" stroke="none"/><circle cx="33" cy="28" r="2.4" fill="currentColor" stroke="none"/><circle cx="41" cy="23" r="2.4" fill="currentColor" stroke="none"/><path d="M20 44c-4 4-6 8-6 12"/><path d="M18 45c-6-2-10-8-10-14 6 0 10 4 12 10Z"/></g>`,
    tea: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V28"/><path d="M32 32C22 32 14 24 14 14c10 0 18 8 18 18Z"/><path d="M32 40c10 0 18-8 18-18-10 0-18 8-18 18Z"/><path d="M32 49c-7 0-12-5-12-12 7 0 12 5 12 12Z"/></g>`,
    tobacco: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V24"/><path d="M32 37C20 37 10 29 10 19c12 0 22 8 22 18Z"/><path d="M32 45c10 0 18-6 18-14-10 0-18 6-18 14Z"/><path d="M32 24c0-8 4-14 10-17"/><path d="M38 10c4-4 10-4 14 0-4 4-10 4-14 0Z"/></g>`,
    tomato: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="37" r="17"/><path d="M32 20v-7"/><path d="M32 20l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="currentColor" stroke="none" opacity=".85"/></g>`,
    wheat: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V16"/><path d="M32 23c-6 0-9-4-9-9 6 0 9 4 9 9Z"/><path d="M32 23c6 0 9-4 9-9-6 0-9 4-9 9Z"/><path d="M32 33c-6 0-9-4-9-9 6 0 9 4 9 9Z"/><path d="M32 33c6 0 9-4 9-9-6 0-9 4-9 9Z"/><path d="M32 43c-6 0-9-4-9-9 6 0 9 4 9 9Z"/><path d="M32 43c6 0 9-4 9-9-6 0-9 4-9 9Z"/><path d="M32 16 24 4M32 16l8-12"/></g>`,
  };

  function constellationSVG() {
    const species = (S.stats?.species || []).slice().sort((a, b) => a.key.localeCompare(b.key));
    const W = 560, C = 280, R = 216;
    const nodes = species.map((sp, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / species.length;
      const x = C + R * Math.cos(a);
      const y = C + R * Math.sin(a);
      const r = clamp(18 + Math.log10((sp.sc_cells || 1) + 1) * 0.95, 18, 25);
      const sig = String(sp.signal || 'NONE').toUpperCase();
      const stroke = sig === 'HIGH' ? 'rgba(60,224,178,.96)' : sig === 'LOW' ? 'rgba(241,201,107,.96)' : 'rgba(140,168,159,.9)';
      const dot = sig === 'HIGH' ? '#3ce0b2' : sig === 'LOW' ? '#f1c96b' : '#8ca89f';
      const icon = SPECIES_ICONS[sp.key] || '';
      const size = (r * 1.3).toFixed(1);
      return `<line class="spoke" x1="${C}" y1="${C}" x2="${x}" y2="${y}"/>
        <g class="node" data-species-option="${esc(sp.key)}" data-tip="${esc(`${sp.name} · ${sp.latin}<br>${compact(sp.sc_cells)} cells · signal ${sp.signal}`)}" data-species-nav="1" tabindex="0" role="button" aria-label="${esc(sp.name)}">
          <title>${esc(sp.name)} · ${esc(sp.latin)} · ${fmtInt(sp.sc_cells)} cells</title>
          <circle class="node-ring" cx="${x}" cy="${y}" r="${r}" fill="rgba(5,20,16,.86)" stroke="${stroke}" stroke-width="1.6"/>
          <svg x="${x - r * 0.65}" y="${y - r * 0.65}" width="${size}" height="${size}" viewBox="0 0 64 64" class="species-icon" aria-hidden="true">${icon}</svg>
          <image href="assets/species/${esc(sp.key)}.png" x="${x - r * 0.9}" y="${y - r * 0.9}" width="${r * 1.8}" height="${r * 1.8}" class="species-img" preserveAspectRatio="xMidYMid meet"/>
          <circle class="node-signal" cx="${x + r * 0.98}" cy="${y + r * 0.98}" r="3.2" fill="${dot}" stroke="rgba(5,20,16,.9)" stroke-width=".8"/>
        </g>`;
    }).join('');
    return `<svg id="constellation-svg" class="constellation-svg" viewBox="0 0 ${W} ${W}" role="img" aria-label="21 物种星座，节点为物种抽象图标，大小表示单细胞数量，圆环颜色表示干旱信号等级">
      <defs>
        <radialGradient id="cellGrad" cx="38%" cy="32%" r="72%">
          <stop offset="0" stop-color="#b9ffea" stop-opacity=".95"/>
          <stop offset=".38" stop-color="#38e0b0" stop-opacity=".62"/>
          <stop offset="1" stop-color="#0a5f4f" stop-opacity=".18"/>
        </radialGradient>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle class="orbit" cx="${C}" cy="${C}" r="216"/>
      <circle class="orbit" cx="${C}" cy="${C}" r="152"/>
      <circle class="orbit-dash" cx="${C}" cy="${C}" r="184"/>
      <circle class="orbit-dash" cx="${C}" cy="${C}" r="246" opacity=".55"/>
      ${nodes}
      <g class="central-cell" filter="url(#glow)">
        <circle cx="${C}" cy="${C}" r="62" fill="url(#cellGrad)" opacity=".2"/>
        <circle cx="${C}" cy="${C}" r="48" fill="url(#cellGrad)" stroke="rgba(178,255,232,.55)" stroke-width="1.2"/>
        <circle cx="${C}" cy="${C}" r="17" fill="rgba(5,24,18,.76)" stroke="rgba(190,255,236,.45)" stroke-width="1"/>
        <circle cx="${C - 8}" cy="${C - 6}" r="3.2" fill="rgba(60,224,178,.8)"/>
        <circle cx="${C + 9}" cy="${C + 5}" r="4.4" fill="rgba(241,201,107,.7)"/>
        <circle cx="${C + 2}" cy="${C - 13}" r="2.2" fill="rgba(178,255,232,.9)"/>
      </g>
      <text id="constellation-focus" x="${C}" y="${C + 84}" class="central-label">VIRTUAL CELL</text>
      <text id="constellation-sub" x="${C}" y="${C + 96}" class="central-sub">21 SPECIES · DROUGHT RESPONSE</text>
    </svg>`;
  }

  function initConstellation() {
    const host = $('#constellation-svg');
    if (!host) return;
    host.outerHTML = constellationSVG();
    const svg = $('#constellation-svg');
    if (!svg) return;
    const focus = $('#constellation-focus');
    const sub = $('#constellation-sub');
    const reset = () => {
      if (focus) focus.textContent = 'VIRTUAL CELL';
      if (sub) sub.textContent = '21 SPECIES · DROUGHT RESPONSE';
    };
    svg.addEventListener('mouseover', (e) => {
      const node = e.target.closest('.node');
      if (!node) return;
      const key = node.dataset.speciesOption;
      const sp = S.speciesByKey.get(key);
      const st = S.statsBySpecies.get(key);
      if (sp && focus) focus.textContent = sp.name;
      if (sp && sub) sub.textContent = `${sp.code} · ${st?.signal || 'NA'} · ${compact(st?.sc_cells || 0)} cells`;
    });
    svg.addEventListener('mouseout', (e) => {
      if (e.target.closest('.node')) reset();
    });
  }

  function renderHighlights() {
    const host = $('#home-highlights');
    if (!host || !S.atlas) {
      if (host) host.innerHTML = '<div class="empty"><strong>图件索引载入中</strong><span>稍后会自动出现精选图件。</span></div>';
      ensureAtlas().then(() => renderHighlights());
      return;
    }
    const picks = ['00_QC_normalization', '06_leiden_clustering', '07_marker_resolution_annotation', '08_cell_composition', '09_celltype_DEG_and_enrichment', '10_pseudotime', '11_gene_regulatory_network', '12_cell_communication', '13_cell_states_ecotypes', '14_bulk_deconvolution']
      .map((m) => S.atlas.figures.find((f) => f.module === m && f.species === 'multi') || S.atlas.figures.find((f) => f.module === m))
      .filter(Boolean)
      .slice(0, 6);
    host.innerHTML = figureGrid(picks, 'home-highlights');
  }

  function coverageData() {
    const metric = S.coverageMetric;
    const rows = (S.stats?.species || []).map((sp) => ({
      key: sp.key,
      label: sp.name,
      value: metric === 'cells' ? sp.sc_cells : metric === 'bulk' ? sp.bulk_samples : sp.grn_edges,
      signal: sp.signal,
      code: sp.code,
    })).sort((a, b) => b.value - a.value);
    return rows;
  }

  function renderCoverageChart() {
    const host = $('#coverage-chart');
    if (!host) return;
    const rows = coverageData();
    const metric = S.coverageMetric;
    const max = Math.max(...rows.map((r) => r.value), 1);
    const logMax = Math.log10(max + 1);
    const valueLabel = (v) => metric === 'cells' ? compact(v) : metric === 'bulk' ? fmtInt(v) : compact(v);
    host.innerHTML = `<div class="bar-chart">${rows.map((r) => {
      const norm = metric === 'cells' ? Math.log10(r.value + 1) / logMax : r.value / max;
      return `<button class="bar-row" data-signal="${esc(r.signal)}" data-action="go-species" data-value="${esc(r.key)}" data-tip="${esc(`${r.label} · ${fmtInt(r.value)}`)}">
        <span class="bar-label">${esc(r.label)}</span>
        <span class="bar-track"><span class="bar-fill" data-w="${Math.max(1.2, norm * 100).toFixed(2)}"></span></span>
        <span class="bar-value">${esc(valueLabel(r.value))}</span>
      </button>`;
    }).join('')}</div>`;
    $$('.chip-btn[data-action="coverage-metric"]').forEach((b) => b.classList.toggle('active', b.dataset.value === metric));
    animateBars();
  }

  function animateBars() {
    requestAnimationFrame(() => {
      $$('.bar-fill[data-w]').forEach((el) => {
        el.style.width = `${clamp(Number(el.dataset.w), 0, 100)}%`;
      });
    });
  }

  /* ---------------- species profile ---------------- */
  async function renderSpecies(key) {
    const sp = S.statsBySpecies.get(key);
    if (!sp) {
      view.innerHTML = `<div class="empty"><strong>未找到物种</strong><span>${esc(key)}</span><p style="margin-top:14px"><a class="btn" href="#/atlas">返回图谱</a></p></div>`;
      return;
    }
    await Promise.all([ensureAtlas(), ensureVirtual()]);
    const predFigs = S.virtual.figures.filter((f) => f.tab === 'prediction' && f.species === key);
    const moduleRows = S.site.atlas_modules.map((m) => {
      const specific = S.atlas.figures.filter((f) => f.module === m.key && f.species === key).length;
      const summary = S.atlas.figures.filter((f) => f.module === m.key && f.species === 'multi').length;
      return { ...m, specific, summary, total: specific + summary };
    }).filter((m) => m.total > 0);
    const highlights = pickSpeciesHighlights(key);
    const topTfs = (S.stats.top_tfs || {})[key] || [];
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Species profile · ${esc(sp.clade)}</div>
            <h1 class="page-title">${esc(sp.name)} <span class="tag teal" style="vertical-align:middle;margin-left:6px">${esc(sp.code)}</span></h1>
            <p class="page-lead"><i>${esc(sp.latin)}</i> · ${signalPill(sp.signal)}</p>
          </div>
          <div class="page-actions">
            <button class="btn primary" data-action="open-atlas-species" data-species="${esc(key)}" data-module="07_marker_resolution_annotation">进入该物种图谱 ${ICONS.arrow}</button>
            <a class="btn ghost" href="#/virtual/prediction?sp=${encode(key)}">查看干旱预测</a>
            <a class="btn ghost" href="#/gallery?species=${encode(key)}">该物种全图库</a>
          </div>
        </div>

        <div class="stat-grid">
          ${statBox(fmtInt(sp.sc_cells), '单细胞数')}
          ${statBox(fmtInt(sp.bulk_samples), 'bulk 样本')}
          ${statBox(fmtInt(sp.common_genes), '共同基因')}
          ${statBox(compact(sp.grn_edges), 'GRN 过滤边数')}
          ${statBox(`${fmtInt(sp.tf_matched)} / ${fmtInt(sp.tf_total)}`, 'TF 匹配')}
          ${statBox(pct(sp.sig_frac), '显著 TF 比例')}
          ${statBox(sp.signal || 'NA', '干旱信号等级')}
          ${statBox(sci(sp.traj_arc_len), '轨迹弧长')}
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Coverage</div><h2 class="section-title">该物种的图谱覆盖</h2><p class="section-desc">“特异图件”为该物种单独图件，“跨物种汇总”为包含该物种的合并/比较图。点击模块进入图谱。</p></div>
          </div>
          <div class="species-grid">
            ${moduleRows.map((m) => `
              <button class="species-card" data-action="open-atlas-species" data-species="${esc(key)}" data-module="${esc(m.key)}">
                <div class="species-card-head">
                  <span class="code">${String(m.order + 1).padStart(2, '0')}</span>
                  <span class="nm"><strong>${esc(m.name)}</strong><span>${esc(m.group)} · ${esc(m.categories.length)} 类</span></span>
                </div>
                <div class="species-stats">
                  <div class="species-stat"><b>${fmtInt(m.specific)}</b><span>特异图件</span></div>
                  <div class="species-stat"><b>${fmtInt(m.summary)}</b><span>跨物种汇总</span></div>
                  <div class="species-stat"><b>${fmtInt(m.total)}</b><span>合计</span></div>
                </div>
                <div class="species-card-foot"><span class="tag">${esc(m.name)}</span><span class="fig-open" style="opacity:1">进入 ↗</span></div>
              </button>`).join('')}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Drought prediction</div><h2 class="section-title">${esc(sp.name)}的干旱预测</h2><p class="section-desc">正常 → 干旱的单细胞预测、TF 活性与轨迹 PCA 概览。模型输出为计算预测。</p></div>
            <a class="btn tiny ghost" href="#/virtual/prediction?sp=${encode(key)}">完整预测面板 ${ICONS.arrow}</a>
          </div>
          ${predFigs.length ? figureGrid(predFigs, `species-pred-${key}`) : `<div class="empty"><strong>暂无该物种预测图</strong><span>当前预测结果目录中没有找到该物种的图件。</span></div>`}
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Top TFs</div><h2 class="section-title">Top 干旱响应 TF</h2><p class="section-desc">来自 11_cross_species_analysis 的 per-species top20 TF 表，按 |Δ activity| 排序。</p></div>
          </div>
          ${topTfs.length ? tableHTML(topTfs.slice(0, 12), [
            { key: 'gene', label: 'TF / gene', cls: 'gene' },
            { key: 'family', label: '家族', fmt: (v) => v || '—' },
            { key: 'delta_tfa', label: 'Δ activity', cls: 'num', fmt: (v) => sci(v) },
            { key: 'abs_delta', label: '|Δ|', cls: 'num', fmt: (v) => sci(v) },
          ]) : `<div class="callout">该物种当前没有可用的 top TF 表；可能是信号等级为 NONE 或分析未产出显著 TF。</div>`}
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Highlights</div><h2 class="section-title">该物种图谱精选</h2><p class="section-desc">每个分析层挑选一张代表图，点击可放大查看。</p></div>
            <a class="btn tiny ghost" href="#/gallery?species=${encode(key)}">查看全部 ${ICONS.arrow}</a>
          </div>
          ${highlights.length ? figureGrid(highlights, `species-highlights-${key}`) : `<div class="empty"><strong>暂无图件</strong><span>该物种暂未匹配到图谱图件。</span></div>`}
        </section>

        ${key !== 'rice' ? `<div class="callout info"><strong>深度轨迹覆盖：</strong>正常 → 干旱的动态细胞状态轨迹与 GRN 轨迹目前完成水稻；${esc(sp.name)}提供模型预测轨迹 PCA 概览与图谱拟时序参考。</div>` : `<div class="callout"><strong>深度轨迹：</strong>水稻已完成正常 → 干旱的潜空间/表达空间轨迹、路标点与 GRN 拓扑时间序列，可在虚拟细胞模块中交互查看。</div>`}
      </div>`;
  }

  function statBox(value, label) {
    return `<div class="stat-box"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  }

  function pickSpeciesHighlights(key) {
    const picks = [];
    const seen = new Set();
    for (const m of S.site.atlas_modules) {
      const candidates = S.atlas.figures.filter((f) => f.module === m.key);
      const specific = candidates.find((f) => f.species === key);
      const summary = candidates.find((f) => f.species === 'multi');
      const pick = specific || summary;
      if (pick && !seen.has(pick.id)) {
        seen.add(pick.id);
        picks.push(pick);
      }
    }
    return picks.slice(0, 8);
  }

  function tableHTML(rows, columns, opts = {}) {
    if (!rows || !rows.length) return `<div class="empty"><strong>暂无数据</strong><span>${esc(opts.empty || '')}</span></div>`;
    const head = columns.map((c) => `<th class="${c.cls || ''}">${esc(c.label)}</th>`).join('');
    const body = rows.map((r) => `<tr>${columns.map((c) => {
      const raw = typeof c.get === 'function' ? c.get(r) : r[c.key];
      const val = c.fmt ? c.fmt(raw, r) : (raw ?? '—');
      return `<td class="${c.cls || ''}">${val === '' ? '—' : (c.html ? val : esc(val))}</td>`;
    }).join('')}</tr>`).join('');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /* ---------------- atlas ---------------- */
  async function renderAtlasOverview() {
    await ensureAtlas();
    const figs = S.atlas.figures;
    const summaryCount = figs.filter((f) => f.species === 'multi').length;
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Atlas · 21 species</div>
            <h1 class="page-title">单细胞转录组<em>图谱</em></h1>
            <p class="page-lead">
              从 QC、HVG、PCA、Harmony、近邻图、Leiden 聚类，到 marker 注释、细胞组成、DEG/富集、拟时序、GRN、细胞通讯、细胞状态与 bulk 反卷积。按分析模块进入，或直接检索全部图件。
            </p>
          </div>
          <div class="page-actions">
            <a class="btn primary" href="#/atlas/07_marker_resolution_annotation">从注释开始 ${ICONS.arrow}</a>
            <a class="btn ghost" href="#/gallery?scope=atlas">图库检索</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(S.site.totals.species, '物种')}
          ${statBox(compact(S.site.totals.atlas_cells), '单细胞数')}
          ${statBox(S.atlas.modules.length, '分析模块')}
          ${statBox(fmtInt(figs.length), '图件条目')}
          ${statBox(compact(summaryCount), '跨物种汇总')}
          ${statBox(compact(S.site.totals.grn_edges), 'GRN 过滤边')}
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Modules</div><h2 class="section-title">按分析层浏览</h2><p class="section-desc">左侧模块栏会在每个页面保持可用；每个模块内再按图型分类。</p></div>
          </div>
          ${S.site.groups.map((group) => {
            const mods = S.atlas.modules.filter((m) => m.group === group);
            if (!mods.length) return '';
            return `<div class="subgroup">
              <div class="subgroup-head"><h3>${esc(group)}</h3><span class="count">${mods.length} 个模块</span></div>
              <div class="module-grid">${mods.map((m) => atlasModuleCard(m)).join('')}</div>
            </div>`;
          }).join('')}
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Coverage</div><h2 class="section-title">数据覆盖</h2><p class="section-desc">点击任一行进入物种档案。</p></div>
            <div class="chart-controls">
              <button class="chip-btn" data-action="coverage-metric" data-value="cells">单细胞数</button>
              <button class="chip-btn" data-action="coverage-metric" data-value="bulk">bulk 样本</button>
              <button class="chip-btn" data-action="coverage-metric" data-value="grn">GRN 边数</button>
            </div>
          </div>
          <div class="chart-card"><div id="coverage-chart"></div></div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Highlights</div><h2 class="section-title">跨物种汇总精选</h2></div>
          </div>
          <div id="atlas-highlights"></div>
        </section>
      </div>`;
    renderAtlasHighlights();
    renderCoverageChart();
  }

  function atlasModuleCard(m) {
    const cats = m.categories || [];
    return `<a class="module-card" href="#/atlas/${encode(m.key)}">
      <span class="module-icon">${ICONS.layers}</span>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.desc)}</p>
      <div class="module-meta"><span class="count">${fmtInt(m.figure_count)} 图件 · ${cats.length} 类</span><span class="arrow">${ICONS.arrow}</span></div>
    </a>`;
  }

  function renderAtlasHighlights() {
    const host = $('#atlas-highlights');
    if (!host) return;
    if (!S.atlas) { host.innerHTML = '<div class="empty"><strong>载入中…</strong></div>'; return; }
    const picks = S.atlas.modules.map((m) => S.atlas.figures.find((f) => f.module === m.key && f.species === 'multi') || S.atlas.figures.find((f) => f.module === m.key)).filter(Boolean).slice(0, 10);
    host.innerHTML = figureGrid(picks, 'atlas-highlights');
  }

  function atlasSidebar(activeKey) {
    const groups = S.site.groups.map((group) => {
      const mods = S.atlas.modules.filter((m) => m.group === group);
      if (!mods.length) return '';
      return `<div class="side-group"><div class="side-title">${esc(group)}</div>
        ${mods.map((m) => `<a class="side-link ${m.key === activeKey ? 'active' : ''}" href="#/atlas/${encode(m.key)}">
          <span class="idx">${String(m.order + 1).padStart(2, '0')}</span>
          <span class="label">${esc(m.name)}</span>
          <span class="side-count">${fmtInt(m.figure_count)}</span>
        </a>`).join('')}
      </div>`;
    }).join('');
    return `<aside class="sidebar"><a class="side-back" href="#/atlas">← 图谱总览</a>${groups}</aside>`;
  }

  async function renderAtlasModule(moduleKey) {
    await ensureAtlas();
    const mod = S.moduleByKey.get(moduleKey);
    if (!mod) {
      view.innerHTML = `<div class="empty"><strong>未找到分析模块</strong><span>${esc(moduleKey)}</span><p style="margin-top:14px"><a class="btn" href="#/atlas">返回图谱总览</a></p></div>`;
      return;
    }
    if (!S.atlas.figures.some((f) => f.module === moduleKey)) {
      view.innerHTML = `<div class="page"><div class="split">${atlasSidebar(moduleKey)}<div class="content"><div class="module-head"><div class="kicker">Atlas / ${esc(moduleKey)}</div><h2>${esc(mod.name)}</h2><p>${esc(mod.desc)}</p></div><div class="empty"><strong>该模块暂无图件</strong><span>源目录中未找到可展示的图片文件。</span></div></div></div></div>`;
      return;
    }
    const cats = mod.categories || [];
    if (!cats.some((c) => c.name === S.atlasCategory)) S.atlasCategory = 'all';
    if (!S.atlasCategory) S.atlasCategory = 'all';
    const key = `${moduleKey}|${S.atlasCategory}|${S.atlasQuery}|${S.species}`;
    if (S.atlasKey !== key) { S.atlasKey = key; S.atlasLimit = 36; }
    view.innerHTML = `
      <div class="page">
        <div class="split">
          ${atlasSidebar(moduleKey)}
          <div class="content">
            <div class="module-head">
              <div class="kicker">Atlas / ${esc(moduleKey)}</div>
              <h2>${esc(mod.name)}</h2>
              <p>${esc(mod.desc)}</p>
              <div class="module-meta-row">
                <span class="chip"><span class="dot"></span>${fmtInt(mod.figure_count)} 图件</span>
                <span class="tag">${esc(mod.group)}</span>
                <span class="tag">${cats.length} 个图型分类</span>
                <span class="tag teal" id="atlas-result-count">—</span>
              </div>
            </div>
            <div class="filter-chips">
              <button class="chip-btn ${S.atlasCategory === 'all' ? 'active' : ''}" data-action="atlas-category" data-value="all">全部 <span style="opacity:.55">${fmtInt(mod.figure_count)}</span></button>
              ${cats.map((c) => `<button class="chip-btn ${S.atlasCategory === c.name ? 'active' : ''}" data-action="atlas-category" data-value="${esc(c.name)}">${esc(c.name)} <span style="opacity:.55">${fmtInt(c.count)}</span></button>`).join('')}
            </div>
            <div class="filter-bar" style="margin-top:16px">
              <div class="filter-row">
                <div class="field grow">
                  <input class="input" id="atlas-search" type="search" placeholder="在本模块中检索图件标题、图注、物种…" value="${esc(S.atlasQuery)}">
                </div>
                <div class="field">
                  <button class="chip-btn" data-action="atlas-clear-search">清空检索</button>
                </div>
              </div>
            </div>
            <div id="atlas-results"></div>
          </div>
        </div>
      </div>`;
    renderAtlasResults(moduleKey);
  }

  function atlasFilteredFigures(moduleKey) {
    const q = S.atlasQuery.trim().toLowerCase();
    const cat = S.atlasCategory;
    let figs = S.atlas.figures.filter((f) => f.module === moduleKey);
    if (cat !== 'all') figs = figs.filter((f) => f.category === cat);
    if (S.species === 'multi') figs = figs.filter((f) => f.species === 'multi');
    else if (S.species !== 'all') figs = figs.filter((f) => f.species === S.species || f.species === 'multi');
    if (q) {
      figs = figs.filter((f) => {
        const text = [f.title, f.caption, f.category, f.organ, f.dataset, speciesName(f.species), f.png, f.pdf, f.svg].join(' ').toLowerCase();
        return text.includes(q);
      });
    }
    const summary = figs.filter((f) => f.species === 'multi').sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const specific = figs.filter((f) => f.species !== 'multi').sort((a, b) => {
      const sa = S.speciesByKey.get(a.species)?.name || '';
      const sb = S.speciesByKey.get(b.species)?.name || '';
      return sa.localeCompare(sb, 'zh-CN') || (a.sort || 0) - (b.sort || 0);
    });
    return { summary, specific, all: [...summary, ...specific] };
  }

  function renderAtlasResults(moduleKey) {
    const host = $('#atlas-results');
    if (!host) return;
    const { summary, specific, all } = atlasFilteredFigures(moduleKey);
    const speciesKey = S.species;
    const listKeySummary = `atlas-summary-${moduleKey}`;
    const listKeySpecific = `atlas-specific-${moduleKey}`;
    let html = '';
    let count = 0;
    if (speciesKey !== 'all' && speciesKey !== 'multi') {
      const sumShown = summary.slice(0, 6);
      const specShown = specific.slice(0, S.atlasLimit);
      count = sumShown.length + specShown.length;
      if (sumShown.length) {
        html += `<div class="subgroup"><div class="subgroup-head"><h3>跨物种汇总</h3><span class="count">显示前 ${sumShown.length} / ${summary.length}</span></div>${figureGrid(sumShown, listKeySummary)}</div>`;
      }
      html += `<div class="subgroup"><div class="subgroup-head"><h3>${esc(speciesName(speciesKey))} 图件</h3><span class="count">显示 ${specShown.length} / ${specific.length}</span></div>`;
      html += specShown.length ? figureGrid(specShown, listKeySpecific) : `<div class="empty"><strong>该物种在此模块暂无特异图件</strong><span>可切换为“全部物种”或查看跨物种汇总。</span></div>`;
      html += `</div>`;
      if (specific.length > specShown.length) {
        html += `<div class="load-more"><button class="btn" data-action="atlas-more">加载更多（剩余 ${specific.length - specShown.length}）</button></div>`;
      }
    } else {
      const shown = all.slice(0, S.atlasLimit);
      count = shown.length;
      html = shown.length ? figureGrid(shown, `atlas-all-${moduleKey}`) : `<div class="empty"><strong>暂无匹配图件</strong><span>尝试切换图型分类、物种或清空检索词。</span></div>`;
      if (all.length > shown.length) {
        html += `<div class="load-more"><button class="btn" data-action="atlas-more">加载更多（剩余 ${all.length - shown.length}）</button></div>`;
      }
    }
    host.innerHTML = html;
    const countEl = $('#atlas-result-count');
    if (countEl) countEl.textContent = `${fmtInt(count)} 张可见 · 共 ${fmtInt(all.length)}`;
  }

  /* ---------------- virtual cell ---------------- */
  async function renderVirtualOverview() {
    await ensureVirtual();
    const tabs = S.site.virtual_tabs;
    const coverage = S.site.coverage || {};
    const predN = (coverage.prediction_species || []).length;
    const trajN = (coverage.trajectory_species || []).length;
    const grnN = (coverage.grn_species || []).length;
    const pertN = (coverage.perturbation_species || []).length;
    const pipeline = S.virtual.figures.find((f) => f.tab === 'framework' && f.title.includes('三阶段')) || S.virtual.figures[0];
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Drought virtual cell · model</div>
            <h1 class="page-title">抗旱<em>虚拟细胞</em></h1>
            <p class="page-lead">
              从 21 物种单细胞图谱与 bulk 干旱数据出发，构建正常 → 干旱的虚拟细胞预测。这里把预测图、动态细胞状态轨迹、基因网络轨迹、规律发现、基因扰动与模型评估拆成可交互的子页面。
            </p>
          </div>
          <div class="page-actions">
            <a class="btn primary" href="#/virtual/prediction">进入干旱预测 ${ICONS.arrow}</a>
            <a class="btn ghost" href="#/virtual/evaluation">模型评估与边界</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(`${predN} / 21`, '物种预测')}
          ${statBox(`${trajN} 种`, '深度细胞轨迹')}
          ${statBox(`${grnN} 种`, '深度 GRN 轨迹')}
          ${statBox(`${pertN} 种`, '扰动物种')}
          ${statBox(S.virtual.figures.length, '虚拟细胞图件')}
          ${statBox('v8', '当前模型版本')}
        </div>

        <section class="section">
          <div class="section-head"><div><div class="section-kicker">Functions</div><h2 class="section-title">七个可交互功能</h2></div></div>
          <div class="virtual-grid">
            ${tabs.map((t) => `<a class="virtual-card" href="#/virtual/${encode(t.key)}">
              <span class="icon">${iconForTab(t.key)}</span>
              <h3>${esc(t.name)}</h3>
              <p>${esc(t.desc)}</p>
              <div class="foot"><span>${fmtInt(t.figure_count)} 图件</span><span>${t.key === 'framework' ? '模型结构' : '进入 ↗'}</span></div>
            </a>`).join('')}
          </div>
        </section>

        <section class="section">
          <div class="section-head"><div><div class="section-kicker">Architecture</div><h2 class="section-title">三阶段数据流</h2><p class="section-desc">原始结果图展示；点击可放大查看。网站不修改源目录中的任何文件。</p></div></div>
          ${pipeline ? bigFigureHTML(pipeline, 'virtual-overview-pipeline') : ''}
        </section>

        <section class="section">
          <div class="framework-steps">
            <div class="fw-step"><div class="n">01 · DATA</div><h4>多物种数据层</h4><p>21 物种 scRNA、bulk 干旱/对照、GRN 先验与直系同源群映射。</p></div>
            <div class="fw-step"><div class="n">02 · ALIGN</div><h4>跨物种对齐</h4><p>统一基因空间、潜空间对齐与跨物种信号质量评估。</p></div>
            <div class="fw-step"><div class="n">03 · MODEL</div><h4>虚拟细胞模型</h4><p>Transformer 编码、神经 ODE 轨迹与干旱上下文组合。</p></div>
            <div class="fw-step"><div class="n">04 · OUTPUT</div><h4>预测与扰动</h4><p>干旱单细胞预测、状态/网络轨迹、规律发现与基因扰动。</p></div>
          </div>
        </section>

        <div class="callout warn">
          <strong>模型边界：</strong>预测、轨迹、GRN 与扰动均为计算输出。v8 模型的外部验证仍有限；网站按原始评估结果展示，不将模型预测解释为已验证的生物学结论。
          <div style="margin-top:10px"><a class="btn tiny ghost" href="#/virtual/evaluation">查看完整评估 ${ICONS.arrow}</a></div>
        </div>
      </div>`;
  }

  function iconForTab(key) {
    if (key === 'prediction') return ICONS.spark;
    if (key === 'trajectory') return ICONS.chart;
    if (key === 'grn') return ICONS.network;
    if (key === 'pattern') return ICONS.layers;
    if (key === 'perturbation') return ICONS.flask;
    if (key === 'evaluation') return ICONS.book;
    return ICONS.cell;
  }

  function bigFigureHTML(rec, listKey = '') {
    if (!rec) return '';
    if (listKey) S.figureLists[listKey] = [rec];
    const src = displaySrc(rec);
    return `<div class="big-figure" ${listKey ? `data-fig-list="${esc(listKey)}" data-fig-index="0" role="button" tabindex="0"` : ''} style="cursor:${listKey ? 'pointer' : 'default'}">
      <div class="img-wrap">${src ? `<img src="${esc(src)}" alt="${esc(rec.title)}" loading="lazy">` : ''}</div>
      <div class="cap"><strong style="color:var(--text)">${esc(rec.title)}</strong> · ${esc(rec.caption || '')}</div>
    </div>`;
  }

  function virtualSidebar(activeKey) {
    return `<aside class="sidebar"><a class="side-back" href="#/virtual">← 虚拟细胞总览</a>${S.site.virtual_tabs.map((t) => `
      <a class="side-link ${t.key === activeKey ? 'active' : ''}" href="#/virtual/${encode(t.key)}">
        <span class="idx">${String(t.order + 1).padStart(2, '0')}</span>
        <span class="label">${esc(t.name)}</span>
        <span class="side-count">${fmtInt(t.figure_count)}</span>
      </a>`).join('')}</aside>`;
  }

  async function renderVirtualTab(tabKey) {
    const tab = S.tabByKey.get(tabKey);
    if (!tab) {
      view.innerHTML = `<div class="empty"><strong>未找到虚拟细胞功能</strong><span>${esc(tabKey)}</span><p style="margin-top:14px"><a class="btn" href="#/virtual">返回总览</a></p></div>`;
      return;
    }
    stopTrajectory();
    await ensureVirtual();
    const content = tabKey === 'framework' ? await virtualFramework()
      : tabKey === 'prediction' ? await virtualPrediction()
      : tabKey === 'trajectory' ? await virtualTrajectory()
      : tabKey === 'grn' ? await virtualGrn()
      : tabKey === 'pattern' ? await virtualPattern()
      : tabKey === 'perturbation' ? await virtualPerturbation()
      : await virtualEvaluation();
    view.innerHTML = `
      <div class="page">
        <div class="split">
          ${virtualSidebar(tabKey)}
          <div class="content">
            <div class="module-head">
              <div class="kicker">Virtual cell / ${esc(tabKey)}</div>
              <h2>${esc(tab.name)}</h2>
              <p>${esc(tab.desc)}</p>
              <div class="module-meta-row">
                <span class="chip"><span class="dot"></span>${fmtInt(tab.figure_count)} 图件</span>
                <span class="tag">${esc(coverageLabel(tabKey))}</span>
              </div>
            </div>
            ${content}
          </div>
        </div>
      </div>`;
  }

  function coverageLabel(key) {
    const c = S.site.coverage || {};
    if (key === 'prediction') return `${(c.prediction_species || []).length} / 21 物种`;
    if (key === 'trajectory') return `${(c.trajectory_species || []).length} 个物种深度轨迹`;
    if (key === 'grn') return `${(c.grn_species || []).length} 个物种深度 GRN`;
    if (key === 'perturbation') return `${(c.perturbation_species || []).length} 个物种 · ${(c.celloracle_datasets || []).length} 个 CellOracle 数据集`;
    if (key === 'evaluation') return 'v8 · 3 seeds';
    if (key === 'pattern') return '跨物种 · 条件 · bulk';
    return '21 species';
  }

  async function virtualFramework() {
    const figs = S.virtual.figures.filter((f) => f.tab === 'framework');
    const pipeline = figs.find((f) => f.title.includes('三阶段')) || figs[0];
    const framework = figs.find((f) => f.title.includes('基线模型')) || figs[1];
    const internal = (S.stats.v8?.internal || []);
    return `
      <section class="section" style="margin-top:22px">
        ${pipeline ? bigFigureHTML(pipeline, 'framework-pipeline') : ''}
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Model</div><h2 class="section-title">模型框架与阶段</h2><p class="section-desc">数据层、跨物种对齐层、虚拟细胞模型层与输出层。具体模型版本与评估边界见“模型评估与边界”。</p></div></div>
        <div class="framework-steps">
          <div class="fw-step"><div class="n">01 · INPUT</div><h4>多物种单细胞 + bulk</h4><p>21 物种表达矩阵、细胞类型注释、bulk 干旱/对照样本与 GRN 先验。</p></div>
          <div class="fw-step"><div class="n">02 · ALIGN</div><h4>直系同源群与潜空间</h4><p>跨物种共同基因、正交群映射、潜空间对齐与信号质量评估。</p></div>
          <div class="fw-step"><div class="n">03 · GENERATE</div><h4>干旱上下文生成</h4><p>Transformer 编码 + 神经 ODE 轨迹；在正常状态上施加干旱上下文。</p></div>
          <div class="fw-step"><div class="n">04 · READOUT</div><h4>预测 / 轨迹 / 扰动</h4><p>干旱单细胞、状态轨迹、GRN 时间序列与基因敲低/过表达模拟。</p></div>
        </div>
      </section>
      <section class="section">
        <div class="split" style="grid-template-columns:minmax(0,1fr) 360px">
          <div>${framework ? bigFigureHTML(framework, 'framework-model') : ''}</div>
          <div class="detail-panel">
            <div class="detail-head"><div><h3>模型版本 v8</h3><p>内部留出与外部验证</p></div></div>
            ${internal.length ? tableHTML(internal, [
              { key: 'variant', label: '变体', cls: 'gene' },
              { key: 'type_r', label: '类型 logFC 相关', cls: 'num', fmt: (v) => fixed(v, 3) },
              { key: 'spec_r', label: '类型特异部分相关', cls: 'num', fmt: (v) => fixed(v, 3) },
              { key: 'comp_r', label: '组成变化相关', cls: 'num', fmt: (v) => fixed(v, 3) },
            ]) : '<div class="callout">暂无内部评估表。</div>'}
            <div class="callout info" style="margin-top:12px">内部留出（GSE290214 第 4/8 天）表现较好；外部验证仍有限。这里是模型输出，不是实验证据。</div>
          </div>
        </div>
      </section>
      ${pipeline ? `<section class="section"><div class="callout"><strong>如何阅读：</strong>本网站把“原始结果图”和“模型交互”分开呈现。图件来自源目录；交互轨迹/网络数据由源 CSV/JSON 抽取，只写入网站目录，不改动源结果。</div></section>` : ''}`;
  }

  async function virtualPrediction() {
    const allPred = S.virtual.figures.filter((f) => f.tab === 'prediction');
    const speciesKeys = S.site.species.map((s) => s.key);
    if (S.species !== 'all' && S.species !== 'multi' && speciesKeys.includes(S.species)) {
      S.predictionSpecies = S.species;
    }
    if (!S.predictionSpecies || !speciesKeys.includes(S.predictionSpecies)) {
      S.predictionSpecies = 'arabidopsis';
    }
    const sp = S.predictionSpecies;
    const st = S.statsBySpecies.get(sp) || {};
    const figs = allPred.filter((f) => f.species === sp);
    const order = ['UMAP', 'TF 活性热图', '轨迹 PCA', 'Top 干旱'];
    figs.sort((a, b) => {
      const ia = order.findIndex((x) => a.title.includes(x));
      const ib = order.findIndex((x) => b.title.includes(x));
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const topTfs = (S.stats.top_tfs || {})[sp] || [];
    const speciesCards = S.stats.species.map((x) => {
      const umap = allPred.find((f) => f.species === x.key && f.title.includes('UMAP'));
      return `<button class="pred-species-card ${x.key === sp ? 'active' : ''}" data-action="pick-pred-species" data-value="${esc(x.key)}">
        <div class="thumb">${umap ? `<img src="${esc(thumbUrl(umap, 480))}" alt="${esc(x.name)} UMAP" loading="lazy">` : ''}</div>
        <div class="body">
          <div class="pred-species-title"><span class="code">${esc(x.code)}</span><strong>${esc(x.name)}</strong><span class="signal-dot ${signalClass(x.signal)}"></span></div>
          <div class="pred-species-meta"><span>${escapeNum(x.sig_tfs)} / ${escapeNum(x.n_tfs)} TF</span><span>${pct(x.sig_frac)}</span></div>
        </div>
      </button>`;
    }).join('');
    return `
      <section class="section" style="margin-top:22px">
        <div class="chart-card">
          <div class="chart-head">
            <div><div class="chart-title">21 物种干旱响应信号</div><div class="chart-sub">按显著 TF 比例排序；点击柱条切换下方物种详情。</div></div>
            <span class="tag teal">${(S.site.coverage.prediction_species || []).length} / 21 已生成预测</span>
          </div>
          <div id="prediction-bar-chart"></div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Species</div><h2 class="section-title">选择一个物种</h2><p class="section-desc">缩略图为该物种的预测 UMAP。点击卡片查看四张预测图与 Top TF 表。</p></div></div>
        <div class="pred-species-grid">${speciesCards}</div>
      </section>
      <section class="section">
        <div class="detail-panel">
          <div class="detail-head">
            <div><h3>${esc(st.name || speciesName(sp))} · 干旱预测</h3><p><i>${esc(st.latin || '')}</i> · ${signalPill(st.signal)}</p></div>
            <a class="btn tiny ghost" href="#/species/${encode(sp)}">物种档案 ${ICONS.arrow}</a>
          </div>
          <div class="stat-grid">
            ${statBox(fmtInt(st.sc_cells), '单细胞数')}
            ${statBox(fmtInt(st.n_tfs), '可评估 TF')}
            ${statBox(fmtInt(st.sig_tfs), '显著 TF')}
            ${statBox(pct(st.sig_frac), '显著比例')}
          </div>
          <div style="margin-top:16px">${figs.length ? figureGrid(figs, `pred-detail-${sp}`) : `<div class="empty"><strong>暂无该物种预测图</strong><span>可切换其他物种。</span></div>`}</div>
          <div style="margin-top:22px">
            <div class="subgroup-head"><h3>Top 干旱响应 TF</h3><span class="count">按 |Δ activity| 排序</span></div>
            ${topTfs.length ? tableHTML(topTfs.slice(0, 12), [
              { key: 'gene', label: 'TF / gene', cls: 'gene' },
              { key: 'family', label: '家族', fmt: (v) => v || '—' },
              { key: 'delta_tfa', label: 'Δ activity', cls: 'num', fmt: (v) => sci(v) },
              { key: 'abs_delta', label: '|Δ|', cls: 'num', fmt: (v) => sci(v) },
            ]) : '<div class="callout">该物种当前没有可用的 top TF 表；可能是信号等级为 NONE 或分析未产出显著 TF。</div>'}
          </div>
          <div class="callout info" style="margin-top:16px"><strong>解释：</strong>预测图为模型在正常细胞上施加干旱上下文后的输出。信号等级与显著 TF 比例来自 11_cross_species_analysis，不代表实验验证。</div>
        </div>
      </section>`;
  }

  function escapeNum(n) { return Number(n || 0).toLocaleString('zh-CN'); }

  function renderPredictionChart() {
    const host = $('#prediction-bar-chart');
    if (!host) return;
    const rows = [...S.stats.species].sort((a, b) => b.sig_frac - a.sig_frac);
    const max = Math.max(...rows.map((r) => r.sig_frac), 0.001);
    host.innerHTML = `<div class="bar-chart">${rows.map((r) => `
      <button class="bar-row" data-signal="${esc(r.signal)}" data-action="pick-pred-species" data-value="${esc(r.key)}" data-tip="${esc(`${r.name} · ${pct(r.sig_frac)} · ${r.sig_tfs}/${r.n_tfs} TF`)}">
        <span class="bar-label">${esc(r.name)}</span>
        <span class="bar-track"><span class="bar-fill" data-w="${Math.max(1.2, r.sig_frac / max * 100).toFixed(2)}"></span></span>
        <span class="bar-value">${pct(r.sig_frac)}</span>
      </button>`).join('')}</div>`;
    animateBars();
  }

  /* ---------------- trajectory ---------------- */
  async function virtualTrajectory() {
    await ensureInteractive();
    const d = S.interactive.rice_trajectory;
    const deep = S.virtual.figures.filter((f) => f.tab === 'trajectory');
    const preview = S.virtual.figures.filter((f) => f.tab === 'prediction' && f.title.includes('轨迹 PCA'));
    if (!d) {
      return `<div class="empty"><strong>没有轨迹交互数据</strong><span>请先运行数据生成脚本。</span></div>`;
    }
    return `
      <section class="section" style="margin-top:22px">
        <div class="traj-shell">
          <div class="traj-toolbar">
            <div class="traj-controls">
              <button class="chip-btn ${S.trajMode === 'latent' ? 'active' : ''}" data-action="traj-mode" data-value="latent">潜空间 UMAP</button>
              <button class="chip-btn ${S.trajMode === 'expr' ? 'active' : ''}" data-action="traj-mode" data-value="expr">表达空间 UMAP</button>
              <button class="chip-btn ${S.trajMode === 'pca' ? 'active' : ''}" data-action="traj-mode" data-value="pca">PCA</button>
            </div>
            <div class="traj-controls">
              <button class="btn tiny ghost" data-action="traj-play" id="traj-play">${ICONS.play} 播放</button>
              <span class="tag">水稻 · 11 个路标点</span>
            </div>
          </div>
          <div class="traj-canvas-wrap"><canvas id="traj-canvas" class="traj-canvas" aria-label="正常到干旱的细胞状态轨迹交互图"></canvas></div>
          <div class="slider-row">
            <label for="traj-time">时间</label>
            <input id="traj-time" type="range" min="0" max="10" step="1" value="${S.trajTime}">
            <span class="time-readout" id="traj-time-readout">${(S.trajTime / 10).toFixed(1)}</span>
          </div>
          <div class="traj-legend">
            <span class="legend-item"><span class="legend-swatch" style="background:#3ce0b2"></span>正常细胞</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#f1c96b"></span>干旱预测细胞</span>
            <span class="legend-item"><span class="legend-swatch" style="background:linear-gradient(90deg,#3ce0b2,#f1c96b);border-radius:2px"></span>轨迹路标点（颜色随时间）</span>
            <span class="legend-item" style="color:var(--dim)">滚轮/滑块查看轨迹 · 播放自动推进</span>
          </div>
        </div>
        <div class="callout info"><strong>解读：</strong>轨迹是模型潜空间/表达空间中的路标点序列，可用于探索正常到干旱的状态变化；不是实测时间序列。当前深度轨迹完成水稻，其余物种提供预测轨迹 PCA 概览。</div>
      </section>

      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Deep trajectory</div><h2 class="section-title">水稻 · 深度轨迹图件</h2><p class="section-desc">潜空间/表达空间散点、密度、方向箭头与 PCA 轨迹。</p></div></div>
        <div id="traj-deep-gallery"></div>
      </section>

      <section class="section">
        <div class="section-head"><div><div class="section-kicker">All species</div><h2 class="section-title">21 物种 · 预测轨迹 PCA</h2><p class="section-desc">每个物种的模型轨迹 PCA 概览；点击可切换全局物种筛选。</p></div></div>
        <div id="traj-preview-gallery"></div>
      </section>`;
  }

  function initTrajectory() {
    const canvas = $('#traj-canvas');
    if (!canvas) return;
    const d = S.interactive?.rice_trajectory;
    if (!d) return;
    S.trajChart = { canvas, data: d };
    const slider = $('#traj-time');
    if (slider) {
      slider.addEventListener('input', () => updateTrajTime(Number(slider.value)));
    }
    const deep = S.virtual.figures.filter((f) => f.tab === 'trajectory');
    const preview = S.virtual.figures.filter((f) => f.tab === 'prediction' && f.title.includes('轨迹 PCA'));
    const deepHost = $('#traj-deep-gallery');
    if (deepHost) deepHost.innerHTML = figureGrid(deep, 'traj-deep');
    const previewHost = $('#traj-preview-gallery');
    if (previewHost) previewHost.innerHTML = figureGrid(preview, 'traj-preview');
    drawTrajectory();
  }

  function drawTrajectory() {
    const c = S.trajChart;
    if (!c) return;
    const canvas = c.canvas;
    if (!canvas.isConnected) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width, h = rect.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pts = c.data.points;
    const mode = S.trajMode;
    const xi = mode === 'latent' ? 0 : mode === 'expr' ? 4 : 2;
    const yi = xi + 1;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p[xi]); maxX = Math.max(maxX, p[xi]);
      minY = Math.min(minY, p[yi]); maxY = Math.max(maxY, p[yi]);
    }
    const padX = (maxX - minX) * 0.06 || 1;
    const padY = (maxY - minY) * 0.08 || 1;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    const ml = 14, mr = 14, mt = 16, mb = 12;
    const sx = (x) => ml + ((x - minX) / (maxX - minX || 1)) * (w - ml - mr);
    const sy = (y) => h - mb - ((y - minY) / (maxY - minY || 1)) * (h - mt - mb);
    // grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(116,219,188,.07)';
    for (let i = 0; i <= 5; i++) {
      const x = ml + (i / 5) * (w - ml - mr);
      const y = mt + (i / 5) * (h - mt - mb);
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, h - mb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
    }
    // all waypoints faint
    for (const p of pts) {
      if (p[6] !== 2) continue;
      const t = p[7] < 0 ? 0 : p[7];
      const hue = 168 - 126 * clamp(t, 0, 1);
      ctx.fillStyle = `hsla(${hue},78%,58%,.16)`;
      ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 1.15, 0, Math.PI * 2); ctx.fill();
    }
    // normal / drought
    for (const p of pts) {
      if (p[6] === 0) {
        ctx.fillStyle = 'rgba(60,224,178,.30)';
        ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 1.15, 0, Math.PI * 2); ctx.fill();
      } else if (p[6] === 1) {
        ctx.fillStyle = 'rgba(241,201,107,.30)';
        ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 1.15, 0, Math.PI * 2); ctx.fill();
      }
    }
    // centroid path
    const sums = Array.from({ length: 11 }, () => ({ x: 0, y: 0, n: 0 }));
    for (const p of pts) {
      if (p[6] !== 2 || p[7] < 0) continue;
      const k = Math.round(p[7] * 10);
      if (k >= 0 && k < 11) { sums[k].x += p[xi]; sums[k].y += p[yi]; sums[k].n++; }
    }
    const centers = sums.map((s) => s.n ? [s.x / s.n, s.y / s.n] : null);
    ctx.save();
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = 'rgba(241,201,107,.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let started = false;
    centers.forEach((p) => {
      if (!p) return;
      const x = sx(p[0]), y = sy(p[1]);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
    centers.forEach((p, i) => {
      if (!p) return;
      const x = sx(p[0]), y = sy(p[1]);
      const hue = 168 - 126 * (i / 10);
      ctx.fillStyle = `hsla(${hue},82%,62%,.9)`;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      if (i === 0 || i === 10 || i === S.trajTime) {
        ctx.fillStyle = '#f5fffb';
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText(i === 10 ? '干旱 · t=1.0' : i === 0 ? '正常 · t=0' : `t=${(i / 10).toFixed(1)}`, x + 7, y - 6);
      }
    });
    // current time points
    const t = S.trajTime / 10;
    const hue = 168 - 126 * t;
    ctx.fillStyle = `hsla(${hue},88%,64%,.92)`;
    ctx.strokeStyle = 'rgba(245,255,251,.55)';
    ctx.lineWidth = .5;
    for (const p of pts) {
      if (p[6] === 2 && Math.abs((p[7] < 0 ? -1 : p[7]) - t) < .01) {
        ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 2.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    // labels
    ctx.fillStyle = 'rgba(157,186,176,.75)';
    ctx.font = '10px ui-monospace, monospace';
    const label = mode === 'latent' ? 'LATENT UMAP' : mode === 'expr' ? 'EXPRESSION UMAP' : 'PCA';
    ctx.fillText(label, 14, 18);
    // update readout / slider
    const readout = $('#traj-time-readout');
    if (readout) readout.textContent = (S.trajTime / 10).toFixed(1);
    const slider = $('#traj-time');
    if (slider) {
      slider.value = String(S.trajTime);
      slider.style.setProperty('--pct', `${(S.trajTime / 10) * 100}%`);
    }
  }

  function updateTrajTime(t) {
    S.trajTime = clamp(Math.round(t), 0, 10);
    drawTrajectory();
  }

  function toggleTrajectoryPlay() {
    if (S.trajPlaying) {
      stopTrajectory();
      return;
    }
    if (!S.trajChart) return;
    S.trajPlaying = true;
    if (S.trajTime >= 10) S.trajTime = 0;
    const btn = $('#traj-play');
    if (btn) btn.innerHTML = `${ICONS.pause} 暂停`;
    drawTrajectory();
    S.trajTimer = setInterval(() => {
      if (S.trajTime >= 10) {
        stopTrajectory();
        return;
      }
      updateTrajTime(S.trajTime + 1);
    }, 850);
  }

  function stopTrajectory() {
    if (S.trajTimer) clearInterval(S.trajTimer);
    S.trajTimer = null;
    S.trajPlaying = false;
    const btn = $('#traj-play');
    if (btn) btn.innerHTML = `${ICONS.play} 播放`;
  }

  /* ---------------- GRN trajectory ---------------- */
  const CHART_COLORS = ['#3ce0b2', '#f1c96b', '#70b8ff', '#ff8d7a', '#c39bff', '#8ce99a', '#ffb86b', '#67e8f9'];

  async function virtualGrn() {
    await ensureInteractive();
    const d = S.interactive.rice_grn;
    if (!d) return `<div class="empty"><strong>没有 GRN 交互数据</strong><span>请先运行数据生成脚本。</span></div>`;
    const valid = new Set(d.tfs);
    S.grnSelected = (S.grnSelected || []).filter((x) => valid.has(x));
    if (!S.grnSelected.length) S.grnSelected = d.tfs.slice(0, 4);
    const figs = S.virtual.figures.filter((f) => f.tab === 'grn');
    return `
      <section class="section" style="margin-top:22px">
        <div class="chart-card">
          <div class="chart-head">
            <div><div class="chart-title">TF 活性随干旱轨迹的变化</div><div class="chart-sub">水稻 · 11 个路标点 · 点击下方图例切换 TF</div></div>
            <span class="tag teal">${d.tfs.length} 个候选 TF</span>
          </div>
          <div class="line-chart-wrap"><svg id="grn-chart" class="line-chart" viewBox="0 0 900 330" preserveAspectRatio="xMidYMid meet" role="img" aria-label="水稻 GRN TF 活性轨迹"></svg></div>
          <div class="chart-legend" id="grn-legend"></div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Topology</div><h2 class="section-title">网络拓扑时间序列</h2><p class="section-desc">GRN 的平均出度、平均入度、熵与 hub 集中度随轨迹变化。</p></div></div>
        <div class="mini-grid" id="topology-mini"></div>
      </section>
      <section class="section">
        <div class="split" style="grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr)">
          <div>
            <div class="subgroup-head"><h3>Top 受调控基因</h3><span class="count">按平均边权重变化</span></div>
            ${d.top_genes?.length ? tableHTML(d.top_genes.slice(0, 15), [
              { key: 'gene', label: 'Gene index', cls: 'gene' },
              { key: 'mean_delta', label: 'Mean Δ edge', cls: 'num', fmt: (v) => sci(v) },
            ]) : '<div class="empty"><strong>暂无数据</strong></div>'}
          </div>
          <div class="detail-panel">
            <div class="detail-head"><div><h3>如何阅读</h3><p>计算推断，不是实验验证</p></div></div>
            <p style="color:var(--muted);font-size:11px;line-height:1.9">TF 活性由 GRN 模型在轨迹路标点上的打分得到；边权重与拓扑指标用于观察网络随时间的重塑。当前深度 GRN 轨迹只完成水稻。</p>
            <div class="callout info" style="margin-top:12px">GRN 轨迹图与 CSV 均来自 9_results_multispecies/grn_trajectory/rice。</div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Figures</div><h2 class="section-title">水稻 · GRN 轨迹图件</h2><p class="section-desc">TF 活性热图、边权重 Bump 图、拓扑时间序列与受调控基因。</p></div></div>
        ${figureGrid(figs, 'grn-figs')}
      </section>`;
  }

  function renderGrnChart() {
    const svg = $('#grn-chart');
    if (!svg) return;
    const d = S.interactive?.rice_grn;
    if (!d) return;
    const selected = S.grnSelected.filter((x) => d.series[x]);
    const n = d.times.length;
    const W = 900, H = 330, ml = 56, mr = 22, mt = 18, mb = 38;
    const iw = W - ml - mr, ih = H - mt - mb;
    const xFor = (i) => ml + (n <= 1 ? 0 : (i / (n - 1)) * iw);
    let min = Infinity, max = -Infinity;
    for (const tf of selected) {
      for (const v of d.series[tf]) {
        if (v === null || v === undefined) continue;
        min = Math.min(min, v); max = Math.max(max, v);
      }
    }
    if (!Number.isFinite(min)) { min = 0; max = 1; }
    const pad = (max - min) * 0.1 || 0.001;
    min -= pad; max += pad;
    const yFor = (v) => mt + ih - ((v - min) / (max - min || 1)) * ih;
    let out = '<g class="axis">';
    for (let i = 0; i <= 4; i++) {
      const y = mt + (i / 4) * ih;
      const val = max - (i / 4) * (max - min);
      out += `<line class="grid-line" x1="${ml}" y1="${y}" x2="${W - mr}" y2="${y}"/>`;
      out += `<text x="${ml - 8}" y="${y + 3}" text-anchor="end">${sci(val)}</text>`;
    }
    d.times.forEach((t, i) => {
      if (i !== 0 && i !== Math.floor((n - 1) / 2) && i !== n - 1) return;
      out += `<text x="${xFor(i)}" y="${H - 14}" text-anchor="middle">${t.toFixed(1)}</text>`;
    });
    out += `<text x="${ml}" y="${H - 2}" fill="var(--dim)" font-size="9">轨迹时间</text>`;
    out += '</g>';
    selected.forEach((tf, si) => {
      const color = CHART_COLORS[si % CHART_COLORS.length];
      const vals = d.series[tf];
      let path = '';
      vals.forEach((v, i) => {
        if (v === null || v === undefined) return;
        path += `${path ? 'L' : 'M'}${xFor(i).toFixed(2)},${yFor(v).toFixed(2)}`;
      });
      out += `<path class="line-path" d="${path}" stroke="${color}"/>`;
      vals.forEach((v, i) => {
        if (v === null || v === undefined) return;
        out += `<circle class="line-dot" cx="${xFor(i).toFixed(2)}" cy="${yFor(v).toFixed(2)}" r="3" fill="${color}"><title>${esc(tf)} · t=${d.times[i].toFixed(1)} · ${sci(v)}</title></circle>`;
      });
    });
    svg.innerHTML = out;
    const legend = $('#grn-legend');
    if (legend) {
      legend.innerHTML = d.tfs.map((tf, i) => {
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const on = S.grnSelected.includes(tf);
        return `<button class="legend-chip ${on ? '' : 'off'}" data-action="grn-tf" data-value="${esc(tf)}"><span class="swatch" style="background:${color}"></span>${esc(tf)}</button>`;
      }).join('');
    }
  }

  function sparklineSVG(values, color, w = 150, h = 40) {
    const clean = values.filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v))).map(Number);
    if (!clean.length) return '';
    const min = Math.min(...clean), max = Math.max(...clean);
    const pad = (max - min) * .12 || 1;
    const xFor = (i) => 3 + (i / Math.max(1, clean.length - 1)) * (w - 6);
    const yFor = (v) => 3 + (1 - (v - (min - pad)) / ((max + pad) - (min - pad))) * (h - 6);
    const path = clean.map((v, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderTopology() {
    const host = $('#topology-mini');
    if (!host) return;
    const rows = S.interactive?.rice_grn?.topology || [];
    if (!rows.length) { host.innerHTML = '<div class="empty"><strong>暂无拓扑数据</strong></div>'; return; }
    const metrics = [
      ['avg_outdeg', '平均出度', '#3ce0b2'],
      ['avg_indeg', '平均入度', '#70b8ff'],
      ['net_entropy', '网络熵', '#f1c96b'],
      ['hub_conc', 'Hub 集中度', '#ff8d7a'],
    ];
    host.innerHTML = metrics.map(([key, label, color]) => {
      const vals = rows.map((r) => r[key]);
      const last = vals[vals.length - 1];
      return `<div class="mini-chart"><div class="mini-title">${esc(label)}</div><div class="mini-val">${sci(last)}</div>${sparklineSVG(vals, color)}</div>`;
    }).join('');
  }

  /* ---------------- pattern discovery ---------------- */
  async function virtualPattern() {
    await ensureVirtual();
    const figs = S.virtual.figures.filter((f) => f.tab === 'pattern');
    const cats = Array.from(new Set(figs.map((f) => f.category))).sort();
    if (!cats.includes(S.patternCategory)) S.patternCategory = 'all';
    const shown = S.patternCategory === 'all' ? figs : figs.filter((f) => f.category === S.patternCategory);
    const rows = [...S.stats.species].sort((a, b) => b.sig_frac - a.sig_frac);
    return `
      <section class="section" style="margin-top:22px">
        <div class="chart-card">
          <div class="chart-head">
            <div><div class="chart-title">跨物种干旱信号强度</div><div class="chart-sub">显著 TF 比例（sig_frac）；点击物种进入档案。</div></div>
            <span class="tag teal">21 物种</span>
          </div>
          <div id="pattern-bar-chart"></div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Table</div><h2 class="section-title">物种级规律发现指标</h2><p class="section-desc">信号等级来自 11_cross_species_analysis；轨迹弧长与 TF 数量用于跨物种比较。</p></div></div>
        ${tableHTML(rows, [
          { key: 'name', label: '物种' },
          { key: 'signal', label: '信号', fmt: (v) => `<span class="signal-pill ${esc(v)}">${esc(v)}</span>`, html: true },
          { key: 'n_tfs', label: '可评估 TF', cls: 'num', fmt: fmtInt },
          { key: 'sig_tfs', label: '显著 TF', cls: 'num', fmt: fmtInt },
          { key: 'sig_frac', label: 'sig_frac', cls: 'num', fmt: pct },
          { key: 'traj_arc_len', label: '轨迹弧长', cls: 'num', fmt: (v) => sci(v) },
          { key: 'sc_cells', label: '单细胞数', cls: 'num', fmt: (v) => compact(v) },
        ])}
      </section>
      <section class="section">
        <div class="section-head">
          <div><div class="section-kicker">Figures</div><h2 class="section-title">正常 vs 干旱规律图件</h2><p class="section-desc">跨物种信号、数据覆盖、细胞状态条件关联与 bulk 干旱组成。</p></div>
          <div class="chart-controls">
            <button class="chip-btn ${S.patternCategory === 'all' ? 'active' : ''}" data-action="pattern-category" data-value="all">全部</button>
            ${cats.map((c) => `<button class="chip-btn ${S.patternCategory === c ? 'active' : ''}" data-action="pattern-category" data-value="${esc(c)}">${esc(c)}</button>`).join('')}
          </div>
        </div>
        ${figureGrid(shown, 'pattern-figs')}
      </section>
      <div class="callout info"><strong>解释：</strong>细胞状态与生态型、细胞通讯、bulk 反卷积均为计算推断；“正常 vs 干旱”的条件关联来自样本级/模型级比较，不能替代控制实验。</div>`;
  }

  function renderPatternChart() {
    const host = $('#pattern-bar-chart');
    if (!host) return;
    const rows = [...S.stats.species].sort((a, b) => b.sig_frac - a.sig_frac);
    const max = Math.max(...rows.map((r) => r.sig_frac), 0.001);
    host.innerHTML = `<div class="bar-chart">${rows.map((r) => `
      <button class="bar-row" data-signal="${esc(r.signal)}" data-action="go-species" data-value="${esc(r.key)}" data-tip="${esc(`${r.name} · ${pct(r.sig_frac)} · ${r.sig_tfs}/${r.n_tfs} TF`)}">
        <span class="bar-label">${esc(r.name)}</span>
        <span class="bar-track"><span class="bar-fill" data-w="${Math.max(1.2, r.sig_frac / max * 100).toFixed(2)}"></span></span>
        <span class="bar-value">${pct(r.sig_frac)}</span>
      </button>`).join('')}</div>`;
    animateBars();
  }

  /* ---------------- perturbation ---------------- */
  async function virtualPerturbation() {
    await Promise.all([ensureInteractive(), ensureVirtual()]);
    const allPert = S.virtual.figures.filter((f) => f.tab === 'perturbation');
    const celloracle = allPert.filter((f) => f.tags.includes('celloracle'));
    const datasets = Array.from(new Set(celloracle.map((f) => f.dataset).filter(Boolean))).sort();
    if (S.celloracleDataset !== 'all' && !datasets.includes(S.celloracleDataset)) S.celloracleDataset = 'all';
    const coracleShown = S.celloracleDataset === 'all' ? celloracle : celloracle.filter((f) => f.dataset === S.celloracleDataset);
    const riceEntries = (S.interactive?.perturbation?.rice || []).filter((p) => p.gene !== 'pert_now');
    const overview = (S.interactive?.perturbation?.rice || []).find((p) => p.gene === 'pert_now');
    if (!S.pertGene || !riceEntries.some((p) => p.gene === S.pertGene)) S.pertGene = riceEntries[0]?.gene || null;
    const entry = riceEntries.find((p) => p.gene === S.pertGene) || null;
    const pertRecs = entry ? entry.figures.map((f, i) => {
      const formats = f.formats || ['png'];
      return {
        id: `pert-${entry.gene}-${i}`, title: f.title, caption: '水稻模型扰动图件；模型内模拟，不是实验验证。',
        species: 'rice', organ: '', dataset: entry.gene, category: '水稻模型扰动', formats,
        png: f.png || (formats.includes('png') ? f.url : ''), jpg: f.jpg || '', thumb: f.thumb || '',
        pdf: f.pdf || '', svg: f.svg || '', source: '', sort: i, tags: ['perturbation'], module: 'virtual', tab: 'perturbation',
      };
    }) : [];
    return `
      <section class="section" style="margin-top:22px">
        <div class="section-head">
          <div><div class="section-kicker">CellOracle</div><h2 class="section-title">CellOracle 虚拟敲除</h2><p class="section-desc">在 GRN 模型上设置 TF 表达为 0，模拟细胞状态位移；覆盖 ${datasets.length} 个物种-器官数据集。不是实验证据。</p></div>
          <div class="chart-controls">
            <button class="chip-btn ${S.celloracleDataset === 'all' ? 'active' : ''}" data-action="celloracle-dataset" data-value="all">全部</button>
            ${datasets.map((d) => `<button class="chip-btn ${S.celloracleDataset === d ? 'active' : ''}" data-action="celloracle-dataset" data-value="${esc(d)}">${esc(datasetLabel(d))}</button>`).join('')}
          </div>
        </div>
        ${figureGrid(coracleShown, 'celloracle-figs')}
      </section>

      <section class="section">
        <div class="section-head">
          <div><div class="section-kicker">Rice perturbation</div><h2 class="section-title">水稻 · 模型扰动</h2><p class="section-desc">选择基因查看敲低/过表达后的 TF 活性、表达变化与潜空间位移。数值为模型内扰动分数。</p></div>
        </div>
        <div class="filter-chips">
          ${riceEntries.map((p) => `<button class="chip-btn ${S.pertGene === p.gene ? 'active' : ''}" data-action="pert-gene" data-value="${esc(p.gene)}">${esc(p.gene)}</button>`).join('')}
        </div>
        ${entry ? `
          <div class="detail-panel" style="margin-top:16px">
            <div class="detail-head"><div><h3>${esc(entry.gene)}</h3><p>${entry.figures.length} 张图 · ${Object.keys(entry.tables).length} 个数据表</p></div><span class="tag teal">模型扰动</span></div>
            ${figureGrid(pertRecs, `pert-gene-${entry.gene}`)}
            <div class="subgroup" style="margin-top:22px">
              ${renderPertTables(entry.tables)}
            </div>
          </div>` : `<div class="empty"><strong>暂无可选基因</strong></div>`}
        ${overview ? `<div class="subgroup" style="margin-top:24px"><div class="subgroup-head"><h3>扰动总览</h3><span class="count">方向罗盘 / 前后 PCA / 表达变化</span></div>${figureGrid(overview.figures.map((f, i) => { const formats = f.formats || ['png']; return { id: `pert-now-${i}`, title: f.title, caption: '扰动总览图件。', species: 'rice', organ: '', dataset: 'pert_now', category: '水稻模型扰动', formats, png: f.png || (formats.includes('png') ? f.url : ''), jpg: f.jpg || '', thumb: f.thumb || '', pdf: f.pdf || '', svg: f.svg || '', source: '', sort: i, tags: ['perturbation'], module: 'virtual', tab: 'perturbation' }; }), 'pert-now-figs')}</div>` : ''}
      </section>
      <div class="callout warn"><strong>边界：</strong>基因扰动效应为模型内模拟（敲低/过表达），不是实验验证；效应量可能很小，不能直接解释为真实生物学效应。</div>`;
  }

  function datasetLabel(d) {
    const parts = String(d).split('_');
    const sp = parts[0];
    return `${speciesName(sp)} · ${organName(parts.slice(1).join('_'))}`;
  }

  function renderPertTables(tables) {
    const defs = {
      top_changed: { title: 'Top 变化基因', cols: [
        { key: 'gene', label: 'Gene', cls: 'gene' },
        { key: 'gene_index', label: 'Index', cls: 'num' },
        { key: 'ko_delta', label: 'KO Δ', cls: 'num', fmt: (v) => sci(v) },
        { key: 'oe_delta', label: 'OE Δ', cls: 'num', fmt: (v) => sci(v) },
      ] },
      tf_activity: { title: 'TF 活性变化', cols: [
        { key: 'tf_name', label: 'TF', cls: 'gene' },
        { key: 'ko_delta', label: 'KO Δ', cls: 'num', fmt: (v) => sci(v) },
        { key: 'oe_delta', label: 'OE Δ', cls: 'num', fmt: (v) => sci(v) },
      ] },
      ko_downstream: { title: 'KO 下游变化', cols: [
        { key: 'gene_name', label: 'Gene', cls: 'gene' },
        { key: 'emb_change', label: 'Emb change', cls: 'num', fmt: (v) => sci(v) },
      ] },
      oe_downstream: { title: 'OE 下游变化', cols: [
        { key: 'gene_name', label: 'Gene', cls: 'gene' },
        { key: 'emb_change', label: 'Emb change', cls: 'num', fmt: (v) => sci(v) },
      ] },
      ko_signed: { title: 'KO signed change', cols: [
        { key: 'gene_name', label: 'Gene', cls: 'gene' },
        { key: 'signed_change', label: 'Signed', cls: 'num', fmt: (v) => sci(v) },
        { key: 'emb_change_norm', label: 'Emb change', cls: 'num', fmt: (v) => sci(v) },
      ] },
      oe_signed: { title: 'OE signed change', cols: [
        { key: 'gene_name', label: 'Gene', cls: 'gene' },
        { key: 'signed_change', label: 'Signed', cls: 'num', fmt: (v) => sci(v) },
        { key: 'emb_change_norm', label: 'Emb change', cls: 'num', fmt: (v) => sci(v) },
      ] },
    };
    const out = Object.entries(tables).map(([key, rows]) => {
      const def = defs[key];
      if (!def || !rows?.length) return '';
      return `<div class="subgroup" style="margin-top:16px"><div class="subgroup-head"><h3>${esc(def.title)}</h3><span class="count">前 ${Math.min(12, rows.length)} 行</span></div>${tableHTML(rows.slice(0, 12), def.cols)}</div>`;
    }).join('');
    return out || '<div class="callout">该基因当前只有图件，没有可展示的扰动表。</div>';
  }

  /* ---------------- model evaluation ---------------- */
  async function virtualEvaluation() {
    await ensureVirtual();
    const v8 = S.stats.v8 || { summary: [], internal: [] };
    const internal = v8.internal || [];
    const external = (v8.summary || []).filter((r) => r.context === 'oracle' || r.context === 'nobulk');
    const shownExternal = S.evalContext === 'all' ? external : external.filter((r) => r.context === S.evalContext);
    const phases = S.virtual.figures.filter((f) => f.tab === 'evaluation');
    return `
      <section class="section" style="margin-top:22px">
        <div class="split" style="grid-template-columns:minmax(0,1fr) 340px">
          <div>
            <div class="subgroup-head"><h3>内部留出（GSE290214 第 4/8 天）</h3><span class="count">3 seeds · 均值</span></div>
            ${internal.length ? tableHTML(internal, [
              { key: 'variant', label: '变体', cls: 'gene' },
              { key: 'type_r', label: '类型 logFC 相关', cls: 'num', fmt: (v) => heatValue(v, 3), html: true },
              { key: 'spec_r', label: '类型特异部分相关', cls: 'num', fmt: (v) => heatValue(v, 3), html: true },
              { key: 'comp_r', label: '组成变化相关', cls: 'num', fmt: (v) => heatValue(v, 3), html: true },
            ]) : '<div class="empty"><strong>暂无内部评估</strong></div>'}
          </div>
          <div class="detail-panel">
            <div class="detail-head"><div><h3>关键结论</h3><p>来自 8_checkpoints_multispecies/v8/RESULTS_20261023.md</p></div></div>
            <ul class="note-list">
              <li>阶段一达标：未见文库上的细胞类型 kNN 准确率 0.776，随机初始化 0.470。</li>
              <li>同一研究内部留出：sc_only / full 的类型特异部分相关约 0.53。</li>
              <li>迁移到其他研究时，类型特异相关接近 0，外部泛化仍有限。</li>
              <li>bulk 与单细胞干旱响应本身一致性较低（约 0.24）。</li>
            </ul>
            <div class="callout warn" style="margin-top:12px">因此：网站展示的预测与扰动均属于计算探索，不应作为实验结论。</div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-head">
          <div><div class="section-kicker">External</div><h2 class="section-title">外部验证指标</h2><p class="section-desc">情境 = 该研究自己的 pseudobulk logFC；“oracle”为给定 bulk 上下文，“nobulk”为由对照状态预测。</p></div>
          <div class="chart-controls">
            <button class="chip-btn ${S.evalContext === 'all' ? 'active' : ''}" data-action="eval-context" data-value="all">全部</button>
            <button class="chip-btn ${S.evalContext === 'oracle' ? 'active' : ''}" data-action="eval-context" data-value="oracle">oracle</button>
            <button class="chip-btn ${S.evalContext === 'nobulk' ? 'active' : ''}" data-action="eval-context" data-value="nobulk">nobulk</button>
          </div>
        </div>
        ${tableHTML(shownExternal, [
          { key: 'set', label: '验证集', cls: 'gene' },
          { key: 'context', label: '情境' },
          { key: 'variant', label: '变体', cls: 'gene' },
          { key: 'type_r', label: '类型 logFC 相关', cls: 'num', fmt: (v) => heatValue(v, 3), html: true },
          { key: 'spec_r', label: '类型特异部分相关', cls: 'num', fmt: (v) => heatValue(v, 3), html: true },
          { key: 'comp_r', label: '组成变化相关', cls: 'num', fmt: (v) => heatValue(v, 3), html: true },
          { key: 'shift', label: '位移恢复', cls: 'num', fmt: (v) => sci(v) },
        ])}
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">History</div><h2 class="section-title">历史阶段分析图件</h2><p class="section-desc">阶段一至阶段三的模型比较与评估过程；最新版本为 v8。</p></div></div>
        ${figureGrid(phases, 'eval-figs')}
      </section>
      <div class="callout warn"><strong>模型边界（完整表述）：</strong>内部留出表现好主要来自同一研究；外部验证的类型特异相关接近 0。bulk 与单细胞响应一致性低、训练研究单一，是当前主要限制。网站保留这些边界，避免把模型预测误读为已验证结论。</div>`;
  }

  function heatValue(v, digits = 3) {
    if (v === null || v === undefined || v === '') return '<span style="color:var(--dim)">—</span>';
    const n = Number(v);
    if (!Number.isFinite(n)) return '<span style="color:var(--dim)">—</span>';
    const a = clamp(Math.abs(n), 0, 1);
    const color = n >= 0 ? `rgba(60,224,178,${0.08 + a * 0.30})` : `rgba(255,141,122,${0.08 + a * 0.30})`;
    const text = n >= 0 ? '#bff5e5' : '#ffc3b8';
    return `<span style="display:inline-block;min-width:52px;padding:2px 6px;border-radius:4px;background:${color};color:${text}">${n.toFixed(digits)}</span>`;
  }

  /* ---------------- global gallery ---------------- */
  async function renderGallery() {
    await ensureAllFigures();
    const moduleOptions = [
      '<option value="all">全部模块</option>',
      `<optgroup label="单细胞图谱">${S.site.atlas_modules.map((m) => `<option value="atlas:${esc(m.key)}" ${S.gallery.module === `atlas:${m.key}` ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</optgroup>`,
      `<optgroup label="虚拟细胞">${S.site.virtual_tabs.map((t) => `<option value="virtual:${esc(t.key)}" ${S.gallery.module === `virtual:${t.key}` ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>`,
    ].join('');
    const catCounts = new Map();
    for (const f of S.allFigures) catCounts.set(f.category || '', (catCounts.get(f.category || '') || 0) + 1);
    const catOptions = ['<option value="all">全部类别</option>', ...Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<option value="${esc(c)}" ${S.gallery.category === c ? 'selected' : ''}>${esc(c || '未分类')} (${n})</option>`)].join('');
    const spOptions = [
      `<option value="auto" ${S.gallery.species === 'auto' ? 'selected' : ''}>跟随全局（${esc(speciesName(S.species))}）</option>`,
      `<option value="all" ${S.gallery.species === 'all' ? 'selected' : ''}>全部物种</option>`,
      `<option value="multi" ${S.gallery.species === 'multi' ? 'selected' : ''}>跨物种汇总</option>`,
      ...S.site.species.map((sp) => `<option value="${esc(sp.key)}" ${S.gallery.species === sp.key ? 'selected' : ''}>${esc(sp.name)}</option>`),
    ].join('');
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Gallery · ${fmtInt(S.allFigures.length)} entries · ${fmtInt(S.site.totals.figures)} unique</div>
            <h1 class="page-title">全图<em>库</em></h1>
            <p class="page-lead">跨单细胞图谱与虚拟细胞模块检索全部图件。每张卡片保留模块、物种、类别和图注；点击打开原图查看器，${S.site.mode === 'static' ? (S.site.pdf_enabled !== false ? '可切换 JPG / PDF 或打开原文件' : '可查看 JPG 原图或打开原文件') : '可切换 PNG / SVG / PDF 或复制源路径'}。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/atlas">图谱总览</a>
            <a class="btn ghost" href="#/virtual">虚拟细胞</a>
          </div>
        </div>

        <div class="filter-bar">
          <div class="filter-row">
            <div class="field grow">
              <label for="gallery-q">关键词</label>
              <input id="gallery-q" class="input" type="search" placeholder="标题、图注、物种、模块、文件名…" value="${esc(S.gallery.q)}">
            </div>
            <div class="field">
              <label for="gallery-scope">范围</label>
              <select id="gallery-scope" class="select" data-gallery-filter="scope">
                <option value="all" ${S.gallery.scope === 'all' ? 'selected' : ''}>全部</option>
                <option value="atlas" ${S.gallery.scope === 'atlas' ? 'selected' : ''}>单细胞图谱</option>
                <option value="virtual" ${S.gallery.scope === 'virtual' ? 'selected' : ''}>虚拟细胞</option>
              </select>
            </div>
            <div class="field">
              <label for="gallery-module">模块</label>
              <select id="gallery-module" class="select" data-gallery-filter="module">${moduleOptions}</select>
            </div>
            <div class="field">
              <label for="gallery-species">物种</label>
              <select id="gallery-species" class="select" data-gallery-filter="species">${spOptions}</select>
            </div>
            <div class="field">
              <label for="gallery-category">类别</label>
              <select id="gallery-category" class="select" data-gallery-filter="category">${catOptions}</select>
            </div>
            <div class="field">
              <label for="gallery-format">格式</label>
              <select id="gallery-format" class="select" data-gallery-filter="format">
                <option value="all" ${S.gallery.format === 'all' ? 'selected' : ''}>全部</option>
                <option value="png" ${S.gallery.format === 'png' ? 'selected' : ''}>PNG</option>
                <option value="svg" ${S.gallery.format === 'svg' ? 'selected' : ''}>SVG</option>
                <option value="pdf" ${S.gallery.format === 'pdf' ? 'selected' : ''}>PDF</option>
              </select>
            </div>
            <div class="field" style="align-self:flex-end">
              <button class="btn tiny ghost" data-action="gallery-clear">清空</button>
            </div>
          </div>
        </div>

        <div class="results-meta" id="gallery-count"></div>
        <div id="gallery-results"></div>
      </div>`;
    renderGalleryResults();
  }

  function galleryFiltered() {
    const effSpecies = S.gallery.species === 'auto' ? S.species : S.gallery.species;
    const q = S.gallery.q.trim().toLowerCase();
    let out = S.allFigures.slice();
    if (S.gallery.scope !== 'all') out = out.filter((f) => f.scope === S.gallery.scope);
    if (S.gallery.module !== 'all') {
      const [scope, key] = S.gallery.module.split(':');
      out = out.filter((f) => f.scope === scope && (scope === 'atlas' ? f.module === key : f.tab === key));
    }
    if (effSpecies !== 'all') {
      out = effSpecies === 'multi' ? out.filter((f) => f.species === 'multi') : out.filter((f) => f.species === effSpecies || f.species === 'multi');
    }
    if (S.gallery.category !== 'all') out = out.filter((f) => f.category === S.gallery.category);
    if (S.gallery.format !== 'all') out = out.filter((f) => (f.formats || []).includes(S.gallery.format));
    if (q) {
      out = out.filter((f) => {
        const text = [f.title, f.caption, f.category, f.organ, f.dataset, speciesName(f.species), scopeName(f), f.png, f.jpg, f.pdf, f.svg].join(' ').toLowerCase();
        return text.includes(q);
      });
    }
    return out;
  }

  function renderGalleryResults() {
    const host = $('#gallery-results');
    if (!host) return;
    const all = galleryFiltered();
    const visible = all.slice(0, S.gallery.limit);
    const count = $('#gallery-count');
    if (count) {
      count.innerHTML = `<strong>${fmtInt(all.length)}</strong> 个图件条目匹配 · 当前显示 ${fmtInt(visible.length)} · 物种：${esc(speciesName(S.gallery.species === 'auto' ? S.species : S.gallery.species))}`;
    }
    if (!visible.length) {
      host.innerHTML = `<div class="empty"><strong>没有匹配图件</strong><span>尝试清空关键词或切换物种范围。</span><p style="margin-top:14px"><button class="btn tiny" data-action="gallery-clear">清空筛选</button></p></div>`;
      return;
    }
    host.innerHTML = figureGrid(visible, 'gallery') + (all.length > visible.length ? `<div class="load-more"><button class="btn" data-action="gallery-more">加载更多（剩余 ${fmtInt(all.length - visible.length)}）</button></div>` : '');
  }

  /* ---------------- methods (static GitHub Pages) ---------------- */
  function renderMethodsStatic() {
    const totals = S.site.totals;
    const coverage = S.site.coverage;
    const repo = S.site.repo_url || '';
    const release = S.site.release_url || '';
    const hasPdf = S.site.pdf_enabled !== false;
    const isGitee = S.site.platform === 'gitee' || (repo || '').includes('gitee.com');
    const isCloudflare = S.site.platform === 'cloudflare';
    const platform = isCloudflare ? 'Cloudflare Pages' : isGitee ? 'Gitee Pages' : 'GitHub Pages';
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">方法与数据 · ${platform}</div>
            <h1 class="page-title">方法与<em>数据</em></h1>
            <p class="page-lead">这里汇总数据来源、图件规范、模型评估与引用信息。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/gallery">全图库</a>
            <a class="btn ghost" href="#/virtual/evaluation">模型边界</a>
          </div>
        </div>
        <div class="stat-grid">
          ${statBox(totals.species, '物种')}
          ${statBox(compact(totals.atlas_cells), '单细胞图谱')}
          ${statBox(compact(totals.bulk_samples), 'bulk 样本')}
          ${statBox(compact(totals.grn_edges), 'GRN 过滤边')}
          ${statBox(fmtInt(totals.figures), '唯一图件')}
          ${statBox((coverage.prediction_species || []).length, '预测物种')}
          ${statBox((coverage.celloracle_datasets || []).length, 'CellOracle 数据集')}
          ${statBox('v8', '模型版本')}
        </div>

        <section class="section">
          <div class="method-grid">
            <div class="method-block">
              <h3>数据布局</h3>
              <p>站点只保留展示所需的文件；原始结果目录不在仓库中。</p>
              <table class="path-table">
                <tr><td>media/full/</td><td>预览图，灯箱查看</td></tr>
                <tr><td>media/thumb/</td><td>卡片缩略图</td></tr>
                ${hasPdf ? '<tr><td>media/pdf/</td><td>有 PDF 的图件保留原始 PDF，可下载</td></tr>' : ''}
                <tr><td>data/</td><td>图件清单、统计、轨迹/GRN 交互数据</td></tr>
                <tr><td>assets/</td><td>页面样式与前端逻辑</td></tr>
              </table>
            </div>
            <div class="method-block">
              <h3>图件读取</h3>
              <p>每张卡片先加载 <code>media/thumb</code> 缩略图；打开灯箱后加载 <code>media/full</code> 预览图。所有路径都是相对路径，因此可以部署在仓库子路径下。</p>
              <p>如需完全原始分辨率，请使用下方数据包链接（如果已发布）。</p>
              ${release ? `<p><a class="btn tiny primary" href="${esc(release)}" target="_blank" rel="noopener">下载完整原始图件包</a></p>` : `<p class="tag gold">完整原始图件包可在代码托管平台的 Release/附件中提供</p>`}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="method-grid">
            <div class="method-block">
              <h3>${platform} 发布</h3>
              <p>仓库根目录即为站点，包含 <code>index.html</code>、<code>data/</code>、<code>media/</code> 与 <code>.nojekyll</code>。${isCloudflare ? '在 Cloudflare Pages 项目中直接上传 public_site 目录；构建输出目录为 /。' : isGitee ? '在仓库“服务 → Gitee Pages”中选择 main 分支根目录部署；Gitee Pages 可能需要实名认证。' : '在仓库 Settings → Pages 中选择从 main 分支根目录发布即可。'}</p>
              ${S.site.site_url ? `<p><a class="btn tiny primary" href="${esc(S.site.site_url)}" target="_blank" rel="noopener">打开在线站点</a></p>` : ''}
              ${repo ? `<p><a class="btn tiny ghost" href="${esc(repo)}" target="_blank" rel="noopener">打开代码仓库</a></p>` : ''}
            </div>
            <div class="method-block">
              <h3>更新方式</h3>
              <p>在本地 DroAIVC 结果更新后，重新运行静态导出脚本，然后把 <code>public_site</code> 内容推送到代码仓库。图件清单与交互数据会自动重新生成。</p>
              <p>本地 <code>AIVC_web/update_public.sh</code> 已封装“重扫 → 导出 → 提交 → 推送 → 等待 Pages”的完整流程。</p>
              <div class="callout info">数据规模：${fmtInt(totals.figures)} 张唯一图件；${(coverage.prediction_species || []).length} / 21 物种已有干旱预测；深度轨迹/GRN 轨迹当前完成水稻。</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="method-block">
            <h3>解释边界</h3>
            <ul class="note-list">
              <li>细胞通讯、拟时序、GRN 与基因扰动均为计算推断；模型输出不是实验证据。</li>
              <li>v8 模型的外部验证仍有限；网站保留原始评估指标，不将预测解释为已验证结论。</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <div class="callout"><strong>数据生成时间：</strong>${esc(formatDate(S.site.generated_at))} · 图件 ${fmtInt(totals.figures)} 张。</div>
        </section>
      </div>`;
  }

  /* ---------------- methods ---------------- */
  function renderMethods() {
    if (S.site.mode === 'static') { renderMethodsStatic(); return; }
    const totals = S.site.totals;
    const coverage = S.site.coverage;
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Methods & data</div>
            <h1 class="page-title">方法与<em>数据</em></h1>
            <p class="page-lead">这个门户只做索引、展示与交互，不修改 DroAIVC 源目录。所有图件通过 AIVC_web/files 下的软链接读取；缩略图按需生成在 AIVC_web/.cache。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/gallery">全图库</a>
            <a class="btn ghost" href="#/virtual/evaluation">模型边界</a>
          </div>
        </div>
        <div class="stat-grid">
          ${statBox(totals.species, '物种')}
          ${statBox(compact(totals.atlas_cells), '单细胞图谱')}
          ${statBox(compact(totals.bulk_samples), 'bulk 样本')}
          ${statBox(compact(totals.grn_edges), 'GRN 过滤边')}
          ${statBox(fmtInt(totals.figures), '图件条目')}
          ${statBox((coverage.prediction_species || []).length, '预测物种')}
          ${statBox((coverage.celloracle_datasets || []).length, 'CellOracle 数据集')}
          ${statBox('v8', '模型版本')}
        </div>

        <section class="section">
          <div class="method-grid">
            <div class="method-block">
              <h3>目录映射</h3>
              <p>网站位于 <code>AIVC_web/</code>，源结果保持在原位置。下列软链接只建立引用，不复制大文件。</p>
              <table class="path-table">
                <tr><td>4_scRNASeq_dataout</td><td>单细胞图谱与 00–14 分析模块</td></tr>
                <tr><td>10_inference_multispecies</td><td>21 物种干旱预测</td></tr>
                <tr><td>9_results_multispecies</td><td>轨迹、GRN、扰动、阶段评估</td></tr>
                <tr><td>11_cross_species_analysis</td><td>跨物种信号与 Top TF</td></tr>
                <tr><td>7_dataset_multispecies</td><td>建模数据覆盖与汇总</td></tr>
                <tr><td>12_baselines</td><td>基线模型框架</td></tr>
                <tr><td>8_checkpoints_multispecies/v8</td><td>v8 模型、评估表与结果说明</td></tr>
              </table>
            </div>
            <div class="method-block">
              <h3>图件读取与缩略图</h3>
              <p>页面中的 <code>/files/...</code> 指向软链接；<code>/thumb/...</code> 由本地 Python 服务器按需生成缩略图并缓存到 <code>.cache/thumbs</code>。原始 PNG / SVG / PDF 不被修改。</p>
              <table class="path-table">
                <tr><td>源目录</td><td><code>${esc(ROOT_PATH)}</code></td></tr>
                <tr><td>网站目录</td><td><code>AIVC_web/</code></td></tr>
                <tr><td>数据清单</td><td><code>AIVC_web/data/*.json</code></td></tr>
                <tr><td>软链接</td><td><code>AIVC_web/files/*</code></td></tr>
                <tr><td>缩略图缓存</td><td><code>AIVC_web/.cache/thumbs/</code></td></tr>
              </table>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="method-block">
            <h3>单细胞图谱流水线</h3>
            <p>00 质控/标准化 → 01 高变基因 → 02 PCA → 03 Harmony 批次校正 → 04 近邻图 → 05 UMAP → 06 Leiden 聚类 → 07 marker 与细胞类型注释 → 08 细胞组成 → 09 细胞类型 DEG 与功能富集 → 10 拟时序 → 11 基因调控网络 → 12 细胞通讯 → 13 细胞状态与生态型 → 14 bulk 反卷积。网站按模块保留每张图的图注、类别与源表路径。</p>
            <div class="callout info">单细胞图谱为 21 物种、5,427,550 个细胞的 release；建模数据集（7_dataset_multispecies）在 2026-10-23 刷新后包含 21 物种的单细胞与 bulk 汇总。两个数字在网站中分别标注。</div>
          </div>
        </section>

        <section class="section">
          <div class="method-grid">
            <div class="method-block">
              <h3>虚拟细胞模块</h3>
              <p>预测生成（10_inference_multispecies）覆盖 21 物种；动态细胞状态轨迹与 GRN 轨迹当前完成水稻（9_results_multispecies）；基因扰动包含水稻模型扰动与 CellOracle 虚拟敲除（6 个物种-器官数据集）。所有输出均为计算预测。</p>
              <div class="callout warn" style="margin-top:10px">v8 模型的外部验证仍有限。内部留出表现好，但迁移到其他研究时类型特异相关接近 0；bulk 与单细胞干旱响应一致性约 0.24。</div>
            </div>
            <div class="method-block">
              <h3>更新与启动</h3>
              <p>源结果更新后，重新扫描并生成 JSON：</p>
              <details class="fold" open><summary>命令</summary><div class="fold-body">
                <div class="lb-source">python3 AIVC_web/tools/build_site_data.py<br>cd AIVC_web && ./start.sh</div>
              </div></details>
              <p style="margin-top:12px">启动后打开 <code>http://127.0.0.1:8765/</code>。建议通过本地服务器访问，不要直接双击 HTML（浏览器会限制本地文件读取）。</p>
              <p style="margin-top:8px">同步到公开 GitHub Pages：运行 <code>./update_public.sh</code>，会重扫、导出静态图件、提交并推送。</p>
              <p>若需让局域网其他机器访问：<code>./start.sh --host 0.0.0.0 --port 8765</code>。</p>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="method-block">
            <h3>解释边界</h3>
            <ul class="note-list">
              <li>细胞通讯（LIANA + CellChat）是基于表达的推断；细胞不是独立生物学重复，不能作为因果或空间互作证据。</li>
              <li>拟时序/轨迹是计算排序，不是实测时间；模型轨迹是潜空间路标点。</li>
              <li>GRN、CellOracle 与基因扰动为模型内模拟；不是实验验证。</li>
              <li>v8 模型的外部验证仍有限；网站保留原始指标，不将模型输出解释为已验证结论。</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <div class="callout"><strong>生成时间：</strong>${esc(formatDate(S.site.generated_at))} · 图件 ${fmtInt(S.site.totals.figures)} 条 · 网站文件与源目录分离。</div>
        </section>
      </div>`;
  }
  let ROOT_PATH = 'DroAIVC 结果目录';

  /* ---------------- lightbox ---------------- */
  function openLightbox(list, index) {
    if (!list || !list.length) return;
    S.lightbox.list = list;
    S.lightbox.index = clamp(Number(index) || 0, 0, list.length - 1);
    S.lightbox.zoom = 1;
    S.lightbox.x = 0;
    S.lightbox.y = 0;
    const rec = list[S.lightbox.index];
    S.lightbox.format = rec.png ? 'png' : rec.jpg ? 'jpg' : rec.svg ? 'svg' : rec.pdf ? 'pdf' : '';
    renderLightbox();
    const lb = $('#lightbox');
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    body.classList.add('lb-open');
  }

  function closeLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    body.classList.remove('lb-open');
    $('#lb-media').innerHTML = '';
  }

  function renderLightbox() {
    const lb = S.lightbox;
    const rec = lb.list[lb.index];
    if (!rec) return;
    const kicker = $('#lb-kicker');
    const title = $('#lb-title');
    if (kicker) kicker.textContent = `${scopeName(rec)} · ${rec.category || ''}`;
    if (title) title.textContent = rec.title;
    const meta = $('#lb-meta');
    if (meta) {
      meta.innerHTML = [
        `<span class="tag teal">${esc(speciesName(rec.species))}</span>`,
        rec.organ ? `<span class="tag">${esc(organName(rec.organ))}</span>` : '',
        rec.dataset ? `<span class="tag">${esc(rec.dataset)}</span>` : '',
        `<span class="tag">${esc(formatLabel(rec))}</span>`,
      ].filter(Boolean).join('');
    }
    const cap = $('#lb-caption');
    if (cap) cap.textContent = rec.caption || '（无图注）';
    const srcWrap = $('#lb-source-wrap');
    if (srcWrap) {
      const src = rec.source || '';
      srcWrap.innerHTML = src ? `<details><summary>源路径 / 数据表</summary><div class="lb-source">${src.split(';').filter(Boolean).map((s) => esc(s)).join('<br>')}</div></details>` : '';
    }
    const formats = $('#lb-formats');
    if (formats) {
      formats.innerHTML = ['png', 'jpg', 'svg', 'pdf'].filter((k) => rec[k]).map((k) => `<button class="btn tiny ${lb.format === k ? 'primary' : 'ghost'}" data-action="lb-format" data-value="${k}">${k.toUpperCase()}</button>`).join('') + (fullSrc(rec) ? `<a class="btn tiny ghost" href="${esc(fullSrc(rec))}" target="_blank" rel="noopener">打开原文件</a>` : '');
    }
    const counter = $('#lb-counter');
    if (counter) counter.textContent = `${lb.index + 1} / ${lb.list.length}`;
    renderLightboxMedia();
  }

  function renderLightboxMedia() {
    const lb = S.lightbox;
    const rec = lb.list[lb.index];
    const media = $('#lb-media');
    if (!rec || !media) return;
    const hint = $('#lb-hint');
    let format = lb.format;
    if (!rec[format]) format = rec.png ? 'png' : rec.jpg ? 'jpg' : rec.svg ? 'svg' : rec.pdf ? 'pdf' : '';
    lb.format = format;
    if (!format) {
      media.innerHTML = '<div class="pdf-fallback"><strong>没有可预览格式</strong><p>请复制源路径查看原始文件。</p></div>';
      return;
    }
    updateLbFormatButtons();
    if (format === 'pdf') {
      media.innerHTML = `<iframe src="${esc(rec.pdf)}#toolbar=0&navpanes=0&view=FitH" title="${esc(rec.title)}"></iframe>`;
      if (hint) hint.textContent = 'PDF 预览 · 可用右侧按钮切换格式或复制源路径';
      return;
    }
    const src = rec[format];
    media.innerHTML = `<img src="${esc(src)}" alt="${esc(rec.title)}" draggable="false">`;
    if (hint) hint.textContent = '滚轮缩放 · 拖动平移 · 双击切换 1× / 2×';
    const img = $('img', media);
    if (img) {
      img.addEventListener('error', () => {
        media.innerHTML = `<div class="pdf-fallback"><strong>预览加载失败</strong><p>${esc(src)}</p><p><a class="btn tiny" href="${esc(src)}" target="_blank" rel="noopener">打开原文件</a></p></div>`;
      });
      applyLightboxTransform();
    }
    updateLbFormatButtons();
  }

  function updateLbFormatButtons() {
    $$('#lb-formats .btn').forEach((b) => {
      b.classList.toggle('primary', b.dataset.value === S.lightbox.format);
      b.classList.toggle('ghost', b.dataset.value !== S.lightbox.format);
    });
  }

  function applyLightboxTransform() {
    const img = $('#lb-media img');
    if (!img) return;
    img.style.transform = `translate(${S.lightbox.x}px, ${S.lightbox.y}px) scale(${S.lightbox.zoom})`;
  }

  function zoomLightbox(delta) {
    if (S.lightbox.format === 'pdf') return;
    S.lightbox.zoom = clamp(S.lightbox.zoom + delta, 0.4, 6);
    applyLightboxTransform();
  }

  function resetLightboxZoom() {
    S.lightbox.zoom = 1;
    S.lightbox.x = 0;
    S.lightbox.y = 0;
    applyLightboxTransform();
  }

  function moveLightbox(delta) {
    const lb = S.lightbox;
    if (!lb.list.length) return;
    lb.index = (lb.index + delta + lb.list.length) % lb.list.length;
    lb.zoom = 1; lb.x = 0; lb.y = 0;
    const rec = lb.list[lb.index];
    lb.format = rec.png ? 'png' : rec.jpg ? 'jpg' : rec.svg ? 'svg' : rec.pdf ? 'pdf' : '';
    renderLightbox();
  }

  async function copyLightboxPath() {
    const rec = S.lightbox.list[S.lightbox.index];
    if (!rec) return;
    const text = rec.source || fullSrc(rec);
    try {
      await navigator.clipboard.writeText(text);
      toast('已复制源路径');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('已复制源路径');
    }
  }

  /* ---------------- command palette ---------------- */
  async function buildCommandEntries() {
    if (S.command.entries) return S.command.entries;
    const entries = [];
    const pages = [
      ['首页', '', 'DroAIVC 总览'],
      ['单细胞图谱', 'atlas', '21 物种单细胞分析'],
      ['虚拟细胞', 'virtual', '干旱预测、轨迹、GRN、扰动'],
      ['全图库', 'gallery', '检索全部图件'],
      ['方法与数据', 'methods', '目录、软链接、模型边界'],
    ];
    for (const [title, path, sub] of pages) entries.push({ type: 'page', title, sub, href: path, key: path });
    for (const m of S.site.atlas_modules) entries.push({ type: 'module', title: m.name, sub: `${m.group} · ${m.figure_count} 图件`, key: m.key, href: `atlas/${m.key}`, text: `${m.name} ${m.desc} ${m.group}` });
    for (const t of S.site.virtual_tabs) entries.push({ type: 'tab', title: t.name, sub: `虚拟细胞 · ${t.figure_count} 图件`, key: t.key, href: `virtual/${t.key}`, text: `${t.name} ${t.desc}` });
    for (const sp of S.site.species) entries.push({ type: 'species', title: sp.name, sub: `${sp.latin} · ${sp.code}`, key: sp.key, href: `species/${sp.key}`, text: `${sp.name} ${sp.latin} ${sp.code}` });
    const figs = await ensureAllFigures();
    figs.forEach((f, i) => {
      entries.push({
        type: 'figure', title: f.title, sub: `${speciesName(f.species)} · ${scopeName(f)} · ${f.category || ''}`,
        allIndex: i, text: [f.title, f.caption, f.category, f.organ, f.dataset, speciesName(f.species), scopeName(f), f.png].join(' '),
      });
    });
    S.command.entries = entries;
    return entries;
  }

  function commandScore(entry, q) {
    const title = (entry.title || '').toLowerCase();
    const sub = (entry.sub || '').toLowerCase();
    const text = (entry.text || '').toLowerCase();
    let score = 0;
    if (title === q) score += 100;
    else if (title.startsWith(q)) score += 60;
    else if (title.includes(q)) score += 38;
    if (sub.includes(q)) score += 24;
    if (text.includes(q)) score += 8;
    if (entry.type === 'page') score += 6;
    if (entry.type === 'module') score += 4;
    if (entry.type === 'tab') score += 4;
    if (entry.type === 'species') score += 3;
    return score;
  }

  async function openCommand() {
    const el = $('#command');
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    body.classList.add('command-open');
    const input = $('#command-input');
    if (input) { input.value = ''; input.focus(); }
    const host = $('#command-results');
    if (host) host.innerHTML = '<div class="empty" style="padding:28px"><strong>正在载入图件索引…</strong></div>';
    await buildCommandEntries();
    renderCommandResults('');
  }

  function closeCommand() {
    const el = $('#command');
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    body.classList.remove('command-open');
    S.command.active = 0;
  }

  function renderCommandResults(query) {
    const host = $('#command-results');
    if (!host) return;
    const q = query.trim().toLowerCase();
    let results;
    if (!S.command.entries) {
      host.innerHTML = '<div class="empty" style="padding:28px"><strong>正在载入图件索引…</strong></div>';
      buildCommandEntries().then(() => renderCommandResults(query));
      return;
    }
    if (!q) {
      results = S.command.entries.filter((e) => ['page', 'module', 'tab'].includes(e.type)).slice(0, 12);
    } else {
      results = S.command.entries
        .map((e) => ({ e, score: commandScore(e, q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 28)
        .map((x) => x.e);
    }
    S.command.results = results;
    S.command.active = clamp(S.command.active, 0, Math.max(0, results.length - 1));
    if (!results.length) {
      host.innerHTML = `<div class="empty" style="padding:30px"><strong>没有匹配结果</strong><span>试试物种名、模块名或图件标题。</span></div>`;
      return;
    }
    host.innerHTML = results.map((e, i) => {
      const icon = e.type === 'figure' ? '图' : e.type === 'species' ? '种' : e.type === 'module' ? '模' : e.type === 'tab' ? '虚' : '页';
      return `<button class="command-item ${i === S.command.active ? 'active' : ''}" data-command-index="${i}">
        <span class="ci-icon">${icon}</span>
        <span class="ci-main"><span class="ci-title">${esc(e.title)}</span><span class="ci-sub">${esc(e.sub || '')}</span></span>
      </button>`;
    }).join('');
  }

  function selectCommand(index) {
    const e = S.command.results[index];
    if (!e) return;
    if (e.type === 'figure') {
      closeCommand();
      openLightbox(S.allFigures, e.allIndex);
      return;
    }
    closeCommand();
    if (e.type === 'page') go(e.href);
    else if (e.type === 'module') go(e.href);
    else if (e.type === 'tab') go(e.href);
    else if (e.type === 'species') go(e.href);
  }

  function moveCommand(delta) {
    if (!S.command.results.length) return;
    S.command.active = (S.command.active + delta + S.command.results.length) % S.command.results.length;
    $$('#command-results .command-item').forEach((el, i) => {
      el.classList.toggle('active', i === S.command.active);
      if (i === S.command.active) el.scrollIntoView({ block: 'nearest' });
    });
  }

  /* ---------------- global events ---------------- */
  const debouncedAtlasSearch = debounce(() => { if (S.atlasModule && $('#atlas-results')) renderAtlasResults(S.atlasModule); }, 160);
  const debouncedGallerySearch = debounce(() => { S.gallery.limit = 60; renderGalleryResults(); }, 180);
  const debouncedDrawTrajectory = debounce(() => drawTrajectory(), 80);

  function handleAction(action, el, event) {
    const value = el.dataset.value || '';
    switch (action) {
      case 'toggle-species': {
        const p = $('#species-popover');
        if (!p) return;
        p.hidden = !p.hidden;
        if (!p.hidden) {
          const input = $('#species-search');
          if (input) { input.value = S.speciesQuery; input.focus(); }
        }
        break;
      }
      case 'toggle-nav': {
        const nav = $('#main-nav');
        if (nav) nav.classList.toggle('open');
        break;
      }
      case 'open-command': openCommand(); break;
      case 'close-command': closeCommand(); break;
      case 'coverage-metric':
        S.coverageMetric = value;
        renderCoverageChart();
        break;
      case 'atlas-category':
        S.atlasCategory = value;
        S.atlasLimit = 36;
        if (S.atlasModule) location.hash = `#/atlas/${encode(S.atlasModule)}?cat=${encode(value)}`;
        break;
      case 'atlas-more':
        S.atlasLimit += 36;
        if (S.atlasModule) renderAtlasResults(S.atlasModule);
        break;
      case 'atlas-clear-search':
        S.atlasQuery = '';
        S.atlasLimit = 36;
        { const input = $('#atlas-search'); if (input) input.value = ''; }
        if (S.atlasModule) renderAtlasResults(S.atlasModule);
        break;
      case 'pick-pred-species':
        S.predictionSpecies = value;
        if (value && value !== 'all' && value !== 'multi') {
          S.species = value;
          localStorage.setItem('droaivc.species', value);
          updateSpeciesTrigger();
        }
        history.replaceState(null, '', `#/virtual/prediction?sp=${encode(value)}`);
        renderRoute();
        break;
      case 'traj-mode':
        S.trajMode = value;
        $$('.chip-btn[data-action="traj-mode"]').forEach((b) => b.classList.toggle('active', b.dataset.value === value));
        drawTrajectory();
        break;
      case 'traj-play':
        toggleTrajectoryPlay();
        break;
      case 'grn-tf': {
        const on = S.grnSelected.includes(value);
        if (on) S.grnSelected = S.grnSelected.filter((x) => x !== value);
        else {
          if (S.grnSelected.length >= 6) { toast('最多同时显示 6 条 TF 曲线'); return; }
          S.grnSelected.push(value);
        }
        renderGrnChart();
        break;
      }
      case 'pattern-category':
        S.patternCategory = value;
        renderRoute();
        break;
      case 'pert-gene':
        S.pertGene = value;
        renderRoute();
        break;
      case 'celloracle-dataset':
        S.celloracleDataset = value;
        renderRoute();
        break;
      case 'eval-context':
        S.evalContext = value;
        renderRoute();
        break;
      case 'open-atlas-species':
        { const spKey = el.dataset.species || value;
          if (spKey) {
            S.species = spKey;
            localStorage.setItem('droaivc.species', spKey);
            updateSpeciesTrigger();
          }
          if (el.dataset.module) go(`atlas/${el.dataset.module}`); }
        break;
      case 'go-species':
        if (value) go(`species/${value}`);
        break;
      case 'gallery-more':
        S.gallery.limit += 36;
        renderGalleryResults();
        break;
      case 'gallery-clear':
        S.gallery = { q: '', scope: 'all', module: 'all', species: 'auto', category: 'all', format: 'all', limit: 36 };
        renderRoute();
        break;
      case 'lb-prev': moveLightbox(-1); break;
      case 'lb-next': moveLightbox(1); break;
      case 'lb-close': closeLightbox(); break;
      case 'lb-zoom-in': zoomLightbox(0.2); break;
      case 'lb-zoom-out': zoomLightbox(-0.2); break;
      case 'lb-reset': resetLightboxZoom(); break;
      case 'lb-copy': copyLightboxPath(); break;
      case 'lb-format':
        S.lightbox.format = value;
        renderLightboxMedia();
        break;
      default:
        break;
    }
  }

  function wireGlobalEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-lightbox]')) { closeLightbox(); return; }
      if (e.target.closest('[data-close-command]')) { closeCommand(); return; }
      const cmd = e.target.closest('[data-command-index]');
      if (cmd) { selectCommand(Number(cmd.dataset.commandIndex)); return; }
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) { e.preventDefault(); handleAction(actionEl.dataset.action, actionEl, e); return; }
      const spOpt = e.target.closest('[data-species-option]');
      if (spOpt) {
        const key = spOpt.dataset.speciesOption;
        const nav = spOpt.dataset.speciesNav === '1';
        setSpecies(key, nav ? { navigate: `species/${key}` } : {});
        return;
      }
      const fig = e.target.closest('[data-fig-list]');
      if (fig) {
        const list = S.figureLists[fig.dataset.figList] || [];
        openLightbox(list, Number(fig.dataset.figIndex) || 0);
        return;
      }
      const goEl = e.target.closest('[data-go]');
      if (goEl) { e.preventDefault(); go(goEl.dataset.go); return; }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'atlas-search') {
        S.atlasQuery = e.target.value;
        S.atlasLimit = 36;
        debouncedAtlasSearch();
      } else if (e.target.id === 'gallery-q') {
        S.gallery.q = e.target.value;
        debouncedGallerySearch();
      } else if (e.target.id === 'command-input') {
        S.command.active = 0;
        renderCommandResults(e.target.value);
      }
    });

    document.addEventListener('change', (e) => {
      const filter = e.target.closest('[data-gallery-filter]');
      if (filter) {
        S.gallery[filter.dataset.galleryFilter] = filter.value;
        S.gallery.limit = 36;
        renderGalleryResults();
      }
    });

    document.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if ($('#command').classList.contains('open')) closeCommand();
        else openCommand();
        return;
      }
      if (e.key === 'Escape') {
        if ($('#lightbox').classList.contains('open')) { closeLightbox(); return; }
        if ($('#command').classList.contains('open')) { closeCommand(); return; }
        const pop = $('#species-popover');
        if (pop && !pop.hidden) { pop.hidden = true; return; }
      }
      if ($('#command').classList.contains('open')) {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveCommand(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveCommand(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); selectCommand(S.command.active); }
        return;
      }
      if ($('#lightbox').classList.contains('open')) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); moveLightbox(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); moveLightbox(1); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomLightbox(0.2); }
        else if (e.key === '-') { e.preventDefault(); zoomLightbox(-0.2); }
        else if (e.key === '0') { e.preventDefault(); resetLightboxZoom(); }
      }
    });

    window.addEventListener('hashchange', renderRoute);
    window.addEventListener('resize', debouncedDrawTrajectory);

    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t) return;
      showTooltip(t.dataset.tip, e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => {
      const t = e.target.closest('[data-tip]');
      if (t) showTooltip(t.dataset.tip, e.clientX, e.clientY);
      else hideTooltip();
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-tip]')) hideTooltip();
    });

    document.addEventListener('error', (e) => {
      const img = e.target;
      if (!img || img.tagName !== 'IMG' || img.dataset.failed) return;
      img.dataset.failed = '1';
      const media = img.closest('.fig-media');
      if (media) {
        img.style.display = 'none';
        if (!media.querySelector('.placeholder')) {
          const d = document.createElement('div');
          d.className = 'placeholder';
          d.innerHTML = '<strong>预览不可用</strong><span>点击打开原始文件</span>';
          media.appendChild(d);
        }
      }
    }, true);

    // lightbox drag / wheel
    const media = $('#lb-media');
    if (media) {
      let dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;
      media.addEventListener('pointerdown', (e) => {
        const img = e.target.closest('img');
        if (!img) return;
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        baseX = S.lightbox.x; baseY = S.lightbox.y;
        media.classList.add('dragging');
        media.setPointerCapture?.(e.pointerId);
      });
      media.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        S.lightbox.x = baseX + (e.clientX - startX);
        S.lightbox.y = baseY + (e.clientY - startY);
        applyLightboxTransform();
      });
      media.addEventListener('pointerup', () => { dragging = false; media.classList.remove('dragging'); });
      media.addEventListener('pointercancel', () => { dragging = false; media.classList.remove('dragging'); });
      media.addEventListener('wheel', (e) => {
        if (S.lightbox.format === 'pdf') return;
        e.preventDefault();
        zoomLightbox(e.deltaY > 0 ? -0.12 : 0.12);
      }, { passive: false });
      media.addEventListener('dblclick', () => {
        if (S.lightbox.format === 'pdf') return;
        if (S.lightbox.zoom > 1.2) resetLightboxZoom();
        else { S.lightbox.zoom = 2; applyLightboxTransform(); }
      });
    }
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    try {
      const [site, stats] = await Promise.all([loadJSON('site.json'), loadJSON('stats.json')]);
      S.site = site;
      S.stats = stats;
      ROOT_PATH = site.source_root || ROOT_PATH;
      S.speciesByKey = new Map(site.species.map((s) => [s.key, s]));
      S.statsBySpecies = new Map(stats.species.map((s) => [s.key, s]));
      S.moduleByKey = new Map(site.atlas_modules.map((m) => [m.key, m]));
      S.tabByKey = new Map(site.virtual_tabs.map((t) => [t.key, t]));
      if (S.species !== 'all' && S.species !== 'multi' && !S.speciesByKey.has(S.species)) {
        S.species = 'all';
      }
      renderTopbar();
      const footer = $('#footer-generated');
      if (footer) footer.textContent = `数据生成 ${formatDate(site.generated_at)}`;
      wireGlobalEvents();
      await renderRoute();
      // Preload the heavy indexes after first paint.
      setTimeout(() => { ensureAllFigures().catch((err) => console.warn('preload', err)); }, 900);
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="empty" style="margin-top:12vh"><strong>无法载入数据</strong><span>${esc(err.message || err)}</span><p style="margin-top:14px">请确认通过 <code>./start.sh</code> 启动本地服务器，并在 AIVC_web 目录下运行。</p></div>`;
    }
  }

  boot();
})();
