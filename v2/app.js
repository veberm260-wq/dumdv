/* Версия v2 — поведение тестовой страницы «Строительство».
   Платежи не подключены: форма только показывает интерфейс. */
(function () {
  'use strict';

  var slow = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── появление блоков при прокрутке ──────────────────────────── */
  var risers = document.querySelectorAll('.rise');
  if (slow || !('IntersectionObserver' in window)) {
    for (var i = 0; i < risers.length; i++) risers[i].classList.add('seen');
  } else {
    var ioRise = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        r.target.classList.add('seen');
        ioRise.unobserve(r.target);
      });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    for (var j = 0; j < risers.length; j++) ioRise.observe(risers[j]);
  }

  /* ── цифры первого экрана набегают от нуля ───────────────────── */
  function ruNum(v, dec) {
    return v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var group = el.getAttribute('data-group') !== 'no';
    var slot = el.querySelector('.n');
    function put(v) {
      slot.textContent = group ? ruNum(v, dec) : v.toFixed(dec).replace('.', ',');
    }
    if (slow) { put(to); return; }
    var dur = 1500, t0 = null, done = false;
    function finish() { if (!done) { done = true; put(to); } }
    function step(t) {
      if (done) return;
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      if (p < 1) { put(to * (1 - Math.pow(1 - p, 3))); requestAnimationFrame(step); }
      else finish();                                // замедление к концу
    }
    requestAnimationFrame(step);
    // в фоновой вкладке кадры не идут и цифры застыли бы на нуле
    setTimeout(finish, dur + 500);
  }

  var figs = document.querySelectorAll('[data-to]');
  if (!('IntersectionObserver' in window)) {
    for (var k = 0; k < figs.length; k++) runCount(figs[k]);
  } else {
    var ioNum = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        runCount(r.target);
        ioNum.unobserve(r.target);
      });
    }, { threshold: .4 });
    for (var m = 0; m < figs.length; m++) ioNum.observe(figs[m]);
  }

  /* ── подсветка текущего якоря в липкой полосе ────────────────── */
  var links = [].slice.call(document.querySelectorAll('.rail a'));
  var targets = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  if ('IntersectionObserver' in window) {
    var ioRail = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        var idx = targets.indexOf(r.target);
        if (idx < 0) return;
        links.forEach(function (a, n) { a.classList.toggle('on', n === idx); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { if (t) ioRail.observe(t); });
  }

  /* ── выбор суммы и периодичности ─────────────────────────────── */
  function pick(selector) {
    var items = [].slice.call(document.querySelectorAll(selector));
    items.forEach(function (b) {
      b.addEventListener('click', function () {
        items.forEach(function (x) {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
      });
    });
  }
  pick('.sum');
  pick('.when');

  /* ── закреплённая кнопка прячется у формы и в подвале ────────── */
  (function () {
    var pin = document.querySelector('.pin');
    if (!pin) return;
    var zones = [document.getElementById('pomoch'), document.querySelector('.foot')]
      .filter(Boolean);
    if (!zones.length) return;
    // обычная проверка на прокрутке: наблюдатель тут не нужен,
    // а считается это по положению, а не по кадрам отрисовки
    function sync() {
      var h = window.innerHeight;
      var near = zones.some(function (z) {
        var r = z.getBoundingClientRect();
        return r.top < h * 0.82 && r.bottom > 0;
      });
      pin.classList.toggle('hide', near);
    }
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
  })();

  /* ── карта регионов: берём готовые файлы версии 2.0 ──────────── */
  var mapBox = document.getElementById('mapBox');
  var tops = document.getElementById('tops');
  if (!mapBox) return;

  var STEPS = [
    { upto: 1e3, fill: '#F2DC9B' }, { upto: 1e4, fill: '#E2C169' },
    { upto: 1e5, fill: '#D5AB47' }, { upto: 1e6, fill: '#B98F22' },
    { upto: Infinity, fill: '#87680F' }
  ];
  function shade(v) {
    for (var s = 0; s < STEPS.length; s++) if (v < STEPS[s].upto) return STEPS[s].fill;
    return STEPS[STEPS.length - 1].fill;
  }
  function money(n) { return n.toLocaleString('ru-RU') + ' ₽'; }
  function people(n) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return n + ' человек';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return n + ' человека';
    return n + ' человек';
  }
  function norm(s) {
    return s.toLowerCase().replace(/ё/g, 'е')
      .replace(/республика|область|автономный округ|автономная область|край|город/g, ' ')
      .replace(/[^а-я]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  Promise.all([
    fetch('../data/regions.json').then(function (r) { return r.json(); }),
    fetch('../assets/russia-regions.svg').then(function (r) { return r.text(); })
  ]).then(function (res) {
    var data = res[0];
    mapBox.innerHTML = res[1];
    var svg = mapBox.querySelector('svg');
    if (!svg) return;

    var byName = {};
    var paths = svg.querySelectorAll('path[data-name]');
    for (var i = 0; i < paths.length; i++) {
      byName[norm(paths[i].getAttribute('data-name'))] = paths[i];
    }

    var rows = (data.regions || []).slice().sort(function (a, b) { return b.sum - a.sum; });
    rows.forEach(function (row, n) {
      var hit = byName[norm(row.name)];
      // заливку ставим стилем: правило .map-box path перебило бы атрибут
      if (hit) hit.style.fill = shade(row.sum);
      if (n > 3 || !tops) return;
      var li = document.createElement('div');
      li.className = 'top-row';
      li.innerHTML = '<span class="top-i"></span><span class="top-n"></span><span class="top-s"></span>';
      li.querySelector('.top-i').textContent = '0' + (n + 1);
      li.querySelector('.top-n').textContent = row.name;
      if (row.donors != null) {
        var p = document.createElement('span');
        p.className = 'top-p';
        p.textContent = people(row.donors);
        li.querySelector('.top-n').appendChild(p);
      }
      li.querySelector('.top-s').textContent = money(row.sum);
      tops.appendChild(li);
    });

    var note = document.getElementById('mapNote');
    if (note) note.textContent = 'Данные за ' + (data.period || '—') +
      ', по жертвователям, указавшим регион. Регионов с пожертвованиями: ' + rows.length + '.';
  }).catch(function () {
    mapBox.innerHTML = '<p class="map-load">Карту не удалось загрузить.</p>';
  });
})();
