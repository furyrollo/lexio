/* ==========================================================================
   Category detail — Warm Atelier: hero band, pill search, accent-bar cards.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;
  var queries = {};

  function boxPill(word) {
    var box = 0;
    try { box = global.Scheduler ? Scheduler.boxOf(word) : 0; } catch (e) { box = 0; }
    var label = global.Scheduler ? Scheduler.describeBox(box) : 'New';
    var cls = 'box-pill--new';
    if (box >= 5) { cls = 'box-pill--mastered'; }
    else if (box >= 3) { cls = 'box-pill--familiar'; }
    else if (box >= 1) { cls = 'box-pill--seen'; }
    return '<span class="tag box-pill ' + cls + '">' + esc(label) + '</span>';
  }

  function wordCard(word, language, index) {
    var delay = 40 + Math.min(index, 8) * 24;
    return '<article class="browse-word" role="listitem" style="--word-delay:' + delay + 'ms">' +
      '<div class="browse-word__top">' + boxPill(word) + '</div>' +
      WordDisplay.pairHTML(word, language) +
    '</article>';
  }
  function resultsHTML(cat, language, query) {
    var words = Store.words({ categoryId: cat.id, query: query });
    words.sort(function (a, b) {
      return a.term.localeCompare(b.term, (language && language.code) || undefined, { sensitivity: 'base' });
    });

    if (!words.length && query) {
      return '<div class="browse-no-results">' + Icon('search') +
        '<strong>No words match “' + esc(query) + '”</strong>' +
        '<p>Try a shorter search, or look for the meaning instead.</p>' +
        '<button type="button" class="btn btn--sm" data-act="clear-category-search">Clear search</button>' +
      '</div>';
    }

    return '<div class="browse-grid" role="list" aria-label="' + esc(cat.name) + ' words">' +
      words.map(function (word, index) { return wordCard(word, language, index); }).join('') +
    '</div>';
  }

  function render(root, params) {
    var cat = Categories.get(params.id);
    if (!cat) { Router.go('/home', true); return; }

    var dark = document.documentElement.dataset.theme === 'dark';
    var stat = Store.categoryStats(cat.id);
    var lang = Store.activeLanguage();
    var query = queries[cat.id] || '';
    var countLabel = stat.total + ' ' + UI.plural(stat.total, 'word');

    var head = '<header class="page-head cat-head" style="' + Categories.styleVars(cat, dark) + '">' +
      '<a class="cat-head__back" href="#/home" aria-label="All categories">' +
        '<span class="flip-rtl">' + Icon('back') + '</span></a>' +
      '<span class="cat-head__back-label">All categories</span>' +
      '<div class="cat-head__band">' +
        '<div class="cat-head__row">' +
          '<span class="cat-head__icon' + (global.CatArt && CatArt.has(cat.icon) ? ' cat-head__icon--art' : '') + '" aria-hidden="true">' +
            (global.CatArt && CatArt.has(cat.icon) ? CatArt(cat.icon) : Icon(cat.icon)) + '</span>' +
          '<div class="cat-head__copy">' +
            '<span class="cat-head__tag">' + esc(countLabel) + '</span>' +
            '<h1>' + esc(cat.name) + '</h1>' +
            '<p>' + esc(cat.blurb) + (lang ? ' · ' + esc(lang.name) : '') + '</p>' +
          '</div>' +
        '</div>' +
        (stat.total
          ? '<div class="cat-head__cta"><a class="btn btn--primary" href="#/learn/play/flashcards/category/' + cat.id + '">' +
            Icon('sparkle') + 'Practise these words</a></div>'
          : '') +
      '</div>' +
    '</header>';

    var body;
    if (stat.total === 0) {
      body = UI.emptyState({
        icon: cat.icon,
        title: 'Nothing in ' + cat.name + ' yet',
        body: 'This category is waiting for your words. Add one in seconds, or paste a whole list in Manage.',
        actions:
          '<button type="button" class="btn btn--primary" data-act="quick-add">' + Icon('plus') + 'Add a ' + esc(cat.name.toLowerCase()) + ' word</button>' +
          '<a class="btn" href="#/manage/category/' + cat.id + '">Bulk add in Manage</a>'
      });
    } else {
      body = '<section class="browse" aria-labelledby="browse-title"' +
          ' style="' + Categories.styleVars(cat, dark) + '">' +
          '<div class="browse-tools">' +
            '<div class="browse-tools__copy"><h2 id="browse-title">Your ' + esc(cat.name.toLowerCase()) + '</h2>' +
              '<p id="category-result-count">' + esc(countLabel) + ' in this collection</p></div>' +
            '<label class="browse-search">' +
              '<span aria-hidden="true">' + Icon('search') + '</span>' +
              '<span class="sr-only">Search within ' + esc(cat.name) + '</span>' +
              '<input id="category-search" type="search" value="' + esc(query) + '" ' +
                'placeholder="Search words or meanings…" autocomplete="off">' +
            '</label>' +
          '</div>' +
          '<div id="category-results" aria-live="polite">' + resultsHTML(cat, lang, query) + '</div>' +
        '</section>' +
      '<aside class="manage-callout" aria-label="Manage this category">' +
        '<span class="manage-callout__icon" aria-hidden="true">' + Icon('manage') + '</span>' +
        '<div><strong>Want to change this collection?</strong>' +
          '<p>Adding, editing, and deleting stay safely inside Manage Words.</p></div>' +
        '<a class="btn btn--edit btn--sm" href="#/manage/category/' + cat.id + '">Manage ' + esc(cat.name) +
          '<span class="flip-rtl">' + Icon('chevron') + '</span></a>' +
      '</aside>';
    }

    root.innerHTML = '<div class="category-page">' + head + body + '</div>';

    var search = UI.$('#category-search', root);
    if (search) {
      search.addEventListener('input', function () {
        queries[cat.id] = search.value.trim();
        updateResults(root, cat, lang, queries[cat.id]);
      });
    }
    root.onclick = function (event) {
      var qa = event.target.closest('[data-act="quick-add"]');
      if (qa) {
        if (global.QuickAdd && QuickAdd.open) { QuickAdd.open(cat.id); }
        return;
      }
      var clear = event.target.closest('[data-act="clear-category-search"]');
      if (!clear) { return; }
      queries[cat.id] = '';
      search.value = '';
      search.focus();
      updateResults(root, cat, lang, '');
    };
  }

  function updateResults(root, cat, language, query) {
    var result = UI.$('#category-results', root);
    var count = UI.$('#category-result-count', root);
    if (!result) { return; }
    var matches = Store.words({ categoryId: cat.id, query: query }).length;
    result.innerHTML = resultsHTML(cat, language, query);
    if (count) {
      count.textContent = query
        ? matches + ' ' + UI.plural(matches, 'match') + ' for “' + query + '”'
        : matches + ' ' + UI.plural(matches, 'word') + ' in this collection';
    }
  }

  global.Views = global.Views || {};
  global.Views.category = render;
})(window);
