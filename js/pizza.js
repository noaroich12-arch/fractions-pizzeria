/* pizza.js - חשבון שברים, ציור הפיצה, והלוח האינטראקטיבי (חיתוך, בחירת חלקים, תוספות) */
(function () {
  'use strict';
  var PZ = window.PZ = window.PZ || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* ================= חשבון שברים מדויק ================= */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function reduce(a, b) { var g = gcd(a, b); return [a / g, b / g]; }
  function eq(x, y) { return x[0] * y[1] === y[0] * x[1]; }
  function add(x, y) { return reduce(x[0] * y[1] + y[0] * x[1], x[1] * y[1]); }
  PZ.math = { gcd: gcd, reduce: reduce, eq: eq, add: add };

  /* ================= שמות שברים בעברית ================= */
  var NUM_M = ['אפס', 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה'];
  var NUM_F = ['אפס', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];
  var DEN = {
    3: ['שליש', 'שלישים', 'm'], 4: ['רבע', 'רבעים', 'm'], 5: ['חמישית', 'חמישיות', 'f'],
    6: ['שישית', 'שישיות', 'f'], 7: ['שביעית', 'שביעיות', 'f'], 8: ['שמינית', 'שמיניות', 'f'],
    9: ['תשיעית', 'תשיעיות', 'f'], 10: ['עשירית', 'עשיריות', 'f']
  };
  function readFrac(a, b) {
    if (b === 1) return a === 1 ? 'פיצה שלמה' : a + ' פיצות שלמות';
    if (b === 2) {
      if (a === 1) return 'חצי';
      return (a <= 10 ? NUM_M[a] : a) + ' חצאים';
    }
    var d = DEN[b];
    if (!d) return a + ' חלקי ' + b;
    if (a === 1) return d[0];
    var num = a <= 10 ? (d[2] === 'm' ? NUM_M[a] : NUM_F[a]) : a;
    return num + ' ' + d[1];
  }
  PZ.readFrac = readFrac;
  /* שם החלוקה: "רבעים", "שמיניות"... */
  var CUT_NAMES = { 1: 'שלמה', 2: 'חצאים', 3: 'שלישים', 4: 'רבעים', 5: 'חמישיות', 6: 'שישיות', 8: 'שמיניות', 10: 'עשיריות', 12: 'חלקי 12' };
  PZ.cutName = function (n) { return CUT_NAMES[n] || ('חלקי ' + n); };

  /* ================= טקסט עשיר: שברים מוערמים ================= */
  function fracHTML(a, b, cls) {
    return '<span class="frac' + (cls ? ' ' + cls : '') + '" dir="ltr"><span class="fn">' + a + '</span><span class="fd">' + b + '</span></span>';
  }
  function mixedHTML(w, a, b, cls) {
    return '<span class="mixed" dir="ltr"><span class="mw">' + w + '</span>' + fracHTML(a, b, cls) + '</span>';
  }
  /* {3/4} שבר, {1:1/4} מספר מעורב, {3/4*} שבר צבעוני (מונה/מכנה), [[ ... ]] משוואה משמאל לימין */
  function maqaf(s) { return String(s).replace(/([א-ת])-(?=[\d{])/g, '$1־'); }
  PZ.maqaf = maqaf;
  function rich(s) {
    s = maqaf(s);
    s = s.replace(/\{(?:(\d+):)?(\d+)\/(\d+)(\*?)\}/g, function (m, w, a, b, star) {
      return w !== undefined ? mixedHTML(w, a, b, star ? 'col' : '') : fracHTML(a, b, star ? 'col' : '');
    });
    s = s.replace(/\[\[([\s\S]+?)\]\]/g, function (m, inner) {
      var blk = /[=+<>−×÷]/.test(inner.replace(/<[^>]*>/g, ''));
      return '<span class="eq' + (blk ? ' blk' : '') + '" dir="ltr">' + inner + '</span>';
    });
    return s;
  }
  PZ.fracHTML = fracHTML; PZ.mixedHTML = mixedHTML; PZ.rich = rich;

  /* ================= ציור SVG ================= */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function polar(r, deg) { var a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
  function f1(x) { return Math.round(x * 100) / 100; }
  function wedge(r, a0, a1) {
    if (a1 - a0 >= 359.9) {
      return 'M0 ' + (-r) + ' A' + r + ' ' + r + ' 0 1 1 0 ' + r + ' A' + r + ' ' + r + ' 0 1 1 0 ' + (-r) + ' Z';
    }
    var p0 = polar(r, a0), p1 = polar(r, a1);
    return 'M0 0 L' + f1(p0[0]) + ' ' + f1(p0[1]) + ' A' + r + ' ' + r + ' 0 ' + ((a1 - a0) > 180 ? 1 : 0) + ' 1 ' + f1(p1[0]) + ' ' + f1(p1[1]) + ' Z';
  }
  function rnd(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }

  PZ.TOPPINGS = {
    mush: 'פטריות', olive: 'זיתים', tomato: 'עגבניות', corn: 'תירס',
    onion: 'בצל', cheese: 'גבינה', pepper: 'פלפל'
  };

  /* מקומות לתוספות בתוך חלק: טבעות סביב המרכז, בלי לגלוש לקצוות */
  function spots(a0, a1, seed) {
    var span = a1 - a0, mid = (a0 + a1) / 2, sr = span * Math.PI / 180;
    var s = span >= 170 ? 34 : span >= 85 ? 28 : span >= 55 ? 24 : span >= 40 ? 21 : 18;
    var rMin = Math.max(24, s * 0.75), rMax = 117 - s / 2 - 1;
    var step = s * 1.12;
    var m = Math.max(1, Math.floor((rMax - rMin) / step) + 1);
    var rings = [];
    for (var j = 0; j < m; j++) rings.push(m === 1 ? rMin : rMin + j * (rMax - rMin) / (m - 1));
    var out = [];
    rings.forEach(function (r, ri) {
      var full = span >= 359;
      var arc = full ? r * sr : (span >= 180 ? r * sr : 2 * r * Math.sin(sr / 2));
      var k = full || span >= 180 ? Math.floor(arc / (s * 1.1)) : Math.floor((arc - s * 0.35) / (s * 1.1));
      if (k < 1 && arc >= s * 0.95) k = 1;
      for (var q = 0; q < k; q++) {
        var off = -span / 2 + (q + 0.5) * span / k;
        if (!full) {
          var edge = (span / 2 - Math.abs(off)) * Math.PI / 180;
          if (r * Math.sin(Math.min(edge, Math.PI / 2)) < s * 0.52) continue;
        }
        var p = polar(r + (rnd(seed * 31 + ri * 7 + q) - 0.5) * 4, mid + off);
        out.push({ x: p[0], y: p[1], s: s, rot: Math.floor(rnd(seed * 17 + ri * 5 + q * 3) * 360) });
      }
    });
    return out;
  }

  function renderTops(slice, key, seed) {
    var g = slice.top;
    while (g.firstChild) g.removeChild(g.firstChild);
    slice.g.classList.toggle('has-top', !!key);
    if (!key) return;
    spots(slice.a0, slice.a1, seed).forEach(function (p) {
      el('use', {
        href: '#t-' + key, x: -p.s / 2, y: -p.s / 2, width: p.s, height: p.s,
        transform: 'translate(' + f1(p.x) + ' ' + f1(p.y) + ') rotate(' + p.rot + ')'
      }, g);
    });
  }

  /* בונה פיצה אחת: cfg = {n} או {angles:[...]} ואפשר guide:[a,b] */
  PZ.buildPizza = function (cfg) {
    var angles = cfg.angles;
    if (!angles) { angles = []; for (var i = 0; i <= cfg.n; i++) angles.push(360 * i / cfg.n); }
    var n = angles.length - 1;
    var svg = el('svg', { viewBox: '-176 -176 352 352', 'class': 'pizza-svg', focusable: 'false' });
    el('circle', { r: 164, 'class': 'plate' }, svg);
    el('circle', { r: 150, 'class': 'plate-in' }, svg);
    var gSl = el('g', { 'class': 'slices' }, svg);
    var slices = [];
    for (var j = 0; j < n; j++) {
      var a0 = angles[j], a1 = angles[j + 1], mid = (a0 + a1) / 2;
      var g = el('g', { 'class': 'slice' }, gSl);
      el('path', { d: wedge(140, a0, a1), 'class': 'crust' }, g);
      el('path', { d: wedge(125, a0, a1), 'class': 'sauce' }, g);
      el('path', { d: wedge(117, a0, a1), 'class': 'cheese' }, g);
      var top = el('g', { 'class': 'tops' }, g);
      el('path', { d: wedge(125, a0, a1), 'class': 'given-ov' }, g);
      el('path', { d: wedge(140, a0, a1), 'class': 'sel-ov' }, g);
      var lab = el('g', { 'class': 'slab' }, g);
      if (n > 1 && !cfg.angles) {
        var lp = polar(n === 2 ? 66 : 76, mid);
        lab.setAttribute('transform', 'translate(' + f1(lp[0]) + ' ' + f1(lp[1]) + ')');
        var t1 = el('text', { x: 0, y: -4 }, lab); t1.textContent = '1';
        el('line', { x1: -9, y1: 0, x2: 9, y2: 0 }, lab);
        var t2 = el('text', { x: 0, y: 16 }, lab); t2.textContent = String(n);
      }
      var d = polar(13, mid), sv = polar(40, mid);
      g.style.setProperty('--dx', f1(d[0]) + 'px'); g.style.setProperty('--dy', f1(d[1]) + 'px');
      g.style.setProperty('--sx', f1(sv[0] + 330) + 'px'); g.style.setProperty('--sy', f1(sv[1] - 40) + 'px');
      slices.push({ g: g, a0: a0, a1: a1, mid: mid, top: top, topKey: null, seed: j + 1 });
    }
    var lines = el('g', { 'class': 'cuts' }, svg);
    if (n > 1) {
      for (var c = 0; c < n; c++) {
        var q = polar(141, angles[c]);
        el('line', { x1: 0, y1: 0, x2: f1(q[0]), y2: f1(q[1]), 'class': 'cutline' }, lines);
      }
    }
    if (cfg.guide) {
      el('path', { d: wedge(128, 0, 360 * cfg.guide[0] / cfg.guide[1]), 'class': 'guide' }, svg);
    }
    return { svg: svg, slices: slices, n: n, angles: angles };
  };

  /* פיצה קטנה לאייקונים ולכרטיסי בחירה (לא אינטראקטיבית) */
  PZ.miniPizza = function (cfg, cls) {
    var v = PZ.buildPizza(cfg);
    v.svg.setAttribute('class', 'pizza-svg mini ' + (cls || ''));
    v.svg.setAttribute('aria-hidden', 'true');
    if (cfg.marked) cfg.marked.forEach(function (i) { v.slices[i].g.classList.add('given'); });
    return v.svg;
  };

  /* ================= הלוח: פיצות + חיתוך + תוספות ================= */
  function Board(host) {
    this.host = host;
    host.classList.add('board');
    host.innerHTML =
      '<div class="pizza-row"></div>' +
      '<div class="tools-row"><div class="live" aria-live="polite" hidden></div>' +
      '<div class="cutbar" role="group" aria-label="חלוקת הפיצה" hidden></div>' +
      '<button type="button" class="aid-btn" hidden>🔍 הראו לי את השבר</button></div>' +
      '<div class="toptray" role="group" aria-label="תוספות" hidden></div>';
    this.rowEl = host.querySelector('.pizza-row');
    this.liveEl = host.querySelector('.live');
    this.cutEl = host.querySelector('.cutbar');
    this.aidBtn = host.querySelector('.aid-btn');
    this.trayEl = host.querySelector('.toptray');
    this.pizzas = []; this.views = []; this.mode = 'none'; this.tool = null;
    this.onChange = null; this.labels = true; this.liveOn = false; this.liveBtn = false;
    var self = this;
    this.aidBtn.addEventListener('click', function () { self.liveOn = !self.liveOn; self.refresh(); });
  }

  Board.prototype.load = function (cfg) {
    this.pizzas = cfg.pizzas.map(function (p) {
      var n = p.angles ? p.angles.length - 1 : p.n;
      var arr = function (idx) { var a = []; for (var i = 0; i < n; i++) a.push(false); (idx || []).forEach(function (i) { a[i] = true; }); return a; };
      var nul = []; for (var i = 0; i < n; i++) nul.push(null);
      return { n: n, angles: p.angles || null, fixed: !!(p.fixed || p.angles), sel: arr(p.sel), given: arr(p.given), done: arr([]), top: nul, guide: p.guide || null };
    });
    this.tool = null;
    this.buildViews();
    this.configure(cfg);
  };

  /* שינוי הגדרות בלי לאפס את הפיצות (מעבר בין חלקי הזמנה) */
  Board.prototype.configure = function (c) {
    this.mode = c.mode || 'none';
    this.cutList = c.cut || null;
    this.tops = c.toppings || null;
    this.labels = c.labels !== false;
    this.liveOn = !!c.live;
    this.liveBtn = !!c.liveBtn;
    this.reading = !!c.reading;
    this.reduceLive = !!c.reduce;
    this.preserve = !!c.preserve;
    this.terms = !!c.terms;
    this.tool = null;
    this.buildCutbar();
    this.buildTray();
    this.refresh();
  };

  Board.prototype.buildViews = function () {
    var self = this;
    this.rowEl.innerHTML = '';
    this.rowEl.className = 'pizza-row count-' + this.pizzas.length;
    this.views = this.pizzas.map(function (p, pi) {
      var wrap = document.createElement('div');
      wrap.className = 'pz-wrap';
      var v = PZ.buildPizza({ n: p.n, angles: p.angles, guide: p.guide });
      wrap.appendChild(v.svg);
      self.rowEl.appendChild(wrap);
      v.slices.forEach(function (s, i) {
        s.g.dataset.pi = pi; s.g.dataset.i = i;
        s.g.addEventListener('click', function () { self.tapSlice(pi, i); });
        s.g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.tapSlice(pi, i); }
        });
      });
      return v;
    });
  };

  Board.prototype.fire = function () { if (this.onChange) this.onChange(this); };

  Board.prototype.tapSlice = function (pi, i) {
    var p = this.pizzas[pi];
    if (this.mode === 'pick' || this.mode === 'aid') {
      if (p.given[i] || p.done[i]) return;
      p.sel[i] = !p.sel[i];
      this.refresh(); this.fire();
    } else if (this.mode === 'toppings') {
      this.applyTool(this.tool, pi, i);
    }
  };

  Board.prototype.applyTool = function (key, pi, i) {
    var p = this.pizzas[pi];
    if (!key) { this.flashTray(); return; }
    if (key === 'erase') p.top[i] = null;
    else p.top[i] = (p.top[i] === key) ? null : key;
    this.refresh(); this.fire();
  };

  Board.prototype.flashTray = function () {
    var t = this.trayEl; t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash');
  };

  /* חלוקה: אפשר לשמור את החלק המסומן כשעוברים בין חלוקות (שברים שקולים) */
  function keepSel(oldSel, newN) {
    var oldN = oldSel.length, out = [], j, k;
    for (j = 0; j < newN; j++) out.push(false);
    if (newN % oldN === 0) { for (j = 0; j < newN; j++) out[j] = oldSel[Math.floor(j * oldN / newN)]; }
    else if (oldN % newN === 0) {
      var r = oldN / newN;
      for (j = 0; j < newN; j++) { var all = true; for (k = j * r; k < (j + 1) * r; k++) if (!oldSel[k]) all = false; out[j] = all; }
    }
    return out;
  }

  Board.prototype.setN = function (n) {
    var self = this;
    this.pizzas.forEach(function (p) {
      if (p.fixed) return;
      var old = p.sel;
      p.n = n;
      p.sel = self.preserve ? keepSel(old, n) : (function () { var a = []; for (var i = 0; i < n; i++) a.push(false); return a; })();
      p.given = p.sel.map(function () { return false; });
      p.done = p.sel.map(function () { return false; });
      p.top = p.sel.map(function () { return null; });
    });
    this.buildViews();
    this.refresh();
    this.views.forEach(function (v) {
      var ls = v.svg.querySelectorAll('.cutline');
      for (var i = 0; i < ls.length; i++) ls[i].classList.add('anim');
    });
    this.fire();
  };

  Board.prototype.buildCutbar = function () {
    var self = this;
    this.cutEl.innerHTML = '';
    if (!this.cutList) { this.cutEl.hidden = true; return; }
    this.cutEl.hidden = false;
    this.cutList.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cut-btn'; b.dataset.n = n;
      b.appendChild(PZ.miniPizza({ n: n }, 'icon'));
      var s = document.createElement('span'); s.textContent = PZ.cutName(n);
      b.appendChild(s);
      b.addEventListener('click', function () { self.setN(n); });
      self.cutEl.appendChild(b);
    });
  };

  Board.prototype.buildTray = function () {
    var self = this;
    this.trayEl.innerHTML = '';
    if (!(this.mode === 'toppings' && this.tops)) { this.trayEl.hidden = true; return; }
    this.trayEl.hidden = false;
    var keys = this.tops.concat(['erase']);
    keys.forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.k = key;
      if (key === 'erase') b.innerHTML = '<span class="chip-ic">🧽</span><span class="chip-tx">מחק</span>';
      else b.innerHTML = '<svg class="chip-ic" viewBox="0 0 40 40" aria-hidden="true"><use href="#t-' + key + '"/></svg><span class="chip-tx">' + PZ.TOPPINGS[key] + '</span>';
      self.attachChip(b, key);
      self.trayEl.appendChild(b);
    });
  };

  Board.prototype.selectTool = function (key) {
    this.tool = (this.tool === key) ? null : key;
    var self = this;
    [].forEach.call(this.trayEl.querySelectorAll('.chip'), function (c) {
      c.classList.toggle('on', c.dataset.k === self.tool);
      c.setAttribute('aria-pressed', c.dataset.k === self.tool ? 'true' : 'false');
    });
  };

  Board.prototype.attachChip = function (chip, key) {
    var self = this;
    chip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.selectTool(key); }
    });
    chip.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, dragging = false, ghost = null, lastHover = null;
      function sliceAt(x, y) {
        var t = document.elementFromPoint(x, y);
        var g = t && t.closest ? t.closest('.slice') : null;
        return g && g.dataset.pi !== undefined ? g : null;
      }
      function move(ev) {
        if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
          dragging = true;
          ghost = document.createElement('div');
          ghost.className = 'ghost';
          ghost.innerHTML = key === 'erase' ? '🧽' : '<svg viewBox="0 0 40 40"><use href="#t-' + key + '"/></svg>';
          document.body.appendChild(ghost);
        }
        if (dragging) {
          ghost.style.left = (ev.clientX - 26) + 'px'; ghost.style.top = (ev.clientY - 26) + 'px';
          var g = sliceAt(ev.clientX, ev.clientY);
          if (lastHover && lastHover !== g) lastHover.classList.remove('hover');
          if (g) g.classList.add('hover');
          lastHover = g;
        }
      }
      function up(ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (lastHover) lastHover.classList.remove('hover');
        if (dragging) {
          var g = sliceAt(ev.clientX, ev.clientY);
          if (ghost) ghost.remove();
          if (g) self.applyTool(key, +g.dataset.pi, +g.dataset.i);
        } else {
          self.selectTool(key);
        }
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
  };

  /* ---------- קריאות מצב ---------- */
  Board.prototype.selCount = function () {
    return this.pizzas.reduce(function (a, p) { return a + p.sel.filter(Boolean).length; }, 0);
  };
  Board.prototype.selValue = function () {
    var v = [0, 1];
    this.pizzas.forEach(function (p) { var c = p.sel.filter(Boolean).length; if (c) v = add(v, [c, p.n]); });
    return v;
  };
  Board.prototype.totalSlices = function () { return this.pizzas.reduce(function (a, p) { return a + p.n; }, 0); };

  /* מסמן את מה שנבחר כ"הוגש" ועובר לשלב הבא בהזמנה */
  Board.prototype.lockSel = function () {
    this.pizzas.forEach(function (p) { for (var i = 0; i < p.n; i++) if (p.sel[i]) { p.done[i] = true; p.sel[i] = false; } });
    this.refresh();
  };
  Board.prototype.clearSel = function () {
    this.pizzas.forEach(function (p) { p.sel = p.sel.map(function () { return false; }); });
    this.refresh();
  };
  Board.prototype.serve = function () {
    var self = this;
    return new Promise(function (res) {
      self.views.forEach(function (v, pi) {
        v.slices.forEach(function (s, i) {
          var p = self.pizzas[pi];
          if (p.sel[i] || p.done[i]) s.g.classList.add('served');
        });
      });
      setTimeout(res, 850);
    });
  };
  Board.prototype.setAids = function (a) {
    if (a.live !== undefined) this.liveOn = a.live;
    if (a.labels !== undefined) this.labels = a.labels;
    this.refresh();
  };

  /* ---------- הצגה ---------- */
  function liveCard(b) {
    var ps = b.pizzas, ns = ps.map(function (p) { return p.n; });
    var same = ns.every(function (x) { return x === ns[0]; });
    var total = b.selCount();
    var h = '';
    if (same) {
      var n = ns[0];
      h = '<div class="live-main">' + fracHTML(total, n, 'col big');
      if (b.reduceLive && total > 0) {
        var r = reduce(total, n);
        if (r[1] !== n) h += '<span class="live-eq">=</span>' + fracHTML(r[0], r[1], 'col big');
      }
      if (total > n && ps.length > 1) {
        var w = Math.floor(total / n), rem = total % n;
        h += '<span class="live-eq">=</span>' + (rem ? mixedHTML(w, rem, n, 'col big') : '<span class="mw big">' + w + '</span>');
      }
      h += '</div>';
      if (b.reading && total > 0) h += '<div class="live-read">' + readFrac(total, n) + '</div>';
      if (b.terms) {
        h += '<div class="live-terms"><div><b class="t-num">מונה ' + total + '</b> – כמה חלקים לקחנו</div>' +
             '<div><b class="t-den">מכנה ' + n + '</b> – לכמה חלקים שווים חתכנו</div></div>';
      }
    } else {
      h = '<div class="live-main">' + ps.map(function (p) {
        return fracHTML(p.sel.filter(Boolean).length, p.n, 'col');
      }).join('<span class="live-eq">+</span>') + '</div>';
    }
    return h;
  }

  Board.prototype.refresh = function () {
    var self = this;
    var interactive = (this.mode === 'pick' || this.mode === 'aid' || this.mode === 'toppings');
    this.pizzas.forEach(function (p, pi) {
      var v = self.views[pi]; if (!v) return;
      v.svg.classList.toggle('interactive', interactive);
      v.svg.classList.toggle('show-labels', self.labels && self.mode !== 'toppings' && p.n > 1 && !p.angles);
      v.slices.forEach(function (s, i) {
        s.g.classList.toggle('sel', !!p.sel[i]);
        s.g.classList.toggle('given', !!(p.given[i] || p.done[i]));
        if (s.topKey !== p.top[i]) { renderTops(s, p.top[i], s.seed); s.topKey = p.top[i]; }
        if (interactive) {
          s.g.setAttribute('tabindex', '0'); s.g.setAttribute('role', 'button');
          s.g.setAttribute('aria-label', 'חלק ' + (i + 1) + ' מתוך ' + p.n + (p.sel[i] ? ', נבחר' : ''));
        } else {
          s.g.removeAttribute('tabindex'); s.g.removeAttribute('role'); s.g.removeAttribute('aria-label');
        }
      });
    });
    var showLive = this.liveOn && !this.pizzas.some(function (p) { return p.angles; });
    this.liveEl.hidden = !showLive;
    if (showLive) this.liveEl.innerHTML = liveCard(this);
    this.aidBtn.hidden = !(this.liveBtn && !this.pizzas.some(function (p) { return p.angles; }));
    this.aidBtn.textContent = this.liveOn ? '🙈 הסתירו את השבר' : '🔍 הראו לי את השבר';
    [].forEach.call(this.cutEl.querySelectorAll('.cut-btn'), function (b) {
      var cur = self.pizzas.filter(function (p) { return !p.fixed; }).map(function (p) { return p.n; });
      var on = cur.length && cur.every(function (x) { return x === +b.dataset.n; });
      b.classList.toggle('on', !!on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };

  PZ.Board = Board;
})();
