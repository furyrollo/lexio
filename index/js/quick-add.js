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
      if (cur && cur.route.meta.section === 'learn' && scoped && Categories.get(scoped)) { return scoped; }
    } catch (e) { /* fall through to last used */ }
    return lastCategoryId || 'greetings';
  }

  function categoryOptions(selected) {
    return Categories.all.map(function (cat) {
      return '<option value="' + cat.id + '"' + (cat.id === selected ? ' selected' : '') + '>' +
        esc(cat.name) + '</option>';
    }).join('');
  }

  function open(overrideCategoryId) {
    var lang = Store.activeLanguage();
    if (!lang) {
      if (global.App && App.openLanguageSheet) {
        App.openLanguageSheet(function () { open(overrideCategoryId); });
      } else { UI.toast('Choose a language first', { icon: 'warning' }); }
      return;
    }
    var catId = (overrideCategoryId && Categories.get(overrideCategoryId))
      ? overrideCategoryId
      : currentCategoryContext();
    var pendingDupId = null;

    UI.modal({
      title: 'Add a word',
      description: lang.name + ' · Add one word or keep going at your own pace.',
      body:
        '<form id="qa-form" class="stack" autocomplete="off">' +
          '<label class="field"><span class="field__label">Word</span>' +
            '<input class="field__input" name="term" dir="auto" maxlength="200" ' +
              'placeholder="e.g. hola" data-autofocus></label>' +
          '<label class="field"><span class="field__label">Meaning</span>' +
            '<input class="field__input" name="meaning" dir="auto" required maxlength="300" ' +
              'placeholder="e.g. hello"></label>' +
          '<label class="field"><span class="field__label">Category</span>' +
            '<select class="field__select" name="categoryId">' + categoryOptions(catId) + '</select></label>' +
          '<div id="qa-dup" class="form-error hide" role="alert"></div>' +
          '<div id="qa-added" class="qa-added hide" role="status">' + Icon('check') + '<span>Word added</span></div>' +
          '<details class="qa-more"><summary class="btn btn--ghost btn--sm">Optional details</summary>' +
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
        var addedTimer = null;

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
          clearTimeout(addedTimer);
          addedTimer = setTimeout(function () { addedBox.classList.add('hide'); }, 1200);
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
          if (!data.term && !data.nativeScript) {
            dupBox.textContent = 'Enter a word or its native spelling.';
            dupBox.classList.remove('hide');
            form.elements.term.focus();
            return;
          }
          if (!data.meaning) {
            dupBox.textContent = 'Enter a meaning.';
            dupBox.classList.remove('hide');
            form.elements.meaning.focus();
            return;
          }
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
          form.elements.term.value = '';
          if (form.elements.nativeScript) { form.elements.nativeScript.value = ''; }
          form.elements.meaning.value = '';
          if (form.elements.example) { form.elements.example.value = ''; }
          hideDup();
          form.elements.term.focus();
        });
      }
    });
  }

  global.QuickAdd = {
    open: open,
    contextCategory: currentCategoryContext
  };
})(window);
