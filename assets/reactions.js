/* Реакции под новостями: сердце, луна, мечеть, дуа.
 *
 * ГДЕ ХРАНЯТСЯ ЧИСЛА. Сейчас — только в браузере читателя: сайт статический,
 * общего счётчика без сервера быть не может, и каждый видит свои отметки.
 * Когда появится место для хранения (php на хостинге или внешняя база),
 * менять нужно ровно две функции ниже — load и save. Разметка и стили
 * останутся прежними.
 */
(function () {
  var KEY = 'dumdv-rx';
  var TYPES = [
    { id: 'heart',  cls: 'rx-heart',  label: 'Нравится',  ic: '❤️' },
    { id: 'moon',   cls: 'rx-moon',   label: 'Баракат',   ic: '🌙' },
    { id: 'mosque', cls: 'rx-mosque', label: 'За мечеть', ic: '🕌' },
    { id: 'dua',    cls: 'rx-dua',    label: 'Дуа',       ic: '🤲' }
  ];

  // ── хранилище ────────────────────────────────────────────────────
  // load возвращает {heart:0|1, ...} — что этот читатель уже отметил.
  function load(id) {
    try {
      var all = JSON.parse(localStorage.getItem(KEY) || '{}');
      return all[id] || {};
    } catch (e) { return {}; }
  }
  // save запоминает выбор. С сервером здесь будет отправка запроса,
  // а число для показа вернётся из ответа.
  function save(id, state) {
    try {
      var all = JSON.parse(localStorage.getItem(KEY) || '{}');
      all[id] = state;
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) { /* приватное окно: отметка не переживёт перезагрузку */ }
  }

  function render(box) {
    if (!box || box.dataset.rxReady) return;
    var id = box.getAttribute('data-rx') || '';
    var state = load(id);

    box.dataset.rxReady = '1';
    box.innerHTML = TYPES.map(function (t) {
      var on = state[t.id] ? ' on' : '';
      return '<button class="rx-btn ' + t.cls + on + '" type="button" data-t="' + t.id + '"' +
        ' aria-pressed="' + (state[t.id] ? 'true' : 'false') + '" title="' + t.label + '">' +
        '<span class="rx-ic" aria-hidden="true">' + t.ic + '</span>' +
        '<span class="rx-n">' + (state[t.id] ? 1 : 0) + '</span>' +
        '<span class="vh">' + t.label + '</span></button>';
    }).join('');

    box.addEventListener('click', function (e) {
      var b = e.target.closest('.rx-btn');
      if (!b) return;
      e.preventDefault();
      var t = b.getAttribute('data-t');
      var now = !state[t];
      state[t] = now ? 1 : 0;
      save(id, state);

      b.classList.toggle('on', now);
      b.setAttribute('aria-pressed', now ? 'true' : 'false');
      b.querySelector('.rx-n').textContent = now ? 1 : 0;
      b.classList.remove('pop');
      void b.offsetWidth;            // перезапуск анимации
      if (now) b.classList.add('pop');
    });
  }

  // карточки рисуются скриптом страницы, поэтому вызываем вручную после отрисовки
  window.rxMount = function (root) {
    (root || document).querySelectorAll('[data-rx]').forEach(render);
  };
  document.addEventListener('DOMContentLoaded', function () { window.rxMount(); });
})();
