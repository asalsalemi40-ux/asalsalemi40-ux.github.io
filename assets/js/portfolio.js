/* Page-load reveal, compare sliders, service walk-through and image lightbox (no dependencies). */
(function () {
  var root = document.documentElement;
  if (document.getElementById('banner')) {
    root.classList.add('reveal');
    window.addEventListener('load', function () { setTimeout(function () { root.classList.add('revealed'); }, 150); });
  }

  document.querySelectorAll('.compare').forEach(function (c) {
    var input = c.querySelector('input[type="range"]');
    if (!input) return;
    var set = function (v) { c.style.setProperty('--pos', v + '%'); };
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
  });

  document.querySelectorAll('[data-walk]').forEach(function (walk) {
    var range = walk.querySelector('input[type="range"]');
    var track = walk.querySelector('.walk-track');
    var steps = Array.prototype.slice.call(walk.querySelectorAll('.journey li'));
    var shots = walk.querySelectorAll('.walk-media img');
    var out = {
      count: walk.querySelector('.walk-count'), title: walk.querySelector('.walk-info h3'), text: walk.querySelector('.walk-text'),
      touchpoint: walk.querySelector('.walk-touchpoint'), backstage: walk.querySelector('.walk-backstage')
    };
    function show(n) {
      var li = steps[n - 1];
      range.value = n;
      steps.forEach(function (s, i) { s.classList.toggle('done', i < n - 1); s.classList.toggle('on', i === n - 1); });
      shots.forEach(function (img, i) { img.classList.toggle('on', i === n - 1); });
      out.count.textContent = li.getAttribute('data-stage') + ', step ' + n + ' of ' + steps.length;
      out.title.textContent = li.querySelector('h3').textContent;
      out.text.textContent = li.querySelector('p').textContent;
      out.touchpoint.textContent = li.getAttribute('data-touchpoint');
      out.backstage.textContent = li.getAttribute('data-backstage');
    }
    // Pointer: the nearest step to the finger or cursor. Keyboard: the range input.
    function pick(e) {
      var best = 1, gap = Infinity;
      steps.forEach(function (li, i) {
        var r = li.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - e.clientX);
        if (d < gap) { gap = d; best = i + 1; }
      });
      if (best !== +range.value) show(best);
    }
    var dragging = null;
    track.addEventListener('pointerdown', function (e) { dragging = e.pointerId; track.setPointerCapture(e.pointerId); pick(e); });
    track.addEventListener('pointermove', function (e) { if (dragging === e.pointerId) pick(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) { track.addEventListener(t, function () { dragging = null; }); });
    range.addEventListener('input', function () { show(+range.value); });
    walk.classList.add('is-live');
    show(1);
  });

  var links = Array.prototype.slice.call(document.querySelectorAll('a.zoom'));
  if (!links.length) return;
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML = '<span class="lb-count"></span>' +
    '<button class="lb-close" type="button">Close</button>' +
    '<button class="lb-prev" type="button" aria-label="Previous image">Previous</button>' +
    '<img alt=""><p></p>' +
    '<button class="lb-next" type="button" aria-label="Next image">Next</button>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), cap = box.querySelector('p'), count = box.querySelector('.lb-count');
  var i = 0, last = null, startX = null;
  function show(n) {
    i = (n + links.length) % links.length;
    var a = links[i], thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = a.getAttribute('data-caption') || '';
    count.textContent = (i + 1) + ' / ' + links.length;
  }
  function open(n) { last = document.activeElement; show(n); box.classList.add('open'); document.body.classList.add('lb-lock'); box.querySelector('.lb-close').focus(); }
  function close() { box.classList.remove('open'); document.body.classList.remove('lb-lock'); if (last) last.focus(); }
  links.forEach(function (a, n) { a.addEventListener('click', function (e) { e.preventDefault(); open(n); }); });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { show(i - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(i + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
