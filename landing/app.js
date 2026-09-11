/* PROOF interactive layer: metric tabs, animated bars, receipts, count-ups, reveals.
   All figures copied from src/data/*.yaml in the repo. No invented numbers. */
(function () {
  'use strict';

  var NIDA = 'https://nida.nih.gov/research-topics/trends-statistics/overdose-death-rates';
  var WONDER = 'https://wonder.cdc.gov/mcd.html';
  var DAWN = 'https://www.samhsa.gov/data/data-we-collect/dawn-drug-abuse-warning-network';
  var NSDUH23 = 'https://www.samhsa.gov/data/sites/default/files/reports/rpt47095/National%20Report/National%20Report/2023-nsduh-annual-national.htm';

  var METRICS = {
    deaths: {
      kicker: 'Annual deaths, United States',
      note: 'Modelled figures (alcohol, tobacco) attribute deaths across conditions; they are broader estimates, not death-certificate counts. Reported figures are counts from mortality records. Categories overlap: a death involving fentanyl and cocaine appears in both series, so never sum the rows.',
      rows: [
        { name: 'Tobacco (smoking-attributable)', value: 480000, display: '480,000+', year: 'annual avg, 2014 estimate, still cited', basis: 'modelled',
          cites: [
            ['2014 Surgeon General\u2019s report', 'https://www.ncbi.nlm.nih.gov/books/NBK179276/', 'More than 480,000 deaths annually, including ~41,000 from secondhand smoke.'],
            ['CDC tobacco fast facts', 'https://www.cdc.gov/tobacco/data_statistics/fact_sheets/fast_facts/index.htm', 'CDC repeats the figure as the current estimate.']
          ] },
        { name: 'Alcohol (excessive use)', value: 178307, display: '178,307', year: '2020\u20132021 annual average', basis: 'modelled',
          cites: [
            ['CDC ARDI', 'https://nccd.cdc.gov/DPH_ARDI/default/default.aspx', 'Average annual deaths from excessive alcohol use, 2020\u20132021.'],
            ['CDC alcohol facts', 'https://www.cdc.gov/alcohol/facts-stats/index.html', 'More than 178,000 die from excessive alcohol use each year.']
          ] },
        { name: 'Opioids (any)', value: 79358, display: '79,358', year: '2023', basis: 'reported',
          cites: [
            ['NIDA overdose death rates', NIDA, 'National overdose deaths involving any opioid, 2023 (NCHS final).'],
            ['CDC WONDER', WONDER, 'Underlying Multiple Cause of Death data.']
          ] },
        { name: 'Fentanyl (synthetic opioids)', value: 72776, display: '72,776', year: '2023', basis: 'reported',
          cites: [
            ['NIDA overdose death rates', NIDA, 'Deaths involving synthetic opioids other than methadone, 2023 (NCHS final).'],
            ['CDC WONDER', WONDER, 'Underlying Multiple Cause of Death data.']
          ] },
        { name: 'Stimulants (psychostimulants)', value: 36251, display: '36,251', year: '2023', basis: 'reported',
          cites: [
            ['NIDA overdose death rates', NIDA, 'Overdose deaths involving psychostimulants, 2023 (NCHS final).'],
            ['CDC WONDER', WONDER, 'Underlying Multiple Cause of Death data.']
          ] },
        { name: 'Cocaine', value: 29918, display: '29,918', year: '2023', basis: 'reported',
          cites: [
            ['NIDA overdose death rates', NIDA, 'Overdose deaths involving cocaine, 2023 (NCHS final). Crack and powder are not separated in mortality coding.'],
            ['CDC WONDER', WONDER, 'Underlying Multiple Cause of Death data.']
          ] },
        { name: 'Heroin', value: 4364, display: '4,364', year: '2023', basis: 'reported',
          cites: [
            ['NIDA overdose death rates', NIDA, 'Overdose deaths involving heroin, 2023 (NCHS final).'],
            ['CDC WONDER', WONDER, 'Underlying Multiple Cause of Death data.']
          ] },
        { name: 'Cannabis (overdose)', value: 0, display: '0', year: '2023', basis: 'reported', cannabis: true, zero: true,
          cites: [
            ['DEA drug fact sheet', 'https://www.dea.gov/factsheets/marijuana-cannabis', 'No deaths from marijuana overdose have been reported.'],
            ['NIDA cannabis research', 'https://nida.nih.gov/research-topics/cannabis-marijuana', 'A fatal cannabis overdose is not documented; harms are non-lethal.']
          ] }
      ]
    },
    er: {
      kicker: 'Emergency department visits, United States, 2023',
      note: 'From SAMHSA\u2019s Drug Abuse Warning Network. \u201CInvolving\u201D means the substance was recorded among those for the visit, not that it was the sole or primary cause. Cannabis harms show up in ERs, not morgues.',
      rows: [
        { name: 'Alcohol-involved', value: 5370000, display: '5.37M', year: '2023', basis: 'reported',
          cites: [
            ['SAMHSA DAWN', DAWN, 'National estimate of alcohol-involved ED visits, 2023 (rounded headline value).']
          ] },
        { name: 'Cannabis-involved', value: 896418, display: '896,418', year: '2023', basis: 'reported', cannabis: true,
          cites: [
            ['SAMHSA DAWN', DAWN, 'National estimate of cannabis-involved ED visits, 2023.']
          ] }
      ]
    },
    use: {
      kicker: 'Share of Americans 12+, 2023 (SAMHSA NSDUH)',
      note: 'Compare with care: alcohol is a past-month measure, cannabis and cocaine are past-year, because those are the headline measures each survey publishes. Globally, WHO estimates roughly 2.3 billion current drinkers.',
      rows: [
        { name: 'Alcohol (past month)', value: 47.5, display: '47.5%', year: '2023', basis: 'reported',
          cites: [
            ['NSDUH 2023 annual report', NSDUH23, '47.5 percent (134.7 million people) drank alcohol in the past month.']
          ] },
        { name: 'Cannabis (past year)', value: 21.8, display: '21.8%', year: '2023', basis: 'reported', cannabis: true,
          cites: [
            ['NSDUH 2023 annual report', NSDUH23, '21.8 percent (61.8 million people) used marijuana in the past year.']
          ] },
        { name: 'Cocaine (past year)', value: 1.8, display: '1.8%', year: '2023', basis: 'reported',
          cites: [
            ['NSDUH 2023 annual report', NSDUH23, 'About 1.8 percent (roughly 5.0 million people) used cocaine in the past year.']
          ] }
      ]
    }
  };

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var barsEl = document.getElementById('bars');
  var kickerEl = document.getElementById('chart-kicker');
  var noteEl = document.getElementById('chart-note');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panel = document.getElementById('panel-chart');

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(metric) {
    var m = METRICS[metric];
    kickerEl.textContent = m.kicker;
    noteEl.textContent = m.note;
    var max = 0;
    m.rows.forEach(function (r) { if (r.value > max) max = r.value; });

    barsEl.innerHTML = m.rows.map(function (r, i) {
      var w = max > 0 ? (r.value / max * 100) : 0;
      var cls = 'bar-row' + (r.zero ? ' zero' : '') + (r.cannabis ? ' cannabis' : '');
      var cites = r.cites.map(function (c) {
        return '<li><a href="' + esc(c[1]) + '" target="_blank" rel="noopener">' + esc(c[0]) + '</a> &mdash; ' + esc(c[2]) + '</li>';
      }).join('');
      return '<li class="' + cls + '">' +
        '<div class="bar-head">' +
          '<span class="bar-name">' + esc(r.name) + '</span>' +
          '<span class="bar-badges"><span class="badge ' + r.basis + '">' + r.basis + '</span>' +
          '<span class="bar-value">' + esc(r.display) + '</span></span>' +
        '</div>' +
        '<div class="bar-track" role="img" aria-label="' + esc(r.name + ': ' + r.display) + '">' +
          '<div class="bar-fill" style="width:' + w.toFixed(2) + '%"></div>' +
        '</div>' +
        '<div class="bar-meta">' +
          '<span class="bar-year">' + esc(r.year) + '</span>' +
          '<button class="receipts-btn" aria-expanded="false" data-i="' + i + '">Receipts</button>' +
        '</div>' +
        '<ul class="cites" data-cites="' + i + '" hidden>' + cites + '</ul>' +
      '</li>';
    }).join('');

    /* animate bars in (transform-only) */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var fills = barsEl.querySelectorAll('.bar-fill');
        for (var j = 0; j < fills.length; j++) { fills[j].style.transform = 'scaleX(1)'; }
      });
    });

    /* receipts toggles */
    var btns = barsEl.querySelectorAll('.receipts-btn');
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener('click', function () {
        var i = this.getAttribute('data-i');
        var list = barsEl.querySelector('[data-cites="' + i + '"]');
        var open = list.hidden;
        list.hidden = !open;
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) panel.setAttribute('aria-labelledby', t.id);
    });
    render(tab.getAttribute('data-metric'));
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  render('deaths');

  /* count-ups: format from data attributes, animate with rAF */
  function fmt(el) {
    var v = parseInt(el.getAttribute('data-count'), 10);
    if (el.getAttribute('data-format') === 'usd') return '$' + v.toLocaleString('en-US');
    return v.toLocaleString('en-US');
  }
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (REDUCED || target === 0) { el.textContent = fmt(el); return; }
    var dur = 1100, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(target * eased);
      el.textContent = el.getAttribute('data-format') === 'usd'
        ? '$' + v.toLocaleString('en-US') : v.toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(el);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    for (var c = 0; c < counters.length; c++) cio.observe(counters[c]);
  } else {
    for (var c2 = 0; c2 < counters.length; c2++) countUp(counters[c2]);
  }

  /* reveals */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !REDUCED) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    for (var r = 0; r < reveals.length; r++) rio.observe(reveals[r]);
  } else {
    for (var r2 = 0; r2 < reveals.length; r2++) reveals[r2].classList.add('in');
  }

  /* notify form: front-end only, same behavior as before */
  var form = document.querySelector('form[data-notify]');
  if (form) {
    var email = form.querySelector('input[type="email"]');
    var error = form.querySelector('.field-error');
    var button = form.querySelector('button');
    function setError(msg) {
      error.textContent = msg;
      email.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) email.focus();
    }
    email.addEventListener('input', function () { setError(''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = email.value.trim();
      if (!value) { setError('Please enter your email address.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError('That does not look like an email address. Even a dog can tell.');
        return;
      }
      setError('');
      button.disabled = true;
      button.classList.add('loading');
      setTimeout(function () { window.location.href = './thanks.html'; }, 800);
    });
  }
})();
