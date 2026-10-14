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
    { id: 'heart',  cls: 'rx-heart',  label: 'Нравится',
      svg: '<path d="M12 20.3 4.2 12.6a4.9 4.9 0 0 1 6.9-6.9l.9.9.9-.9a4.9 4.9 0 1 1 6.9 6.9z"/>' },
    { id: 'moon',   cls: 'rx-moon',   label: 'Баракат',
      svg: '<path d="M20.4 13.4A8.5 8.5 0 1 1 10.9 3.6a6.7 6.7 0 0 0 9.5 9.8z"/>' },
    { id: 'mosque', cls: 'rx-mosque', label: 'За мечеть',
      svg: '<path d="M4.4 20.4h15.2M6 20.4v-6.2a6 6 0 0 1 12 0v6.2"/><path d="M12 8.2V5.6"/>' +
           '<path d="M3.2 20.4v-7.6a1 1 0 0 1 2 0v7.6M18.8 20.4v-7.6a1 1 0 0 1 2 0v7.6"/>' },
    { id: 'dua',    cls: 'rx-dua',    label: 'Дуа',
      svg: '<path d="M9.3 11.4V5.8a1.5 1.5 0 0 1 3 0v5.2M14.7 11.4V5.8a1.5 1.5 0 0 0-3 0"/>' +
           '<path d="M9.3 10.6a1.5 1.5 0 0 0-3 0v3.2c0 3.4 2.5 6.2 5.7 6.2s5.7-2.8 5.7-6.2v-3.2a1.5 1.5 0 0 0-3 0"/>' }
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
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + t.svg + '</svg>' +
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
