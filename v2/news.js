/* Версия v2 — новости. Данные из v2/data/news.json (выгрузка REST API dumdv.ru).
   Карусель без библиотек: CSS scroll-snap плюс немного скрипта. */
(function () {
  'use strict';

  var lead = document.getElementById('lead');
  var row = document.getElementById('row');
  var dotsBox = document.getElementById('dots');
  var grid = document.getElementById('grid');
  var filters = document.getElementById('filters');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // обложка: две ширины через srcset; нет обложки — заглушка со знаком, не серый прямоугольник
  function shot(p, sizes) {
    if (!p.cover800 && !p.cover1600) return '<div class="card-stub" aria-hidden="true"></div>';
    var big = p.cover1600 || p.cover800;
    var small = p.cover800 || p.cover1600;
    return '<div class="card-shot">' +
      '<img src="' + esc(small) + '" srcset="' + esc(small) + ' 800w, ' + esc(big) + ' 1600w"' +
      ' sizes="' + sizes + '" loading="lazy" decoding="async" alt="' + esc(p.title) + '">' +
      '</div>';
  }

  function card(p, cls, sizes) {
    var parts = ['<a class="card ' + cls + '" href="' + esc(p.link) + '" target="_blank" rel="noopener">'];
    parts.push(shot(p, sizes));
    parts.push('<div class="card-veil"></div><div class="card-in">');
    if (p.category) parts.push('<span class="card-cat">' + esc(p.category) + '</span>');
    // заголовка нет — остаются рубрика и дата, пустое место не оставляем
    if (p.title) parts.push('<h3 class="card-t">' + esc(p.title) + '</h3>');
    if (p.dateHuman) parts.push('<time class="card-d" datetime="' + esc(p.date) + '">' + esc(p.dateHuman) + '</time>');
    parts.push('</div></a>');
    return parts.join('');
  }

  function tile(p) {
    var out = ['<a class="tile" href="' + esc(p.link) + '" target="_blank" rel="noopener"' +
      ' data-cat="' + esc(p.category) + '">'];
    out.push('<div class="tile-shot">' +
      (p.cover800 || p.cover1600
        ? '<img src="' + esc(p.cover800 || p.cover1600) + '" srcset="' +
          esc(p.cover800 || p.cover1600) + ' 800w, ' + esc(p.cover1600 || p.cover800) + ' 1600w"' +
          ' sizes="(max-width:640px) 92vw, (max-width:980px) 46vw, 31vw"' +
          ' loading="lazy" decoding="async" alt="' + esc(p.title) + '">'
        : '<div class="card-stub" aria-hidden="true"></div>') +
      '</div>');
    out.push('<div class="tile-meta">');
    if (p.dateHuman) out.push('<span class="tile-d">' + esc(p.dateHuman) + '</span>');
    if (p.category) out.push('<span class="tile-c">' + esc(p.category) + '</span>');
    out.push('</div>');
    if (p.title) out.push('<div class="tile-t">' + esc(p.title) + '</div>');
    out.push('</a>');
    return out.join('');
  }

  fetch('data/news.json').then(function (r) { return r.json(); }).then(function (data) {
    var posts = (data.posts || []).slice();
    if (!posts.length) { lead.textContent = 'Новостей нет.'; return; }

    // 1. главная новость — самая свежая
    lead.className = '';
    lead.innerHTML = card(posts[0], 'lead-card', '100vw');

    // 2. лента — остальные
    row.innerHTML = posts.slice(1).map(function (p) {
      return card(p, '', '(max-width:760px) 86vw, 42vw');
    }).join('');

    // 3. сетка — все
    grid.innerHTML = posts.map(tile).join('');

    // фильтр по рубрикам
    var cats = [];
    posts.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    filters.innerHTML = ['<button class="filter on" type="button" data-cat="">Все</button>']
      .concat(cats.map(function (c) {
        return '<button class="filter" type="button" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
      })).join('');

    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button.filter');
      if (!b) return;
      var pick = b.getAttribute('data-cat');
      [].forEach.call(filters.querySelectorAll('.filter'), function (x) {
        x.classList.toggle('on', x === b);
      });
      [].forEach.call(grid.querySelectorAll('.tile'), function (t) {
        t.classList.toggle('off', !!pick && t.getAttribute('data-cat') !== pick);
      });
    });

    setupRow();
  }).catch(function () {
    lead.textContent = 'Не удалось загрузить новости.';
  });

  /* ── лента: стрелки, точки, положение ───────────────────────── */
  function setupRow() {
    var cards = [].slice.call(row.children);
    if (!cards.length) return;

    function step() {
      // шаг прокрутки — ширина карточки с промежутком
      var a = cards[0].getBoundingClientRect();
      var b = cards[1] ? cards[1].getBoundingClientRect() : null;
      return b ? (b.left - a.left) : a.width;
    }
    function maxScroll() { return row.scrollWidth - row.clientWidth; }

    dotsBox.innerHTML = cards.map(function (c, i) {
      return '<button class="dot" type="button" role="tab" aria-label="Новость ' + (i + 1) +
        '" data-i="' + i + '"></button>';
    }).join('');
    var dots = [].slice.call(dotsBox.children);

    function sync() {
      var x = row.scrollLeft, s = step() || 1;
      var i = Math.round(x / s);
      if (i > dots.length - 1) i = dots.length - 1;
      dots.forEach(function (d, n) {
        d.classList.toggle('on', n === i);
        d.setAttribute('aria-selected', n === i ? 'true' : 'false');
      });
      // крайние стрелки приглушены
      prev.disabled = x <= 2;
      next.disabled = x >= maxScroll() - 2;
    }

    function slide(dir) { row.scrollBy({ left: dir * step(), behavior: 'smooth' }); }
    prev.addEventListener('click', function () { slide(-1); });
    next.addEventListener('click', function () { slide(1); });

    dotsBox.addEventListener('click', function (e) {
      var d = e.target.closest('.dot');
      if (!d) return;
      row.scrollTo({ left: (+d.getAttribute('data-i')) * step(), behavior: 'smooth' });
    });

    // листание с клавиатуры, когда лента в фокусе
    row.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); slide(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); slide(-1); }
    });

    // колесо мыши поперёк: вертикальный прокрут переводим в горизонтальный,
    // но только пока ряд не доехал до края — иначе страница перестанет листаться
    row.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      var x = row.scrollLeft;
      if ((e.deltaY < 0 && x <= 0) || (e.deltaY > 0 && x >= maxScroll() - 1)) return;
      e.preventDefault();
      row.scrollLeft = x + e.deltaY;
    }, { passive: false });

    row.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
})();
