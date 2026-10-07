/* ==========================================================================
   Quick-add — the floating "+" available everywhere. A small sheet with
   just word → meaning; category is pre-filled from context (open the
   Greetings page and it is already Greetings). Native script, example
   and direction collapse behind "More". Duplicates are caught before
   they double up the collection.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;
  var lastCategoryId = 'greetings';
  var pendingDupId = null;

  function currentCategoryContext() {
    try {
      var cur = global.Router && Router.current;
      if (cur && cur.params) {
        if (cur.params.categoryId && Categories.get(cur.params.categoryId)) {
          return cur.params.categoryId;
        }
        if (cur.params.id && Categories.get(cur.params.id)) {
          return cur.params.id;
        }
      }
      var scoped = Store.settings && Store.settings.learnScopeId;
      if (scoped && Categories.get(scoped)) { return scoped; }
    } catch (e) { /* fall through to last used */ }
    return lastCategoryId || 'greetings';
  }

  function categoryOptions(selected) {
    return Categories.all.map(function (cat) {
      return '<option value="' + cat.id + '"' + (cat.id === selected ? ' selected' : '') + '>' +
        esc(cat.name) + '</option>';
    }).join('');
  }

  function catPills(selected) {
    var dark = document.documentElement.dataset.theme === 'dark';
    return '<div class="qa-cats" role="group" aria-label="Category">' +
      Categories.all.map(function (cat) {
        var sel = cat.id === selected;
        return '<button type="button" class="qa-cat" data-cat="' + cat.id + '" ' +
          'aria-pressed="' + sel + '" style="' + Categories.styleVars(cat, dark) + '">' +
          Icon(cat.icon) + '<span>' + esc(cat.name) + '</span></button>';
      }).join('') + '</div>';
  }

  function open(overrideCategoryId) {
    var lang = Store.activeLanguage();
    if (!lang) {
      // No home for the word yet — onboarding asks for the language first.
      if (Store.needsOnboarding && Store.needsOnboarding()) { Router.go('/welcome'); return; }
      if (global.App && App.openLanguageSheet) { App.openLanguageSheet(); }
      else { UI.toast('Add a language first', { icon: 'warning' }); }
      return;
    }
    var catId = (overrideCategoryId && Categories.get(overrideCategoryId))
      ? overrideCategoryId
      : currentCategoryContext();
    pendingDupId = null;

    UI.modal({
      title: 'Quick add',
      description: 'Just the word and its meaning — the rest can wait.',
      body:
        '<form id="qa-form" class="stack" autocomplete="off">' +
          '<label class="field"><span class="field__label">Word</span>' +
            '<input class="field__input" name="term" dir="auto" maxlength="200" ' +
              'placeholder="e.g. hola" data-autofocus></label>' +
          '<label class="field"><span class="field__label">Meaning</span>' +
            '<input class="field__input" name="meaning" dir="auto" required maxlength="300" ' +
              'placeholder="e.g. hello"></label>' +
          '<div class="field"><span class="field__label">Category</span>' +
            catPills(catId) +
            '<input type="hidden" name="categoryId" value="' + esc(catId) + '"></div>' +
          '<div id="qa-dup" class="form-error hide" role="alert"></div>' +
          '<div id="qa-added" class="qa-added hide" role="status">' + Icon('check') + '<span>Added ✓</span></div>' +
          '<details class="welcome__more"><summary class="btn btn--ghost btn--sm">More (native script, example, direction)</summary>' +
            '<div class="stack" style="margin-block-start:var(--s-3)">' +
              '<label class="field"><span class="field__label">Native script <span class="optional">Optional</span></span>' +
                '<input class="field__input" name="nativeScript" dir="auto" maxlength="200"></label>' +
              '<label class="field"><span class="field__label">Example <span class="optional">Optional</span></span>' +
                '<input class="field__input" name="example" dir="auto" maxlength="1000"></label>' +
              '<label class="field"><span class="field__label">Direction</span>' +
                '<select class="field__select" name="dir">' +
                  '<option value="auto"' + ((lang.dir || 'auto') === 'auto' ? ' selected' : '') + '>Auto-detect</option>' +
                  '<option value="ltr"' + (lang.dir === 'ltr' ? ' selected' : '') + '>Left to right</option>' +
                  '<option value="rtl"' + (lang.dir === 'rtl' ? ' selected' : '') + '>Right to left</option>' +
                '</select></label>' +
            '</div>' +
          '</details>' +
          '<div class="modal__actions">' +
            '<button type="button" class="btn" data-act="done">Done</button>' +
            '<button type="submit" class="btn btn--primary btn--block">' + Icon('plus') + '<span>Add word</span></button>' +
          '</div></form>',
      onMount: function (panel, close) {
        var form = UI.$('#qa-form', panel);
        var dupBox = UI.$('#qa-dup', panel);
        var addedBox = UI.$('#qa-added', panel);
        var submitBtn = UI.$('button[type="submit"]', panel);
        var catInput = UI.$('input[name="categoryId"]', panel);

        UI.$$('.qa-cat', panel).forEach(function (pill) {
          pill.addEventListener('click', function () {
            UI.$$('.qa-cat', panel).forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
            pill.setAttribute('aria-pressed', 'true');
            catInput.value = pill.dataset.cat;
            lastCategoryId = pill.dataset.cat;
          });
        });

        function showDup(existing) {
          dupBox.classList.remove('hide');
          dupBox.innerHTML = 'Already in ' + esc(lang.name) + ': “' +
            esc(WordDisplay.primary(existing)) + '” → ' + esc(existing.meaning) +
            '. Save again to add it anyway.';
          submitBtn.querySelector('span').textContent = 'Add anyway';
        }
        function hideDup() {
          dupBox.classList.add('hide'); dupBox.innerHTML = '';
          submitBtn.querySelector('span').textContent = 'Add word';
        }
        function flashAdded() {
          addedBox.classList.remove('hide');
          setTimeout(function () { addedBox.classList.add('hide'); }, 800);
        }

        form.addEventListener('input', function (e) {
          if (e.target && e.target.name !== 'categoryId') { pendingDupId = null; hideDup(); }
        });
        UI.$('[data-act="done"]', panel).addEventListener('click', close);

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var fd = new FormData(form);
          var data = {
            languageId: lang.id,
            term: String(fd.get('term') || '').trim(),
            nativeScript: String(fd.get('nativeScript') || '').trim(),
            meaning: String(fd.get('meaning') || '').trim(),
            categoryId: String(fd.get('categoryId') || catId),
            example: String(fd.get('example') || '').trim(),
            dir: String(fd.get('dir') || 'auto')
          };
          lastCategoryId = data.categoryId;
          var dup = Store.findDuplicate(data, lang.id);
          if (dup && pendingDupId !== dup.id) {
            pendingDupId = dup.id;
            showDup(dup);
            return;
          }
          try {
            var word = Store.addWord(data);
          } catch (err) { UI.toast(err.message, { icon: 'warning' }); return; }
          pendingDupId = null;
          flashAdded();
          // Stay open for rapid entry: clear the word fields, keep category.
          form.term.value = '';
          if (form.nativeScript) { form.nativeScript.value = ''; }
          form.meaning.value = '';
          if (form.example) { form.example.value = ''; }
          hideDup();
          form.term.focus();
        });
      }
    });
  }

  global.QuickAdd = {
    open: open,
    contextCategory: currentCategoryContext
  };
})(window);
