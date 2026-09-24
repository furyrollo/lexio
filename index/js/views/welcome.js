/* ==========================================================================
   Welcome — first-run onboarding. Cold start is the core product problem:
   everything downstream needs words, but a blank Manage page costs too
   much and rewards too late. So brand-new users land here instead:

     1. Pick a language from a real list (BCP-47 code stored for future
        TTS / dictionary / AI grounding; direction auto-filled, overridable).
     2. Add the first 5 words in a tiny guided flow — word → meaning,
        category pre-filled, native/example/direction behind "More".

   No sample data. The full Manage page stays for power editing later.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;
  var TARGET = 5;
  var state = { query: '', selected: null, showAll: false, pendingDup: null };

  function dirLabel(dir) {
    return dir === 'rtl' ? 'Right to left' : (dir === 'auto' ? 'Auto' : 'Left to right');
  }

  function categoryOptions(selected) {
    return Categories.all.map(function (cat) {
      return '<option value="' + cat.id + '"' + (cat.id === selected ? ' selected' : '') + '>' +
        esc(cat.name) + '</option>';
    }).join('');
  }

  function directionSeg(name, current) {
    function opt(v, label) {
      return '<label class="seg__opt"><input type="radio" name="' + name + '" value="' + v + '"' +
        (current === v ? ' checked' : '') + '><span>' + label + '</span></label>';
    }
    return '<div class="seg" role="radiogroup" aria-label="Reading direction">' +
      opt('ltr', 'Left → right') + opt('rtl', 'Right ← left') + opt('auto', 'Auto') + '</div>';
  }

  function render(root) {
    var langs = Store.languages();
    var active = Store.activeLanguage();
    var wordCount = Store.words().length;

    // Onboarding is done once the active language holds words. A returning
    // user who typed this URL manually goes home instead of looping.
    if (langs.length && wordCount > 0) { Router.go('/home', true); return; }

    if (!langs.length) { renderLanguageStep(root); }
    else { renderWordsStep(root, active); }
  }

  /* ---- Step 1: pick a language ------------------------------------------ */

  function renderLanguageStep(root) {
    var allMatches = LexioLanguages.search(state.query);
    var results = allMatches.slice(0, state.showAll ? 60 : 12);
    var sel = state.selected;
    var q = String(state.query || '').trim();
    var exactName = q ? LexioLanguages.getByName(q) : null;

    root.innerHTML =
      '<div class="welcome welcome--split">' +
        '<aside class="welcome__panel" aria-hidden="true">' +
          '<div class="welcome__glyphs"><span>あ</span><span>ع</span><span>A</span></div>' +
          '<div class="welcome__brand"><span class="brand__mark">' + Icon('seed') + '</span><strong>Lexio</strong></div>' +
          '<p class="welcome__promise">Your words. Your pace. Every script.</p>' +
        '</aside>' +
        '<div class="welcome__body">' +
        '<div class="welcome__steps"><span class="welcome__step is-active">1 Language</span>' +
          '<span class="welcome__step">2 First words</span></div>' +
        '<header class="page-head welcome__head">' +
          '<span class="eyebrow">Welcome to Lexio</span>' +
          '<h1>What are you learning?</h1>' +
          '<p>Any language works — popular ones are shortcuts below, but an obscure ' +
          'language, dialect, or constructed tongue is just as welcome. We save a ' +
          'code with it so future voices and lookups know what to use.</p>' +
        '</header>' +
        '<div class="welcome__grid">' +
          '<section class="card card--pad welcome__pick" aria-labelledby="w-pick">' +
            '<h2 id="w-pick">Find it, or just type it</h2>' +
            '<label class="search-box welcome__search"><span aria-hidden="true">' + Icon('search') + '</span>' +
              '<span class="sr-only">Search languages</span>' +
              '<input id="w-search" type="search" value="' + esc(state.query) + '" ' +
                'placeholder="Search, or type any language — try Pashto, Yoruba…" autocomplete="off"></label>' +
            (q && !exactName
              ? '<button type="button" class="option option--custom" data-act="use-custom">' +
                '<span class="grow"><span class="option__title" dir="auto">Use “' + esc(q) + '”</span><br>' +
                '<span class="option__sub">Not in the shortcuts — works fully, code suggested for you</span></span>' +
                Icon('plus') + '</button>' : '') +
            '<div class="option-list welcome__list" role="listbox" aria-label="Popular languages">' +
              (results.length ? results.map(function (l) {
                var isSel = sel && sel.code.toLocaleLowerCase() === l.code.toLocaleLowerCase();
                return '<button type="button" class="option" role="option" aria-selected="' + !!isSel + '"' +
                  (isSel ? ' aria-pressed="true"' : '') + ' data-code="' + esc(l.code) + '">' +
                  '<span class="chip__code">' + esc(l.code) + '</span>' +
                  '<span class="grow"><span class="option__title" dir="auto">' + esc(l.name) + '</span><br>' +
                  '<span class="option__sub">' + esc(dirLabel(l.dir)) + '</span></span>' +
                  (isSel ? Icon('check') : '') +
                '</button>';
              }).join('') : '<p class="acct-empty-line">No shortcuts match — use “' + esc(q || 'your language') +
                '” above, it works fully.</p>') +
            '</div>' +
            ((allMatches.length > 12 && !state.showAll)
              ? '<button type="button" class="btn btn--sm btn--ghost" data-act="show-all">Show all ' +
                allMatches.length + ' matches</button>' : '') +
          '</section>' +
          '<section class="card card--pad welcome__confirm" aria-labelledby="w-confirm">' +
            '<h2 id="w-confirm">Your language</h2>' +
            '<form id="w-form" class="stack" autocomplete="off">' +
              '<label class="field"><span class="field__label">Language name</span>' +
                '<input class="field__input" name="name" dir="auto" required maxlength="40" ' +
                  'placeholder="Spanish — or anything, e.g. Hunsrik" value="' + esc(sel ? sel.name : q) + '"></label>' +
              '<label class="field"><span class="field__label">Code <span class="optional">Auto if blank</span></span>' +
                '<input class="field__input" name="code" dir="ltr" maxlength="20" spellcheck="false" ' +
                  'placeholder="es — or leave blank" value="' + esc(sel ? sel.code : '') + '">' +
                '<span class="field__hint">Standard tag when one exists (es, pt-BR, zh-Hant-TW). ' +
                'Blank is fine — we suggest one and you can edit it later.</span></label>' +
              '<div class="field"><span class="field__label">Reading direction</span>' +
                directionSeg('dir', sel ? sel.dir : LexioLanguages.guessDir(sel ? sel.code : '')) +
                '<span class="field__hint">Guessed from the code — change it only if your words need it. ' +
                'Unknown scripts default to Auto.</span></div>' +
              '<button type="submit" class="btn btn--primary btn--block btn--lg">' + Icon('chevron') +
                'Start with this language</button>' +
              '<p class="acct-empty-line">You can add more languages later. Words stay private to each one.</p>' +
            '</form>' +
          '</section>' +
        '</div>' +
        '</div>' +
      '</div>';

    var search = UI.$('#w-search', root);
    search.addEventListener('input', function () {
      state.query = search.value;
      state.showAll = false;
      // Re-render list only, keep the form (and focus) intact.
      render(root);
      var again = UI.$('#w-search', root);
      again.focus();
      // Keep caret at the end after re-render.
      again.setSelectionRange(again.value.length, again.value.length);
    });

    root.onclick = function onPick(e) {
      var custom = e.target.closest('[data-act="use-custom"]');
      if (custom) {
        var name = String(state.query || '').trim();
        if (name) {
          var code = LexioLanguages.suggestCode(name);
          state.selected = { name: name, code: code, dir: LexioLanguages.guessDir(code) };
          state.query = '';
          state.showAll = false;
        }
        render(root);
        return;
      }
      var btn = e.target.closest('[data-code]');
      if (btn && root.contains(btn)) {
        var found = LexioLanguages.getByCode(btn.dataset.code);
        if (found) { state.selected = { name: found.name, code: found.code, dir: found.dir }; }
        render(root);
        return;
      }
      if (e.target.closest('[data-act="show-all"]')) {
        state.showAll = true;
        render(root);
      }
      var del = e.target.closest('[data-del]');
      if (del) {
        Store.deleteWord(del.dataset.del);
        state.pendingDup = null;
        render(root);
      }
    };

    UI.$('#w-form', root).addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var name = String(fd.get('name') || '').trim();
      var code = String(fd.get('code') || '').trim();
      var dir = String(fd.get('dir') || 'auto');
      if (!name) { UI.toast('Give your language a name', { icon: 'warning' }); return; }
      if (!code) { code = LexioLanguages.suggestCode(name); }
      if (!LexioLanguages.isValidCode(code)) {
        UI.toast('That code looks off — use letters like es, pt-BR, zh-Hant-TW, or leave it blank', { icon: 'warning', duration: 4000 });
        return;
      }
      // Direction stays exactly as the user left the seg (guessed, overridable).
      var lang = Store.addLanguage({ name: name, code: code, dir: dir });
      Store.setActiveLanguage(lang.id);
      state.selected = null; state.query = ''; state.showAll = false; state.pendingDup = null;
      UI.toast(name + ' is ready — add your first words');
      Router.refresh();
    });

    // Typing a custom name clears the shortcut pick but keeps your text.
    // If the code box is still empty, suggest one live and guess direction.
    (function () {
      var form = UI.$('#w-form', root);
      form.addEventListener('input', function (e) {
        if (e.target.name === 'name' || e.target.name === 'code') { state.selected = null; }
        if (e.target.name !== 'name') { return; }
        var codeInput = UI.$('[name="code"]', form);
        if (!codeInput || codeInput.value) { return; }
        var typed = String(e.target.value || '').trim();
        if (typed.length < 2) { return; }
        var known = LexioLanguages.getByName(typed);
        var suggestion = known ? known.code : LexioLanguages.suggestCode(typed);
        codeInput.placeholder = suggestion + ' — or leave blank';
        var dirRadio = UI.$('input[name="dir"][value="' +
          LexioLanguages.guessDir(known ? known.code : suggestion) + '"]', form);
        if (dirRadio) { dirRadio.checked = true; }
      });
    })();
  }

  /* ---- Step 2: first five words ------------------------------------------ */

  function renderWordsStep(root, lang) {
    var words = Store.words().slice()
      .sort(function (a, b) { return String(b.dateAdded).localeCompare(String(a.dateAdded)); });
    var count = words.length;
    var pct = Math.min(100, Math.round((count / TARGET) * 100));
    var remaining = Math.max(0, TARGET - count);
    var gate = global.Activities ? Activities.GATE_MIN_WORDS : 4;

    root.innerHTML =
      '<div class="welcome welcome--split">' +
        '<aside class="welcome__panel" aria-hidden="true">' +
          '<div class="welcome__glyphs"><span>あ</span><span>ع</span><span>A</span></div>' +
          '<div class="welcome__brand"><span class="brand__mark">' + Icon('seed') + '</span><strong>Lexio</strong></div>' +
          '<p class="welcome__promise">Your words. Your pace. Every script.</p>' +
        '</aside>' +
        '<div class="welcome__body">' +
        '<div class="welcome__steps"><span class="welcome__step">1 Language</span>' +
          '<span class="welcome__step is-active">2 First words</span></div>' +
        '<header class="page-head welcome__head">' +
          '<span class="eyebrow">' + esc(lang ? lang.name + (lang.code ? ' · ' + lang.code : '') : 'Your language') + '</span>' +
          '<h1>Add your first ' + TARGET + ' words.</h1>' +
          '<p>Just the word and what it means — the rest can wait. ' +
          (remaining ? remaining + ' more to your first set.' : 'Set complete — nicely done.') + '</p>' +
          '<span class="bar welcome__bar"><span class="bar__fill" style="inline-size:' + pct + '%"></span></span>' +
          '<p class="welcome__count">' + count + ' of ' + TARGET + ' added' +
            (count >= gate ? ' · Learn is unlocked' : ' · ' + (gate - count) + ' more unlocks Learn') + '</p>' +
        '</header>' +
        '<div class="welcome__grid">' +
          '<section class="card card--pad" aria-labelledby="w-add">' +
            '<h2 id="w-add">New word</h2>' +
            '<form id="w-word-form" class="stack" autocomplete="off">' +
              '<label class="field"><span class="field__label">Word</span>' +
                '<input class="field__input" name="term" dir="auto" maxlength="200" ' +
                  'placeholder="e.g. hola" data-autofocus></label>' +
              '<label class="field"><span class="field__label">Meaning</span>' +
                '<input class="field__input" name="meaning" dir="auto" required maxlength="300" ' +
                  'placeholder="e.g. hello"></label>' +
              '<label class="field"><span class="field__label">Category</span>' +
                '<select class="field__select" name="categoryId">' + categoryOptions('greetings') + '</select></label>' +
              '<div id="w-dup" class="form-error hide" role="alert"></div>' +
              '<details class="welcome__more"><summary>More (native script, example, direction)</summary>' +
                '<div class="stack" style="margin-block-start:var(--s-3)">' +
                  '<label class="field"><span class="field__label">Native script <span class="optional">Optional</span></span>' +
                    '<input class="field__input" name="nativeScript" dir="auto" maxlength="200"></label>' +
                  '<label class="field"><span class="field__label">Example <span class="optional">Optional</span></span>' +
                    '<input class="field__input" name="example" dir="auto" maxlength="1000"></label>' +
                  '<div class="field"><span class="field__label">Direction</span>' +
                    directionSeg('dir', (lang && lang.dir) || 'auto') + '</div>' +
                '</div>' +
              '</details>' +
              '<button type="submit" class="btn btn--primary btn--block">' + Icon('plus') +
                (state.pendingDup ? 'Add anyway' : 'Add word') + '</button>' +
            '</form>' +
          '</section>' +
          '<section class="card card--pad" aria-labelledby="w-list" aria-live="polite">' +
            '<h2 id="w-list">Your starting set</h2>' +
            (words.length
              ? '<ul class="summary__words welcome__rows">' + words.slice(0, TARGET).map(function (w, i) {
                  var cat = Categories.get(w.categoryId);
                  return '<li class="sum-word"><span class="welcome__num" aria-hidden="true">' + (i + 1) + '</span>' +
                    '<span class="sum-word__text"><strong dir="auto">' +
                    esc(WordDisplay.primary(w)) + '</strong>' +
                    (WordDisplay.secondary(w)
                      ? '<span class="sum-word__native" dir="' + WordDisplay.dirOf(w, lang) + '">' +
                        esc(WordDisplay.secondary(w)) + '</span>' : '') +
                    '<span dir="auto">' + esc(w.meaning) + '</span></span>' +
                    '<span class="tag">' + esc(cat ? cat.name : '') + '</span>' +
                    '<button type="button" class="icon-btn icon-btn--plain" data-del="' + esc(w.id) + '" ' +
                      'aria-label="Remove ' + esc(WordDisplay.primary(w)) + '">' + Icon('trash') + '</button></li>';
                }).join('') + '</ul>'
              : '<p class="acct-empty-line">Nothing yet — your first word goes here.</p>') +
            '<div class="welcome__actions">' +
              (count >= gate
                ? '<a class="btn btn--primary" href="#/learn">' + Icon('sparkle') + 'Start learning</a>'
                : '<span class="acct-empty-line">Learn unlocks at ' + gate + ' words.</span>') +
              '<a class="btn" href="#/home">Explore first</a>' +
            '</div>' +
          '</section>' +
        '</div>' +
        '</div>' +
      '</div>';

    var form = UI.$('#w-word-form', root);
    var dupBox = UI.$('#w-dup', root);

    function showDup(existing) {
      dupBox.classList.remove('hide');
      dupBox.innerHTML = 'You already have “' + esc(WordDisplay.primary(existing)) + '” → ' +
        esc(existing.meaning) + '. Press <strong>Add anyway</strong> if this is a different sense.';
    }
    function hideDup() { dupBox.classList.add('hide'); dupBox.innerHTML = ''; }

    form.addEventListener('input', function () { state.pendingDup = null; hideDup(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var data = {
        languageId: lang.id,
        term: String(fd.get('term') || '').trim(),
        nativeScript: String(fd.get('nativeScript') || '').trim(),
        meaning: String(fd.get('meaning') || '').trim(),
        categoryId: String(fd.get('categoryId') || 'greetings'),
        example: String(fd.get('example') || '').trim(),
        dir: String(fd.get('dir') || (lang.dir || 'auto'))
      };
      var dup = Store.findDuplicate(data, lang.id);
      if (dup && !state.pendingDup) {
        state.pendingDup = dup.id;
        showDup(dup);
        UI.$('button[type="submit"]', form).innerHTML = Icon('plus') + 'Add anyway';
        return;
      }
      try {
        Store.addWord(data);
        state.pendingDup = null;
        UI.toast(data.term || data.nativeScript ? 'Added — ' + remainingAfter() : 'Word added');
      } catch (err) { UI.toast(err.message, { icon: 'warning' }); return; }
      Router.refresh();

      function remainingAfter() {
        var n = Store.words().length;
        return n >= TARGET ? 'set complete' : (TARGET - n) + ' to go';
      }
    });

    root.onclick = function (e) {
      var del = e.target.closest('[data-del]');
      if (del) { Store.deleteWord(del.dataset.del); state.pendingDup = null; Router.refresh(); }
    };
  }

  global.Views = global.Views || {};
  global.Views.welcome = render;
})(window);
