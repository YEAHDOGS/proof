/* PROOF interactive layer: scroll reveals, bar + count-up animation, honest notify form.
   All figures copied from src/data/*.yaml in the repo. No invented numbers.
   No scroll listeners — reveal via IntersectionObserver, parallax via CSS scroll-driven animation. */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveals: clip-path stagger on panel entry ----------
     NOTE: IntersectionObserver is registered on the PANELS, not the .reveal
     elements themselves. Chromium factors an element's own clip-path into its
     intersection rect, so a fully clipped .reveal never reports intersecting. */
  var panels = document.querySelectorAll('.panel');
  function armReveals(panel) {
    var items = panel.querySelectorAll('.reveal');
    for (var i = 0; i < items.length; i++) items[i].classList.add('in');
  }
  if (REDUCED || !('IntersectionObserver' in window)) {
    for (var p = 0; p < panels.length; p++) armReveals(panels[p]);
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          armReveals(entries[i].target);
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.35 });
    for (var q = 0; q < panels.length; q++) io.observe(panels[q]);
  }

  /* ---------- background images: data-img -> CSS var ---------- */
  var bgs = document.querySelectorAll('.panel .bg[data-img]');
  for (var b = 0; b < bgs.length; b++) {
    bgs[b].style.setProperty('--bgimg', 'url("' + bgs[b].getAttribute('data-img') + '")');
  }

  /* ---------- numbers: format helpers ---------- */
  function fmt(n) { return n.toLocaleString('en-US'); }

  /* ---------- bars + count-ups: fire when the COUNT panel enters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var fills = document.querySelectorAll('.bfill[data-w]');

  function setFinal() {
    for (var i = 0; i < counters.length; i++) {
      var el = counters[i], target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var approx = el.getAttribute('data-approx') === '1';
      el.textContent = (approx ? '~' : '') + fmt(target) + suffix;
    }
    for (var f = 0; f < fills.length; f++) {
      var pct = parseInt(fills[f].getAttribute('data-w'), 10);
      fills[f].style.width = (pct === 0 ? 2 : pct) + (pct === 0 ? 'px' : '%');
    }
  }

  function animate() {
    var DURATION = 1600, start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      for (var i = 0; i < counters.length; i++) {
        var el = counters[i], target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var approx = el.getAttribute('data-approx') === '1';
        el.textContent = (approx ? '~' : '') + fmt(Math.round(target * eased)) + suffix;
      }
      for (var f = 0; f < fills.length; f++) {
        var pct = parseInt(fills[f].getAttribute('data-w'), 10);
        fills[f].style.width = pct === 0 ? '2px' : (pct * eased) + '%';
      }
      if (p < 1) requestAnimationFrame(frame); else setFinal();
    }
    requestAnimationFrame(frame);
  }

  var fired = false;
  function fireNumbers() {
    if (fired) return;
    fired = true;
    if (REDUCED) setFinal(); else animate();
  }

  var p2 = document.getElementById('p2');
  if (p2 && 'IntersectionObserver' in window && !REDUCED) {
    var p2io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fireNumbers(); p2io.disconnect(); }
    }, { threshold: 0.25 });
    p2io.observe(p2);
  } else {
    fireNumbers();
  }
  /* stats on panel 3 use the same counters — fire once is enough, panel 3
     shares the fired flag through a second observer */
  var p3 = document.getElementById('p3');
  if (p3 && 'IntersectionObserver' in window) {
    var p3io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fireNumbers(); p3io.disconnect(); }
    }, { threshold: 0.25 });
    p3io.observe(p3);
  }

  /* ---------- notify form: honest localStorage capture ---------- */
  var forms = document.querySelectorAll('form[data-notify]');
  for (var n = 0; n < forms.length; n++) (function (form) {
    var input = form.querySelector('input[type="email"]');
    var err = form.querySelector('.field-error');
    try {
      if (window.localStorage.getItem('proof-notify') === '1') {
        form.classList.add('done');
      }
    } catch (e) { /* storage unavailable — form still works */ }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        err.textContent = 'Enter a valid email address.';
        input.focus();
        return;
      }
      try { window.localStorage.setItem('proof-notify', '1'); } catch (e) {}
      err.textContent = '';
      form.classList.add('done');
      var ok = document.createElement('p');
      ok.className = 'notify-success';
      ok.setAttribute('role', 'status');
      ok.textContent = 'Saved on this device. You will hear it here first.';
      form.appendChild(ok);
    });
    input.addEventListener('input', function () { err.textContent = ''; });
  })(forms[n]);

})();
