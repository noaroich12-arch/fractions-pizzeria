/* gen.js - כלי עזר לבניית הזמנות: שברים בטקסט, בדיקות תשובה, ציורים (ציר מספרים, רשת, נקודות) */
(function () {
  'use strict';
  var PZ = window.PZ = window.PZ || {};
  var G = PZ.G = {};
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- מספרים ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function red(a, b) { var g = gcd(a, b); return [a / g, b / g]; }
  G.gcd = gcd; G.lcm = lcm; G.red = red;

  /* ערבוב קבוע מראש: אותו סדר בכל פתיחה, כדי שאפשר לבדוק */
  var seed = 20261115;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  G.rnd = rnd;
  G.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };

  /* ---------- סימון שברים בטקסט ---------- */
  G.F = function (a, b) { return '{' + a + '/' + b + '}'; };
  G.M = function (w, a, b) { return '{' + w + ':' + a + '/' + b + '}'; };
  G.E = function (s) { return '[[ ' + s + ' ]]'; };

  /* ---------- בדיקות תשובה גמישות ---------- */
  /* שבר בדיוק כפי שנתבקש (מונה ומכנה); שבר שקול מקבל הסבר */
  G.chkExact = function (a, b, note) {
    return function (v) {
      if (v[1] <= 0) return false;
      if (v[0] === a && v[1] === b) return true;
      if (v[0] * b === a * v[1]) return { ok: false, diag: note || 'זה שבר שקול, ויפה שזיהיתם! אבל כאן צריך לכתוב במכנה שנתבקש.' };
      return false;
    };
  };
  /* שבר מצומצם עד הסוף */
  G.chkLow = function (a, b) {
    var r = red(a, b);
    return function (v) {
      if (v[1] <= 0) return false;
      if (v[0] === r[0] && v[1] === r[1]) return true;
      if (v[0] * r[1] === r[0] * v[1]) return { ok: false, diag: 'הערך נכון! אבל אפשר לצמצם עוד. צמצמו עד שאי אפשר יותר.' };
      return false;
    };
  };
  /* מספר מעורב: שלם ושבר קטן מ-1 (ומצומצם, אלא אם ביקשו אחרת) */
  G.chkMixed = function (w, a, b, notLow) {
    var r = red(a, b);
    return function (v) {
      if (v[2] <= 0) return false;
      if ((v[0] * v[2] + v[1]) * b !== (w * b + a) * v[2]) return false;
      if (v[1] >= v[2]) return { ok: false, diag: 'כמעט! כתבו קודם כמה שלמים, ואחריהם שבר שקטן מ-1.' };
      if (!notLow && (v[1] * r[1] !== r[0] * v[2] || v[2] !== r[1])) return { ok: false, diag: 'הערך נכון! אבל השבר עוד אפשר לצמצם.' };
      if (!notLow && v[0] !== w) return false;
      return true;
    };
  };

  /* ---------- בניית חלקי הזמנה ---------- */
  /* משבצות חופשיות */
  G.fill = function (template, answers, task, hints, o) {
    var p = { kind: 'fill', template: template, answers: answers, task: task, hints: hints };
    if (o) for (var k in o) p[k] = o[k];
    return p;
  };
  /* מספר בודד */
  G.num = function (n, task, hints, unit) { return G.fill('{_}', [n], task, hints, unit ? { unit: unit } : null); };
  /* שבר: ברירת מחדל מצומצם עד הסוף. mode 'exact' = במכנה שנתבקש */
  G.frac = function (a, b, task, hints, mode) {
    if (mode === 'exact') return G.fill('{_/_}', [a, b], task, hints, { check: G.chkExact(a, b) });
    var r = red(a, b);
    return G.fill('{_/_}', [r[0], r[1]], task, hints, { check: G.chkLow(a, b) });
  };
  /* מספר מעורב */
  G.mix = function (w, a, b, task, hints, notLow) {
    var r = notLow ? [a, b] : red(a, b);
    return G.fill('{_} {_/_}', [w, r[0], r[1]], task, hints, { check: G.chkMixed(w, a, b, notLow) });
  };
  /* בחירה: התשובה הנכונה במקום קבוע-אך-מעורבב */
  G.choice = function (correct, wrongs, task, hints) {
    var opts = G.shuffle([correct].concat(wrongs));
    return { kind: 'choice', options: opts, answer: opts.indexOf(correct), task: task, hints: hints };
  };
  G.pick = function (value, task, hints, o) {
    var p = { kind: 'pick', value: value, task: task, hints: hints };
    if (o) for (var k in o) p[k] = o[k];
    return p;
  };
  G.cut = function (n, cuts, task, hints) { return { kind: 'cut', n: n, cut: cuts, task: task, hints: hints }; };
  G.tops = function (n, need, tops, task, hints, o) {
    var p = { kind: 'toppings', n: n, need: need, all: true, cut: [2, 3, 4, 6, 8], toppings: tops, task: task, hints: hints };
    if (o) for (var k in o) p[k] = o[k];
    return p;
  };

  /* הזמנה אחת. extra: {pizzas, labels, html, preserve} */
  G.o = function (c, text, parts, explain, extra) {
    extra = extra || {};
    var ex = { c: c, text: text, board: { pizzas: extra.pizzas || [] }, parts: parts, explain: explain };
    if (extra.labels !== undefined) ex.board.labels = extra.labels;
    if (extra.html) ex.html = extra.html;
    return ex;
  };

  /* שלב: 5 רמות, בכל רמה מערך של הזמנות */
  G.stage = function (meta, lesson, levels) {
    var ex = [];
    levels.forEach(function (list, li) { list.forEach(function (e) { e.lv = li + 1; ex.push(e); }); });
    var st = { ready: true, lesson: lesson, exercises: ex };
    for (var k in meta) st[k] = meta[k];
    return st;
  };

  /* ---------- ציורים ---------- */
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function wrapSvg(inner, vw, vh, label) {
    return '<div class="vis" dir="ltr"><svg class="vis-svg" viewBox="0 0 ' + vw + ' ' + vh + '" role="img" aria-label="' + (label || 'ציור') + '" xmlns="' + NS + '">' + inner + '</svg></div>';
  }

  /* ציר מספרים. o: {max, den, marks:[{v:[a,b], label}], labels:'int'|'all'} */
  G.numberLine = function (o) {
    var max = o.max || 1, den = o.den, x0 = 24, x1 = 296, W = 320, H = 96, y = 52;
    var X = function (a, b) { return x0 + (x1 - x0) * (a / b) / max; };
    var s = '<line x1="' + (x0 - 8) + '" y1="' + y + '" x2="' + (x1 + 8) + '" y2="' + y + '" stroke="#3a2a1c" stroke-width="3"/>';
    var total = max * den, i;
    for (i = 0; i <= total; i++) {
      var isInt = i % den === 0, x = X(i, den);
      s += '<line x1="' + x + '" y1="' + (y - (isInt ? 13 : 8)) + '" x2="' + x + '" y2="' + (y + (isInt ? 13 : 8)) + '" stroke="#3a2a1c" stroke-width="' + (isInt ? 3 : 2) + '"/>';
      if (isInt) s += '<text x="' + x + '" y="' + (y + 34) + '" text-anchor="middle" font-size="20" font-weight="bold" fill="#2b1d14">' + (i / den) + '</text>';
    }
    (o.marks || []).forEach(function (m) {
      var x = X(m.v[0], m.v[1]);
      s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#d6402c" stroke="#7a1410" stroke-width="2"/>';
      if (m.label) s += '<text x="' + x + '" y="' + (y - 20) + '" text-anchor="middle" font-size="22" font-weight="bold" fill="#7a1410">' + m.label + '</text>';
    });
    return wrapSvg(s, W, H, 'ציר מספרים');
  };

  /* רשת מלבנית. shade(r,c) מחזיר 0 ריק, 1 כחול, 2 כתום, 3 סגול (חפיפה) */
  G.grid = function (rows, cols, shade) {
    var cell = Math.min(36, Math.floor(280 / cols), Math.floor(180 / rows)), W = cell * cols + 8, H = cell * rows + 8;
    var fills = ['#fff8e8', '#9cc4f2', '#f6c27a', '#b58ad6'], s = '', r, c;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      s += '<rect x="' + (4 + c * cell) + '" y="' + (4 + r * cell) + '" width="' + cell + '" height="' + cell + '" fill="' + fills[shade(r, c) || 0] + '" stroke="#5a3418" stroke-width="2"/>';
    }
    s += '<rect x="4" y="4" width="' + (cell * cols) + '" height="' + (cell * rows) + '" fill="none" stroke="#3a2a1c" stroke-width="4"/>';
    return wrapSvg(s, W, H, 'רשת חלקים');
  };

  /* נקודות (עיגולים) בשורות; marked = כמה צבועים, mark2 = כמה בצבע שני */
  G.dots = function (total, marked, perRow, mark2) {
    perRow = perRow || Math.min(total, 10);
    var rows = Math.ceil(total / perRow), cell = Math.min(34, Math.floor(290 / perRow)), W = cell * perRow + 8, H = cell * rows + 8, s = '', i;
    for (i = 0; i < total; i++) {
      var r = Math.floor(i / perRow), c = i % perRow, f = '#fff8e8';
      if (i < marked) f = '#3f7fd6'; else if (mark2 && i < marked + mark2) f = '#e08a1e';
      s += '<circle cx="' + (4 + c * cell + cell / 2) + '" cy="' + (4 + r * cell + cell / 2) + '" r="' + (cell / 2 - 3) + '" fill="' + f + '" stroke="#3a2a1c" stroke-width="2"/>';
    }
    return wrapSvg(s, W, H, 'קבוצה של ' + total + ' עיגולים');
  };

  /* פס מחולק לחלקים שווים: parts חלקים, shaded הראשונים צבועים */
  G.bar = function (parts, shaded, shaded2) {
    return G.grid(1, parts, function (r, c) { return c < shaded ? 1 : (shaded2 && c < shaded + shaded2 ? 2 : 0); });
  };
})();
