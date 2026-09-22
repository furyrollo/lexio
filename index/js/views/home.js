/* ==========================================================================
   Home — Warm Atelier: bento hero with Today ring, tinted category grid.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;
  var cardIndex = 0;

  function isDark() { return document.documentElement.dataset.theme === 'dark'; }

  function cardHTML(cat, stat) {
    var empty = stat.total === 0;
    var pct = stat.total ? Math.round((stat.learned / stat.total) * 100) : 0;
    var done = !empty && stat.learned === stat.total;
    var i = (cardIndex++);

    var meta = empty
      ? '<span>No words yet</span>'
      : '<span class="cat-card__count">' + stat.learned + ' learned</span>' +
        '<span class="cat-card__dot" aria-hidden="true"></span>' +
        '<span>' + stat.total + ' ' + UI.plural(stat.total, 'word') + '</span>';

    var label = empty
      ? cat.name + ', no words yet. Open to add some.'
      : cat.name + ', ' + stat.learned + ' of ' + stat.total + ' words learned.';

    return '' +
      '<a class="cat-card' + (empty ? ' cat-card--empty' : '') + '" ' +
         'href="#/category/' + cat.id + '" ' +
         'style="' + Categories.styleVars(cat, isDark()) + '--i:' + i + '" ' +
         'aria-label="' + esc(label) + '">' +
        (done ? '<span class="cat-card__done" aria-hidden="true">' + Icon('check') + '</span>' : '') +
        '<span class="cat-card__icon" aria-hidden="true">' + Icon(cat.icon) + '</span>' +
        '<span class="cat-card__text">' +
          '<span class="cat-card__name">' + esc(cat.name) + '</span>' +
          '<span class="cat-card__meta">' + meta + '</span>' +
        '</span>' +
        (empty
          ? '<span class="cat-card__add">+ Add</span>'
          : '<span class="bar cat-card__bar" role="presentation">' +
            '<span class="bar__fill" data-w="' + pct + '" style="inline-size:0%"></span>' +
            '</span>') +
      '</a>';
  }

  function ringSVG(pct, idSuffix) {
    var r = 60, c = 2 * Math.PI * r;
    var off = c * (1 - pct / 100);
    return '' +
      '<span class="today__ring" role="img" aria-label="' + pct + '% learned">' +
        '<svg viewBox="0 0 140 140" aria-hidden="true">' +
          '<defs><linearGradient id="todayGrad' + idSuffix + '" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="hsl(258 90% 64%)"/>' +
            '<stop offset="1" stop-color="hsl(276 84% 56%)"/>' +
          '</linearGradient></defs>' +
          '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke-width="10" class="today__ring-track"/>' +
          '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke-width="10" stroke-linecap="round" ' +
            'stroke="url(#todayGrad' + idSuffix + ')" stroke-dasharray="' + c.toFixed(1) + '" ' +
            'stroke-dashoffset="' + c.toFixed(1) + '" data-ring="' + off.toFixed(1) + '" class="today__ring-fill"/>' +
        '</svg>' +
        '<span class="today__ring-center"><b data-count="' + pct + '">0%</b><span>learned</span></span>' +
      '</span>';
  }

  function heroHTML(totals, lang) {
    var hasWords = totals.words > 0;

    if (!hasWords) {
      return '' +
        '<section class="hero hero--bento" id="hero">' +
          '<div class="hero__greet">' +
            '<span class="eyebrow">' + esc(UI.greeting()) + '</span>' +
            '<h1>' + (lang
              ? 'Your ' + esc(lang.name) + ' notebook is ready.'
              : 'What are you learning?') + '</h1>' +
            '<p>Lexio holds only the words you choose — nothing pre-loaded. ' +
            'Pick your language, then add your first five words. It takes about a minute.</p>' +
            '<div class="hero__cta">' +
              '<a class="btn btn--primary" href="#/welcome">' + Icon('plus') +
              (lang ? 'Add your first words' : 'Start with your language') + '</a>' +
              (lang ? '<a class="btn" href="#/learn">Browse categories</a>'
                    : '<button type="button" class="btn" id="hero-lang">' + Icon('globe') + 'Choose a language</button>') +
            '</div>' +
          '</div>' +
          '<aside class="hero__today" aria-label="Get started">' +
            '<div class="today__top"><span class="eyebrow">Today</span></div>' +
            ringSVG(0, 'h') +
            '<div class="today__copy"><strong>Add 5 words to unlock your first session</strong>' +
              '<p>Four words open Learn — five make a real set.</p>' +
              '<a class="btn btn--primary btn--sm" href="#/welcome">' + Icon('plus') + 'Add words</a></div>' +
          '</aside>' +
        '</section>';
    }

    var pct = totals.words ? Math.round((totals.learned / totals.words) * 100) : 0;
    var due = 0;
    try { due = global.Scheduler ? Scheduler.dueCount(Store.words()) : 0; } catch (e) { due = 0; }

    return '' +
      '<section class="hero hero--bento" id="hero">' +
        '<div class="hero__greet">' +
          '<span class="eyebrow">' + esc(UI.greeting()) + '</span>' +
          '<h1><span class="hero__num" data-count="' + totals.learned + '">0</span> of ' +
            '<span class="hero__num" data-count="' + totals.words + '">0</span> words are <em>sticking</em>.</h1>' +
          '<p>Ten focused minutes is plenty. Pick up where you left off, or browse a category.</p>' +
          '<div class="hero__stats">' +
            '<span class="stat-pill"><span class="stat-pill__well stat-pill__well--words">' + Icon('cards') + '</span>' +
              '<b data-count="' + totals.words + '">0</b><span>' + UI.plural(totals.words, 'word') + '</span></span>' +
            '<span class="stat-pill"><span class="stat-pill__well stat-pill__well--learned">' + Icon('check') + '</span>' +
              '<b data-count="' + totals.learned + '">0</b><span>learned</span></span>' +
            '<span class="stat-pill"><span class="stat-pill__well stat-pill__well--streak">' + Icon('flame') + '</span>' +
              '<b data-count="' + totals.streak + '">0</b><span>day streak</span></span>' +
          '</div>' +
          '<div class="hero__cta">' +
            '<a class="btn btn--primary" href="#/learn">' + Icon('sparkle') + 'Start a session</a>' +
            '<a class="btn" href="#/home" data-act="browse">Browse categories</a>' +
          '</div>' +
        '</div>' +
        '<aside class="hero__today" aria-label="Today">' +
          '<div class="today__top"><span class="eyebrow">Today</span></div>' +
          '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">' +
            ringSVG(pct, 'h') +
            '<div class="today__copy"><strong>' + (due ? due + ' ' + UI.plural(due, 'word') + ' due now' : 'All caught up') + '</strong>' +
              '<p>Best streak ' + totals.streak + ' ' + UI.plural(totals.streak, 'day') + ' · ' + totals.learned + ' of ' + totals.words + ' sticking</p>' +
              '<a class="today__link" href="#/review">Review progress →</a></div>' +
          '</div>' +
        '</aside>' +
      '</section>';
  }

  function animateNumbers(root) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    UI.$$('[data-count]', root).forEach(function (el) {
      var target = Number(el.dataset.count) || 0;
      var isPct = el.textContent.indexOf('%') !== -1 || (el.parentElement && el.parentElement.className.indexOf('today__ring-center') !== -1);
      if (reduced) {
        el.textContent = isPct ? target + '%' : String(target);
        return;
      }
      var start = null, dur = 600;
      function frame(t) {
        if (!start) { start = t; }
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        el.textContent = isPct ? val + '%' : String(val);
        if (p < 1) { requestAnimationFrame(frame); }
      }
      requestAnimationFrame(frame);
    });
    // Progress bars + ring
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        UI.$$('.bar__fill[data-w]', root).forEach(function (f) {
          f.style.inlineSize = (f.dataset.w || 0) + '%';
        });
        UI.$$('[data-ring]', root).forEach(function (c) {
          c.style.transition = 'stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)';
          c.setAttribute('stroke-dashoffset', c.dataset.ring);
        });
      });
    });
  }

  function render(root) {
    cardIndex = 0;
    var stats = Store.allCategoryStats();
    var totals = Store.totals();
    var lang = Store.activeLanguage();

    var html = heroHTML(totals, lang);

    Categories.tiers.forEach(function (tier) {
      var cats = Categories.byTier(tier.id);
      var started = cats.filter(function (c) { return stats[c.id] && stats[c.id].total > 0; }).length;
      html += '' +
        '<div class="tier">' +
          '<div class="tier__head">' +
            '<span class="tier__label">' + esc(tier.label) + '</span>' +
            '<span class="tier__hint">' + esc(tier.hint) + '</span>' +
          '</div>' +
          '<span class="tier__count">' + started + ' of ' + cats.length + ' started</span>' +
        '</div>' +
        '<section class="cat-grid" aria-label="' + esc(tier.label) + ' categories">' +
          cats.map(function (c) { return cardHTML(c, stats[c.id]); }).join('') +
        '</section>';
    });

    root.innerHTML = html;
    animateNumbers(root);

    var langBtn = document.getElementById('hero-lang');
    if (langBtn) {
      langBtn.addEventListener('click', function () { global.App.openLanguageSheet(); });
    }
    var browse = UI.$('[data-act="browse"]', root);
    if (browse) {
      browse.addEventListener('click', function (e) {
        e.preventDefault();
        var first = UI.$('.cat-grid', root);
        if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    }
  }

  global.Views = global.Views || {};
  global.Views.home = render;
})(window);
