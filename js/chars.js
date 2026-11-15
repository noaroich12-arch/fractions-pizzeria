/* chars.js - הלקוחות והשף (איורי SVG) */
(function () {
  'use strict';
  var PZ = window.PZ = window.PZ || {};

  var INK = '#3a2a20';
  PZ.CUSTOMERS = [
    { name: 'מיכל',  skin: '#f6cfa5', hair: '#4a2c17', style: 'long',  shirt: '#7cc4ee', acc: 'bow' },
    { name: 'דורון', skin: '#e8b98a', hair: '#2b1d14', style: 'short', shirt: '#f6b26b', acc: 'none' },
    { name: 'ליאור', skin: '#f6cfa5', hair: '#c0702a', style: 'curly', shirt: '#a9d98f', acc: 'glasses' },
    { name: 'שירה',  skin: '#c98d5f', hair: '#1f1511', style: 'bun',   shirt: '#f2a3c0', acc: 'none' },
    { name: 'איתי',  skin: '#f1c99b', hair: '#6b4a2b', style: 'cap',   shirt: '#9bb7f0', acc: 'none' },
    { name: 'רותם',  skin: '#a8713f', hair: '#1a1210', style: 'curly', shirt: '#ffd966', acc: 'none' },
    { name: 'גילי',  skin: '#f6cfa5', hair: '#d8a24a', style: 'long',  shirt: '#c9a7ec', acc: 'glasses' },
    { name: 'מיה',   skin: '#e8b98a', hair: '#2b1d14', style: 'bun',   shirt: '#8fd6c1', acc: 'bow' },
    { name: 'אלון',  skin: '#f1c99b', hair: '#8a8a8a', style: 'bald',  shirt: '#e98a7b', acc: 'mustache' },
    { name: 'יובל',  skin: '#c98d5f', hair: '#2b1d14', style: 'short', shirt: '#7fb8a4', acc: 'glasses' },
    { name: 'נעמה',  skin: '#f6cfa5', hair: '#7a3b1d', style: 'long',  shirt: '#f4c27a', acc: 'none' },
    { name: 'עומר',  skin: '#e8b98a', hair: '#3b2a1c', style: 'cap',   shirt: '#b5d17a', acc: 'none' }
  ];

  function mouth(expr) {
    if (expr === 'cheer') return '<path d="M44 78 Q60 100 76 78 Z" fill="#7a1f1f" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 88 Q60 95 70 88 Q60 84 50 88Z" fill="#f08a8a"/>';
    if (expr === 'think') return '<path d="M49 85 Q60 80 72 84" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
    return '<path d="M46 80 Q60 93 74 80" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
  }
  function eyes(expr) {
    if (expr === 'cheer') {
      return '<path d="M38 64 Q46 54 54 64" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>' +
             '<path d="M66 64 Q74 54 82 64" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>';
    }
    var dy = expr === 'think' ? -2 : 0;
    return '<ellipse cx="46" cy="' + (63 + dy) + '" rx="5.2" ry="6.2" fill="' + INK + '"/><circle cx="48" cy="' + (60.5 + dy) + '" r="1.8" fill="#fff"/>' +
           '<ellipse cx="74" cy="' + (63 + dy) + '" rx="5.2" ry="6.2" fill="' + INK + '"/><circle cx="76" cy="' + (60.5 + dy) + '" r="1.8" fill="#fff"/>' +
           (expr === 'think' ? '<path d="M38 50 L54 47 M66 47 L82 50" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' : '');
  }

  PZ.customerSVG = function (idx, expr) {
    var c = PZ.CUSTOMERS[idx % PZ.CUSTOMERS.length];
    var back = '', front = '', acc = '';
    var st = c.style, hc = c.hair;
    if (st === 'long') {
      back = '<path d="M22 62 C16 104 26 118 40 118 L80 118 C94 118 104 104 98 62 C98 18 22 18 22 62Z" fill="' + hc + '" stroke="' + INK + '" stroke-width="3"/>';
      front = '<path d="M25 60 C24 26 96 26 95 60 C86 42 44 38 25 60Z" fill="' + hc + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    } else if (st === 'short') {
      front = '<path d="M25 60 C22 24 98 24 95 60 C86 44 42 40 25 60Z" fill="' + hc + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    } else if (st === 'curly') {
      var dots = '';
      [[28, 50], [38, 34], [52, 28], [68, 28], [82, 34], [92, 50], [24, 66], [96, 66]].forEach(function (p) {
        dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="13" fill="' + hc + '" stroke="' + INK + '" stroke-width="3"/>';
      });
      back = dots;
      front = '<path d="M30 56 C40 40 80 40 90 56 C80 48 40 48 30 56Z" fill="' + hc + '"/>';
    } else if (st === 'bun') {
      back = '<circle cx="60" cy="18" r="14" fill="' + hc + '" stroke="' + INK + '" stroke-width="3"/>';
      front = '<path d="M25 60 C22 24 98 24 95 60 C86 44 42 40 25 60Z" fill="' + hc + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    } else if (st === 'cap') {
      front = '<path d="M24 56 C22 18 98 18 96 56 Z" fill="#e0533b" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
              '<path d="M24 56 L8 60 C14 66 40 62 52 56 Z" fill="#b83a26" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    } else if (st === 'bald') {
      back = '<path d="M26 66 C20 62 22 52 28 50 L30 66Z M94 66 C100 62 98 52 92 50 L90 66Z" fill="' + hc + '" stroke="' + INK + '" stroke-width="2.5"/>';
    }
    if (c.acc === 'glasses') {
      acc = '<circle cx="46" cy="63" r="12" fill="#ffffff" fill-opacity="0.35" stroke="' + INK + '" stroke-width="3"/>' +
            '<circle cx="74" cy="63" r="12" fill="#ffffff" fill-opacity="0.35" stroke="' + INK + '" stroke-width="3"/>' +
            '<path d="M58 63 L62 63" stroke="' + INK + '" stroke-width="3"/>';
    } else if (c.acc === 'mustache') {
      acc = '<path d="M44 76 Q52 70 60 75 Q68 70 76 76 Q68 82 60 78 Q52 82 44 76Z" fill="#6b6b6b" stroke="' + INK + '" stroke-width="2"/>';
    } else if (c.acc === 'bow') {
      acc = '<path d="M78 30 L96 22 L96 40 Z M78 30 L60 22 L60 40 Z" fill="#ef6f9a" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/><circle cx="78" cy="31" r="4" fill="#d44b7c" stroke="' + INK + '" stroke-width="2"/>';
    }
    return '<svg class="cust-svg" viewBox="0 0 120 150" role="img" aria-label="' + c.name + '">' +
      back +
      '<path d="M10 150 C10 112 36 100 60 100 C84 100 110 112 110 150Z" fill="' + c.shirt + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M50 96 L50 108 Q60 116 70 108 L70 96Z" fill="' + c.skin + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<ellipse cx="60" cy="64" rx="35" ry="38" fill="' + c.skin + '" stroke="' + INK + '" stroke-width="3"/>' +
      front +
      '<circle cx="38" cy="76" r="6" fill="#f08a8a" fill-opacity="0.45"/><circle cx="82" cy="76" r="6" fill="#f08a8a" fill-opacity="0.45"/>' +
      eyes(expr) + mouth(expr) + acc +
      '</svg>';
  };

  PZ.chefSVG = function (expr) {
    return '<svg class="chef-svg" viewBox="0 0 120 150" role="img" aria-label="השף פיפו">' +
      '<path d="M10 150 C10 112 36 100 60 100 C84 100 110 112 110 150Z" fill="#ffffff" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M44 102 L60 124 L76 102 Z" fill="#d6402c" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="60" cy="128" r="3" fill="' + INK + '"/><circle cx="60" cy="140" r="3" fill="' + INK + '"/>' +
      '<path d="M50 96 L50 108 Q60 116 70 108 L70 96Z" fill="#f1c99b" stroke="' + INK + '" stroke-width="3"/>' +
      '<ellipse cx="60" cy="70" rx="33" ry="34" fill="#f1c99b" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M26 44 C16 44 12 30 22 24 C20 10 40 6 48 14 C54 4 70 4 74 14 C84 6 102 10 98 24 C108 30 104 44 94 44 L94 50 L26 50 Z" fill="#ffffff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M26 50 L94 50" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle cx="38" cy="82" r="6" fill="#f08a8a" fill-opacity="0.5"/><circle cx="82" cy="82" r="6" fill="#f08a8a" fill-opacity="0.5"/>' +
      (expr === 'cheer'
        ? '<path d="M38 68 Q46 58 54 68" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/><path d="M66 68 Q74 58 82 68" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>'
        : '<ellipse cx="46" cy="68" rx="5" ry="6" fill="' + INK + '"/><circle cx="48" cy="65.5" r="1.8" fill="#fff"/><ellipse cx="74" cy="68" rx="5" ry="6" fill="' + INK + '"/><circle cx="76" cy="65.5" r="1.8" fill="#fff"/>') +
      '<path d="M40 82 Q50 74 60 80 Q70 74 80 82 Q72 92 60 86 Q48 92 40 82Z" fill="#4a3b33" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      (expr === 'cheer'
        ? '<path d="M52 91 Q60 100 68 91 Z" fill="#7a1f1f" stroke="' + INK + '" stroke-width="2"/>'
        : '<path d="M53 92 Q60 96 67 92" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>') +
      '</svg>';
  };
})();
