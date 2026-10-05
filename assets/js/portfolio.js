/* Page-load reveal, compare sliders, service walk-through, image lightbox, and the one-time
   demonstration of each interactive piece (no dependencies). */
(function () {
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smooth = function (x) { return x * x * x * (x * (x * 6 - 15) + 10); };
  if (document.getElementById('banner')) {
    root.classList.add('reveal');
    window.addEventListener('load', function () { setTimeout(function () { root.classList.add('revealed'); }, 150); });
  }

  // Visitors miss what a piece can do until they see it move, so each piece shows it once, when it
  // is first in view. A touch, click or key on the piece stops the demonstration where it is.
  // frame(p) draws progress p from 0 to 1 and ends in the piece's starting state. Also used by model3d.js.
  function demoOnce(piece, ms, frame) {
    if (reduced || !window.IntersectionObserver) return;
    var timer = 0, raf = 0, start = 0, over = false;
    var cues = ['pointerdown', 'keydown', 'focusin'];
    var imgs = Array.prototype.slice.call(piece.querySelectorAll('img'));
    // Screen readers should not announce every step of the demonstration.
    var live = Array.prototype.slice.call(piece.querySelectorAll('[aria-live]')).map(function (el) { return [el, el.getAttribute('aria-live')]; });
    function stop() {
      over = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      seen.disconnect();
      cues.forEach(function (t) { piece.removeEventListener(t, stop, true); });
      live.forEach(function (l) { l[0].setAttribute('aria-live', l[1]); });
    }
    function tick(now) {
      if (!start) {
        start = now;
        live.forEach(function (l) { l[0].setAttribute('aria-live', 'off'); });
      }
      var p = Math.min(1, (now - start) / ms);
      frame(p);
      if (p < 1) raf = requestAnimationFrame(tick); else stop();
    }
    var seen = new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1], view = e.rootBounds ? e.rootBounds.height : innerHeight;
      clearTimeout(timer);
      // Most of the piece is visible, or it fills most of the screen.
      if (e.intersectionRatio < 0.6 && e.intersectionRect.height < 0.6 * view) return;
      timer = setTimeout(function () {
        seen.disconnect();
        var images = Promise.all(imgs.map(function (img) { return img.decode().catch(function () {}); }));
        Promise.race([images, new Promise(function (r) { setTimeout(r, 3000); })]).then(function () {
          if (!over) raf = requestAnimationFrame(tick);
        });
      }, 600);
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    cues.forEach(function (t) { piece.addEventListener(t, stop, true); });
    seen.observe(piece);
  }
  window.demoOnce = demoOnce;

  document.querySelectorAll('.compare').forEach(function (c) {
    var input = c.querySelector('input[type="range"]');
    if (!input) return;
    var set = function (v) { c.style.setProperty('--pos', v + '%'); };
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
    // Towards one image, across to the other, back to the start.
    var demo = function () {
      var home = +input.value;
      demoOnce(c, 3200, function (p) {
        var v = home + 35 * Math.sin(2 * Math.PI * smooth(p));
        input.value = v;
        set(v);
      });
    };
    // In the banner, wait for the entrance to finish.
    var media = root.classList.contains('reveal') && c.closest('#banner .hero-media');
    if (media) media.addEventListener('transitionend', function go(e) {
      if (e.target !== media) return;
      media.removeEventListener('transitionend', go);
      demo();
    });
    else demo();
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
    // Along the whole journey, a pause at the end, then quickly back to the first step.
    demoOnce(walk, 4200, function (p) {
      var along = p < 0.6 ? p / 0.6 : p < 0.78 ? 1 : 1 - (p - 0.78) / 0.22;
      var n = 1 + Math.round(along * (steps.length - 1));
      if (n !== +range.value) show(n);
    });
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
