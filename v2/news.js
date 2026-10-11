/* v2 — новости. Данные из v2/data/news.json (выгрузка REST API dumdv.ru).
   Ничего не досочиняем: чего нет в записи, то и не выводится. */
(function () {
  'use strict';

  var leadBox = document.getElementById('lead');
  var grid = document.getElementById('grid');
  var filters = document.getElementById('filters');
  var moreBox = document.getElementById('more');
  var moreBtn = document.getElementById('moreBtn');
  if (!leadBox || !grid) return;

  var STEP = 6;          // сколько карточек добавляет «Показать ещё»
  var all = [];          // все записи кроме главной
  var pick = '';         // выбранная рубрика
  var shown = STEP;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // обложка: две ширины через srcset; нет обложки — орнамент, а не серый блок
  function shot(p, sizes) {
    if (!p.cover800 && !p.cover1600) return '<div class="shot"><div class="stub" aria-hidden="true"></div></div>';
    var big = p.cover1600 || p.cover800, small = p.cover800 || p.cover1600;
    return '<div class="shot"><img src="' + esc(small) + '" srcset="' + esc(small) + ' 800w, ' +
      esc(big) + ' 1600w" sizes="' + sizes + '" loading="lazy" decoding="async" alt="' +
      esc(p.title) + '"></div>';
  }

  function leadCard(p) {
    var o = ['<div class="lead">'];
    o.push('<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' +
      shot(p, '(max-width:860px) 92vw, 58vw') + '</a>');
    o.push('<div>');
    if (p.dateHuman) o.push('<time class="lead-d" datetime="' + esc(p.date) + '">' + esc(p.dateHuman) + '</time>');
    if (p.category) o.push('<span class="lead-c">' + esc(p.category) + '</span>');
    if (p.title) o.push('<h2 class="lead-t">' + esc(p.title) + '</h2>');
    if (p.excerpt) o.push('<p class="lead-x">' + esc(p.excerpt) + '</p>');
    o.push('<a class="arch" href="' + esc(p.link) + '" target="_blank" rel="noopener">' +
      '<span class="arch-in">Подробнее <i aria-hidden="true">&#8594;</i></span></a>');
    o.push('</div></div>');
    return o.join('');
  }

  function tile(p) {
    var o = ['<a class="tile" href="' + esc(p.link) + '" target="_blank" rel="noopener">'];
    o.push(shot(p, '(max-width:620px) 92vw, (max-width:980px) 46vw, 31vw'));
    if (p.dateHuman) o.push('<time class="tile-d" datetime="' + esc(p.date) + '">' + esc(p.dateHuman) + '</time>');
    if (p.title) o.push('<h3 class="tile-t">' + esc(p.title) + '</h3>');
    // анонса нет — остаётся только заголовок, пустого места не оставляем
    if (p.excerpt) o.push('<p class="tile-x">' + esc(p.excerpt) + '</p>');
    o.push('</a>');
    return o.join('');
  }

  function render() {
    var list = pick ? all.filter(function (p) { return p.category === pick; }) : all;
    grid.innerHTML = list.slice(0, shown).map(tile).join('');
    var left = list.length - shown;
    moreBox.hidden = left <= 0;
    if (!moreBox.hidden) moreBtn.textContent = 'Показать ещё' + (left > STEP ? '' : ' (' + left + ')');
  }

  fetch('data/news.json').then(function (r) { return r.json(); }).then(function (data) {
    var posts = (data.posts || []).slice();
    if (!posts.length) { leadBox.textContent = 'Новостей пока нет.'; return; }

    leadBox.className = '';
    leadBox.innerHTML = leadCard(posts[0]);
    all = posts.slice(1);
    render();

    var cats = [];
    posts.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    filters.innerHTML = ['<button class="filter on" type="button" data-cat="">Все</button>']
      .concat(cats.map(function (c) {
        return '<button class="filter" type="button" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
      })).join('');

    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button.filter');
      if (!b) return;
      pick = b.getAttribute('data-cat');
      shown = STEP;                                   // при смене рубрики счёт заново
      [].forEach.call(filters.querySelectorAll('.filter'), function (x) {
        x.classList.toggle('on', x === b);
      });
      render();
    });

    moreBtn.addEventListener('click', function () { shown += STEP; render(); });
  }).catch(function () {
    leadBox.textContent = 'Не удалось загрузить новости.';
  });
})();
