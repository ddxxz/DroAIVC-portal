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
    regulatory: null,
    inferenceMeta: null,
    inferenceAnalysis: null,
    modelPerformance: null,
    iaSpecies: null,
    iaOrgan: 'all',
    iaSection: 'all',
    iaModule: 'all',
    inference: { jobId: localStorage.getItem('droaivc.inference.job') || '', timer: null, started: 0 },
    perturb: { jobId: localStorage.getItem('droaivc.perturb.job') || '', timer: null, started: 0, polling: false, searchTimer: null },
    perturbCount: 1,
    allFigures: null,
    speciesByKey: new Map(),
    statsBySpecies: new Map(),
    moduleByKey: new Map(),
    tabByKey: new Map(),
    species: localStorage.getItem('droaivc.species') || 'all',
    speciesQuery: '',
    route: { name: 'home', module: null, tab: null },
    pendingScroll: null,
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

  const FRAMEWORK_FIGS = [
    {
      id: 'fw_overall', module: 'virtual', tab: 'framework', species: 'multi', category: '模型框架',
      title: 'DroAIVC 模型总体框架',
      caption: '正常单细胞 → 模块一正常状态编码 → 模块二干旱轨迹 · ODE → 模块三干旱单细胞生成；下方为虚拟基因扰动层（NetPerturber）。',
      method: '模块一（M2）把每个正常细胞编码为 TF 活性 a 与 4 维自由变量 f；模块二（D3）从 a(0) 出发，按 TF → TF 先验边积分干旱 ODE，并把解码权重随 τ 重连；模块三在每个细胞自身真实计数上施加 log 倍数 r(τ) 后重采样；扰动层通过模块一的 TF → 基因权重把任意基因 KO / OE 映射为 TF 活性入口，再沿模块二轨迹传播。',
      result: '正式模型为模块一 M2 + 模块二 D3 final；21 物种共享 TF → TF 调控，其余基因层网络按物种各自先验。模型输出为计算预测，不是实验证据。',
      png: 'assets/framework/overall.jpg', thumb: 'assets/framework/thumbs/overall.jpg', formats: ['jpg'], ar: 1.777,
    },
    {
      id: 'fw_module1', module: 'virtual', tab: 'framework', species: 'multi', category: '模块一 · 正常状态',
      title: '模块一 · 正常状态编码（M2）',
      caption: 'TF 活性 a = c · e + p；物种特异输入层 + 跨物种共享编码器；解码器只在先验边上取值的 TF → 基因权重 Ŵ = W ⊙ M。',
      method: '编码器第一层按物种，输入为该物种 4,000 个高变表达基因 + 全部 TF 基因；后续层跨物种共享，输出物种特异的翻译后修正 p 与 4 维自由变量 f。解码器为单层线性：logits = b + a · Ŵ + f · V̂，负二项似然。',
      result: '21 物种验证集每基因负二项损失 0.2394；[a, f] 空间 15 近邻细胞类型准确率平均 0.742；拟南芥 ChIP / 文献边 AUROC 0.534。5 个物种（香蕉、大麦、西兰花、花生、小麦）网络很弱。',
      png: 'assets/framework/module1_state.jpg', thumb: 'assets/framework/thumbs/module1_state.jpg', formats: ['jpg'], ar: 1.777,
    },
    {
      id: 'fw_module2', module: 'virtual', tab: 'framework', species: 'multi', category: '模块二 · 干旱轨迹',
      title: '模块二 · 干旱轨迹（D3）',
      caption: 'TF 活性按调控 ODE 从正常状态走到干旱终点；解码权重随 τ 重连，并叠加类型偏离、组成变化与 bulk 不动点校准。',
      method: '状态 z = [a, f]，dΔa/dτ = S + tanh(Δa · (K ⊙ M_tf)) − δ ⊙ Δa；K 只在 TF → TF 先验边上取值并跨物种共享。解码 Ŵ(τ) = W + τ · ΔW，叠加网络外类型偏离 R(h,k)、组成权重 γ(h,k) 与群体校准 A。',
      result: '留出研究上每类 logFC r = 0.697，类型特异 r = 0.041；能量距离 0.539，组成 JS 相对值 0.776。类型特异增益很小，与“各类型同样变化”基线接近。',
      png: 'assets/framework/module2_dynamics.jpg', thumb: 'assets/framework/thumbs/module2_dynamics.jpg', formats: ['jpg'], ar: 1.777,
    },
    {
      id: 'fw_module3', module: 'virtual', tab: 'framework', species: 'multi', category: '模块三 · 生成',
      title: '模块三 · 干旱单细胞生成',
      caption: '在每个细胞自己的真实计数 X0 上施加干旱 log 倍数 r(τ)，再按二项稀疏 / 泊松补充重采样，保留原始细胞差异与测序噪声。',
      method: '按原组成从匹配物种与器官的正常单细胞中抽取不超过 5,000 个细胞；模型给出每个细胞每个基因的 log 倍数 r(τ)，期望计数为 X0 ⊙ exp(r(τ))；下调走二项稀疏、上调走泊松补充；非表达基因按 s(τ) × bulk logFC 处理。',
      result: '输出为带原始计数尺度与细胞组成的干旱单细胞 h5ad；τ = 0.25–1 可调。生成结果由真实 bulk 与留出干旱单细胞评价，不是实验验证。',
      png: 'assets/framework/module3_generation.jpg', thumb: 'assets/framework/thumbs/module3_generation.jpg', formats: ['jpg'], ar: 1.777,
    },
    {
      id: 'fw_perturbation', module: 'virtual', tab: 'framework', species: 'multi', category: '扰动层',
      title: '扰动层 · NetPerturber',
      caption: '任意表达基因 KO / OE → TF 活性改变 → TF 间级联 3 步 → 扰动后的正常细胞 → 沿模块二轨迹得到扰动后的干旱细胞。',
      method: 'TF 直接干预：KO 令 Δa_t = −a_t，OE 令表达 F 倍；非 TF 基因通过一步共表达映射到 TF；随后在模块一的 TF → TF 权重上做 3 步级联。交付预测器另含 T（方向 / 幅度）、g（通用响应分数）与 N（候选靶基因排序）。',
      result: '正常状态扰动按批次预注册检验；干旱扰动为探索性预测。扰动验证见图 3.2.9（哪些基因会变、变化方向与幅度）。',
      png: 'assets/framework/perturbation.jpg', thumb: 'assets/framework/thumbs/perturbation.jpg', formats: ['jpg'], ar: 1.777,
    },
  ];
  const FRAMEWORK_OVERALL = FRAMEWORK_FIGS[0];
  const FRAMEWORK_MODULES = FRAMEWORK_FIGS.slice(1);

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
    if (rec.module === 'bulk') return '批量转录组';
    if (rec.module === 'single-cell') return '单细胞转录组';
    if (rec.module === 'drought') return '干旱细胞规律';
    if (rec.module === 'model') return '模型性能';
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
  async function ensureLandscape() { if (!S.landscape) S.landscape = await loadJSON('landscape.json'); return S.landscape; }
  async function ensureResults() { if (!S.results) S.results = await loadJSON('results.json'); return S.results; }
  async function ensureRegulatory() { if (!S.regulatory) S.regulatory = await loadJSON('regulatory.json'); return S.regulatory; }
  async function ensureInferenceMeta() {
    if (!S.inferenceMeta) {
      const r = await fetch(`data/inference_meta.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`inference_meta.json: ${r.status}`);
      S.inferenceMeta = await r.json();
    }
    return S.inferenceMeta;
  }
  async function ensureInferenceAnalysis() {
    if (!S.inferenceAnalysis) S.inferenceAnalysis = await loadJSON('inference_analysis.json');
    return S.inferenceAnalysis;
  }
  async function ensureModelPerformance() {
    if (!S.modelPerformance) S.modelPerformance = await loadJSON('model_performance.json');
    return S.modelPerformance;
  }
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
    return `<div class="fig-grid ${opts.className || ''}">${records.map((r, i) => figureCard(r, listKey, i)).join('')}</div>`;
  }

  /* ---------------- topbar ---------------- */
  function renderTopbar() {
    const top = $('#topbar');
    const nav = [
      ['home', '首页', ''],
      ['data', '数据', 'data'],
      ['virtual', '抗旱虚拟细胞', 'virtual'],
      ['drought', '干旱细胞规律', 'drought'],
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
      const active = k === name
        || (name === 'species' && k === 'data')
        || (['atlas','bulk','single','regulatory'].includes(name) && k === 'data')
        || (name === 'design' && k === 'virtual')
        || (name === 'gallery' && k === 'gallery');
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
    if (S.inference.timer) { clearInterval(S.inference.timer); S.inference.timer = null; }
    S.inference.polling = false;
    if (S.perturb.timer) { clearInterval(S.perturb.timer); S.perturb.timer = null; }
    S.perturb.polling = false;
    const { parts, params } = parseHash();
    let route = { name: 'home', module: null, tab: null };
    if (parts[0] === 'atlas') {
      route = { name: 'atlas', module: parts[1] || null, tab: null };
      if (parts[1]) {
        S.atlasModule = parts[1];
        S.atlasCategory = params.get('cat') || 'all';
        S.atlasQuery = params.get('q') || '';
      }
    } else if (parts[0] === 'data') {
      route = { name: 'data', module: null, tab: null };
    } else if (parts[0] === 'bulk') {
      route = { name: 'bulk', module: null, tab: null };
    } else if (parts[0] === 'single-cell') {
      route = { name: 'single', module: null, tab: null };
    } else if (parts[0] === 'regulatory') {
      route = { name: 'regulatory', module: null, tab: null };
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
    } else if (parts[0] === 'drought') {
      route = { name: 'drought', module: null, tab: null };
    } else if (parts[0] === 'design') {
      route = { name: 'design', module: null, tab: null };
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
      else if (route.name === 'data') await renderData();
      else if (route.name === 'bulk') await renderBulk();
      else if (route.name === 'single') await renderSingle();
      else if (route.name === 'regulatory') await renderRegulatory();
      else if (route.name === 'atlas') await (route.module ? renderAtlasModule(route.module) : renderAtlasOverview());
      else if (route.name === 'virtual') await (route.tab ? renderVirtualTab(route.tab) : renderVirtualOverview());
      else if (route.name === 'gallery') await renderGallery();
      else if (route.name === 'methods') renderMethods();
      else if (route.name === 'drought') await renderDrought();
      else if (route.name === 'design') await renderDesign();
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
    if (S.pendingScroll) {
      const targetId = S.pendingScroll;
      S.pendingScroll = null;
      const align = () => {
        const target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      requestAnimationFrame(align);
      setTimeout(align, 700);
      setTimeout(align, 1800);
    }
  }

  function pageTitle(route) {
    const base = 'DroAIVC · 节水抗旱虚拟细胞';
    if (route.name === 'data') return `数据层 · ${base}`;
    if (route.name === 'bulk') return `批量转录组 · ${base}`;
    if (route.name === 'single') return `单细胞转录组 · ${base}`;
    if (route.name === 'regulatory') return `调控关系 · ${base}`;
    if (route.name === 'atlas') return `${route.module ? (S.moduleByKey.get(route.module)?.name || '图谱') + ' · ' : ''}单细胞图谱 · ${base}`;
    if (route.name === 'virtual') return `${route.tab ? (S.tabByKey.get(route.tab)?.name || '虚拟细胞') + ' · ' : ''}虚拟细胞 · ${base}`;
    if (route.name === 'gallery') return `全图库 · ${base}`;
    if (route.name === 'methods') return `方法与数据 · ${base}`;
    if (route.name === 'drought') return `干旱细胞规律 · ${base}`;
    if (route.name === 'design') return `耐旱状态设计 · ${base}`;
    if (route.name === 'species') return `${speciesName(route.species)} · ${base}`;
    return base;
  }

  /* ---------------- home ---------------- */
  async function renderHome() {
    const [L, MP] = await Promise.all([
      ensureLandscape(),
      ensureModelPerformance().catch(() => null),
    ]);
    const totals = S.site.totals;
    const perfStats = MP?.stats || {};
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
              汇集 21 个物种的单细胞转录组图谱、干旱/对照 bulk 数据与先验调控关系，把质控、注释、轨迹、基因调控网络、细胞通讯与虚拟细胞模型放在同一个可交互门户中。
            </p>
            <div class="hero-actions">
              <a class="btn primary" href="#/atlas">进入单细胞图谱 ${ICONS.arrow}</a>
              <a class="btn ghost" href="#/virtual/prediction">查看 21 物种干旱预测</a>
              <a class="btn ghost" href="#/gallery">检索全图库</a>
            </div>
            <div class="hero-stats">
              <div class="stat"><div class="stat-value">${totals.species}<span class="unit">种</span></div><div class="stat-label">物种覆盖</div></div>
              <div class="stat"><div class="stat-value">${compact(totals.atlas_cells)}<span class="unit">cells</span></div><div class="stat-label">单细胞图谱</div></div>
              <div class="stat"><div class="stat-value">${compact(L.bulk.total_samples)}<span class="unit">bulk</span></div><div class="stat-label">bulk 样本（全量）</div></div>
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
            <div><div class="section-kicker">01 · Data</div><h2 class="section-title">数据底座：批量、单细胞与调控关系</h2><p class="section-desc">三条主线入口：批量转录组（正常/干旱）、单细胞转录组（全物种、单物种、单器官）与初始 TF–靶基因调控关系。</p></div>
            <a class="btn tiny ghost" href="#/data">进入数据层 ${ICONS.arrow}</a>
          </div>
          <div class="data-entry-grid">
            ${moduleCard('bulk', '批量转录组', '全量正常/干旱 bulk RNA-seq；结果图覆盖 21 物种，提供全部物种汇总与单物种结果。', `${fmtInt(L.bulk.total_samples)} 样本`, '#/bulk', ICONS.layers)}
            ${moduleCard('single', '单细胞转录组', '21 物种正常单细胞图谱；提供全部物种、单物种与单器官结果。', `${compact(L.normal_sc.cells)} cells`, '#/single-cell', ICONS.cell)}
            ${moduleCard('regulatory', '调控关系', '21 物种已知 TF–靶基因先验关系；展示原始/过滤边、TF 匹配与单物种、全物种汇总。', `${compact(S.site.totals.grn_edges)} 边`, '#/regulatory', ICONS.network)}
          </div>
        </section>

        <section class="section" id="home-model">
          <div class="section-head">
            <div><div class="section-kicker">02 · Model</div><h2 class="section-title">模型框架与性能</h2><p class="section-desc">正式模型 = 模块一 M2 + 模块二 D3 final：从正常单细胞编码到干旱轨迹与单细胞生成，再加扰动层；性能评价覆盖基线、消融、留出研究、网络证据与扰动验证。</p></div>
            <a class="btn tiny ghost" href="#/data">进入模型部分 ${ICONS.arrow}</a>
          </div>
          <div class="home-model-grid">
            <a class="home-model-card" href="#/data" data-scroll-target="model-framework">
              <div class="hmc-body">
                <div class="hmc-top"><span class="hmc-icon">${ICONS.layers}</span><span class="hmc-kicker">Model framework</span></div>
                <h3>模型框架</h3>
                <p>正常状态编码 → 干旱轨迹 ODE → 干旱单细胞生成；扰动层支持任意基因 KO / OE，并沿轨迹传播到干旱状态。</p>
                <div class="hmc-stats">
                  <div><b>21</b><span>物种</span></div>
                  <div><b>4,942</b><span>TF 基因</span></div>
                  <div><b>3.42M</b><span>先验边</span></div>
                  <div><b>475k</b><span>表达基因</span></div>
                </div>
                <div class="hmc-tags"><span>模块一 M2</span><span>模块二 D3</span><span>模块三生成</span><span>NetPerturber</span></div>
              </div>
            </a>
            <a class="home-model-card" href="#/data" data-scroll-target="model-performance">
              <div class="hmc-body">
                <div class="hmc-top"><span class="hmc-icon">${ICONS.chart}</span><span class="hmc-kicker">Model performance</span></div>
                <h3>模型性能</h3>
                <p>5 项留出研究上的基线方法比较与关键模块消融，并覆盖网络证据、组成/解卷积、种子稳定性、适用范围与扰动验证。</p>
                <div class="hmc-stats">
                  <div><b>${perfStats.heldout_studies || 5}</b><span>留出研究</span></div>
                  <div><b>${perfStats.ablations || 5}</b><span>消融版本</span></div>
                  <div><b>${perfStats.seeds || 3}</b><span>随机种子</span></div>
                  <div><b>${perfStats.figures || 17}</b><span>评价图件</span></div>
                </div>
                <div class="hmc-tags"><span>基线</span><span>消融</span><span>留出研究</span><span>扰动验证</span></div>
              </div>
            </a>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">03 · Virtual cell</div><h2 class="section-title">抗旱虚拟细胞：预测、扰动与设计</h2><p class="section-desc">输入正常/干旱 bulk 与正常单细胞，输出干旱单细胞、扰动效应和耐旱状态候选。</p></div>
            <a class="btn tiny ghost" href="#/virtual">进入虚拟细胞 ${ICONS.arrow}</a>
          </div>
          <div class="virtual-grid">
            <a class="virtual-card" href="#/virtual/prediction">
              <span class="icon">${ICONS.spark}</span>
              <h3>单细胞转录组生成</h3>
              <p>输入正常/干旱 bulk 与正常 scRNA，生成干旱单细胞转录组；覆盖 21 物种。</p>
              <div class="foot"><span>${L.virtual.prediction_species} 物种 · ${fmtInt(L.virtual.prediction_figures)} 图</span><span>进入 ↗</span></div>
            </a>
            <a class="virtual-card" href="#/virtual/perturbation">
              <span class="icon">${ICONS.flask}</span>
              <h3>基因扰动效应</h3>
              <p>CellOracle 虚拟敲除与模型扰动：TF 活性、表达变化与潜空间位移。</p>
              <div class="foot"><span>${L.virtual.perturbation_species} 物种 · ${fmtInt(L.virtual.perturbation_figures)} 图</span><span>进入 ↗</span></div>
            </a>
            <a class="virtual-card" href="#/design">
              <span class="icon">${ICONS.layers}</span>
              <h3>耐旱状态设计</h3>
              <p>以目标耐旱状态为约束，结合 GRN 与扰动候选生成设计建议。</p>
              <div class="foot"><span>设计入口 · 工作流</span><span>进入 ↗</span></div>
            </a>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">04 · Drought cell patterns</div><h2 class="section-title">干旱细胞规律</h2><p class="section-desc">把正常图谱的分析逻辑迁移到干旱 scRNA：QC → HVG → PCA → Harmony → 聚类 → 注释 → DEG → 拟时序 → GRN → 通讯 → 状态 → 反卷积。</p></div>
            <a class="btn tiny ghost" href="#/drought">进入干旱细胞规律 ${ICONS.arrow}</a>
          </div>
          <div class="drought-band">
            <div class="drought-stats">
              <div class="drought-stat"><b>${L.drought_sc.species}</b><span>实测干旱物种</span></div>
              <div class="drought-stat"><b>${compact(L.drought_sc.cells)}</b><span>干旱 scRNA 细胞</span></div>
              <div class="drought-stat"><b>${L.drought_sc.datasets}</b><span>数据集</span></div>
              <div class="drought-stat"><b>${L.drought_sc.cell_types}</b><span>细胞类型</span></div>
              <div class="drought-stat"><b>${compact(L.drought_sc.control_cells)}</b><span>对照细胞</span></div>
              <div class="drought-stat"><b>${compact(L.drought_sc.drought_cells)}</b><span>干旱细胞</span></div>
            </div>
            <div class="drought-modules">
              ${L.drought_sc.modules.slice(0, 8).map((m) => `<span class="drought-chip">${esc(m.name)}</span>`).join('')}
              <span class="drought-chip more">+ 其余 ${L.drought_sc.modules.length - 8} 模块</span>
            </div>
            <div class="drought-note">首批实测：拟南芥 / 水稻 / 大豆；其余 18 物种由虚拟细胞预测，见“单细胞转录组生成”。</div>
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

  async function renderData() {
    const [L, reg, V, MP] = await Promise.all([
      ensureLandscape(),
      ensureRegulatory().catch(() => null),
      ensureVirtual().catch(() => null),
      ensureModelPerformance().catch(() => null),
    ]);
    const regTotals = reg?.totals || { raw_edges: 0, filtered_edges: S.site.totals.grn_edges };
    const fw = (V?.figures || []).filter((f) => f.tab === 'framework');
    const pipeline = fw.find((f) => f.title.includes('三阶段')) || fw[0];
    const perf = MP || { stats: {}, modules: [], key_tables: [], figures: [], summary: '' };
    const perfFigs = perf.figures || [];
    const baselineFigs = perfFigs.filter((f) => f.module_key === '326_baselines' || f.module_key === '327_ablations');
    const otherFigs = perfFigs.filter((f) => !baselineFigs.includes(f));
    const keyTables = perf.key_tables || [];
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Data layer · bulk + single-cell + regulation</div>
            <h1 class="page-title">数据层：批量、单细胞与<em>调控关系</em></h1>
            <p class="page-lead">数据底座包含三条主线：批量转录组（正常/干旱）、单细胞转录组（正常图谱）与初始调控关系（已知 TF–靶基因）。批量与单细胞均含全部物种与单物种结果；调控关系展示 21 物种的先验边、TF 匹配与单物种、全物种汇总。页面后部给出正式模型（模块一 M2 + 模块二 D3 final）的框架与性能：基线、消融、留出研究、网络证据与扰动验证。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/methods">数据来源与方法</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(fmtInt(L.bulk.total_samples), 'bulk 总样本')}
          ${statBox(fmtInt(L.bulk.total_control_samples), '正常 bulk')}
          ${statBox(fmtInt(L.bulk.total_drought_samples), '干旱 bulk')}
          ${statBox(compact(L.normal_sc.cells), '正常 scRNA 细胞')}
          ${statBox(L.normal_sc.modules, '分析模块')}
          ${statBox(compact(regTotals.filtered_edges), '先验调控边')}
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Three tracks</div><h2 class="section-title">三部分，三个入口</h2><p class="section-desc">批量转录组看全物种与单物种的 bulk 结果；单细胞转录组看全物种、单物种与单器官结果；调控关系看先验 TF–靶基因边与匹配统计。</p></div>
          </div>
          <div class="data-entry-grid">
            ${moduleCard('bulk', '批量转录组', '全量正常/干旱 bulk RNA-seq；结果图覆盖 21 物种，提供全部物种汇总与单物种结果。', `${fmtInt(L.bulk.total_samples)} 样本`, '#/bulk', ICONS.layers)}
            ${moduleCard('single', '单细胞转录组', '21 物种正常单细胞图谱；提供全部物种、单物种与单器官结果。', `${compact(L.normal_sc.cells)} cells`, '#/single-cell', ICONS.cell)}
            ${moduleCard('regulatory', '调控关系', '21 物种已知 TF–靶基因先验关系；展示原始/过滤边、TF 匹配与单物种、全物种汇总。', `${compact(regTotals.filtered_edges)} 边`, '#/regulatory', ICONS.network)}
          </div>
        </section>

        <section class="section">
          <div class="callout info">
            <strong>数值口径：</strong>全量 bulk 样本 ${fmtInt(L.bulk.total_samples)} 个（正常 ${fmtInt(L.bulk.total_control_samples)} / 干旱 ${fmtInt(L.bulk.total_drought_samples)}）。其中 21 物种可用清单 ${fmtInt(L.bulk.all_species_samples)} 个（正常 ${fmtInt(L.bulk.all_species_control)} / 干旱 ${fmtInt(L.bulk.all_species_drought)}）；虚拟细胞建模输入 ${fmtInt(L.bulk.model_samples)} 个（正常 ${fmtInt(L.bulk.control_samples)} / 干旱 ${fmtInt(L.bulk.drought_samples)}）。正常单细胞图谱 ${compact(L.normal_sc.cells)} 个细胞、${L.normal_sc.modules} 个分析模块。初始调控关系覆盖 ${regTotals.species || S.site.totals.species} 个物种，原始 ${compact(regTotals.raw_edges)} 条边、匹配后 ${compact(regTotals.filtered_edges)} 条边。
          </div>
        </section>

        <section class="section" id="model-framework">
          <div class="section-head">
            <div><div class="section-kicker">Model framework</div><h2 class="section-title">模型框架</h2><p class="section-desc">从多物种正常单细胞与 bulk 情境，到跨物种共享的 TF → 基因调控、干旱轨迹与单细胞生成，再到预测、轨迹、GRN 与扰动输出。正式模型为模块一 M2 + 模块二 D3 final。</p></div>
            <a class="btn tiny ghost" href="#/virtual/framework">完整框架 ${ICONS.arrow}</a>
          </div>
          ${bigFigureHTML(FRAMEWORK_OVERALL, 'data-framework-overall')}
          <div class="framework-steps" style="margin-top:18px">
            <div class="fw-step"><div class="n">01 · INPUT</div><h4>多物种单细胞 + bulk</h4><p>21 物种正常单细胞图谱、细胞类型注释、bulk 干旱/对照样本、bulk 时间序列与 GRN 先验。</p></div>
            <div class="fw-step"><div class="n">02 · STATE</div><h4>正常状态编码</h4><p>模块一 M2：TF 活性 a = c·e + p，加 4 维自由变量 f；只在先验边上学习 TF → 基因权重。</p></div>
            <div class="fw-step"><div class="n">03 · TRAJECTORY</div><h4>干旱轨迹与生成</h4><p>模块二 D3：TF 动力学 ODE 从正常走到干旱；模块三在每个细胞自身计数上生成干旱单细胞。</p></div>
            <div class="fw-step"><div class="n">04 · READOUT</div><h4>预测 / 轨迹 / 扰动</h4><p>干旱单细胞、类型轨迹、TF 活性、GRN 时间序列与任意基因 KO/OE 扰动模拟。</p></div>
          </div>

          <div class="subgroup" style="margin-top:26px">
            <div class="subgroup-head"><h3>分模块结构</h3><span class="count">模块一 M2 · 模块二 D3 · 模块三生成 · 扰动层 NetPerturber</span></div>
            ${figureGrid(FRAMEWORK_MODULES, 'data-framework-modules', { className: 'fw-module-grid' })}
          </div>

          <div class="detail-panel fw-model-panel" style="margin-top:26px">
            <div class="detail-head"><div><h3>正式模型</h3><p>模块一 M2 + 模块二 D3 final · v10</p></div><span class="tag teal">v10</span></div>
            <div class="model-facts">
              <div class="model-fact"><b>模块一 · M2</b><p>正常状态编码：TF 活性 a = c·e + p；物种特异解码器只在三层先验边上学习 Ŵ。</p></div>
              <div class="model-fact"><b>模块二 · D3</b><p>TF 动力学 ODE；跨物种共享 TF → TF 权重；解码权重随 τ 重连，叠加类型偏离、组成变化与 bulk 校准。</p></div>
              <div class="model-fact"><b>模块三 · 生成</b><p>在细胞自身真实计数上施加 log 倍数 r(τ)，再按二项稀疏 / 泊松补充生成干旱单细胞；τ = 0.25–1。</p></div>
              <div class="model-fact"><b>扰动层 · NetPerturber</b><p>任意表达基因 KO/OE → TF 活性入口 → TF 级联 3 步 → 扰动后正常细胞 → 沿模块二轨迹得到扰动后干旱细胞。</p></div>
            </div>
            <div class="callout info" style="margin-top:14px">模块一不使用细胞类型标签；模块二在 21 物种间共享 TF → TF 调控。模型输出是计算预测，不是实验证据。</div>
          </div>

          <div class="subgroup" style="margin-top:26px">
            <div class="subgroup-head"><h3>三阶段数据流</h3><span class="count">单细胞图谱 → bulk 定干旱箭头 → 轨迹 × GRN 走路径</span></div>
            ${pipeline ? bigFigureHTML(pipeline, 'data-framework-pipeline') : '<div class="callout">数据流图暂未载入。</div>'}
          </div>
        </section>

        <section class="section" id="model-performance">
          <div class="section-head">
            <div><div class="section-kicker">Model performance</div><h2 class="section-title">模型性能</h2><p class="section-desc">正式模型在 5 项留出研究上的评价：基线方法比较、消融、留出预测、中间时间点、网络证据、组成/解卷积、种子稳定性、适用范围与扰动验证。</p></div>
            <a class="btn tiny ghost" href="#/virtual/evaluation">完整评估 ${ICONS.arrow}</a>
          </div>
          <div class="stat-grid six">
            ${statBox(perf.stats.modules || 9, '评价模块')}
            ${statBox(perf.stats.figures || perfFigs.length, '图件')}
            ${statBox(perf.stats.heldout_studies || 5, '留出研究')}
            ${statBox(perf.stats.ablations || 5, '消融版本')}
            ${statBox(perf.stats.seeds || 3, '随机种子')}
            ${statBox(perf.stats.tables || 0, '结果表')}
          </div>
          <div class="callout info" style="margin-top:18px"><strong>总体结论：</strong>${esc(perf.summary || '')}</div>

          <div class="subgroup" style="margin-top:24px">
            <div class="subgroup-head"><h3>基线对比与消融</h3><span class="count">与统一变化、v9、外部方法比较；关键模块消融</span></div>
            <div id="mp-baseline-grid">${baselineFigs.length ? figureGrid(baselineFigs, 'mp-baseline') : '<div class="callout">基线/消融图暂未载入。</div>'}</div>
          </div>

          <div class="subgroup" style="margin-top:26px">
            <div class="subgroup-head"><h3>其他评估</h3><span class="count">留出研究、模块一、网络证据、组成、种子、适用范围与扰动验证</span></div>
            <div id="mp-other-grid">${otherFigs.length ? figureGrid(otherFigs, 'mp-other') : '<div class="callout">其他评估图暂未载入。</div>'}</div>
          </div>

          <div style="margin-top:26px">
            <div class="subgroup-head"><h3>关键结果表</h3><span class="count">${keyTables.length} 表 · 完整表见源目录</span></div>
            <div class="ia-table-grid">${keyTables.map(iaKeyTable).join('')}</div>
          </div>
          <div class="callout warn" style="margin-top:18px">
            <strong>解释边界：</strong>细胞类型 logFC 与“各类型同样变化”基线持平；相对现有 bulk–单细胞与扰动方法有明显优势，但类型特异信号的增益很小。5 个物种（香蕉、大麦、西兰花、花生、小麦）网络很弱，依赖网络的结论不适用。所有结果均为模型评估，不是实验验证。
          </div>
        </section>
      </div>`;
  }


  function resultCard(item, listKey, index) {
    const sub = item.scope === 'all'
      ? (item.stage_name ? `${item.stage_name} · 全部物种` : '全部物种')
      : item.scope === 'organ'
        ? `${speciesName(item.species)} · ${organName(item.organ)} · 器官`
        : `${speciesName(item.species)} · ${item.stage_name || item.group || ''}`;
    return `<a class="fig-card result-card" href="${esc(item.image)}" data-result-list="${esc(listKey)}" data-result-index="${index}">
      <div class="fig-media"><img loading="lazy" src="${esc(item.thumb || item.image)}" alt="${esc(item.title)}"></div>
      <div class="fig-body"><div class="fig-title">${esc(item.title)}</div><div class="fig-sub">${esc(sub)}</div></div>
    </a>`;
  }
  function resultGrid(items, listKey = 'results') {
    S.resultLists = S.resultLists || {};
    S.resultLists[listKey] = items;
    if (!items.length) return '<div class="empty"><strong>暂无可展示结果</strong><span>该范围尚未生成对应图片。</span></div>';
    return `<div class="fig-grid">${items.map((item, i) => resultCard(item, listKey, i)).join('')}</div>`;
  }
  function openResultLightbox(listKey, index) {
    const items = (S.resultLists && S.resultLists[listKey]) || [];
    const recs = items.map((x) => ({
      ...x,
      jpg: x.image,
      png: undefined,
      svg: undefined,
      pdf: undefined,
      caption: '',
      formats: ['jpg'],
      module: x.stage ? 'single-cell' : 'bulk',
      category: x.stage_name || x.group || '',
    }));
    openLightbox(recs, Number(index) || 0);
  }

  async function renderBulk() {
    await Promise.all([ensureResults(), ensureLandscape()]);
    const R = S.results.bulk;
    const L = S.landscape;
    const species = [...new Set(R.species.map((x) => x.species))].sort((a,b) => speciesName(a).localeCompare(speciesName(b), 'zh'));
    const defaultSp = species.includes(S.species) ? S.species : (species.includes('rice') ? 'rice' : species[0]);
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Bulk transcriptome · normal vs drought</div>
            <h1 class="page-title">批量<em>转录组</em></h1>
            <p class="page-lead">全量 ${fmtInt(L.bulk.total_samples)} 个 bulk 样本（正常 ${fmtInt(L.bulk.total_control_samples)} / 干旱 ${fmtInt(L.bulk.total_drought_samples)}）；结果图覆盖 21 物种。先按物种查看单物种结果，页面底部为全部物种合并结果。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/data">返回数据层</a>
            <a class="btn ghost" href="#/single-cell">单细胞转录组</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(fmtInt(L.bulk.total_samples), 'bulk 总样本')}
          ${statBox(fmtInt(L.bulk.total_control_samples), '正常 bulk')}
          ${statBox(fmtInt(L.bulk.total_drought_samples), '干旱 bulk')}
          ${statBox(fmtInt(L.bulk.model_samples), '模型输入')}
          ${statBox(L.bulk.species, '物种')}
          ${statBox(fmtInt(R.species.length), '单物种结果')}
        </div>
        <div class="callout info" style="margin-top:18px">
          <strong>样本口径：</strong>全量清洗清单 ${fmtInt(L.bulk.total_samples)}（正常 ${fmtInt(L.bulk.total_control_samples)} / 干旱 ${fmtInt(L.bulk.total_drought_samples)}）；21 物种可用清单 ${fmtInt(L.bulk.all_species_samples)}（正常 ${fmtInt(L.bulk.all_species_control)} / 干旱 ${fmtInt(L.bulk.all_species_drought)}）；虚拟细胞建模输入 ${fmtInt(L.bulk.model_samples)}（正常 ${fmtInt(L.bulk.control_samples)} / 干旱 ${fmtInt(L.bulk.drought_samples)}）。
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Single species</div><h2 class="section-title">单个物种结果</h2><p class="section-desc">按物种筛选，查看该物种的 bulk 分析图。</p></div>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>物种</span>
                <select class="select" id="bulk-species-select">${species.map((sp) => `<option value="${esc(sp)}" ${sp===defaultSp?'selected':''}>${esc(speciesName(sp))}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="bulk-species-grid" style="margin-top:18px">${resultGrid(R.species.filter((x) => x.species === defaultSp), `bulk-species-${defaultSp}`)}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">All species</div><h2 class="section-title">全部物种放在一起</h2><p class="section-desc">21 物种合并的批量分析结果：质控、DEG、富集、GSEA、WGCNA、TF、机器学习等。</p></div>
          </div>
          ${resultGrid(R.all, 'bulk-all')}
        </section>
      </div>`;
    const sel = $('#bulk-species-select');
    if (sel) sel.addEventListener('change', () => {
      const grid = $('#bulk-species-grid');
      if (grid) grid.innerHTML = resultGrid(R.species.filter((x) => x.species === sel.value), `bulk-species-${sel.value}`);
    });
  }

  async function renderSingle() {
    await Promise.all([ensureResults(), ensureLandscape()]);
    const R = S.results.single;
    const L = S.landscape;
    const stages = R.stages || [];
    const species = (R.species_keys || []).slice();
    const defaultSp = species.includes(S.species) ? S.species : (species.includes('rice') ? 'rice' : species[0]);
    const organOptions = R.organs || [];
    const latest = R.latest || [];
    const allItems = R.all.concat(latest.filter((x) => !x.species));
    const speciesItems = R.species.concat(latest.filter((x) => x.species).map((x) => ({ ...x, scope: 'species' })));
    const organItems = R.organ.concat(latest.filter((x) => x.species && x.organ).map((x) => ({ ...x, scope: 'organ' })));
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Single-cell transcriptome · 21 species</div>
            <h1 class="page-title">单细胞<em>转录组</em></h1>
            <p class="page-lead">正常单细胞图谱的新版结果汇总：先看单物种、单器官结果，页面底部为全部物种汇总；并已并入 2026-10-25 新增的 Cell2Fate / WOT / CellRank 结果。14 个分析模块的完整交互结果仍可从单细胞图谱进入。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/data">返回数据层</a>
            <a class="btn primary" href="#/atlas">打开单细胞图谱 ${ICONS.arrow}</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(L.normal_sc.species, '物种')}
          ${statBox(compact(L.normal_sc.cells), '正常 scRNA 细胞')}
          ${statBox(stages.length, '分析阶段')}
          ${statBox(allItems.length, '全物种汇总图')}
          ${statBox(fmtInt(speciesItems.length), '单物种结果')}
          ${statBox(organItems.length, '单器官结果')}
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Single species</div><h2 class="section-title">单个物种结果</h2><p class="section-desc">按物种筛选；每个阶段展示该物种的汇总图，并含最新拟时序补充图。</p></div>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>物种</span>
                <select class="select" id="single-species-select">${species.map((sp) => `<option value="${esc(sp)}" ${sp===defaultSp?'selected':''}>${esc(speciesName(sp))}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="single-species-grid" style="margin-top:18px">${resultGrid(speciesItems.filter((x) => x.species === defaultSp), `single-species-${defaultSp}`)}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Single organ</div><h2 class="section-title">单个器官结果</h2><p class="section-desc">按器官筛选；覆盖 UMAP 器官图与最新 CellRank 器官结果。</p></div>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>器官</span>
                <select class="select" id="single-organ-select"><option value="all">全部器官</option>${organOptions.map((o) => `<option value="${esc(o)}">${esc(organName(o))}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="single-organ-grid" style="margin-top:18px">${resultGrid(organItems, 'single-organ')}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">All species</div><h2 class="section-title">全部物种放在一起</h2><p class="section-desc">每个分析阶段的跨物种概览，含最新新增结果；可按阶段筛选。</p></div>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>分析阶段</span>
                <select class="select" id="single-stage-filter"><option value="all">全部阶段</option>${stages.map((st) => `<option value="${esc(st.key)}">${esc(st.name)}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="single-all-grid" style="margin-top:18px">${resultGrid(allItems, 'single-all')}</div>
        </section>
      </div>`;
    const stageSel = $('#single-stage-filter');
    if (stageSel) stageSel.addEventListener('change', () => {
      const grid = $('#single-all-grid');
      if (grid) grid.innerHTML = resultGrid(stageSel.value === 'all' ? allItems : allItems.filter((x) => x.stage === stageSel.value), 'single-all');
    });
    const spSel = $('#single-species-select');
    if (spSel) spSel.addEventListener('change', () => {
      const grid = $('#single-species-grid');
      if (grid) grid.innerHTML = resultGrid(speciesItems.filter((x) => x.species === spSel.value), `single-species-${spSel.value}`);
    });
    const orgSel = $('#single-organ-select');
    if (orgSel) orgSel.addEventListener('change', () => {
      const grid = $('#single-organ-grid');
      if (grid) grid.innerHTML = resultGrid(orgSel.value === 'all' ? organItems : organItems.filter((x) => x.organ === orgSel.value), 'single-organ');
    });
  }

  function renderRegTfNetwork(host, entry) {
    if (!host) return;
    if (!entry || !(entry.genes || []).length) {
      host.innerHTML = `<div class="empty"><strong>暂无可绘制的下游靶基因</strong><span>该 TF 没有可用的靶基因列表。</span></div>`;
      return;
    }
    const genes = entry.genes.slice(0, 30);
    const W = 960;
    const H = 520;
    const cx = W / 2;
    const cy = H / 2;
    const n = genes.length;
    const innerCount = Math.ceil(n / 2);
    const outerCount = Math.floor(n / 2);
    const nodes = genes.map((g, i) => {
      const ring = i % 2 === 0 ? 0 : 1;
      const idxInRing = Math.floor(i / 2);
      const countInRing = ring === 0 ? innerCount : outerCount;
      const offset = ring === 1 ? Math.PI / Math.max(countInRing, 1) : 0;
      const angle = -Math.PI / 2 + (idxInRing / Math.max(countInRing, 1)) * Math.PI * 2 + offset;
      const R = ring === 0 ? 112 : 188;
      return { g, i, ring, R, angle, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });
    const startR = 46;
    const edges = nodes.map((nd) => {
      const nodeR = nd.ring === 0 ? 9.5 : 8.5;
      const endR = nd.R - nodeR - 4;
      const sx = cx + Math.cos(nd.angle) * startR;
      const sy = cy + Math.sin(nd.angle) * startR;
      const ex = cx + Math.cos(nd.angle) * endR;
      const ey = cy + Math.sin(nd.angle) * endR;
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      const dx = ex - sx;
      const dy = ey - sy;
      const len = Math.hypot(dx, dy) || 1;
      const bend = (nd.i % 2 === 0 ? 1 : -1) * 12;
      const qx = mx - (dy / len) * bend;
      const qy = my + (dx / len) * bend;
      return `<path class="reg-edge" data-idx="${nd.i}" pathLength="1" style="animation-delay:${(0.05 + nd.i * 0.025).toFixed(2)}s" d="M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" marker-end="url(#reg-arrow)"></path>`;
    }).join('');
    const targetNodes = nodes.map((nd) => {
      const nodeR = nd.ring === 0 ? 9.5 : 8.5;
      return `<g class="reg-target" data-idx="${nd.i}" data-tip="<strong>${esc(nd.g)}</strong><br>靶基因 ${String(nd.i + 1).padStart(2, '0')} · ${esc(entry.tf)} 下游" style="animation-delay:${(0.18 + nd.i * 0.02).toFixed(2)}s">
        <circle class="reg-node-aura" cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="${(nodeR + 4.5).toFixed(1)}"></circle>
        <circle class="reg-node" cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="${nodeR}"></circle>
        <text class="reg-node-idx" x="${nd.x.toFixed(1)}" y="${nd.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${String(nd.i + 1).padStart(2, '0')}</text>
      </g>`;
    }).join('');
    const labelLines = (() => {
      if (entry.tf.length <= 9) return [entry.tf];
      const out = [];
      for (let i = 0; i < entry.tf.length && out.length < 2; i += 9) out.push(entry.tf.slice(i, i + 9));
      if (entry.tf.length > 18) out[1] = `${entry.tf.slice(9, 17)}…`;
      return out;
    })();
    const tfName = labelLines.map((line, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : 12}">${esc(line)}</tspan>`).join('');
    const shownNote = entry.targets > genes.length ? `（按文件顺序展示前 ${genes.length} 个）` : '';
    const chips = genes.map((g, i) => `<span class="reg-gene-chip" data-idx="${i}"><em>${String(i + 1).padStart(2, '0')}</em><span>${esc(g)}</span></span>`).join('');
    host.innerHTML = `
      <svg class="reg-network" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(entry.tf)} 调控网络">
        <defs>
          <radialGradient id="reg-bg-glow" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stop-color="#e5008a" stop-opacity=".13"></stop>
            <stop offset="45%" stop-color="#e5008a" stop-opacity=".045"></stop>
            <stop offset="100%" stop-color="#e5008a" stop-opacity="0"></stop>
          </radialGradient>
          <linearGradient id="reg-edge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e5008a" stop-opacity=".62"></stop>
            <stop offset="100%" stop-color="#e5008a" stop-opacity=".10"></stop>
          </linearGradient>
          <marker id="reg-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="#e5008a" fill-opacity=".45"></path>
          </marker>
        </defs>
        <rect class="reg-bg" x="0" y="0" width="${W}" height="${H}" fill="url(#reg-bg-glow)"></rect>
        <g class="reg-deco">
          <circle class="reg-ring" cx="${cx}" cy="${cy}" r="70"></circle>
          <circle class="reg-ring" cx="${cx}" cy="${cy}" r="140"></circle>
          <circle class="reg-ring faint" cx="${cx}" cy="${cy}" r="210"></circle>
        </g>
        ${edges}
        <g class="reg-hub" data-tip="<strong>${esc(entry.tf)}</strong><br>转录因子 · ${fmtInt(entry.targets)} 个下游靶基因">
          <circle class="reg-orbit" cx="${cx}" cy="${cy}" r="76"></circle>
          <circle class="reg-tf-halo" cx="${cx}" cy="${cy}" r="58"></circle>
          <circle class="reg-tf-node" cx="${cx}" cy="${cy}" r="42"></circle>
          <text class="reg-tf-kicker" x="${cx}" y="${cy - 15}" text-anchor="middle">TF</text>
          <text class="reg-tf-label" x="${cx}" y="${cy - 1}" text-anchor="middle">${tfName}</text>
        </g>
        ${targetNodes}
      </svg>
      <div class="reg-network-note"><strong>${esc(entry.tf)}</strong> → ${fmtInt(entry.targets)} 个下游靶基因${shownNote}。悬停节点可查看完整基因名，编号对应下方列表。</div>
      <div class="reg-network-legend">
        <span class="reg-legend-item"><i class="reg-dot hub"></i>转录因子</span>
        <span class="reg-legend-item"><i class="reg-dot target"></i>下游靶基因</span>
        <span class="reg-legend-hint">悬停节点或编号可高亮调控边</span>
      </div>
      <div class="reg-network-genes-head">展示的靶基因</div>
      <div class="reg-network-genes">${chips}</div>`;
    const edgeFor = (idx) => $(`.reg-edge[data-idx="${idx}"]`, host);
    const targetFor = (idx) => $(`.reg-target[data-idx="${idx}"]`, host);
    const chipFor = (idx) => $(`.reg-gene-chip[data-idx="${idx}"]`, host);
    $$('.reg-target', host).forEach((el) => {
      const idx = el.dataset.idx;
      el.addEventListener('mouseenter', () => {
        const edge = edgeFor(idx);
        const chip = chipFor(idx);
        if (edge) edge.classList.add('hot');
        if (chip) chip.classList.add('hot');
      });
      el.addEventListener('mouseleave', () => {
        const edge = edgeFor(idx);
        const chip = chipFor(idx);
        if (edge) edge.classList.remove('hot');
        if (chip) chip.classList.remove('hot');
      });
    });
    $$('.reg-gene-chip', host).forEach((el) => {
      const idx = el.dataset.idx;
      el.addEventListener('mouseenter', () => {
        const edge = edgeFor(idx);
        const target = targetFor(idx);
        if (edge) edge.classList.add('hot');
        if (target) target.classList.add('hot');
      });
      el.addEventListener('mouseleave', () => {
        const edge = edgeFor(idx);
        const target = targetFor(idx);
        if (edge) edge.classList.remove('hot');
        if (target) target.classList.remove('hot');
      });
    });
  }

  function bindRegTfSelect(sp) {
    const sel = $('#reg-tf-select');
    const host = $('#reg-network');
    if (!sel || !host || !sp) return;
    const top = sp.top_tfs || [];
    const initial = top.find((t) => t.tf === sel.value) || top[0];
    renderRegTfNetwork(host, initial);
    sel.addEventListener('change', () => {
      renderRegTfNetwork(host, top.find((t) => t.tf === sel.value));
    });
  }

  function regulatorySpeciesDetail(sp) {
    if (!sp) return `<div class="empty"><strong>暂无该物种调控关系</strong><span>请切换其他物种。</span></div>`;
    const top = sp.top_tfs || [];
    return `
      <div class="stat-grid six">
        ${statBox(fmtInt(sp.raw_edges), '原始调控边')}
        ${statBox(fmtInt(sp.filtered_edges), '过滤后调控边')}
        ${statBox(fmtInt(sp.common_genes), '共同基因')}
        ${statBox(`${fmtInt(sp.tf_matched)} / ${fmtInt(sp.tf_total)}`, 'TF 匹配')}
        ${statBox(`${Number(sp.tf_match_rate).toFixed(1)}%`, 'TF 匹配率')}
        ${statBox(`${Number(sp.gene_match_rate).toFixed(1)}%`, '基因匹配率')}
      </div>
      <div class="subgroup-head" style="margin-top:22px">
        <h3>出度最高的 TF</h3>
        <span class="count">按原始调控关系中的靶基因数排序</span>
      </div>
      ${top.length ? tableHTML(top, [
        { key: 'tf', label: 'TF', cls: 'gene' },
        { key: 'targets', label: '靶基因数', cls: 'num', fmt: (v) => fmtInt(v) },
        { key: 'tf', label: '网络', cls: 'num', html: true, get: (r) => `<button class="btn tiny ghost" data-action="reg-tf" data-value="${esc(r.tf)}">查看网络</button>` },
      ]) : `<div class="empty"><strong>暂无调控关系明细</strong><span>源文件未找到或为空。</span></div>`}
      ${top.length ? `
      <div class="subgroup-head" style="margin-top:26px">
        <h3>TF 调控网络</h3>
        <span class="count">选择转录因子，查看它与下游靶基因的网络</span>
      </div>
      <div class="filter-bar">
        <div class="filter-row">
          <label class="field"><span>转录因子</span>
            <select class="select" id="reg-tf-select">${top.map((t) => `<option value="${esc(t.tf)}">${esc(t.tf)}（${fmtInt(t.targets)} 个靶基因）</option>`).join('')}</select>
          </label>
        </div>
      </div>
      <div id="reg-network" class="reg-network-wrap" style="margin-top:16px"></div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px">
        <span style="font-size:12.5px;color:var(--muted)">源文件 <code>${esc(sp.reg_file)}</code> · 原始 ${fmtInt(sp.raw_edges)} 条 → 匹配后 ${fmtInt(sp.filtered_edges)} 条</span>
        ${sp.grn_figures
          ? `<button class="btn tiny ghost" data-action="open-atlas-species" data-species="${esc(sp.key)}" data-module="11_gene_regulatory_network">查看该物种 GRN 图件 (${sp.grn_figures}) ${ICONS.arrow}</button>`
          : `<span class="tag">该物种暂无 GRN 图件</span>`}
      </div>`;
  }

  function downloadRegulatorySummary() {
    const R = S.regulatory;
    if (!R || !R.species) return;
    const header = ['species', 'name', 'code', 'reg_file', 'raw_edges', 'filtered_edges', 'common_genes', 'tf_total', 'tf_matched', 'tf_match_rate', 'gene_match_rate', 'grn_figures', 'top_tfs'];
    const lines = [header.join('\t')];
    for (const sp of R.species) {
      const top = (sp.top_tfs || []).map((t) => `${t.tf}(${t.targets})`).join(';');
      lines.push([sp.key, sp.name, sp.code, sp.reg_file, sp.raw_edges, sp.filtered_edges, sp.common_genes, sp.tf_total, sp.tf_matched, sp.tf_match_rate, sp.gene_match_rate, sp.grn_figures, top].join('\t'));
    }
    const blob = new Blob([`\ufeff${lines.join('\n')}\n`], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DroAIVC_regulatory_summary.tsv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已下载调控关系摘要');
  }

  async function renderRegulatory() {
    const R = await ensureRegulatory();
    const species = R.species || [];
    const totals = R.totals || {};
    if (!species.length) {
      view.innerHTML = `<div class="empty"><strong>暂无可展示的调控关系</strong><span>未找到 21 物种的先验调控边统计。</span><p style="margin-top:14px"><a class="btn" href="#/data">返回数据层</a></p></div>`;
      return;
    }
    const defaultSp = species.some((x) => x.key === S.species) ? S.species : (species.some((x) => x.key === 'rice') ? 'rice' : species[0].key);
    const selected = species.find((x) => x.key === defaultSp) || species[0];
    const rows = species.slice().sort((a, b) => b.filtered_edges - a.filtered_edges);
    const max = Math.max(...rows.map((x) => x.filtered_edges), 1);
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Regulatory relationships · prior TF–target</div>
            <h1 class="page-title">初始<em>调控关系</em></h1>
            <p class="page-lead">21 物种已知 TF–靶基因调控关系：原始 ${fmtInt(totals.raw_edges)} 条边，匹配到物种基因后保留 ${fmtInt(totals.filtered_edges)} 条；先按物种查看单物种调控关系并可展开 TF–靶基因网络，页面底部为全部物种汇总。</p>
          </div>
          <div class="page-actions">
            <a class="btn ghost" href="#/data">返回数据层</a>
            <a class="btn ghost" href="#/atlas/11_gene_regulatory_network">打开 GRN 模块 ${ICONS.arrow}</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(totals.species, '物种')}
          ${statBox(compact(totals.raw_edges), '原始调控边')}
          ${statBox(compact(totals.filtered_edges), '过滤后调控边')}
          ${statBox(`${fmtInt(totals.tf_matched)} / ${fmtInt(totals.tf_total)}`, 'TF 匹配')}
          ${statBox(`${Number(totals.tf_match_rate || 0).toFixed(1)}%`, 'TF 匹配率')}
          ${statBox(`${totals.species_with_grn_figures} / ${totals.species}`, '有 GRN 图件')}
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Single species</div><h2 class="section-title">单个物种调控关系</h2><p class="section-desc">选择物种查看先验边数量、TF/基因匹配情况与出度最高的 TF；选择转录因子可自动展开它与下游靶基因的网络图。</p></div>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>物种</span>
                <select class="select" id="reg-species-select">${species.map((sp) => `<option value="${esc(sp.key)}" ${sp.key === selected.key ? 'selected' : ''}>${esc(sp.name)}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="reg-species-detail" style="margin-top:18px">${regulatorySpeciesDetail(selected)}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">All species</div><h2 class="section-title">全部物种放在一起</h2><p class="section-desc">21 物种匹配后调控边规模对比；点击条形进入该物种的 GRN 图件。</p></div>
            <button class="btn tiny ghost" data-action="reg-download">下载摘要 TSV</button>
          </div>
          <div class="bar-chart">${rows.map((sp) => `
            <button class="bar-row" ${sp.grn_figures ? `data-action="open-atlas-species" data-species="${esc(sp.key)}" data-module="11_gene_regulatory_network"` : `data-action="go-species" data-value="${esc(sp.key)}"`} data-tip="${esc(`${sp.name} · 过滤后 ${fmtInt(sp.filtered_edges)} 条 / 原始 ${fmtInt(sp.raw_edges)} 条`)}">
              <span class="bar-label">${esc(sp.name)}</span>
              <span class="bar-track"><span class="bar-fill" data-w="${Math.max(1.2, sp.filtered_edges / max * 100).toFixed(2)}"></span></span>
              <span class="bar-value">${esc(compact(sp.filtered_edges))}</span>
            </button>`).join('')}</div>
          <div class="callout info" style="margin-top:18px">
            <strong>汇总口径：</strong>原始调控边为各物种 regulation 文件中的 TF–靶基因关系条数；过滤后调控边为该关系匹配到本物种共同基因与 TF 列表后、用于建模的边。21 物种合计原始 ${fmtInt(totals.raw_edges)} 条、过滤后 ${fmtInt(totals.filtered_edges)} 条；TF 匹配 ${fmtInt(totals.tf_matched)} / ${fmtInt(totals.tf_total)}（${Number(totals.tf_match_rate || 0).toFixed(1)}%）。
          </div>
        </section>
      </div>`;
    bindRegTfSelect(selected);
    const sel = $('#reg-species-select');
    if (sel) sel.addEventListener('change', () => {
      const sp = species.find((x) => x.key === sel.value);
      const host = $('#reg-species-detail');
      if (host) host.innerHTML = regulatorySpeciesDetail(sp);
      bindRegTfSelect(sp);
      if (sp) {
        S.species = sp.key;
        localStorage.setItem('droaivc.species', sp.key);
        updateSpeciesTrigger();
      }
    });
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
      const stroke = sig === 'HIGH' ? 'rgba(229,0,138,.96)' : sig === 'LOW' ? 'rgba(22,104,227,.96)' : 'rgba(255,255,255,.4)';
      const dot = sig === 'HIGH' ? '#1668e3' : sig === 'LOW' ? '#e5008a' : '#999999';
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
          <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
          <stop offset=".38" stop-color="#1668e3" stop-opacity=".62"/>
          <stop offset="1" stop-color="#000000" stop-opacity=".18"/>
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

  /* ---------------- drought inference analysis ---------------- */
  function iaCards(IA, species, organ) {
    return (IA?.cards || []).filter((c) => (species === 'all' || c.species === species)
      && (organ === 'all' || c.organ === organ));
  }

  function iaSingleFigures(IA, species, organ) {
    return (IA?.figures || []).filter((f) => f.scope === 'species'
      && (species === 'all' || f.species === species)
      && (organ === 'all' || !f.organ || f.organ === organ));
  }

  function iaMultiFigures(IA, section, module) {
    return (IA?.figures || []).filter((f) => f.scope === 'multi'
      && (section === 'all' || f.section === section)
      && (module === 'all' || f.module_key === module));
  }

  function iaOrganKeys(IA, species) {
    return [...new Set((IA?.cards || [])
      .filter((c) => species === 'all' || c.species === species)
      .map((c) => c.organ))].sort((a, b) => organName(a).localeCompare(organName(b), 'zh'));
  }

  function iaContextTable(cards) {
    const rows = cards.map((c) => ({
      context: c.context || '—',
      species: c.species,
      organ: c.organ,
      tier: c.tier || '—',
      intensity: c.intensity,
      n_cells: c.summary?.n_cells,
      n_types: c.summary?.n_types,
      core: `${c.summary?.n_core_up ?? '—'} / ${c.summary?.n_core_dn ?? '—'}`,
      score: `${c.summary?.score_up_t1 ?? '—'} / ${c.summary?.score_dn_t1 ?? '—'}`,
      marker: c.summary?.top_marker || '—',
      tf: c.summary?.top_tf || '—',
    }));
    return tableHTML(rows, [
      { key: 'context', label: '情境', cls: 'gene' },
      { key: 'species', label: '物种', fmt: (v) => speciesName(v) },
      { key: 'organ', label: '器官', fmt: (v) => organName(v) },
      { key: 'tier', label: '层级' },
      { key: 'intensity', label: '干旱强度', cls: 'num', fmt: (v) => (v == null ? '—' : Number(v).toFixed(2)) },
      { key: 'n_cells', label: '细胞', cls: 'num', fmt: (v) => fmtInt(v) },
      { key: 'n_types', label: '类型', cls: 'num' },
      { key: 'core', label: '核心上/下调', cls: 'num' },
      { key: 'score', label: '得分上/下', cls: 'num' },
      { key: 'marker', label: '最大标志基因', cls: 'gene' },
      { key: 'tf', label: '最大 TF', cls: 'gene' },
    ]);
  }

  function iaModuleCard(m) {
    const inner = `
      <span class="ia-code">${esc(m.code || '')} · ${esc(m.section || '')}</span>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.desc || '')}</p>
      <div class="module-meta"><span class="count">${fmtInt(m.figure_count || 0)} 图 · ${fmtInt(m.table_count || 0)} 表</span><span class="arrow">→</span></div>`;
    if (m.href) return `<a class="module-card ia-module-card" href="${esc(m.href)}">${inner}</a>`;
    return `<button type="button" class="module-card ia-module-card" data-action="ia-module" data-value="${esc(m.key)}">${inner}</button>`;
  }

  function iaKeyTable(t) {
    return `<div class="ia-table-card">
      <div class="ia-table-head"><div><h3>${esc(t.title)}</h3><p>${esc(t.desc || '')}</p></div><span class="tag teal">${esc(t.code || '')}</span></div>
      ${tableHTML(t.rows || [], t.columns || [])}
      <div class="ia-table-source">源表：<code>${esc(t.source || '')}</code></div>
    </div>`;
  }

  function iaUpdateOrganOptions(selected = 'all') {
    const sel = $('#ia-organ');
    if (!sel) return;
    const species = $('#ia-species')?.value || 'all';
    const organs = iaOrganKeys(S.inferenceAnalysis, species);
    const keep = organs.includes(selected) ? selected : 'all';
    sel.innerHTML = '<option value="all">全部器官</option>' + organs.map((o) =>
      `<option value="${esc(o)}" ${o === keep ? 'selected' : ''}>${esc(organName(o))}</option>`).join('');
    S.iaOrgan = keep;
  }

  function iaUpdateSingle() {
    const IA = S.inferenceAnalysis;
    if (!IA) return;
    const species = $('#ia-species')?.value || 'all';
    const organ = $('#ia-organ')?.value || 'all';
    S.iaSpecies = species;
    S.iaOrgan = organ;
    const cards = iaCards(IA, species, organ);
    const grid = $('#ia-context-grid');
    if (grid) grid.innerHTML = cards.length ? figureGrid(cards, 'ia-cards') : '<div class="empty"><strong>没有匹配的情境卡片</strong></div>';
    const table = $('#ia-context-table');
    if (table) table.innerHTML = iaContextTable(cards);
    const figs = iaSingleFigures(IA, species, organ);
    const host = $('#ia-single-figures');
    if (host) host.innerHTML = figs.length ? figureGrid(figs, 'ia-single')
      : '<div class="callout">该物种/器官的模块图件以跨物种汇总为主；请在下方“全部物种合并结果”查看对应模块。</div>';
    const count = $('#ia-single-count');
    if (count) count.textContent = `${cards.length} 个情境 · ${figs.length} 张单物种图`;
  }

  function iaUpdateModuleOptions(preserve = 'all') {
    const IA = S.inferenceAnalysis;
    const sel = $('#ia-module');
    if (!sel) return;
    const section = $('#ia-section')?.value || 'all';
    const mods = (IA?.modules || []).filter((m) => section === 'all' || m.section === section);
    const keep = preserve !== 'all' && mods.some((m) => m.key === preserve) ? preserve : 'all';
    sel.innerHTML = '<option value="all">全部模块</option>' + mods.map((m) =>
      `<option value="${esc(m.key)}" ${m.key === keep ? 'selected' : ''}>${esc(m.code)} ${esc(m.name)}</option>`).join('');
    S.iaModule = keep;
  }

  function iaUpdateAll() {
    const IA = S.inferenceAnalysis;
    if (!IA) return;
    const section = $('#ia-section')?.value || 'all';
    const module = $('#ia-module')?.value || 'all';
    S.iaSection = section;
    S.iaModule = module;
    const figs = iaMultiFigures(IA, section, module);
    const host = $('#ia-all-grid');
    if (host) host.innerHTML = figs.length ? figureGrid(figs, 'ia-all')
      : '<div class="empty"><strong>该模块没有跨物种汇总图</strong><span>请选择其他模块，或查看上方单物种单器官结果。</span></div>';
    const count = $('#ia-all-count');
    if (count) count.textContent = `${figs.length} 图`;
  }

  function iaSelectModule(key) {
    const IA = S.inferenceAnalysis;
    if (!IA) return;
    const m = (IA.modules || []).find((x) => x.key === key);
    if (!m) return;
    const sectionSel = $('#ia-section');
    if (sectionSel) sectionSel.value = m.section;
    S.iaSection = m.section;
    iaUpdateModuleOptions(m.key);
    const moduleSel = $('#ia-module');
    if (moduleSel) moduleSel.value = m.key;
    iaUpdateAll();
    const target = $('#ia-all');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- drought inference analysis page ---------------- */
  async function renderDrought() {
    const IA = await ensureInferenceAnalysis();
    const L = await ensureLandscape().catch(() => null);
    const cards = IA.cards || [];
    const speciesKeys = [...new Set(cards.map((c) => c.species))]
      .sort((a, b) => speciesName(a).localeCompare(speciesName(b), 'zh'));
    const defaultSp = speciesKeys.includes(S.species) ? S.species : (speciesKeys.includes('arabidopsis') ? 'arabidopsis' : speciesKeys[0]);
    if (!S.iaSpecies || (S.iaSpecies !== 'all' && !speciesKeys.includes(S.iaSpecies))) S.iaSpecies = defaultSp;
    if (!S.iaSection) S.iaSection = 'all';
    if (!S.iaModule) S.iaModule = 'all';
    const sections = IA.sections || [];
    const modules = IA.modules || [];
    const stats = IA.stats || {};
    const keyTables = IA.key_tables || [];
    const species = S.iaSpecies;
    const organs = iaOrganKeys(IA, species);
    if (S.iaOrgan !== 'all' && !organs.includes(S.iaOrgan)) S.iaOrgan = 'all';
    const organ = S.iaOrgan;
    const shownCards = iaCards(IA, species, organ);
    const singleFigs = iaSingleFigures(IA, species, organ);
    const modsForSection = modules.filter((m) => S.iaSection === 'all' || m.section === S.iaSection);
    const moduleKeys = new Set(modsForSection.map((m) => m.key));
    const shownModule = S.iaModule !== 'all' && moduleKeys.has(S.iaModule) ? S.iaModule : 'all';
    S.iaModule = shownModule;
    const allFigs = iaMultiFigures(IA, S.iaSection, shownModule);
    const D = L?.drought_sc;
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Drought cell patterns · D3 final inference</div>
            <h1 class="page-title">干旱细胞<em>规律</em></h1>
            <p class="page-lead">基于 D3 final 对 21 物种、50 个物种×器官代表情境的推理结果，系统展示经典干旱标志基因、细胞组成、类型特异 DEG、功能程序、叶根比较、跨物种保守、响应轨迹、TF 活性、调控网络与虚拟扰动。所有结果为模型推断。</p>
          </div>
          <div class="page-actions">
            <a class="btn primary" href="#/virtual/prediction">21 物种干旱预测 ${ICONS.arrow}</a>
            <a class="btn ghost" href="#/virtual/perturbation">在线基因扰动</a>
          </div>
        </div>
        <div class="stat-grid six">
          ${statBox(stats.species || speciesKeys.length, '物种')}
          ${statBox(stats.contexts || cards.length, '物种×器官情境')}
          ${statBox(stats.modules || modules.length, '分析模块')}
          ${statBox(stats.figures || 0, '模块图件')}
          ${statBox(stats.multi_figures || 0, '全物种合并图')}
          ${statBox(stats.single_context_figures || 0, '单物种模块图')}
        </div>
        <div class="callout info" style="margin-top:18px">
          <strong>数据边界：</strong>本页为 D3 final 模型推理结果，不是实验证据。模型在留出研究上的细胞类型特异预测能力有限（类型特异结论作为候选）；扰动效应与基因 × 干旱交互没有独立单细胞验证。${D ? `实测干旱 scRNA 首批覆盖 ${D.species} 个物种、${compact(D.cells)} 个细胞，其余物种由虚拟细胞预测。` : ''}
        </div>

        <section class="section" id="ia-single">
          <div class="section-head">
            <div><div class="section-kicker">Single species / organ</div><h2 class="section-title">单物种单器官推理结果</h2><p class="section-desc">按物种和器官筛选；每张卡片是一个代表情境的完整结果（细胞类型、RNA 组成、干旱位移、响应得分与最大变化 TF），下方为情境指标。</p></div>
            <span class="tag" id="ia-single-count">${shownCards.length} 个情境 · ${singleFigs.length} 张单物种图</span>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>物种</span>
                <select class="select" id="ia-species"><option value="all" ${species === 'all' ? 'selected' : ''}>全部物种</option>${speciesKeys.map((k) => `<option value="${esc(k)}" ${k === species ? 'selected' : ''}>${esc(speciesName(k))}</option>`).join('')}</select>
              </label>
              <label class="field"><span>器官</span>
                <select class="select" id="ia-organ"><option value="all" ${organ === 'all' ? 'selected' : ''}>全部器官</option>${organs.map((o) => `<option value="${esc(o)}" ${o === organ ? 'selected' : ''}>${esc(organName(o))}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="ia-context-grid" style="margin-top:18px">${shownCards.length ? figureGrid(shownCards, 'ia-cards') : '<div class="empty"><strong>没有匹配的情境卡片</strong></div>'}</div>
          <div style="margin-top:22px">
            <div class="subgroup-head"><h3>情境指标</h3><span class="count">核心上/下调 = 核心共有干旱 DEG 数；得分 = 逐细胞响应得分均值</span></div>
            <div id="ia-context-table">${iaContextTable(shownCards)}</div>
          </div>
          <div style="margin-top:24px">
            <div class="subgroup-head"><h3>该物种的模块图件</h3><span class="count">拟南芥与小麦有单物种专属图；其他物种以卡片和全物种汇总为主</span></div>
            <div id="ia-single-figures">${singleFigs.length ? figureGrid(singleFigs, 'ia-single') : '<div class="callout">该物种/器官的模块图件以跨物种汇总为主；请在下方“全部物种合并结果”查看对应模块。</div>'}</div>
          </div>
        </section>

        <section class="section" id="ia-all">
          <div class="section-head">
            <div><div class="section-kicker">All species</div><h2 class="section-title">全部物种合并结果</h2><p class="section-desc">跨物种整合的模块图件；可按 3.3 细胞类型响应、3.4 动态过程与调控、3.5 虚拟扰动与候选筛选。</p></div>
            <span class="tag teal" id="ia-all-count">${allFigs.length} 图</span>
          </div>
          <div class="filter-bar">
            <div class="filter-row">
              <label class="field"><span>分析部分</span>
                <select class="select" id="ia-section"><option value="all" ${S.iaSection === 'all' ? 'selected' : ''}>全部 3.3–3.5</option>${sections.map((s) => `<option value="${esc(s.key)}" ${s.key === S.iaSection ? 'selected' : ''}>${esc(s.key)} ${esc(s.name)}</option>`).join('')}</select>
              </label>
              <label class="field"><span>模块</span>
                <select class="select" id="ia-module"><option value="all" ${shownModule === 'all' ? 'selected' : ''}>全部模块</option>${modsForSection.map((m) => `<option value="${esc(m.key)}" ${m.key === shownModule ? 'selected' : ''}>${esc(m.code)} ${esc(m.name)}</option>`).join('')}</select>
              </label>
            </div>
          </div>
          <div id="ia-all-grid" style="margin-top:18px">${allFigs.length ? figureGrid(allFigs, 'ia-all') : '<div class="empty"><strong>该模块没有跨物种汇总图</strong><span>请选择其他模块，或查看上方单物种单器官结果。</span></div>'}</div>
        </section>

        <section class="section" id="ia-modules">
          <div class="section-head">
            <div><div class="section-kicker">Modules</div><h2 class="section-title">分析模块</h2><p class="section-desc">3.3–3.5 共 ${modules.length} 个模块（含 1 个公用扰动数据表）；点击模块筛选上方“全部物种合并结果”。</p></div>
            <span class="tag">${modules.length} 模块</span>
          </div>
          ${sections.map((sec) => {
            const mods = modules.filter((m) => m.section === sec.key);
            if (!mods.length) return '';
            return `<div class="subgroup"><div class="subgroup-head"><h3>${esc(sec.key)} ${esc(sec.name)}</h3><span class="count">${mods.length} 模块</span></div><div class="module-grid">${mods.map(iaModuleCard).join('')}</div></div>`;
          }).join('')}
        </section>

        <section class="section" id="ia-tables">
          <div class="section-head">
            <div><div class="section-kicker">Key results</div><h2 class="section-title">关键结果表</h2><p class="section-desc">从模块表中抽取的代表性结果：核心 TF、保守模块、功能程序、叶根比较、TF 家族、候选排序、调控链与组合扰动。完整表保留在源目录。</p></div>
            <span class="tag">${keyTables.length} 表</span>
          </div>
          <div class="ia-table-grid">${keyTables.map(iaKeyTable).join('')}</div>
        </section>

        <div class="callout warn">
          <strong>解释边界：</strong>这里的细胞类型响应、TF 活性、扰动与基因 × 干旱交互均为模型推断；类型特异部分和扰动效应尤其需要实验验证。所有图注、方法与结果见每张图的详情面板。
        </div>
      </div>`;
    const spSel = $('#ia-species');
    if (spSel) spSel.addEventListener('change', () => {
      S.iaSpecies = spSel.value;
      S.iaOrgan = 'all';
      iaUpdateOrganOptions('all');
      iaUpdateSingle();
    });
    const orgSel = $('#ia-organ');
    if (orgSel) orgSel.addEventListener('change', () => { S.iaOrgan = orgSel.value; iaUpdateSingle(); });
    const secSel = $('#ia-section');
    if (secSel) secSel.addEventListener('change', () => {
      S.iaSection = secSel.value;
      iaUpdateModuleOptions('all');
      iaUpdateAll();
    });
    const modSel = $('#ia-module');
    if (modSel) modSel.addEventListener('change', () => { S.iaModule = modSel.value; iaUpdateAll(); });
  }


  /* ---------------- drought-tolerant state design ---------------- */
  async function renderDesign() {
    await ensureLandscape();
    const L = S.landscape;
    const V = L.virtual;
    view.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">Drought-tolerant state · design</div>
            <h1 class="page-title">耐旱状态<em>设计</em></h1>
            <p class="page-lead">从预测的干旱细胞状态出发，结合基因调控网络与扰动效应，筛选把细胞推向目标耐旱状态的候选 TF/基因。这里是设计工作流入口；候选必须经过实验验证。</p>
          </div>
          <div class="page-actions">
            <a class="btn primary" href="#/virtual/prediction">查看干旱状态 ${ICONS.arrow}</a>
            <a class="btn ghost" href="#/virtual/perturbation">查看扰动证据</a>
          </div>
        </div>
        <div class="stat-grid">
          ${statBox(`${V.prediction_species} / 21`, '已有干旱预测')}
          ${statBox(V.perturbation_species, '有扰动证据物种')}
          ${statBox(V.grn_species, '深度 GRN 物种')}
          ${statBox(fmtInt(V.perturbation_figures), '扰动图件')}
        </div>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Design loop</div><h2 class="section-title">三步设计闭环</h2><p class="section-desc">目标状态、候选扰动、状态位移评估；每一步都回到可核查的模型输出。</p></div>
          </div>
          <div class="design-steps">
            <div class="design-step"><div class="n">01 · TARGET</div><h4>定义目标状态</h4><p>选择物种/组织与目标耐旱状态，输入正常/干旱 bulk 与正常单细胞上下文。</p></div>
            <div class="design-step"><div class="n">02 · PERTURB</div><h4>生成候选扰动</h4><p>在 GRN 与虚拟细胞模型上筛选 TF/基因扰动，预测表达、TF 活性与潜空间位移。</p></div>
            <div class="design-step"><div class="n">03 · SELECT</div><h4>评估与筛选</h4><p>比较候选对目标状态的推进幅度、跨物种一致性与模型边界，形成待验证设计清单。</p></div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><div class="section-kicker">Evidence</div><h2 class="section-title">可用的模型证据</h2><p class="section-desc">先看预测状态，再看扰动与网络；不同物种的可用深度不同。</p></div>
            <a class="btn tiny ghost" href="#/virtual">虚拟细胞总览 ${ICONS.arrow}</a>
          </div>
          <div class="module-grid">
            ${moduleCard('design-pred', '干旱状态预测', '21 物种正常 → 干旱的单细胞预测、UMAP、TF 活性与轨迹。', `${V.prediction_species} 物种 · ${fmtInt(V.prediction_figures)} 图`, '#/virtual/prediction', ICONS.spark)}
            ${moduleCard('design-pert', '扰动候选', 'CellOracle 虚拟敲除与水稻模型扰动；查看 TF 活性、表达变化和潜空间位移。', `${V.perturbation_species} 物种 · ${fmtInt(V.perturbation_figures)} 图`, '#/virtual/perturbation', ICONS.flask)}
            ${moduleCard('design-grn', '调控网络', '水稻深度 GRN 轨迹与 TF 网络拓扑；用于候选调控因子筛选。', `${V.grn_species} 物种 · 网络轨迹`, '#/virtual/grn', ICONS.network)}
            ${moduleCard('design-eval', '模型边界', '内部留出、外部验证与适用边界；设计候选不直接等同于实验结论。', '评估与边界', '#/virtual/evaluation', ICONS.book)}
          </div>
        </section>

        <section class="section">
          <div class="callout warn">
            <strong>设计边界：</strong>当前页面是耐旱状态设计的工作流入口，不是已验证的基因组合或育种方案。候选来自模型预测、GRN 与扰动模拟；需要实验验证后才能用于育种或工程改造。
          </div>
        </section>
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
    if (tabKey === 'prediction') bindInferencePanel();
    if (tabKey === 'perturbation') bindPerturbPanel();
  }

  function coverageLabel(key) {
    const c = S.site.coverage || {};
    if (key === 'prediction') return `${(c.prediction_species || []).length} / 21 物种`;
    if (key === 'trajectory') return `${(c.trajectory_species || []).length} 个物种深度轨迹`;
    if (key === 'grn') return `${(c.grn_species || []).length} 个物种深度 GRN`;
    if (key === 'perturbation') return `${(c.perturbation_species || []).length} 个物种 · ${(c.celloracle_datasets || []).length} 个 CellOracle 数据集`;
    if (key === 'evaluation') return 'v10 · 5 项留出研究';
    if (key === 'pattern') return '跨物种 · 条件 · bulk';
    return '21 species';
  }

  async function virtualFramework() {
    const figs = S.virtual?.figures || [];
    const pipeline = figs.find((f) => f.tab === 'framework' && f.title.includes('三阶段')) || figs[0];
    return `
      <section class="section" style="margin-top:22px">
        ${bigFigureHTML(FRAMEWORK_OVERALL, 'framework-overall')}
      </section>
      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Model</div><h2 class="section-title">模型框架与阶段</h2><p class="section-desc">正式模型为模块一 M2（正常状态）+ 模块二 D3 final（干旱轨迹）+ 模块三（干旱单细胞生成），再加扰动层 NetPerturber。模型在 21 物种间共享 TF → TF 调控。</p></div></div>
        <div class="framework-steps">
          <div class="fw-step"><div class="n">01 · INPUT</div><h4>多物种单细胞 + bulk</h4><p>21 物种正常单细胞图谱、细胞类型注释、bulk 干旱/对照样本、bulk 时间序列与 GRN 先验。</p></div>
          <div class="fw-step"><div class="n">02 · STATE</div><h4>正常状态编码</h4><p>模块一 M2：TF 活性 a = c·e + p，加 4 维自由变量 f；只在先验边上学习 TF → 基因权重。</p></div>
          <div class="fw-step"><div class="n">03 · TRAJECTORY</div><h4>干旱轨迹与生成</h4><p>模块二 D3：TF 动力学 ODE 从正常走到干旱；模块三在细胞自身计数上生成干旱单细胞。</p></div>
          <div class="fw-step"><div class="n">04 · READOUT</div><h4>预测 / 轨迹 / 扰动</h4><p>干旱单细胞、状态轨迹、TF 活性、GRN 时间序列与任意基因 KO/OE 扰动模拟。</p></div>
        </div>
      </section>
      <section class="section">
        <div class="subgroup-head"><h3>分模块结构</h3><span class="count">模块一 M2 · 模块二 D3 · 模块三生成 · 扰动层 NetPerturber</span></div>
        ${figureGrid(FRAMEWORK_MODULES, 'framework-modules', { className: 'fw-module-grid' })}
      </section>
      <section class="section">
        <div class="detail-panel fw-model-panel">
          <div class="detail-head"><div><h3>正式模型</h3><p>模块一 M2 + 模块二 D3 final · v10</p></div><span class="tag teal">v10</span></div>
          <div class="model-facts">
            <div class="model-fact"><b>模块一 · M2</b><p>正常状态编码：TF 活性 a = c·e + p；物种特异解码器只在三层先验边上学习 Ŵ。</p></div>
            <div class="model-fact"><b>模块二 · D3</b><p>TF 动力学 ODE；跨物种共享 TF → TF 权重；解码权重随 τ 重连，叠加类型偏离、组成变化与 bulk 校准。</p></div>
            <div class="model-fact"><b>模块三 · 生成</b><p>在细胞自身真实计数上施加 log 倍数 r(τ)，再按二项稀疏 / 泊松补充生成干旱单细胞；τ = 0.25–1。</p></div>
            <div class="model-fact"><b>扰动层 · NetPerturber</b><p>任意表达基因 KO/OE → TF 活性入口 → TF 级联 3 步 → 扰动后正常细胞 → 沿模块二轨迹得到扰动后干旱细胞。</p></div>
          </div>
          <div class="callout info" style="margin-top:14px">模块一不使用细胞类型标签；模块二在 21 物种间共享 TF → TF 调控。模型输出是计算预测，不是实验证据。性能与边界见 <a href="#/data">数据层 · 模型性能</a>。</div>
        </div>
      </section>
      ${pipeline ? `<section class="section"><div class="subgroup-head"><h3>三阶段数据流</h3><span class="count">单细胞图谱 → bulk 定干旱箭头 → 轨迹 × GRN 走路径</span></div>${bigFigureHTML(pipeline, 'framework-pipeline')}</section>` : ''}
      <section class="section"><div class="callout"><strong>如何阅读：</strong>本网站把“原始结果图”和“模型交互”分开呈现。图件来自源目录；交互轨迹/网络数据由源 CSV/JSON 抽取，只写入网站目录，不改动源结果。</div></section>`;
  }

  function inferenceOrganOptions(meta, species, custom, selected) {
    const list = custom
      ? (meta?.all_organs || []).map((k) => ({ key: k }))
      : (meta?.organs?.[species] || []);
    const rows = list.length ? list : [{ key: 'leaf' }, { key: 'root' }];
    return rows.map((o) => `<option value="${esc(o.key)}" ${o.key === selected ? 'selected' : ''}>${esc(organName(o.key))}${o.n_cells ? `（${compact(o.n_cells)} cells）` : ''}</option>`).join('');
  }

  function inferenceGeneExampleHTML(meta, species) {
    const ex = meta?.gene_examples?.[species];
    if (!ex || !Array.isArray(ex.genes) || !ex.genes.length) return '';
    const spMeta = (meta.species || []).find((s) => s.key === species) || {};
    const name = spMeta.name || speciesName(species) || species;
    const idw = Math.max(4, ...ex.genes.map((g) => String(g.gene).length));
    const cell = (v) => (Number.isFinite(Number(v)) ? String(v) : '—');
    const header = 'gene'.padEnd(idw) + '  ' + 'control_mean_cpm'.padStart(18) + '  ' + 'drought_mean_cpm'.padStart(18);
    const rows = ex.genes.map((g) => String(g.gene).padEnd(idw) + '  ' + cell(g.control_mean_cpm).padStart(18) + '  ' + cell(g.drought_mean_cpm).padStart(18));
    const ctx = [ex.context, ex.organ].filter(Boolean).join(' · ');
    return `<div class="gene-format">
      <div class="gene-format-head"><strong>${esc(name)} · 基因 ID 格式示例</strong><span>${esc(ctx)}</span></div>
      <pre class="gene-format-code">${esc([header, ...rows].join('\n'))}</pre>
      <p class="gene-format-note">以上 gene ID 来自该物种的模型词表，可直接放入 gene 列；CPM 数值取自内置 bulk 情境，仅示范格式，请替换为你的数据。可下载的示例数据仅提供水稻叶片。</p>
    </div>`;
  }

  function inferencePanelHTML(meta) {
    const apiBase = String(meta?.api_base || '').replace(/\/$/, '');
    const speciesList = meta?.species || S.site.species;
    const selected = speciesList.some((s) => s.key === S.predictionSpecies) ? S.predictionSpecies : 'rice';
    const organs = meta?.organs?.[selected] || [];
    const organDefault = organs.some((o) => o.key === 'leaf') ? 'leaf' : (organs[0]?.key || 'leaf');
    const taus = meta?.taus || [1, 0.75, 0.5, 0.25];
    const bulkExample = meta?.examples?.bulk ? `${apiBase}${meta.examples.bulk}` : '#';
    const h5adExample = meta?.examples?.h5ad ? `${apiBase}${meta.examples.h5ad}` : '#';
    const formatHint = meta?.bulk_format || 'TSV：gene, control_mean_cpm, drought_mean_cpm';
    const h5adHint = meta?.h5ad_format || "AnnData；X 或 layers['counts'] 为原始整数计数";
    return `
      <section class="section" id="inference-section">
        <div class="section-head">
          <div>
            <div class="section-kicker">Online inference · GPU</div>
            <h2 class="section-title">在线生成干旱单细胞</h2>
            <p class="section-desc">上传 bulk 正常/干旱情境（可选自带正常单细胞 h5ad），调用 ${esc(meta?.model || 'DroAIVC v10 M2 + D3 final')} 生成干旱单细胞。正常细胞默认取自内置 21 物种图谱；自定义 h5ad 为探索模式，建议同时用内置图谱对照。</p>
          </div>
          <span class="tag" id="inf-api-badge">检查服务…</span>
        </div>
        <div class="inference-panel">
          <form id="inference-form">
            <div class="inference-row">
              <label class="field"><span>物种</span>
                <select class="select" id="inf-species">${speciesList.map((s) => `<option value="${esc(s.key)}" ${s.key === selected ? 'selected' : ''}>${esc(s.name || s.key)}（${esc(s.code || '')}）</option>`).join('')}</select>
              </label>
              <label class="field"><span>器官</span>
                <select class="select" id="inf-organ">${inferenceOrganOptions(meta, selected, false, organDefault)}</select>
              </label>
              <label class="field"><span>干旱进程 τ</span>
                <select class="select" id="inf-tau">${taus.map((t) => `<option value="${t}" ${t === 1 ? 'selected' : ''}>τ = ${t}${t === 1 ? '（干旱终点）' : ''}</option>`).join('')}</select>
              </label>
              <label class="field"><span>最大细胞数</span>
                <select class="select" id="inf-maxcells">${[5000, 3000, 1000, 500].map((n) => `<option value="${n}" ${n === 3000 ? 'selected' : ''}>${fmtInt(n)} cells</option>`).join('')}</select>
              </label>
            </div>
            <div class="inference-upload-grid">
              <label class="file-field">
                <span class="file-label">bulk 情境表 <em>必需</em></span>
                <input class="input" id="inf-bulk" type="file" accept=".tsv,.csv,.txt">
                <span class="file-hint">${esc(formatHint)}</span>
              </label>
              <label class="file-field">
                <span class="file-label">正常单细胞 h5ad <em>可选</em></span>
                <input class="input" id="inf-h5ad" type="file" accept=".h5ad" disabled>
                <span class="file-hint">${esc(h5adHint)}</span>
              </label>
              <label class="file-field">
                <span class="file-label">基因映射表 <em>可选</em></span>
                <input class="input" id="inf-map" type="file" accept=".tsv,.csv">
                <span class="file-hint">两列：user_gene、model_gene；基因 ID 不一致时使用</span>
              </label>
            </div>
            <div id="inf-gene-format">${inferenceGeneExampleHTML(meta, selected)}</div>
            <div class="inference-checks">
              <label><input id="inf-use-example" type="checkbox"> 使用示例数据（仅水稻叶片 PRJDB36834，内置正常细胞）</label>
              <label><input id="inf-custom" type="checkbox"> 使用我上传的正常单细胞 h5ad（自定义模式）</label>
            </div>
            <div class="inference-actions">
              <button class="btn primary" id="inf-submit" type="submit">开始推理 ${ICONS.spark}</button>
              <a class="btn tiny ghost" href="${esc(bulkExample)}" download>下载示例 bulk</a>
              <a class="btn tiny ghost" href="${esc(h5adExample)}" download>下载示例 h5ad</a>
              <span class="inference-hint">公开 GPU 服务，单任务排队；上传文件仅用于本次推理，任务结束即删除，结果最多保留 1 小时。请勿上传敏感数据；模型输出为计算预测，不是实验证据。</span>
            </div>
          </form>
          <div class="inference-job" id="inf-job" hidden>
            <div class="job-head"><strong id="inf-job-stage">排队中</strong><span id="inf-job-progress">0%</span></div>
            <div class="progress-track"><div class="progress-fill" id="inf-progress-fill"></div></div>
            <div class="job-message" id="inf-job-message">正在提交…</div>
            <div class="job-meta" id="inf-job-meta"></div>
          </div>
          <div class="inference-result" id="inf-result" hidden></div>
        </div>
      </section>`;
  }

  function setInferenceJobVisible(show) {
    const box = $('#inf-job');
    if (box) box.hidden = !show;
  }

  function updateInferenceJobStatus(st) {
    const stageNames = {
      queued: '排队中', running: '运行中', preparing: '准备数据', loading_model: '加载模型', encoding: '编码正常细胞',
      calibrating: '校准干旱终点', generating: '生成干旱细胞', writing: '写出 h5ad', packaging: '打包结果',
      done: '完成', failed: '失败',
    };
    const stage = stageNames[st.stage] || st.stage || '运行中';
    const pctVal = Math.round(Number(st.progress || 0) * 100);
    const stageEl = $('#inf-job-stage');
    const progEl = $('#inf-job-progress');
    const fill = $('#inf-progress-fill');
    const msg = $('#inf-job-message');
    const meta = $('#inf-job-meta');
    if (stageEl) stageEl.textContent = stage;
    if (progEl) progEl.textContent = `${pctVal}%`;
    if (fill) fill.style.width = `${pctVal}%`;
    if (msg) msg.textContent = st.message || '';
    if (meta) {
      const job = st.job || {};
      const elapsed = S.inference.started ? Math.max(0, Math.round((Date.now() - S.inference.started) / 1000)) : 0;
      meta.textContent = [job.species ? `${job.species}/${job.organ}` : '', job.job_id ? `job ${job.job_id}` : '', elapsed ? `已用 ${elapsed}s` : '', st.queue ? `队列 ${st.queue}` : ''].filter(Boolean).join(' · ');
    }
  }

  function inferenceTopTable(rows, title) {
    if (!rows || !rows.length) return '';
    return `<div><div class="subgroup-head"><h3>${esc(title)}</h3><span class="count">预测 logFC</span></div>${tableHTML(rows, [
      { key: 'gene', label: '基因', cls: 'gene' },
      { key: 'pred_logFC', label: 'logFC', cls: 'num', fmt: (v) => signed(v, 3) },
    ])}</div>`;
  }

  function renderInferenceResult(summary, jobId, apiBase) {
    const host = $('#inf-result');
    if (!host) return;
    host.hidden = false;
    const warnings = summary.warnings || [];
    host.innerHTML = `
      <div class="result-head">
        <div><h3>干旱单细胞生成完成</h3><p>${esc(speciesName(summary.species))} · ${esc(organName(summary.organ))} · τ = ${esc(String(summary.tau))} · ${esc(summary.cell_source === 'custom_h5ad' ? '自定义正常细胞' : '内置正常图谱')}</p></div>
        <div class="result-actions">
          <a class="btn primary" href="${esc(apiBase)}/api/v1/jobs/${esc(jobId)}/result">下载结果 zip ${ICONS.arrow}</a>
          <button class="btn tiny ghost" data-action="inf-delete" data-value="${esc(jobId)}">删除服务器结果</button>
        </div>
      </div>
      <div class="stat-grid six">
        ${statBox(fmtInt(summary.n_cells), '细胞数')}
        ${statBox(fmtInt(summary.n_genes), '基因数')}
        ${statBox(compact(summary.n_expressed_genes), '表达基因')}
        ${statBox(fixed(summary.path_scale, 3), '路径尺度')}
        ${statBox(summary.cell_source === 'custom_h5ad' ? '自定义' : '内置图谱', '细胞来源')}
        ${statBox(fmtInt((summary.bulk_stats || {}).genes_matched), '匹配基因')}
      </div>
      ${warnings.length ? `<div class="callout warn" style="margin-top:14px"><strong>注意：</strong>${warnings.map(esc).join('；')}</div>` : ''}
      <div class="result-tables">
        ${inferenceTopTable(summary.top_up, '预测上调 Top 20')}
        ${inferenceTopTable(summary.top_down, '预测下调 Top 20')}
      </div>
      <div class="callout info" style="margin-top:14px">
        <strong>结果文件：</strong>zip 内含 h5ad（X=预测干旱计数，layers['control']=正常计数，obsm 含 TF 活性）、summary.json、predicted_logFC.tsv、context_used.tsv。上传文件已在任务结束时从服务器删除；结果最多保留 1 小时，也可点“删除服务器结果”立即清理。模型输出为计算预测，需要实验验证。
      </div>`;
  }

  async function deleteInferenceJob(jobId) {
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!base || !jobId) return;
    if (!window.confirm('确定删除服务器上的任务结果？删除后无法再次下载。')) return;
    try {
      const r = await fetch(`${base}/api/v1/jobs/${jobId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`删除失败（${r.status}）`);
      const host = $('#inf-result');
      if (host) { host.hidden = true; host.innerHTML = ''; }
      const jobBox = $('#inf-job');
      if (jobBox) jobBox.hidden = true;
      localStorage.removeItem('droaivc.inference.job');
      S.inference.jobId = '';
      toast('已删除服务器结果');
    } catch (err) {
      toast(err.message || '删除失败');
    }
  }

  async function fetchInferenceSummary(jobId, apiBase) {
    const r = await fetch(`${apiBase}/api/v1/jobs/${jobId}/summary`);
    if (!r.ok) throw new Error('结果摘要尚未生成');
    return r.json();
  }

  async function pollInferenceJob(jobId) {
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!base) return;
    clearInterval(S.inference.timer);
    S.inference.jobId = jobId;
    S.inference.started = Date.now();
    localStorage.setItem('droaivc.inference.job', jobId);
    setInferenceJobVisible(true);
    const tick = async () => {
      if (S.inference.polling) return;
      S.inference.polling = true;
      try {
        const r = await fetch(`${base}/api/v1/jobs/${jobId}`);
        if (!r.ok) throw new Error(r.status === 404 ? '任务已过期或不存在' : `状态查询失败（${r.status}）`);
        const st = await r.json();
        updateInferenceJobStatus(st);
        if (st.stage === 'done') {
          clearInterval(S.inference.timer);
          S.inference.timer = null;
          const btn = $('#inf-submit');
          if (btn) { btn.disabled = false; btn.innerHTML = `开始推理 ${ICONS.spark}`; }
          const summary = await fetchInferenceSummary(jobId, base);
          renderInferenceResult(summary, jobId, base);
          localStorage.removeItem('droaivc.inference.job');
          S.inference.jobId = '';
        } else if (st.stage === 'failed') {
          clearInterval(S.inference.timer);
          S.inference.timer = null;
          localStorage.removeItem('droaivc.inference.job');
          S.inference.jobId = '';
          const btn = $('#inf-submit');
          if (btn) { btn.disabled = false; btn.innerHTML = `开始推理 ${ICONS.spark}`; }
          const msg = $('#inf-job-message');
          if (msg) msg.textContent = st.message || st.error || '推理失败';
          toast('推理失败，请查看任务信息');
        }
      } catch (err) {
        clearInterval(S.inference.timer);
        S.inference.timer = null;
        const msg = $('#inf-job-message');
        if (msg) msg.textContent = err.message || String(err);
        const btn = $('#inf-submit');
        if (btn) { btn.disabled = false; btn.innerHTML = `开始推理 ${ICONS.spark}`; }
        toast('无法获取任务状态');
      } finally {
        S.inference.polling = false;
      }
    };
    await tick();
    if (S.inference.jobId) S.inference.timer = setInterval(tick, 2500);
  }

  async function submitInference(event) {
    event.preventDefault();
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!base) { toast('推理服务未配置'); return; }
    const useExample = $('#inf-use-example')?.checked;
    const custom = $('#inf-custom')?.checked && !useExample;
    const species = $('#inf-species')?.value || '';
    const organ = $('#inf-organ')?.value || '';
    const bulk = $('#inf-bulk')?.files?.[0];
    const h5ad = $('#inf-h5ad')?.files?.[0];
    const map = $('#inf-map')?.files?.[0];
    if (!useExample && !bulk) { toast('请上传 bulk 情境表，或勾选使用示例数据'); return; }
    if (custom && !h5ad) { toast('已勾选自定义单细胞，请上传 h5ad'); return; }
    const fd = new FormData();
    fd.append('species', species);
    fd.append('organ', organ);
    fd.append('tau', $('#inf-tau')?.value || '1');
    fd.append('max_cells', $('#inf-maxcells')?.value || '3000');
    fd.append('use_example', useExample ? 'true' : 'false');
    fd.append('custom_cells', custom ? 'true' : 'false');
    if (!useExample && bulk) fd.append('bulk', bulk);
    if (custom && h5ad) fd.append('normal_h5ad', h5ad);
    if (map) fd.append('gene_map', map);
    const btn = $('#inf-submit');
    if (btn) { btn.disabled = true; btn.textContent = '提交中…'; }
    setInferenceJobVisible(true);
    const resultBox = $('#inf-result');
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
    updateInferenceJobStatus({ stage: 'queued', progress: 0, message: '正在提交任务…' });
    try {
      const r = await fetch(`${base}/api/v1/jobs`, { method: 'POST', body: fd });
      let data = {};
      try { data = await r.json(); } catch { data = {}; }
      if (!r.ok) throw new Error(data.detail || `提交失败（${r.status}）`);
      if (btn) { btn.disabled = true; btn.textContent = '排队中…'; }
      await pollInferenceJob(data.job_id);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.innerHTML = `开始推理 ${ICONS.spark}`; }
      const msg = $('#inf-job-message');
      if (msg) msg.textContent = err.message || String(err);
      toast(err.message || '提交失败');
    }
  }

  function syncInferenceExampleState() {
    const useExample = $('#inf-use-example')?.checked;
    const customBox = $('#inf-custom');
    const h5adInput = $('#inf-h5ad');
    const bulkInput = $('#inf-bulk');
    const speciesSel = $('#inf-species');
    const organSel = $('#inf-organ');
    if (useExample) {
      if (speciesSel) { speciesSel.value = 'rice'; speciesSel.disabled = true; }
      if (organSel) {
        organSel.innerHTML = inferenceOrganOptions(S.inferenceMeta, 'rice', false, 'leaf');
        organSel.value = 'leaf';
        organSel.disabled = true;
      }
      if (customBox) { customBox.checked = false; customBox.disabled = true; }
      if (h5adInput) { h5adInput.disabled = true; h5adInput.value = ''; }
      if (bulkInput) { bulkInput.disabled = true; bulkInput.value = ''; }
    } else {
      if (speciesSel) speciesSel.disabled = false;
      if (organSel) {
        organSel.disabled = false;
        const sp = speciesSel?.value || 'rice';
        const list = S.inferenceMeta?.organs?.[sp] || [];
        organSel.innerHTML = inferenceOrganOptions(S.inferenceMeta, sp, customBox?.checked, list[0]?.key || 'leaf');
      }
      if (customBox) customBox.disabled = false;
      if (bulkInput) bulkInput.disabled = false;
      if (h5adInput) h5adInput.disabled = !customBox?.checked;
    }
    updateInferenceFormat();
  }

  function updateInferenceFormat() {
    const host = $('#inf-gene-format');
    if (!host) return;
    const sp = $('#inf-species')?.value || 'rice';
    host.innerHTML = inferenceGeneExampleHTML(S.inferenceMeta, sp);
  }

  function updateInferenceOrgans() {
    const sp = $('#inf-species')?.value || 'rice';
    const custom = $('#inf-custom')?.checked;
    const organSel = $('#inf-organ');
    if (!organSel) return;
    const list = custom ? (S.inferenceMeta?.all_organs || []).map((k) => ({ key: k })) : (S.inferenceMeta?.organs?.[sp] || []);
    const current = organSel.value;
    organSel.innerHTML = inferenceOrganOptions(S.inferenceMeta, sp, custom, list.some((o) => o.key === current) ? current : (list[0]?.key || 'leaf'));
    updateInferenceFormat();
  }

  async function checkInferenceHealth() {
    const badge = $('#inf-api-badge');
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!badge) return;
    if (!base) { badge.textContent = '未配置推理服务'; badge.className = 'tag gold'; return; }
    badge.textContent = '检查服务…';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('health');
      const d = await r.json();
      badge.textContent = `GPU 服务在线${typeof d.queue === 'number' ? ` · 队列 ${d.queue}` : ''}`;
      badge.className = 'tag teal';
    } catch {
      badge.textContent = '服务离线 · 请稍后再试';
      badge.className = 'tag gold';
    }
  }

  function bindInferencePanel() {
    const form = $('#inference-form');
    if (!form) return;
    syncInferenceExampleState();
    $('#inf-species')?.addEventListener('change', updateInferenceOrgans);
    $('#inf-custom')?.addEventListener('change', () => {
      const h5ad = $('#inf-h5ad');
      if (h5ad) h5ad.disabled = !$('#inf-custom').checked;
      updateInferenceOrgans();
    });
    $('#inf-use-example')?.addEventListener('change', syncInferenceExampleState);
    form.addEventListener('submit', submitInference);
    checkInferenceHealth();
    if (S.inference.jobId) pollInferenceJob(S.inference.jobId);
  }

  async function virtualPrediction() {
    const inferenceMeta = await ensureInferenceMeta().catch(() => null);
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
      ${inferencePanelHTML(inferenceMeta)}
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
            <span class="legend-item"><span class="legend-swatch" style="background:#1668e3"></span>正常细胞</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#e5008a"></span>干旱预测细胞</span>
            <span class="legend-item"><span class="legend-swatch" style="background:linear-gradient(90deg,#1668e3,#e5008a);border-radius:2px"></span>轨迹路标点（颜色随时间）</span>
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
    ctx.strokeStyle = 'rgba(0,0,0,.07)';
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
      const hue = 220 + 110 * clamp(t, 0, 1);
      ctx.fillStyle = `hsla(${hue},78%,58%,.16)`;
      ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 1.15, 0, Math.PI * 2); ctx.fill();
    }
    // normal / drought
    for (const p of pts) {
      if (p[6] === 0) {
        ctx.fillStyle = 'rgba(22,104,227,.18)';
        ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 1.15, 0, Math.PI * 2); ctx.fill();
      } else if (p[6] === 1) {
        ctx.fillStyle = 'rgba(229,0,138,.18)';
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
    ctx.strokeStyle = 'rgba(229,0,138,.55)';
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
      const hue = 220 + 110 * (i / 10);
      ctx.fillStyle = `hsla(${hue},82%,62%,.9)`;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      if (i === 0 || i === 10 || i === S.trajTime) {
        ctx.fillStyle = '#333333';
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText(i === 10 ? '干旱 · t=1.0' : i === 0 ? '正常 · t=0' : `t=${(i / 10).toFixed(1)}`, x + 7, y - 6);
      }
    });
    // current time points
    const t = S.trajTime / 10;
    const hue = 220 + 110 * t;
    ctx.fillStyle = `hsla(${hue},88%,64%,.92)`;
    ctx.strokeStyle = 'rgba(0,0,0,.28)';
    ctx.lineWidth = .5;
    for (const p of pts) {
      if (p[6] === 2 && Math.abs((p[7] < 0 ? -1 : p[7]) - t) < .01) {
        ctx.beginPath(); ctx.arc(sx(p[xi]), sy(p[yi]), 2.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    // labels
    ctx.fillStyle = '#888888';
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
  const CHART_COLORS = ['#1668e3', '#e5008a', '#f2a900', '#7a5af8', '#12b5a5', '#c62828', '#00a3a3', '#8e8e8e'];

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
      ['avg_outdeg', '平均出度', '#1668e3'],
      ['avg_indeg', '平均入度', '#1668e3'],
      ['net_entropy', '网络熵', '#e5008a'],
      ['hub_conc', 'Hub 集中度', '#c62828'],
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

  /* ---------------- online perturbation ---------------- */
  function perturbMaxGenes() {
    return Math.max(1, Math.min(10, Number(S.inferenceMeta?.perturb?.max_genes) || 10));
  }

  function pertGeneInputsHTML(count, values) {
    return Array.from({ length: count }, (_, i) => `
      <label class="field pert-gene-field">
        <span>扰动基因 ${i + 1}</span>
        <input class="input" id="pert-gene-${i}" list="pert-gene-list" placeholder="输入或搜索基因 ID" autocomplete="off" spellcheck="false" value="${esc(values[i] || '')}">
      </label>`).join('');
  }

  function pertSuggestHTML(meta, species) {
    const rec = meta?.perturb_genes?.[species] || [];
    if (!rec.length) return '<span class="muted">暂无推荐基因，可直接搜索基因 ID。</span>';
    return rec.map((g) => {
      const tip = [g.gene, g.name, g.family, g.model_tf ? 'TF' : 'non-TF'].filter(Boolean).join(' · ');
      return `<button type="button" class="chip-btn" data-action="pert-fill" data-value="${esc(g.gene)}" title="${esc(tip)}">${esc(g.name || g.gene)}</button>`;
    }).join('');
  }

  function perturbPanelHTML(meta) {
    const speciesList = meta?.species || S.site.species;
    const selected = speciesList.some((s) => s.key === S.predictionSpecies) ? S.predictionSpecies : 'rice';
    const organs = meta?.organs?.[selected] || [];
    const organRows = organs.length ? organs : [{ key: 'leaf' }, { key: 'root' }];
    const organDefault = organRows.some((o) => o.key === 'leaf') ? 'leaf' : organRows[0].key;
    const cfg = meta?.perturb || {};
    const maxGenes = perturbMaxGenes();
    const count = Math.max(1, Math.min(maxGenes, Number(S.perturbCount) || 1));
    const modes = cfg.modes || ['KO', 'OE'];
    const maxCells = Number(cfg.max_cells) || 3000;
    const defaultCells = Math.min(Number(cfg.default_cells) || 3000, maxCells);
    const cellOpts = [3000, 1000, 500].filter((n) => n <= maxCells);
    return `
      <section class="section" id="perturb-online-section">
        <div class="section-head">
          <div>
            <div class="section-kicker">Online perturbation · GPU</div>
            <h2 class="section-title">在线基因扰动</h2>
            <p class="section-desc">选定物种与器官，同时扰动 1–${maxGenes} 个基因（全部 KO 或全部 OE），输出扰动后的单细胞矩阵、全基因效应表和 TF 活性变化。正常细胞取自内置图谱。</p>
          </div>
          <span class="tag" id="pert-api-badge">检查服务…</span>
        </div>
        <div class="inference-panel">
          <form id="perturb-form">
            <div class="inference-row">
              <label class="field"><span>物种</span>
                <select class="select" id="pert-species">${speciesList.map((s) => `<option value="${esc(s.key)}" ${s.key === selected ? 'selected' : ''}>${esc(s.name || s.key)}（${esc(s.code || '')}）</option>`).join('')}</select>
              </label>
              <label class="field"><span>器官</span>
                <select class="select" id="pert-organ">${organRows.map((o) => `<option value="${esc(o.key)}" ${o.key === organDefault ? 'selected' : ''}>${esc(organName(o.key))}${o.n_cells ? `（${compact(o.n_cells)} cells）` : ''}</option>`).join('')}</select>
              </label>
              <label class="field"><span>扰动基因个数</span>
                <select class="select" id="pert-count">${Array.from({ length: maxGenes }, (_, i) => `<option value="${i + 1}" ${i + 1 === count ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>
              </label>
              <label class="field"><span>扰动模式</span>
                <select class="select" id="pert-mode">${modes.map((m) => `<option value="${esc(m)}" ${m === 'KO' ? 'selected' : ''}>${m === 'KO' ? '敲低 KO' : '过表达 OE'}</option>`).join('')}</select>
              </label>
            </div>
            <div class="perturb-gene-grid" id="pert-gene-inputs">${pertGeneInputsHTML(count, [])}</div>
            <datalist id="pert-gene-list"></datalist>
            <div class="perturb-suggest-wrap">
              <div class="perturb-suggest-head"><span>推荐抗旱基因</span><span>点击填入第一个空位</span></div>
              <div class="filter-chips" id="pert-suggest">${pertSuggestHTML(meta, selected)}</div>
            </div>
            <div class="inference-row" style="margin-top:12px">
              <label class="field" id="pert-fold-field"><span>过表达倍数</span><input class="input" id="pert-fold" type="number" min="1" max="100" step="1" value="${Number(cfg.default_fold) || 10}"></label>
              <label class="field"><span>最大细胞数</span>
                <select class="select" id="pert-cells">${cellOpts.map((n) => `<option value="${n}" ${n === defaultCells ? 'selected' : ''}>${fmtInt(n)} cells</option>`).join('')}</select>
              </label>
            </div>
            <div class="inference-actions">
              <button class="btn primary" id="pert-submit" type="submit">开始扰动推理 ${ICONS.flask}</button>
              <span class="inference-hint">单任务排队；结果含 h5ad 矩阵、全基因效应表、TF 活性与伪 bulk，最多保留 1 小时。模型输出为计算预测，不是实验证据。</span>
            </div>
          </form>
          <div class="inference-job" id="pert-job" hidden>
            <div class="job-head"><strong id="pert-job-stage">排队中</strong><span id="pert-job-progress">0%</span></div>
            <div class="progress-track"><div class="progress-fill" id="pert-progress-fill"></div></div>
            <div class="job-message" id="pert-job-message">正在提交…</div>
            <div class="job-meta" id="pert-job-meta"></div>
          </div>
          <div class="inference-result" id="pert-result" hidden></div>
        </div>
      </section>`;
  }

  function renderPertGeneInputs(clear = false) {
    const host = $('#pert-gene-inputs');
    if (!host) return;
    const count = Math.max(1, Math.min(perturbMaxGenes(), Number($('#pert-count')?.value || S.perturbCount || 1)));
    S.perturbCount = count;
    const current = clear ? [] : $$('#pert-gene-inputs input').map((x) => x.value);
    host.innerHTML = pertGeneInputsHTML(count, current);
  }

  function fillPertGeneOptions(genes) {
    const list = $('#pert-gene-list');
    if (!list) return;
    list.innerHTML = (genes || []).map((g) => {
      const label = [g.name, g.family, g.tf ? 'TF' : 'non-TF'].filter(Boolean).join(' · ');
      return `<option value="${esc(g.gene)}" label="${esc(label)}"></option>`;
    }).join('');
  }

  async function loadPertGeneOptions(q = '') {
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    const sp = $('#pert-species')?.value || 'rice';
    const recommended = (S.inferenceMeta?.perturb_genes?.[sp] || []).map((g) => ({ gene: g.gene, name: g.name, family: g.family, tf: g.model_tf }));
    if (!q) fillPertGeneOptions(recommended);
    if (!base) return;
    try {
      const r = await fetch(`${base}/api/v1/genes?species=${encodeURIComponent(sp)}&q=${encodeURIComponent(q)}&limit=30`);
      if (!r.ok) throw new Error('genes');
      const d = await r.json();
      if (d.genes && d.genes.length) fillPertGeneOptions(d.genes);
    } catch {
      if (q) fillPertGeneOptions(recommended);
    }
  }

  function updatePertSuggest() {
    const host = $('#pert-suggest');
    if (!host) return;
    host.innerHTML = pertSuggestHTML(S.inferenceMeta, $('#pert-species')?.value || 'rice');
  }

  function updatePertFoldVisibility() {
    const field = $('#pert-fold-field');
    if (!field) return;
    field.style.display = ($('#pert-mode')?.value || 'KO') === 'OE' ? '' : 'none';
  }

  function updatePertOrgans() {
    const sel = $('#pert-organ');
    if (!sel) return;
    const sp = $('#pert-species')?.value || 'rice';
    const rows = S.inferenceMeta?.organs?.[sp] || [];
    const list = rows.length ? rows : [{ key: 'leaf' }, { key: 'root' }];
    const current = sel.value;
    const chosen = list.some((o) => o.key === current) ? current : (list.some((o) => o.key === 'leaf') ? 'leaf' : list[0].key);
    sel.innerHTML = list.map((o) => `<option value="${esc(o.key)}" ${o.key === chosen ? 'selected' : ''}>${esc(organName(o.key))}${o.n_cells ? `（${compact(o.n_cells)} cells）` : ''}</option>`).join('');
  }

  async function checkPerturbHealth() {
    const badge = $('#pert-api-badge');
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!badge) return;
    if (!base) { badge.textContent = '未配置推理服务'; badge.className = 'tag gold'; return; }
    badge.textContent = '检查服务…';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('health');
      const d = await r.json();
      badge.textContent = `GPU 服务在线${typeof d.queue === 'number' ? ` · 队列 ${d.queue}` : ''}`;
      badge.className = 'tag teal';
    } catch {
      badge.textContent = '服务离线 · 请稍后再试';
      badge.className = 'tag gold';
    }
  }

  function setPerturbJobVisible(show) {
    const box = $('#pert-job');
    if (box) box.hidden = !show;
  }

  function updatePerturbJobStatus(st) {
    const stageNames = {
      queued: '排队中', running: '运行中', preparing: '准备数据', loading_model: '加载模型',
      encoding: '编码正常细胞', calibrating: '校准干旱轨迹', perturbing: '计算扰动',
      writing: '写出扰动矩阵', packaging: '打包结果', done: '完成', failed: '失败',
    };
    const stage = stageNames[st.stage] || st.stage || '运行中';
    const pctVal = Math.round(Number(st.progress || 0) * 100);
    const stageEl = $('#pert-job-stage');
    const progEl = $('#pert-job-progress');
    const fill = $('#pert-progress-fill');
    const msg = $('#pert-job-message');
    const meta = $('#pert-job-meta');
    if (stageEl) stageEl.textContent = stage;
    if (progEl) progEl.textContent = `${pctVal}%`;
    if (fill) fill.style.width = `${pctVal}%`;
    if (msg) msg.textContent = st.message || '';
    if (meta) {
      const job = st.job || {};
      const genes = Array.isArray(job.genes) ? job.genes.join(' + ') : '';
      const elapsed = S.perturb.started ? Math.max(0, Math.round((Date.now() - S.perturb.started) / 1000)) : 0;
      meta.textContent = [job.species ? `${job.species}/${job.organ}` : '', genes, job.mode || '',
        job.job_id ? `job ${job.job_id}` : '', elapsed ? `已用 ${elapsed}s` : '', st.queue ? `队列 ${st.queue}` : ''].filter(Boolean).join(' · ');
    }
  }

  function pertTopTable(rows, title) {
    if (!rows || !rows.length) return '<div class="callout">无 |logFC| 明显变化的基因。</div>';
    return `<div><div class="subgroup-head"><h3>${esc(title)}</h3><span class="count">logFC</span></div>${tableHTML(rows, [
      { key: 'gene', label: '基因', cls: 'gene' },
      { key: 'lfc', label: 'logFC', cls: 'num', fmt: (v) => signed(v, 3) },
    ])}</div>`;
  }

  function pertTfTable(rows, title) {
    if (!rows || !rows.length) return '<div class="callout">无明显的 TF 活性变化。</div>';
    return `<div><div class="subgroup-head"><h3>${esc(title)}</h3><span class="count">Δ activity</span></div>${tableHTML(rows, [
      { key: 'tf', label: 'TF', cls: 'gene' },
      { key: 'delta', label: 'Δ 活性', cls: 'num', fmt: (v) => signed(v, 3) },
    ])}</div>`;
  }

  function pertAdditivityHTML(add) {
    if (!add) return '';
    const val = (v) => (v == null || !Number.isFinite(Number(v)) ? '—' : Number(v).toFixed(3));
    return `<div class="subgroup" style="margin-top:20px">
      <div class="subgroup-head"><h3>组合扰动可加性</h3><span class="count">组合 vs 单基因之和</span></div>
      <div class="stat-grid six">
        ${statBox(val(add.norm_ratio_control), 'norm ratio · 正常')}
        ${statBox(val(add.gain_vs_best_single_control), 'vs 最强单基因')}
        ${statBox(val(add.rel_epistasis_control), '相对上位效应')}
        ${statBox(fmtInt(add['n_abs_epistasis_gt_0.1_control'] || 0), '|上位|>0.1')}
        ${statBox(val(add.norm_ratio_drought_t1), 'norm ratio · 干旱')}
        ${statBox(val(add.rel_epistasis_drought_t1), '相对上位 · 干旱')}
      </div>
      ${add.top_epistasis_control?.length ? `<div style="margin-top:12px">${tableHTML(add.top_epistasis_control, [
        { key: 'gene', label: '基因', cls: 'gene' },
        { key: 'epistasis', label: '上位效应', cls: 'num', fmt: (v) => signed(v, 3) },
      ])}</div>` : ''}
    </div>`;
  }

  function renderPerturbResult(summary, jobId, apiBase) {
    const host = $('#pert-result');
    if (!host) return;
    host.hidden = false;
    const genes = summary.genes || [];
    const warnings = summary.warnings || [];
    const head = `${esc(speciesName(summary.species))} · ${esc(organName(summary.organ))} · ${genes.map(esc).join(' + ')}`;
    host.innerHTML = `
      <div class="result-head">
        <div><h3>基因扰动完成</h3><p>${head} · ${esc(summary.mode)}${summary.fold ? `（${esc(String(summary.fold))}×）` : ''} · ${esc(summary.context || '内置情境')}</p></div>
        <div class="result-actions">
          <a class="btn primary" href="${esc(apiBase)}/api/v1/jobs/${esc(jobId)}/result">下载结果 zip ${ICONS.arrow}</a>
          <button class="btn tiny ghost" data-action="pert-delete" data-value="${esc(jobId)}">删除服务器结果</button>
        </div>
      </div>
      <div class="stat-grid six">
        ${statBox(fmtInt(summary.n_cells), '细胞数')}
        ${statBox(fmtInt(genes.length), '扰动基因')}
        ${statBox(fmtInt(summary.n_changed_control), '|logFC|>0.1')}
        ${statBox(fixed(summary.max_abs_control, 3), '最大 |logFC|')}
        ${statBox(summary.covered ? '已覆盖' : '部分未覆盖', '扰动路径')}
        ${statBox(fmtInt(summary.n_expressed_genes), '表达基因')}
      </div>
      ${warnings.length ? `<div class="callout warn" style="margin-top:14px"><strong>注意：</strong>${warnings.map(esc).join('；')}</div>` : ''}
      <div class="result-tables">
        ${pertTopTable(summary.top_up_control, '正常 · 上调 Top 10')}
        ${pertTopTable(summary.top_down_control, '正常 · 下调 Top 10')}
        ${pertTopTable(summary.top_up_drought_t1, '干旱 τ=1 · 上调 Top 10')}
        ${pertTopTable(summary.top_down_drought_t1, '干旱 τ=1 · 下调 Top 10')}
      </div>
      <div class="result-tables">
        ${pertTfTable(summary.tf_top_control, 'TF 活性变化 · 正常')}
        ${pertTfTable(summary.tf_top_drought_t1, 'TF 活性变化 · 干旱 τ=1')}
      </div>
      ${pertAdditivityHTML(summary.additivity)}
      <div class="callout info" style="margin-top:14px">
        <strong>结果文件：</strong>zip 内含 h5ad（X=扰动后干旱计数，layers 含 control/control_perturbed/drought）、
        perturbation_effects.tsv.gz（全基因 logFC 与交互项）、tf_activity.tsv、celltype_pseudobulk.npz 和单基因效应表。
        结果最多保留 1 小时；模型输出为计算预测，需要实验验证。
      </div>`;
  }

  async function deletePerturbJob(jobId) {
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!base || !jobId) return;
    if (!window.confirm('确定删除服务器上的扰动结果？删除后无法再次下载。')) return;
    try {
      const r = await fetch(`${base}/api/v1/jobs/${jobId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`删除失败（${r.status}）`);
      const host = $('#pert-result');
      if (host) { host.hidden = true; host.innerHTML = ''; }
      const jobBox = $('#pert-job');
      if (jobBox) jobBox.hidden = true;
      localStorage.removeItem('droaivc.perturb.job');
      S.perturb.jobId = '';
      toast('已删除服务器结果');
    } catch (err) {
      toast(err.message || '删除失败');
    }
  }

  async function pollPerturbJob(jobId) {
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!base) return;
    clearInterval(S.perturb.timer);
    S.perturb.jobId = jobId;
    S.perturb.started = Date.now();
    localStorage.setItem('droaivc.perturb.job', jobId);
    setPerturbJobVisible(true);
    const tick = async () => {
      if (S.perturb.polling) return;
      S.perturb.polling = true;
      try {
        const r = await fetch(`${base}/api/v1/jobs/${jobId}`);
        if (!r.ok) throw new Error(r.status === 404 ? '任务已过期或不存在' : `状态查询失败（${r.status}）`);
        const st = await r.json();
        updatePerturbJobStatus(st);
        if (st.stage === 'done') {
          clearInterval(S.perturb.timer);
          S.perturb.timer = null;
          const btn = $('#pert-submit');
          if (btn) { btn.disabled = false; btn.innerHTML = `开始扰动推理 ${ICONS.flask}`; }
          const sr = await fetch(`${base}/api/v1/jobs/${jobId}/summary`);
          if (!sr.ok) throw new Error('结果摘要尚未生成');
          renderPerturbResult(await sr.json(), jobId, base);
          localStorage.removeItem('droaivc.perturb.job');
          S.perturb.jobId = '';
        } else if (st.stage === 'failed') {
          clearInterval(S.perturb.timer);
          S.perturb.timer = null;
          localStorage.removeItem('droaivc.perturb.job');
          S.perturb.jobId = '';
          const btn = $('#pert-submit');
          if (btn) { btn.disabled = false; btn.innerHTML = `开始扰动推理 ${ICONS.flask}`; }
          const msg = $('#pert-job-message');
          if (msg) msg.textContent = st.message || st.error || '扰动推理失败';
          toast('扰动推理失败，请查看任务信息');
        }
      } catch (err) {
        clearInterval(S.perturb.timer);
        S.perturb.timer = null;
        const msg = $('#pert-job-message');
        if (msg) msg.textContent = err.message || String(err);
        const btn = $('#pert-submit');
        if (btn) { btn.disabled = false; btn.innerHTML = `开始扰动推理 ${ICONS.flask}`; }
        toast('无法获取扰动任务状态');
      } finally {
        S.perturb.polling = false;
      }
    };
    await tick();
    if (S.perturb.jobId) S.perturb.timer = setInterval(tick, 2500);
  }

  async function submitPerturb(event) {
    event.preventDefault();
    const base = String(S.inferenceMeta?.api_base || '').replace(/\/$/, '');
    if (!base) { toast('推理服务未配置'); return; }
    const species = $('#pert-species')?.value || '';
    const organ = $('#pert-organ')?.value || '';
    const count = Number($('#pert-count')?.value || 1);
    const mode = $('#pert-mode')?.value || 'KO';
    const fold = Number($('#pert-fold')?.value || 10);
    const maxCells = Number($('#pert-cells')?.value || 3000);
    const genes = [];
    for (let i = 0; i < count; i += 1) {
      const v = String($(`#pert-gene-${i}`)?.value || '').trim();
      if (!v) { toast(`请填写扰动基因 ${i + 1}`); return; }
      if (genes.includes(v)) { toast('扰动基因不能重复'); return; }
      genes.push(v);
    }
    if (mode === 'OE' && !(fold >= 1 && fold <= 100)) { toast('过表达倍数需在 1–100 之间'); return; }
    const fd = new FormData();
    fd.append('job_type', 'perturb');
    fd.append('species', species);
    fd.append('organ', organ);
    fd.append('genes', genes.join(','));
    fd.append('mode', mode);
    fd.append('fold', String(fold));
    fd.append('max_cells', String(maxCells));
    const btn = $('#pert-submit');
    if (btn) { btn.disabled = true; btn.textContent = '提交中…'; }
    setPerturbJobVisible(true);
    const resultBox = $('#pert-result');
    if (resultBox) { resultBox.hidden = true; resultBox.innerHTML = ''; }
    updatePerturbJobStatus({ stage: 'queued', progress: 0, message: '正在提交任务…' });
    try {
      const r = await fetch(`${base}/api/v1/jobs`, { method: 'POST', body: fd });
      let data = {};
      try { data = await r.json(); } catch { data = {}; }
      if (!r.ok) throw new Error(data.detail || `提交失败（${r.status}）`);
      if (btn) { btn.disabled = true; btn.textContent = '排队中…'; }
      await pollPerturbJob(data.job_id);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.innerHTML = `开始扰动推理 ${ICONS.flask}`; }
      const msg = $('#pert-job-message');
      if (msg) msg.textContent = err.message || String(err);
      toast(err.message || '提交失败');
    }
  }

  function bindPerturbPanel() {
    const form = $('#perturb-form');
    if (!form) return;
    renderPertGeneInputs();
    updatePertOrgans();
    updatePertSuggest();
    updatePertFoldVisibility();
    loadPertGeneOptions('');
    checkPerturbHealth();
    $('#pert-species')?.addEventListener('change', () => {
      S.predictionSpecies = $('#pert-species')?.value || 'rice';
      updatePertOrgans();
      updatePertSuggest();
      renderPertGeneInputs(true);
      loadPertGeneOptions('');
    });
    $('#pert-count')?.addEventListener('change', () => renderPertGeneInputs());
    $('#pert-mode')?.addEventListener('change', updatePertFoldVisibility);
    $('#pert-gene-inputs')?.addEventListener('input', (e) => {
      clearTimeout(S.perturb.searchTimer);
      const q = String(e.target.value || '').trim();
      if (q.length < 2) { loadPertGeneOptions(''); return; }
      S.perturb.searchTimer = setTimeout(() => loadPertGeneOptions(q), 300);
    });
    form.addEventListener('submit', submitPerturb);
    if (S.perturb.jobId) pollPerturbJob(S.perturb.jobId);
  }

  /* ---------------- perturbation ---------------- */
  async function virtualPerturbation() {
    await Promise.all([ensureInteractive(), ensureVirtual()]);
    const inferenceMeta = await ensureInferenceMeta().catch(() => null);
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
      ${perturbPanelHTML(inferenceMeta)}
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
    const MP = await ensureModelPerformance();
    const figs = MP.figures || [];
    const modules = MP.modules || [];
    const tables = MP.key_tables || [];
    const stats = MP.stats || {};
    const baselineFigs = figs.filter((f) => f.module_key === '326_baselines' || f.module_key === '327_ablations');
    const grouped = modules.map((m) => ({
      ...m,
      figures: figs.filter((f) => f.module_key === m.key && f.module_key !== '326_baselines' && f.module_key !== '327_ablations'),
    })).filter((m) => m.figures.length);
    return `
      <section class="section" style="margin-top:22px">
        <div class="stat-grid six">
          ${statBox(stats.modules || modules.length || 9, '评价模块')}
          ${statBox(stats.figures || figs.length, '图件')}
          ${statBox(stats.heldout_studies || 5, '留出研究')}
          ${statBox(stats.ablations || 5, '消融版本')}
          ${statBox(stats.seeds || 3, '随机种子')}
          ${statBox(stats.tables || tables.length, '结果表')}
        </div>
        <div class="callout info" style="margin-top:18px"><strong>总体结论：</strong>${esc(MP.summary || '')}</div>
      </section>

      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Baselines · ablations</div><h2 class="section-title">基线对比与消融</h2><p class="section-desc">正式模型与统一变化、v9、线性、BayesPrism、CPA、biolord、scGen、scSemiProfiler、Bulk2Space 等方法在同一单元上比较；关键模块逐项消融。</p></div></div>
        ${baselineFigs.length ? figureGrid(baselineFigs, 'eval-baseline') : '<div class="callout">基线 / 消融图暂未载入。</div>'}
      </section>

      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Modules</div><h2 class="section-title">分模块评估</h2><p class="section-desc">5 项留出研究、中间时间点、网络证据、组成 / 解卷积、种子稳定性、21 物种适用范围与扰动验证。</p></div></div>
        ${grouped.map((m) => `
          <div class="subgroup">
            <div class="subgroup-head"><h3>${esc(m.code)} · ${esc(m.name)}</h3><span class="count">${fmtInt(m.figures.length)} 图 · ${fmtInt(m.table_count || 0)} 表</span></div>
            <p class="section-desc" style="margin:-4px 0 12px">${esc(m.desc || '')}</p>
            ${figureGrid(m.figures, `eval-${m.key}`)}
          </div>`).join('')}
      </section>

      <section class="section">
        <div class="section-head"><div><div class="section-kicker">Tables</div><h2 class="section-title">关键结果表</h2><p class="section-desc">基线、消融、留出研究、适用范围与扰动验证的数值结果；完整表见源目录。</p></div></div>
        <div class="ia-table-grid">${tables.map(iaKeyTable).join('')}</div>
      </section>

      <div class="callout warn"><strong>模型边界（完整表述）：</strong>细胞类型 logFC 与“各类型同样变化”基线持平；相对现有 bulk–单细胞与扰动响应方法有明显优势，但类型特异信号的增益很小。5 个物种（香蕉、大麦、西兰花、花生、小麦）网络很弱，依赖网络的结论不适用。所有结果均为模型评估，不是实验验证。</div>`;
  }

  function heatValue(v, digits = 3) {
    if (v === null || v === undefined || v === '') return '<span style="color:var(--dim)">—</span>';
    const n = Number(v);
    if (!Number.isFinite(n)) return '<span style="color:var(--dim)">—</span>';
    const a = clamp(Math.abs(n), 0, 1);
    const color = n >= 0 ? `rgba(22,104,227,${0.07 + a * 0.20})` : `rgba(198,40,40,${0.07 + a * 0.18})`;
    const text = n >= 0 ? '#0b4fb3' : '#a51f1f';
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
  let FIGURE_METHODS = null;
  let FIGURE_METHODS_PROMISE = null;
  async function ensureFigureMethods() {
    if (FIGURE_METHODS) return FIGURE_METHODS;
    if (!FIGURE_METHODS_PROMISE) {
      FIGURE_METHODS_PROMISE = fetch('data/figure_methods.json')
        .then((r) => { if (!r.ok) throw new Error(`figure_methods: ${r.status}`); return r.json(); })
        .then((d) => { FIGURE_METHODS = d; return d; })
        .catch(() => { FIGURE_METHODS = { by_web_id: {} }; return FIGURE_METHODS; });
    }
    return FIGURE_METHODS_PROMISE;
  }

  function renderLightboxDetails(rec) {
    const method = $('#lb-method');
    const result = $('#lb-result');
    if (!method || !result) return;
    if (rec.method || rec.result) {
      method.hidden = false;
      result.hidden = false;
      const mb = $('.lb-detail-body', method);
      const rb = $('.lb-detail-body', result);
      if (mb) mb.textContent = rec.method || '—';
      if (rb) rb.textContent = rec.result || '—';
      return;
    }
    if (!FIGURE_METHODS) {
      method.hidden = false;
      result.hidden = true;
      const body = $('.lb-detail-body', method);
      if (body) body.textContent = '正在加载方法与生物学结论…';
      ensureFigureMethods().then(() => {
        if (S.lightbox.list[S.lightbox.index] === rec) renderLightboxDetails(rec);
      });
      return;
    }
    const d = FIGURE_METHODS.by_web_id?.[rec.id];
    if (!d) {
      method.hidden = true;
      result.hidden = true;
      return;
    }
    method.hidden = false;
    result.hidden = false;
    const mb = $('.lb-detail-body', method);
    const rb = $('.lb-detail-body', result);
    if (mb) mb.textContent = d.method || '—';
    if (rb) rb.textContent = d.result || '—';
  }

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
    if (cap) {
      cap.textContent = rec.caption || '';
      cap.hidden = !rec.caption;
    }
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
    renderLightboxDetails(rec);
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
      ['数据层', 'data', '批量、单细胞与调控关系'],
      ['批量转录组', 'bulk', '全物种与单物种 bulk 结果'],
      ['单细胞转录组', 'single-cell', '全物种、单物种与单器官结果'],
      ['调控关系', 'regulatory', '初始 TF–靶基因调控关系与匹配统计'],
      ['单细胞图谱', 'atlas', '21 物种单细胞分析'],
      ['虚拟细胞', 'virtual', '干旱预测、轨迹、GRN、扰动'],
      ['全图库', 'gallery', '检索全部图件'],
      ['方法与数据', 'methods', '目录、软链接、模型边界'],
      ['干旱细胞规律', 'drought', '3 物种实测干旱 scRNA'],
      ['耐旱状态设计', 'design', '预测 + 扰动 + GRN 工作流'],
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
      case 'inf-delete':
        deleteInferenceJob(value);
        break;
      case 'ia-module':
        iaSelectModule(value);
        break;
      case 'pert-fill': {
        const inputs = $$('#pert-gene-inputs input');
        const target = inputs.find((x) => !x.value.trim()) || inputs[inputs.length - 1];
        if (target) {
          target.value = value;
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.focus();
        }
        break;
      }
      case 'pert-delete':
        deletePerturbJob(value);
        break;
      case 'reg-download':
        downloadRegulatorySummary();
        break;
      case 'reg-tf': {
        const sel = $('#reg-tf-select');
        if (sel) {
          sel.value = value;
          sel.dispatchEvent(new Event('change'));
          const net = $('#reg-network');
          if (net) net.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      }
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
      const scrollLink = e.target.closest('[data-scroll-target]');
      if (scrollLink) {
        e.preventDefault();
        S.pendingScroll = scrollLink.dataset.scrollTarget;
        const h = hashFor('data');
        if (location.hash === h) renderRoute();
        else location.hash = h;
        return;
      }
      const resultCard = e.target.closest('.result-card');
      if (resultCard) {
        e.preventDefault();
        openResultLightbox(resultCard.dataset.resultList, Number(resultCard.dataset.resultIndex));
        return;
      }
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
