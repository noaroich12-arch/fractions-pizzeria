/* game.js - המסכים, ההזמנות, בדיקת תשובות, רמזים, כוכבים ושמירה */
(function () {
  'use strict';
  var PZ = window.PZ;
  var KEY = 'pizzeria-fractions-v2';
  var rich = PZ.rich;

  /* ---------- כלים ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return PZ.maqaf(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stageById(id) { return PZ.STAGES.filter(function (s) { return s.id === id; })[0]; }

  /* ---------- שמירה בדפדפן ---------- */
  var save = loadSave();
  function loadSave() {
    var def = { stars: {}, coins: 0, unlockAll: false, lessonSeen: {} };
    try {
      var j = JSON.parse(localStorage.getItem(KEY));
      if (j && typeof j === 'object') { for (var k in def) if (j[k] === undefined) j[k] = def[k]; return j; }
    } catch (e) { /* בלי שמירה, המשחק עדיין עובד */ }
    return def;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

  /* ביצוע ההזמנה נמדד בפיצות (1-3), והרמה של התרגול נמדדת בכוכבים (1-5) */
  var LEVEL_NAMES = ['', 'בסיס עם ציור ועזרה', 'פשוט ובטוח', 'כמו בכיתה', 'מאתגר', 'הכי קשה'];
  function starsOf(sid, i) { return save.stars[sid + ':' + i] || 0; }
  function levelIdx(st, lv) {
    var out = [];
    st.exercises.forEach(function (e, i) { if (e.lv === lv) out.push(i); });
    return out;
  }
  function levelStats(st, lv) {
    var idx = levelIdx(st, lv), done = 0, got = 0;
    idx.forEach(function (i) { var s = starsOf(st.id, i); if (s) { done++; got += s; } });
    return { done: done, got: got, total: idx.length, idx: idx };
  }
  function stageStats(st) {
    var done = 0, stars = 0;
    st.exercises.forEach(function (e, i) { var s = starsOf(st.id, i); if (s) { done++; stars += s; } });
    return { done: done, stars: stars, total: st.exercises.length };
  }
  function firstUnfinishedIn(st, lv) {
    var idx = levelIdx(st, lv);
    for (var i = 0; i < idx.length; i++) if (!starsOf(st.id, idx[i])) return idx[i];
    return idx[0];
  }
  function unlocked(st) { return !!st.ready; }
  function starRow(st) {
    var h = '';
    for (var lv = 1; lv <= 5; lv++) { var ls = levelStats(st, lv); h += (ls.total && ls.done >= ls.total) ? '⭐' : '☆'; }
    return h;
  }

  /* ---------- מסכים ---------- */
  var SCREENS = ['home', 'stage', 'lesson', 'order', 'done'];
  function show(name) {
    SCREENS.forEach(function (n) { $('#screen-' + n).hidden = (n !== name); });
    window.scrollTo(0, 0);
    current = name;
  }
  var current = 'home';

  /* ----- מסך הבית: מפת השלבים ----- */
  function showHome() {
    var el = $('#screen-home');
    var total = 0;
    PZ.STAGES.forEach(function (st) { total += stageStats(st).stars; });
    var html =
      '<header class="hero">' +
        '<div class="hero-chef">' + PZ.chefSVG('smile') + '</div>' +
        '<div class="hero-text"><h1 class="sign">בוא נשחק פיצה</h1>' +
        '<p>ברוכים הבאים! הלקוחות מחכים להזמנות. בחרו שלב והתחילו לעבוד.</p></div>' +
        '<div class="hero-stats"><div class="stat"><span class="coin" aria-hidden="true"></span> קופה: <b>' + save.coins + '</b></div>' +
        '<div class="stat">🍕 פיצות שהרווחתי: <b>' + total + '</b></div>' +
        '<button type="button" class="btn small" id="btnSettings">⚙ הגדרות</button></div>' +
      '</header>' +
      '';
    var groups = [['topic', 'הנושאים, לפי סדר הלמידה'], ['summary', 'שלבי סיכום: הכול ביחד']];
    groups.forEach(function (g) {
      html += '<h2 class="map-title">' + g[1] + '</h2><div class="map">';
      PZ.STAGES.filter(function (st) { return st.group === g[0]; }).forEach(function (st) {
        var s = stageStats(st);
        var sub = '<span class="sc-stars" aria-label="רמות שהושלמו">' + starRow(st) + '</span> · ' + s.done + ' מתוך ' + s.total + ' הזמנות';
        html += '<button type="button" class="stage-card' + (s.done >= s.total && s.total ? ' full' : '') + '" data-id="' + st.id + '">' +
          '<span class="sc-num">' + st.id + '</span>' +
          '<span class="sc-body"><span class="sc-title">' + esc(st.title) + '</span>' +
          '<span class="sc-blurb">' + esc(st.blurb) + '</span>' +
          '<span class="sc-prog">' + sub + '</span></span></button>';
      });
      html += '</div>';
    });
    el.innerHTML = html;
    [].forEach.call(el.querySelectorAll('.stage-card'), function (b) {
      b.addEventListener('click', function () { showStage(+b.dataset.id); });
    });
    $('#btnSettings').addEventListener('click', openSettings);
    show('home');
  }

  /* ----- מסך שלב ----- */
  function showStage(id) {
    var st = stageById(id), s = stageStats(st), el = $('#screen-stage');
    var html =
      '<div class="topbar"><button type="button" class="btn back" id="sBack">🏠 למפה</button>' +
      '<h2 class="o-title">' + (st.group === 'summary' ? 'סיכום' : 'נושא') + ' ' + st.id + ': ' + esc(st.title) + '</h2></div>' +
      '<div class="stage-hero"><div class="hero-chef">' + PZ.chefSVG('smile') + '</div>' +
      '<div class="stage-info"><p class="blurb">' + esc(st.blurb) + '</p>' +
      '<p class="prog">' + s.done + ' מתוך ' + s.total + ' הזמנות הושלמו · 🍕 ' + s.stars + ' מתוך ' + (s.total * 3) + '</p>' +
      (st.lesson.length ? '<div class="big-actions"><button type="button" class="btn big" id="sLesson">📖 שיעור עם השף</button></div>' : '') +
      '</div></div>' +
      '<h3 class="sec">בחרו רמה: ככל שיש יותר כוכבים, התרגול קשה יותר</h3><div class="lv-list">';
    for (var lv = 1; lv <= 5; lv++) {
      var ls = levelStats(st, lv);
      if (!ls.total) continue;
      var allDone = ls.done >= ls.total;
      html += '<div class="lv-row' + (allDone ? ' full' : '') + '"><button type="button" class="lv-main" data-lv="' + lv + '">' +
        '<span class="lv-stars" aria-label="' + lv + ' כוכבים">' + '⭐'.repeat(lv) + '</span>' +
        '<span class="lv-name">' + LEVEL_NAMES[lv] + '</span>' +
        '<span class="lv-prog">' + ls.done + ' מתוך ' + ls.total + (allDone ? ' ✔' : '') + '</span></button><div class="lv-ex">';
      ls.idx.forEach(function (i, k) {
        var sr = starsOf(st.id, i);
        html += '<button type="button" class="ex-btn small' + (sr ? ' done' : '') + '" data-i="' + i + '" aria-label="הזמנה ' + (k + 1) + '">' +
          '<span class="ex-n">' + (k + 1) + '</span><span class="ex-st">' + (sr ? '🍕'.repeat(sr) : '▶') + '</span></button>';
      });
      html += '</div></div>';
    }
    html += '</div>';
    el.innerHTML = html;
    $('#sBack').addEventListener('click', showHome);
    if ($('#sLesson')) $('#sLesson').addEventListener('click', function () { showLesson(st.id, 0, 0); });
    [].forEach.call(el.querySelectorAll('.lv-main'), function (b) {
      b.addEventListener('click', function () {
        var l = +b.dataset.lv;
        if (st.lesson.length && !save.lessonSeen[st.id] && !stageStats(st).done) showLesson(st.id, 0, l);
        else openExercise(st.id, firstUnfinishedIn(st, l));
      });
    });
    [].forEach.call(el.querySelectorAll('.ex-btn'), function (b) {
      b.addEventListener('click', function () { openExercise(st.id, +b.dataset.i); });
    });
    show('stage');
  }

  /* ----- שיעור עם השף ----- */
  var lessonBoard = null, lessonThenLv = 0;
  function showLesson(id, i, thenLv) {
    var st = stageById(id), card = st.lesson[i], el = $('#screen-lesson');
    var last = (i === st.lesson.length - 1);
    if (thenLv !== undefined) lessonThenLv = thenLv;
    el.innerHTML =
      '<div class="topbar"><button type="button" class="btn back" id="lBack">⬅ לשלב</button>' +
      '<h2 class="o-title">שיעור עם השף · ' + (i + 1) + ' מתוך ' + st.lesson.length + '</h2></div>' +
      '<div class="lesson-grid"><div class="l-chef"><div class="chef-wrap">' + PZ.chefSVG('smile') + '</div>' +
      '<div class="bubble chef-bubble">' + rich(card.text) + '</div>' +
      (card.task ? '<div class="task">👉 ' + rich(card.task) + '</div>' : '') +
      '<div class="nav"><button type="button" class="btn" id="lPrev"' + (i === 0 ? ' disabled' : '') + '>➡ הקודם</button>' +
      '<button type="button" class="btn primary" id="lNext">' + (last ? 'לבחירת רמה 🍕' : 'הבא ⬅') + '</button></div></div>' +
      '<div class="l-board" id="lBoard"></div></div>';
    lessonBoard = new PZ.Board($('#lBoard'));
    var b = card.board || { pizzas: [], mode: 'none' };
    lessonBoard.load({
      pizzas: b.pizzas, mode: b.mode, cut: b.cut, labels: b.labels, live: b.live, reading: b.reading,
      reduce: b.reduce, preserve: b.preserve, terms: b.terms
    });
    if (card.html) {
      var vh = document.createElement('div'); vh.className = 'l-vis'; vh.innerHTML = card.html;
      $('#lBoard').appendChild(vh);
    }
    $('#lBack').addEventListener('click', function () { showStage(id); });
    $('#lPrev').addEventListener('click', function () { if (i > 0) showLesson(id, i - 1); });
    $('#lNext').addEventListener('click', function () {
      if (!last) { showLesson(id, i + 1); return; }
      save.lessonSeen[id] = true; persist();
      if (lessonThenLv && st.exercises.length) openExercise(id, firstUnfinishedIn(st, lessonThenLv)); else showStage(id);
    });
    show('lesson');
  }

  /* ================= בדיקות של חלקי הזמנה ================= */
  function same(a, b) { return a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }

  function checkPart(part, board, slots, choice) {
    var ps = board.pizzas, k;
    if (part.kind === 'cut') {
      var cp = ps.filter(function (p) { return !p.fixed; }); if (!cp.length) cp = ps;
      var bad = cp.filter(function (p) { return p.n !== part.n; });
      if (!bad.length) return { ok: true };
      return { ok: false, always: true, diag: bad[0].n === 1 ? 'עוד לא חתכתם את הפיצה.' : 'הפיצה חתוכה ל-' + bad[0].n + ' חלקים, ובהזמנה צריך ' + part.n + ' חלקים שווים.' };
    }
    if (part.kind === 'pick') {
      if (part.need && ps.some(function (p) { return p.n !== part.need.n; })) {
        return { ok: false, always: true, diag: 'לפי המכנה צריך לחתוך ל-' + part.need.n + ' חלקים שווים (' + PZ.cutName(part.need.n) + ').' };
      }
      var total = board.selValue(), cnt = board.selCount();
      if (cnt === 0) return { ok: false, diag: 'עוד לא בחרתם חלקים להגשה.' };
      var good = part.value ? PZ.math.eq(total, part.value) : (cnt === part.count);
      if (good) return { ok: true };
      var tv = part.value || [part.count, ps[0].n];
      var r = PZ.math.reduce(total[0], total[1]);
      var less = total[0] * tv[1] < tv[0] * total[1];
      return { ok: false, diag: 'הגשתם ' + PZ.fracHTML(r[0], r[1]) + ' פיצה. זה ' + (less ? 'פחות' : 'יותר') + ' ממה שהלקוח ביקש.' };
    }
    if (part.kind === 'toppings') {
      var T = board.totalSlices();
      if (part.n && ps.some(function (p) { return p.n !== part.n; })) return { ok: false, always: true, diag: 'לפי ההזמנה צריך לחתוך ל-' + part.n + ' חלקים שווים.' };
      if (part.nIn && part.nIn.indexOf(ps[0].n) < 0) return { ok: false, always: true, diag: 'בחלוקה הזאת אי אפשר להכין את ההזמנה. נסו חלוקה אחרת.' };
      var have = {}, plain = 0;
      ps.forEach(function (p) { p.top.forEach(function (t) { if (t) have[t] = (have[t] || 0) + 1; else plain++; }); });
      var tgt = function (v) { return Array.isArray(v) ? T * v[0] / v[1] : v; };
      for (k in part.need) {
        var want = tgt(part.need[k]);
        if (want !== Math.floor(want)) return { ok: false, always: true, diag: 'בחלוקה הזאת אי אפשר לחלק את הפיצה כמו שביקשו. נסו חלוקה אחרת.' };
      }
      for (k in part.need) {
        var w = tgt(part.need[k]);
        if ((have[k] || 0) !== w) return { ok: false, diag: 'ביקשו ' + w + ' חלקים עם ' + PZ.TOPPINGS[k] + ', ובפיצה יש ' + (have[k] || 0) + '.' };
      }
      if (part.plain !== undefined) {
        var pw = tgt(part.plain);
        if (plain !== pw) return { ok: false, diag: 'צריכים להישאר ' + pw + ' חלקים בלי תוספת, ובפיצה יש ' + plain + '.' };
      }
      if (part.all && plain > 0) return { ok: false, diag: 'עדיין יש חלקים בלי תוספת.' };
      return { ok: true };
    }
    if (part.kind === 'fill') {
      if (slots.some(function (s) { return s === '' || s === undefined; })) return { empty: true, diag: 'מלאו את כל המשבצות לפני ההגשה.' };
      var vals = slots.map(function (s) { return parseInt(s, 10); });
      if (part.check) {
        var res = part.check(vals);
        if (res === true) return { ok: true };
        return { ok: false, always: true, diag: res && res.diag ? res.diag : '' };
      }
      return same(vals, part.answers) ? { ok: true } : { ok: false };
    }
    if (part.kind === 'choice') {
      if (choice === null || choice === undefined) return { empty: true, diag: 'בחרו תשובה לפני ההגשה.' };
      return choice === part.answer ? { ok: true } : { ok: false };
    }
    return { ok: false };
  }

  /* ---------- פתרון אוטומטי ("הראו לי איך") ואותו קוד גם לבדיקות ---------- */
  function solvePart(part, board) {
    var out = { slots: [], choice: null };
    if (part.kind === 'cut') { board.setN(part.n); }
    else if (part.kind === 'pick') {
      var np = board.pizzas.filter(function (p) { return !p.fixed; });
      var n;
      if (part.need) n = part.need.n;
      else if (np.length && part.cut) {
        n = null;
        var order = part.cut.slice();
        if (part.cut.indexOf(np[0].n) >= 0) order.unshift(np[0].n);
        for (var q = 0; q < order.length && n === null; q++) {
          var cc = part.value ? part.value[0] * order[q] / part.value[1] : part.count;
          if (cc === Math.floor(cc) && cc > 0) n = order[q];
        }
        if (n === null) throw new Error('אין חלוקה שמתאימה להזמנה');
      } else n = board.pizzas[0].n;
      if (np.length && np[0].n !== n) board.setN(n);
      board.clearSel();
      var C = part.value ? part.value[0] * n / part.value[1] : part.count;
      if (C !== Math.floor(C)) throw new Error('מספר חלקים לא שלם: ' + C);
      board.pizzas.forEach(function (p) {
        for (var i = 0; i < p.n && C > 0; i++) { if (!p.given[i] && !p.done[i]) { p.sel[i] = true; C--; } }
      });
      board.refresh();
      if (C > 0) throw new Error('אין מספיק חלקים בפיצות');
    } else if (part.kind === 'toppings') {
      var np2 = board.pizzas.filter(function (p) { return !p.fixed; });
      var tn = part.n || (part.nIn ? part.nIn[0] : board.pizzas[0].n);
      if (np2.length && np2[0].n !== tn) board.setN(tn);
      var T = board.totalSlices(), list = [], k;
      for (k in part.need) {
        var v = part.need[k], c = Array.isArray(v) ? T * v[0] / v[1] : v;
        for (var j = 0; j < c; j++) list.push(k);
      }
      board.pizzas.forEach(function (p) { p.top = p.top.map(function () { return null; }); });
      var idx = 0;
      board.pizzas.forEach(function (p) { for (var i = 0; i < p.n; i++) p.top[i] = list[idx++] || null; });
      board.refresh();
    } else if (part.kind === 'fill') {
      out.slots = part.answers.map(String);
    } else if (part.kind === 'choice') {
      out.choice = part.answer;
    }
    return out;
  }

  /* ================= מסך הזמנה ================= */
  var cur = null, board = null;
  /* רמה 1 = עזרים מלאים, רמות 2-3 = עזרים חלקיים, רמות 4-5 = בלי עזרים */
  function tierOf(lv) { return lv <= 1 ? 1 : (lv <= 3 ? 2 : 3); }

  function openExercise(sid, idx) {
    var st = stageById(sid), ex = st.exercises[idx];
    cur = {
      st: st, idx: idx, ex: ex, lv: ex.lv, lvIdx: levelIdx(st, ex.lv), tier: tierOf(ex.lv), pi: 0, attempts: 0, hintLevel: 0,
      mistakes: 0, hintsUsed: 0, helped: false, slots: [], active: 0, choice: null,
      locked: false, finished: false,
      hasGiven: ex.board.pizzas.some(function (p) { return p.given && p.given.length; })
    };
    renderOrder();
    show('order');
  }

  function dotsHTML() {
    var h = '';
    cur.lvIdx.forEach(function (i) {
      var c = 'dot' + (starsOf(cur.st.id, i) ? ' done' : '') + (i === cur.idx ? ' cur' : '');
      h += '<span class="' + c + '"></span>';
    });
    return h;
  }

  function setExpr(expr) { $('#cAv').innerHTML = PZ.customerSVG(cur.ex.c, expr); }

  function renderOrder() {
    var ex = cur.ex, cust = PZ.CUSTOMERS[ex.c % PZ.CUSTOMERS.length];
    var el = $('#screen-order');
    el.innerHTML =
      '<div class="topbar"><div class="tb-row"><button type="button" class="btn back" id="oBack">⬅ לשלב</button>' +
      '<div class="o-title">' + esc(cur.st.title) + ' · ' + '⭐'.repeat(cur.lv) + ' · הזמנה ' + (cur.lvIdx.indexOf(cur.idx) + 1) + ' מתוך ' + cur.lvIdx.length + '</div></div>' +
      '<div class="tb-row"><div class="dots" aria-hidden="true">' + dotsHTML() + '</div>' +
      '<div class="stat"><span class="coin" aria-hidden="true"></span> <b id="oCoins">' + save.coins + '</b></div></div></div>' +
      '<div class="order-grid">' +
        '<div class="a-cust"><div class="cust"><div class="cust-av" id="cAv"></div><div class="cust-name">' + esc(cust.name) + '</div></div>' +
        '<div class="bubble" id="cText">' + rich(ex.text) + '</div></div>' +
        '<div class="a-board"><div class="task" id="oTask"></div>' + (ex.html ? '<div id="visHost">' + ex.html + '</div>' : '') + '<div id="boardHost"></div><div id="choiceHost" class="pz-choices" hidden></div></div>' +
        '<div class="a-answer"><div id="ansHost"></div>' +
        '<div class="actions"><button type="button" class="btn primary big" id="oSubmit">הגישו! 🍕</button>' +
        '<button type="button" class="btn" id="oHint">💡 רמז</button></div>' +
        '<div class="feedback" id="oFeed" aria-live="polite" hidden></div></div>' +
      '</div>';
    setExpr('hello');
    board = new PZ.Board($('#boardHost'));
    board.onChange = function () { /* הבחירה נבדקת רק בהגשה */ };
    $('#oBack').addEventListener('click', function () { showStage(cur.st.id); });
    $('#oSubmit').addEventListener('click', submit);
    $('#oHint').addEventListener('click', voluntaryHint);
    loadPart(0, true);
  }

  function boardCfg(part) {
    var ex = cur.ex, t = cur.tier, b = ex.board;
    var mode = part.kind === 'cut' ? 'cut' : part.kind === 'pick' ? 'pick' : part.kind === 'toppings' ? 'toppings'
      : (part.aid === false ? 'none' : 'aid');
    var cfg = {
      mode: mode, cut: part.cut || null, toppings: part.toppings || null,
      labels: b.labels !== undefined ? b.labels : (part.kind === 'toppings' ? false : t < 3),
      live: part.live !== undefined ? part.live : (t === 1 && part.kind === 'pick'),
      liveBtn: part.liveBtn !== undefined ? part.liveBtn : (t <= 2 && (mode === 'pick' || mode === 'aid') && !cur.hasGiven),
      reading: !!cur.st.reading && t <= 2,
      reduce: !!cur.st.reduceAid,
      preserve: !!b.preserve
    };
    return cfg;
  }

  function loadPart(pi, first) {
    var ex = cur.ex, part = ex.parts[pi];
    cur.pi = pi; cur.attempts = 0; cur.hintLevel = 0; cur.slots = []; cur.active = 0; cur.choice = null; cur.locked = false;
    $('#oTask').innerHTML = rich(part.task || '');
    var cfg = boardCfg(part);
    var hasPizzas = ex.board.pizzas.length > 0;
    $('#boardHost').hidden = !hasPizzas;
    $('#choiceHost').hidden = hasPizzas;
    if (first) { cfg.pizzas = ex.board.pizzas; board.load(cfg); } else board.configure(cfg);
    var ans = $('#ansHost');
    ans.innerHTML = '';
    $('#choiceHost').innerHTML = '';
    if (part.kind === 'fill') renderFill(part, ans);
    else if (part.kind === 'choice') renderChoice(part, ans);
    var f = $('#oFeed'); f.hidden = true; f.innerHTML = '';
    $('#oSubmit').hidden = false; $('#oHint').hidden = false;
    $('#oSubmit').disabled = false;
  }

  /* ----- כתיבת תשובה: משבצות ומקלדת מספרים ----- */
  function parseTemplate(t) {
    var slot = 0, html = '', last = 0, m, re = /\{([^}]*)\}/g;
    function bit(x) {
      if (x === '_') { var i = slot++; return '<button type="button" class="slot" data-i="' + i + '" aria-label="משבצת ' + (i + 1) + '"></button>'; }
      return '<span class="fixed-num">' + x + '</span>';
    }
    while ((m = re.exec(t))) {
      if (m.index > last) html += '<span class="eq-t">' + esc(t.slice(last, m.index)) + '</span>';
      var inner = m[1];
      if (inner.indexOf('/') >= 0) {
        var p = inner.split('/');
        html += '<span class="frac big" dir="ltr"><span class="fn">' + bit(p[0]) + '</span><span class="fd">' + bit(p[1]) + '</span></span>';
      } else html += bit(inner);
      last = re.lastIndex;
    }
    if (last < t.length) html += '<span class="eq-t">' + esc(t.slice(last)) + '</span>';
    return { html: html, n: slot };
  }
  PZ._parseTemplate = parseTemplate;

  function renderFill(part, host) {
    var tp = parseTemplate(part.template);
    cur.nslots = tp.n;
    for (var i = 0; i < tp.n; i++) cur.slots.push('');
    var keys = '';
    ['1', '2', '3', '4', '5', 'back', '6', '7', '8', '9', '0', 'next'].forEach(function (k) {
      if (k === 'back') keys += '<button type="button" class="key alt" data-k="back" aria-label="מחיקה">⌫</button>';
      else if (k === 'next') keys += (tp.n > 1 ? '<button type="button" class="key alt" data-k="next" aria-label="למשבצת הבאה">⇄</button>' : '<span class="key-gap"></span>');
      else keys += '<button type="button" class="key" data-k="' + k + '">' + k + '</button>';
    });
    host.innerHTML = '<div class="eq-wrap"><div class="eq fill" dir="ltr">' + tp.html + '</div>' +
      (part.unit ? '<span class="eq-unit">' + esc(part.unit) + '</span>' : '') + '</div>' +
      '<div class="keypad" dir="ltr">' + keys + '</div>';
    [].forEach.call(host.querySelectorAll('.slot'), function (s) {
      s.addEventListener('click', function () { cur.active = +s.dataset.i; refreshSlots(); });
    });
    [].forEach.call(host.querySelectorAll('.key'), function (k) {
      k.addEventListener('click', function () { keyPress(k.dataset.k); });
    });
    refreshSlots();
  }
  function refreshSlots() {
    [].forEach.call(document.querySelectorAll('#ansHost .slot'), function (s) {
      var i = +s.dataset.i;
      s.textContent = cur.slots[i] || '';
      s.classList.toggle('on', i === cur.active);
      s.classList.toggle('has', !!cur.slots[i]);
    });
  }
  function keyPress(k) {
    if (!cur || cur.locked || !cur.nslots) return;
    var i = cur.active, v = cur.slots[i] || '';
    if (k === 'back') v = v.slice(0, -1);
    else if (k === 'next') { cur.active = (i + 1) % cur.nslots; refreshSlots(); return; }
    else { if (v === '0') v = ''; if (v.length < 3) v += k; }
    cur.slots[i] = v;
    refreshSlots();
  }

  /* ----- בחירה מתוך תשובות ----- */
  function renderChoice(part, host) {
    var self = this;
    if (part.visual) {
      var box = $('#choiceHost');
      part.visual.forEach(function (v, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pz-card'; b.dataset.i = i; b.setAttribute('aria-pressed', 'false');
        var lab = document.createElement('span'); lab.className = 'lab'; lab.textContent = 'פיצה ' + v.label;
        b.appendChild(PZ.miniPizza(v.angles ? { angles: v.angles } : { n: v.n }, 'big'));
        b.appendChild(lab);
        b.addEventListener('click', function () { pickChoice(i); });
        box.appendChild(b);
      });
      return;
    }
    var h = '<div class="choices">';
    part.options.forEach(function (o, i) { h += '<button type="button" class="choice" data-i="' + i + '" aria-pressed="false">' + rich(o) + '</button>'; });
    host.innerHTML = h + '</div>';
    [].forEach.call(host.querySelectorAll('.choice'), function (b) {
      b.addEventListener('click', function () { pickChoice(+b.dataset.i); });
    });
  }
  function pickChoice(i) {
    if (cur.locked) return;
    cur.choice = i;
    [].forEach.call(document.querySelectorAll('.choice, .pz-card'), function (b) {
      var on = (+b.dataset.i === i); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* ----- משוב (השף מדבר) ----- */
  function feed(kind, html, opts) {
    opts = opts || {};
    var f = $('#oFeed');
    f.hidden = false; f.className = 'feedback ' + kind;
    f.innerHTML = '<div class="fb-chef">' + PZ.chefSVG(kind === 'ok' ? 'cheer' : 'smile') + '</div><div class="fb-body">' + html +
      (opts.showMe ? '<div class="fb-act"><button type="button" class="btn small" id="oShow">🔎 הראו לי איך</button></div>' : '') +
      (opts.next ? '<div class="fb-act"><button type="button" class="btn primary big" id="oNext">' + opts.next + '</button></div>' : '') + '</div>';
    if (opts.showMe) $('#oShow').addEventListener('click', showSolution);
    if (opts.next) $('#oNext').addEventListener('click', nextExercise);
    f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
    if (f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function hintText(part) {
    var hs = part.hints && part.hints.length ? part.hints : ['קראו שוב את ההזמנה: מה בדיוק הלקוח ביקש?'];
    var t = hs[Math.min(cur.hintLevel, hs.length - 1)];
    cur.hintLevel++;
    return t;
  }

  function voluntaryHint() {
    if (cur.locked) return;
    var part = cur.ex.parts[cur.pi];
    cur.hintsUsed++;
    feed('hint', '<b>רמז מהשף:</b> ' + rich(hintText(part)), { showMe: cur.hintLevel >= 3 });
  }

  /* ----- הגשה ----- */
  function submit() {
    if (!cur || cur.locked || cur.finished) return;
    var part = cur.ex.parts[cur.pi];
    var res = checkPart(part, board, cur.slots, cur.choice);
    if (res.empty) { feed('hint', rich(res.diag)); return; }
    if (res.ok) partOk(part); else partFail(part, res);
  }

  function partFail(part, res) {
    cur.attempts++; cur.mistakes++;
    var msg = '', k = cur.attempts;
    if (res.diag && (res.always || k >= 2)) msg += rich(res.diag) + ' ';
    msg += '<b>רמז:</b> ' + rich(hintText(part));
    if (k >= 2 && (board.mode === 'pick' || board.mode === 'aid') && !cur.hasGiven) board.setAids({ live: true, labels: true });
    else if (k >= 2 && board.mode !== 'toppings') board.setAids({ labels: true });
    setExpr('think');
    var sb = $('#oSubmit'); sb.classList.remove('shake'); void sb.offsetWidth; sb.classList.add('shake');
    feed('hint', msg, { showMe: k >= 3 });
  }

  function showSolution() {
    if (!cur || cur.locked) return;
    var part = cur.ex.parts[cur.pi];
    cur.helped = true;
    var sol;
    try { sol = solvePart(part, board); } catch (e) { sol = { slots: [], choice: null }; }
    if (part.kind === 'fill') { cur.slots = sol.slots; refreshSlots(); }
    if (part.kind === 'choice') pickChoice(sol.choice);
    var ex = typeof cur.ex.explain === 'function' ? cur.ex.explain(board) : cur.ex.explain;
    feed('hint', '<b>הנה הפתרון.</b> ' + rich(ex) + '<br>לחצו על "הגישו" כדי להמשיך.');
  }

  function partOk(part) {
    var last = cur.pi >= cur.ex.parts.length - 1;
    if (!last) {
      if (part.kind === 'pick') board.lockSel();
      loadPart(cur.pi + 1, false);
      setExpr('cheer');
      setTimeout(function () { if (cur && !cur.finished) setExpr('hello'); }, 1200);
      feed('ok', '<b>יפה מאוד!</b> השלב הזה הצליח. עכשיו השלב הבא של ההזמנה.');
      return;
    }
    finish();
  }

  function finish() {
    cur.finished = true; cur.locked = true;
    var pen = cur.mistakes + cur.hintsUsed;
    var stars = cur.helped ? 1 : (pen === 0 ? 3 : (pen === 1 ? 2 : 1));
    var key = cur.st.id + ':' + cur.idx, prev = save.stars[key] || 0, gained = 0;
    if (stars > prev) { gained = (stars - prev) * 5; save.coins += gained; save.stars[key] = stars; persist(); }
    $('#oCoins').textContent = save.coins;
    $('#oSubmit').hidden = true; $('#oHint').hidden = true;
    setExpr('cheer');
    var praise = ['כל הכבוד!', 'מצוין!', 'בדיוק ככה!', 'הלקוח מרוצה מאוד!', 'פיצה מושלמת!', 'עבודה נהדרת!'][(cur.idx + cur.st.id) % 6];
    var ex = typeof cur.ex.explain === 'function' ? cur.ex.explain(board) : cur.ex.explain;
    var lastEx = cur.idx === cur.lvIdx[cur.lvIdx.length - 1];
    var starsTxt = '<div class="fb-stars" aria-label="' + stars + ' פיצות">' + '🍕'.repeat(stars) + '<span class="fb-off">' + '🍕'.repeat(3 - stars) + '</span></div>';
    var coinTxt = gained ? '<div class="fb-coins"><span class="coin" aria-hidden="true"></span> הרווחתם ' + gained + ' מטבעות</div>' : '';
    feed('ok', '<div class="praise">' + praise + '</div>' + starsTxt + '<p>' + rich(ex) + '</p>' + coinTxt,
      { next: lastEx ? 'סיום הרמה 🎉' : 'ללקוח הבא ➜' });
    confetti();
    if (ex0hasBoard()) {
      var row = $('#boardHost .pizza-row');
      if (row) { row.classList.remove('bounce'); void row.offsetWidth; row.classList.add('bounce'); }
      board.serve();
    }
  }
  function ex0hasBoard() { return cur.ex.board.pizzas.length > 0; }

  function nextExercise() {
    var st = cur.st, k = cur.lvIdx.indexOf(cur.idx);
    if (k + 1 < cur.lvIdx.length) openExercise(st.id, cur.lvIdx[k + 1]);
    else showDone(st, cur.lv);
  }

  /* ----- מסך סיום רמה ----- */
  function showDone(st, lv) {
    var s = levelStats(st, lv), el = $('#screen-done');
    var max = s.total * 3, pct = max ? s.got / max : 0;
    var medal = pct >= 0.85 ? 'שף זהב 🏆' : pct >= 0.6 ? 'שף כסף 🥈' : 'שף מתחיל 🥉';
    var nextLv = lv < 5 && levelStats(st, lv + 1).total ? lv + 1 : 0;
    el.innerHTML =
      '<div class="done-card"><div class="hero-chef big">' + PZ.chefSVG('cheer') + '</div>' +
      '<h1 class="sign">סיימתם רמה של ' + lv + ' כוכבים!</h1>' +
      '<p class="done-line">' + esc(st.title) + '</p>' +
      '<p class="done-stars">' + '⭐'.repeat(lv) + '</p>' +
      '<p class="done-stars">🍕 ' + s.got + ' מתוך ' + max + '</p><p class="done-medal">' + medal + '</p>' +
      '<div class="big-actions">' +
      (nextLv ? '<button type="button" class="btn primary big" id="dNext">לרמה הבאה (' + nextLv + ' כוכבים) ➜</button>' : '') +
      '<button type="button" class="btn big" id="dLevels">⭐ לבחירת רמה</button>' +
      '<button type="button" class="btn big" id="dMap">🏠 למפת הנושאים</button>' +
      '<button type="button" class="btn big" id="dAgain">🔁 עוד סיבוב ברמה הזאת</button></div></div>';
    if ($('#dNext')) $('#dNext').addEventListener('click', function () { openExercise(st.id, levelIdx(st, nextLv)[0]); });
    $('#dLevels').addEventListener('click', function () { showStage(st.id); });
    $('#dMap').addEventListener('click', showHome);
    $('#dAgain').addEventListener('click', function () { openExercise(st.id, levelIdx(st, lv)[0]); });
    show('done');
    confetti();
  }

  /* ----- חגיגה ----- */
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var fx = $('#fx'); if (!fx) return;
    var chars = ['🍕', '⭐', '🍅', '🧀'];
    for (var i = 0; i < 12; i++) {
      var s = document.createElement('span');
      s.className = 'conf'; s.textContent = chars[i % chars.length];
      s.style.left = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      s.style.fontSize = (22 + Math.random() * 18) + 'px';
      fx.appendChild(s);
      (function (n) { setTimeout(function () { n.remove(); }, 2200); })(s);
    }
  }

  /* ----- הודעה קטנה ----- */
  var toastT = null;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3200);
  }

  /* ----- הגדרות ----- */
  function openSettings() {
    var d = $('#settings');
    $('#resetMsg').textContent = '';
    d.hidden = false; $('#setClose').focus();
  }
  function bindSettings() {
    $('#setClose').addEventListener('click', function () { $('#settings').hidden = true; showHome(); });
    var armed = false;
    $('#setReset').addEventListener('click', function () {
      if (!armed) { armed = true; $('#resetMsg').textContent = 'בטוחות? לחצו שוב כדי למחוק את כל ההתקדמות.'; return; }
      save = { stars: {}, coins: 0, unlockAll: false, lessonSeen: {} }; persist(); armed = false;
      $('#resetMsg').textContent = 'ההתקדמות נמחקה.';
    });
  }

  /* ----- מקלדת ----- */
  document.addEventListener('keydown', function (e) {
    if (current !== 'order' || !cur || cur.locked) return;
    var t = e.target;
    var onBtn = t && t.tagName === 'BUTTON';
    if (e.key >= '0' && e.key <= '9') { keyPress(e.key); }
    else if (e.key === 'Backspace') { keyPress('back'); e.preventDefault(); }
    else if (e.key === 'Enter' && !onBtn) { submit(); }
  });

  /* ================= בדיקה עצמית של כל ההזמנות ================= */
  PZ.selfTest = function () {
    var errs = [], count = 0;
    var host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;width:400px';
    document.body.appendChild(host);
    PZ.STAGES.forEach(function (st) {
      if (!st.ready) return;
      for (var lv = 1; lv <= 5; lv++) {
        if (levelIdx(st, lv).length < 6) errs.push('נושא ' + st.id + ': ברמה ' + lv + ' יש רק ' + levelIdx(st, lv).length + ' הזמנות');
      }
      st.exercises.forEach(function (ex, ei) {
        var tag = 'נושא ' + st.id + ' רמה ' + ex.lv + ' הזמנה ' + (ei + 1);
        count++;
        var bd = new PZ.Board(host);
        try {
          bd.load({ pizzas: JSON.parse(JSON.stringify(ex.board.pizzas)), mode: 'none', preserve: !!ex.board.preserve });
        } catch (e) { errs.push(tag + ': טעינת לוח נכשלה ' + e.message); return; }
        var txts = [ex.text];
        ex.parts.forEach(function (part, pi) {
          var ptag = tag + ' חלק ' + (pi + 1);
          txts.push(part.task || ''); (part.hints || []).forEach(function (h) { txts.push(h); });
          if (part.options) part.options.forEach(function (o) { txts.push(o); });
          if (!part.task) errs.push(ptag + ': חסרה הוראה');
          if (!part.hints || part.hints.length < 1) errs.push(ptag + ': חסרים רמזים');
          var cfg = { mode: part.kind === 'cut' ? 'cut' : part.kind === 'pick' ? 'pick' : part.kind === 'toppings' ? 'toppings' : 'aid', cut: part.cut, toppings: part.toppings, preserve: !!ex.board.preserve };
          bd.configure(cfg);
          if (part.kind === 'fill') {
            var tp = parseTemplate(part.template);
            if (tp.n !== part.answers.length) errs.push(ptag + ': מספר משבצות ' + tp.n + ' שונה ממספר תשובות ' + part.answers.length);
          }
          if (part.kind === 'choice' && !(part.options || part.visual)) errs.push(ptag + ': אין אפשרויות');
          if (part.kind === 'choice' && part.answer >= (part.options || part.visual).length) errs.push(ptag + ': אינדקס תשובה מחוץ לטווח');
          /* הפתרון חייב לעבור */
          var sol;
          try { sol = solvePart(part, bd); } catch (e) { errs.push(ptag + ': פתרון נכשל: ' + e.message); return; }
          var r = checkPart(part, bd, sol.slots, sol.choice);
          if (!r.ok) errs.push(ptag + ': הפתרון האוטומטי לא עבר את הבדיקה (' + (r.diag || '') + ')');
          /* תשובות שגויות חייבות להיכשל */
          var wrong = null;
          if (part.kind === 'pick') {
            var done = false;
            bd.pizzas.forEach(function (p) { for (var i = 0; i < p.n && !done; i++) if (!p.sel[i] && !p.given[i] && !p.done[i]) { p.sel[i] = true; done = true; } });
            if (!done) bd.pizzas.forEach(function (p) { for (var i = 0; i < p.n && !done; i++) if (p.sel[i]) { p.sel[i] = false; done = true; } });
            wrong = checkPart(part, bd, [], null);
            if (wrong.ok) errs.push(ptag + ': בחירה שגויה התקבלה');
          } else if (part.kind === 'toppings') {
            var p0 = bd.pizzas[0], i0 = -1;
            for (var i = 0; i < p0.n; i++) if (p0.top[i]) { i0 = i; break; }
            if (i0 >= 0) { p0.top[i0] = null; wrong = checkPart(part, bd, [], null); if (wrong.ok) errs.push(ptag + ': תוספות חסרות התקבלו'); }
          } else if (part.kind === 'cut') {
            bd.setN(part.n === 2 ? 4 : 2);
            wrong = checkPart(part, bd, [], null);
            if (wrong.ok) errs.push(ptag + ': חיתוך שגוי התקבל');
          } else if (part.kind === 'fill') {
            var bad = sol.slots.slice(); bad[0] = String(+bad[0] + 1);
            wrong = checkPart(part, bd, bad, null);
            if (wrong.ok) errs.push(ptag + ': תשובה שגויה התקבלה');
            if (part.answers.length === 1 && part.answers[0] > 1) {
              bad = [String(part.answers[0] - 1)];
              wrong = checkPart(part, bd, bad, null);
              if (wrong.ok) errs.push(ptag + ': תשובה שגויה (פחות אחד) התקבלה');
            }
          } else if (part.kind === 'choice') {
            var oth = (part.answer + 1) % (part.options || part.visual).length;
            wrong = checkPart(part, bd, [], oth);
            if (wrong.ok) errs.push(ptag + ': בחירה שגויה התקבלה');
          }
          /* מחזירים למצב נכון ועוברים הלאה */
          try { solvePart(part, bd); } catch (e) { /* ignore */ }
          if (part.kind === 'pick') bd.lockSel();
        });
        var explain = typeof ex.explain === 'function' ? ex.explain(bd) : ex.explain;
        txts.push(explain || '');
        if (!explain) errs.push(tag + ': חסר הסבר');
        txts.forEach(function (t) {
          var rr = rich(t);
          if (/\{[^}]*\}/.test(rr.replace(/<[^>]+>/g, ''))) errs.push(tag + ': סימון שבר לא תקין בטקסט: ' + t.slice(0, 40));
        });
      });
    });
    host.remove();
    return { count: count, errors: errs };
  };

  /* ---------- הפעלה ---------- */
  PZ.Game = {
    home: showHome, stage: showStage, lesson: showLesson, order: openExercise, done: function (id, lv) { showDone(stageById(id), lv || 1); },
    state: function () { return { cur: cur, board: board, save: save }; },
    submit: submit, keyPress: keyPress, pickChoice: pickChoice, showSolution: showSolution,
    tapSlice: function (pi, i) { board.tapSlice(pi, i); }
  };
  document.addEventListener('DOMContentLoaded', function () {
    bindSettings();
    showHome();
  });
})();
