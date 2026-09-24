/* ==========================================================================
   Home — Field Guide: bento hero, chapter strip, die-cut sticker category tiles.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;
  var cardIndex = 0;

  function isDark() { return document.documentElement.dataset.theme === 'dark'; }

  /* Resting tilt for each sticker — a hand-placed, not machine-gridded, feel. */
  var TILTS = [-7, 5, -3, 8, -5, 4, -8, 6, -4, 3];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /** Ten-pip meter: each pip is a tenth of the category learned. */
  function pipsHTML(pct) {
    var on = Math.round(pct / 10);
    if (pct > 0 && on === 0) { on = 1; }
    var out = '<span class="pips" role="presentation">';
    for (var p = 0; p < 10; p++) {
      out += '<i' + (p < on ? ' class="on" style="--p:' + p + '"' : '') + '></i>';
    }
    return out + '</span>';
  }

  function cardHTML(cat, stat) {
    var empty = stat.total === 0;
    var pct = stat.total ? Math.round((stat.learned / stat.total) * 100) : 0;
    var done = !empty && stat.learned === stat.total;
    var i = (cardIndex++);
    var tilt = TILTS[cat.order % TILTS.length];

    var foot = empty
      ? '<span class="fg-tile__start">Start here<span class="fg-tile__plus" aria-hidden="true">' + Icon('plus') + '</span></span>'
      : '<span class="fg-tile__count"><b>' + stat.learned + '</b><span>/' + stat.total + ' learned</span></span>' +
        pipsHTML(pct);

    var label = empty
      ? cat.name + ', no words yet. Open to add some.'
      : cat.name + ', ' + stat.learned + ' of ' + stat.total + ' words learned.';

    return '' +
      '<a class="fg-tile' + (empty ? ' is-empty' : '') + (done ? ' is-done' : '') + '" ' +
         'href="#/category/' + cat.id + '" ' +
         'style="' + Categories.styleVars(cat, isDark()) + '--i:' + i + ';--tilt:' + tilt + 'deg" ' +
         'aria-label="' + esc(label) + '">' +
        '<span class="fg-tile__no" aria-hidden="true">' + pad2(cat.order + 1) + '</span>' +
        (done ? '<span class="fg-tile__stamp" aria-hidden="true">' + Icon('check') + 'Mastered</span>' : '') +
        '<span class="fg-tile__art" aria-hidden="true">' +
          (global.CatArt && CatArt.has(cat.icon) ? CatArt(cat.icon) : Icon(cat.icon)) +
        '</span>' +
        '<span class="fg-tile__body">' +
          '<span class="fg-tile__name">' + esc(cat.name) + '</span>' +
          '<span class="fg-tile__blurb">' + esc(cat.blurb) + '</span>' +
        '</span>' +
        '<span class="fg-tile__foot">' + foot + '</span>' +
      '</a>';
  }

  /* Chapter strip — one card per tier, jumps to that section. */
  function chaptersHTML(stats) {
    return '<nav class="chapters" aria-label="Jump to a chapter">' +
      Categories.tiers.map(function (tier, t) {
        var cats = Categories.byTier(tier.id);
        var words = 0, started = 0;
        cats.forEach(function (c) {
          var st = stats[c.id] || { total: 0 };
          words += st.total; if (st.total > 0) { started++; }
        });
        var lead = cats[0];
        return '<button type="button" class="chapter" data-jump="' + tier.id + '" ' +
            'style="' + Categories.styleVars(lead, isDark()) + '">' +
          '<span class="chapter__no">' + pad2(t + 1) + '</span>' +
          '<span class="chapter__txt"><b>' + esc(tier.label) + '</b>' +
            '<span>' + started + '/' + cats.length + ' started · ' + words + ' ' + UI.plural(words, 'word') + '</span></span>' +
          '<span class="chapter__stack" aria-hidden="true">' +
            cats.slice(0, 3).map(function (c) {
              return '<span class="chapter__chip" style="' + Categories.styleVars(c, isDark()) + '">' +
                (global.CatArt ? CatArt(c.icon) : Icon(c.icon)) + '</span>';
            }).join('') +
          '</span>' +
        '</button>';
      }).join('') +
    '</nav>';
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

  /* A little pile of category stickers tucked into the Today card. */
  function scatterHTML() {
    if (!global.CatArt) { return ''; }
    return '<span class="scatter" aria-hidden="true">' +
      ['greetings', 'colors', 'animals'].map(function (id, n) {
        var c = Categories.get(id);
        return '<span class="scatter__s scatter__s--' + n + '" style="' + Categories.styleVars(c, isDark()) + '">' +
          CatArt(c.icon) + '</span>';
      }).join('') + '</span>';
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
              (lang ? '<a class="btn" href="#/home" data-act="browse">Browse categories</a>'
                    : '<button type="button" class="btn" id="hero-lang">' + Icon('globe') + 'Choose a language</button>') +
            '</div>' +
          '</div>' +
          '<aside class="hero__today" aria-label="Get started">' + scatterHTML() +
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
        '<aside class="hero__today" aria-label="Today">' + scatterHTML() +
          '<div class="today__top"><span class="eyebrow">Today</span></div>' +
          '<div class="today__body">' +
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

    html += '<div class="fg-intro">' +
        '<div class="fg-intro__copy"><span class="eyebrow">Your field guide</span>' +
          '<h2>Twenty rooms of words, <em>basic to bold</em>.</h2></div>' +
        '<p>Every category starts empty. Fill the ones you need — the stickers light up as words stick.</p>' +
      '</div>' +
      chaptersHTML(stats);

    Categories.tiers.forEach(function (tier, t) {
      var cats = Categories.byTier(tier.id);
      var started = cats.filter(function (c) { return stats[c.id] && stats[c.id].total > 0; }).length;
      html += '' +
        '<section class="fg-chapter" id="chapter-' + tier.id + '" aria-labelledby="chapter-' + tier.id + '-title">' +
          '<header class="tier">' +
            '<span class="tier__no" aria-hidden="true">' + pad2(t + 1) + '</span>' +
            '<div class="tier__head">' +
              '<h2 class="tier__label" id="chapter-' + tier.id + '-title">' + esc(tier.label) + '</h2>' +
              '<span class="tier__hint">' + esc(tier.hint) + '</span>' +
            '</div>' +
            '<span class="tier__count"><b>' + started + '</b><span>/' + cats.length + '&nbsp;started</span></span>' +
          '</header>' +
          '<div class="cat-grid fg-grid">' +
            cats.map(function (c) { return cardHTML(c, stats[c.id]); }).join('') +
          '</div>' +
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
        var first = UI.$('.chapters', root);
        if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    }
    UI.$$('[data-jump]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById('chapter-' + btn.dataset.jump);
        if (!target) { return; }
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  global.Views = global.Views || {};
  global.Views.home = render;
})(window);
