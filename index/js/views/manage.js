/* ==========================================================================
   Manage Words — the only editing surface in Lexio.
   Single-entry CRUD, bulk paste preview, language setup, and JSON portability.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;
  var viewState = { query: '', categoryId: '', bulkRows: [] };

  function cloudOn() { return CloudSync && CloudSync.isAuthenticated(); }
  function saveNote() {
    return cloudOn() ? 'Saved privately to your account' : 'Guest mode · saved only on this device';
  }

  function categoryOptions(selected, allLabel) {
    var first = allLabel
      ? '<option value="">' + esc(allLabel) + '</option>'
      : '<option value="" disabled' + (selected ? '' : ' selected') + '>Choose a category</option>';
    return first + Categories.all.map(function (cat) {
      return '<option value="' + cat.id + '"' + (cat.id === selected ? ' selected' : '') + '>' +
        esc(cat.name) + '</option>';
    }).join('');
  }

  function directionOptions(selected) {
    return [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'ltr', label: 'Left to right' },
      { value: 'rtl', label: 'Right to left' }
    ].map(function (item) {
      return '<option value="' + item.value + '"' + (selected === item.value ? ' selected' : '') + '>' +
        item.label + '</option>';
    }).join('');
  }

  function languageRows(langs, activeId) {
    if (!langs.length) {
      return UI.emptyState({
        small: true,
        variant: 'edit',
        icon: 'globe',
        title: 'Set up a language first',
        body: 'A language gives your words a home and a default reading direction.',
        actions: '<button type="button" class="btn btn--edit" data-act="add-lang">' +
          Icon('plus') + 'Add a language</button>'
      });
    }

    return '<div class="card language-list">' + langs.map(function (lang) {
      var dirLabel = lang.dir === 'rtl' ? 'Right to left' : (lang.dir === 'auto' ? 'Auto-detect' : 'Left to right');
      var code = lang.code ? '<span class="lang-code">' + esc(lang.code) + '</span>' : '';
      return '<div class="data-row">' +
        '<span class="preview-card__icon" aria-hidden="true">' + Icon('globe') + '</span>' +
        '<span class="data-row__text"><strong dir="auto">' + esc(lang.name) + '</strong>' +
          '<span>' + esc(dirLabel) + '</span></span>' +
        code +
        (lang.id === activeId
          ? '<span class="tag tag--edit">Active</span>'
          : '<button type="button" class="btn btn--sm" data-act="use-lang" data-id="' + esc(lang.id) + '">Use</button>') +
        '<button type="button" class="icon-btn icon-btn--plain" data-act="del-lang" data-id="' +
          esc(lang.id) + '" aria-label="Remove ' + esc(lang.name) + '">' + Icon('trash') + '</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  function addWordPanel(active, scopedCategoryId) {
    if (!active) { return ''; }
    return '<section class="editor-card card" aria-labelledby="add-word-title">' +
      '<div class="editor-card__head"><span class="editor-card__icon">' + Icon('plus') + '</span><div>' +
        '<span class="eyebrow">One at a time</span><h2 id="add-word-title">Add a word</h2>' +
        '<p>Type it the way you say it. The native script is welcome but optional.</p></div></div>' +
      '<form id="word-form" class="word-form" autocomplete="off">' +
        '<label class="field"><span class="field__label">Word (transliterated)</span>' +
          '<input class="field__input word-input" name="term" dir="auto" maxlength="200" ' +
          'placeholder="e.g. marhaba" data-autofocus>' +
          '<span class="field__hint">However you spell it in English letters.</span></label>' +
        '<label class="field"><span class="field__label">Native script <span class="optional">Optional</span></span>' +
          '<input class="field__input word-input" name="nativeScript" dir="auto" maxlength="200" ' +
          'placeholder="e.g. مرحبا"></label>' +
        '<label class="field"><span class="field__label">Meaning</span>' +
          '<input class="field__input word-input" name="meaning" dir="auto" required maxlength="300" ' +
          'placeholder="e.g. hello"></label>' +
        '<label class="field"><span class="field__label">Category</span>' +
          '<select class="field__select" name="categoryId" required>' + categoryOptions(scopedCategoryId || '', '') + '</select></label>' +
        '<label class="field"><span class="field__label">Text direction</span>' +
          '<select class="field__select" name="dir">' + directionOptions(active.dir || 'auto') + '</select>' +
          '<span class="field__hint">Guides the native script and example. Auto handles mixed scripts.</span></label>' +
        '<label class="field word-form__wide"><span class="field__label">Example sentence <span class="optional">Optional</span></span>' +
          '<textarea class="field__textarea field__textarea--short word-input" name="example" dir="auto" maxlength="1000" ' +
          'placeholder="Use this word in a sentence…"></textarea></label>' +
        '<div class="word-form__wide form-submit"><span class="form-submit__note">' + saveNote() + '</span>' +
          '<button type="submit" class="btn btn--edit">' + Icon('plus') + 'Save word</button></div>' +
      '</form></section>';
  }

  function bulkPanel(active, scopedCategoryId) {
    if (!active) { return ''; }
    return '<section class="editor-card card" aria-labelledby="bulk-title">' +
      '<div class="editor-card__head"><span class="editor-card__icon">' + Icon('inbox') + '</span><div>' +
        '<span class="eyebrow">Many at once</span><h2 id="bulk-title">Bulk add</h2>' +
        '<p>One word per line: <code>word - meaning</code> or <code>word | native | meaning | example</code>. ' +
        'Tabs work too — paste straight from Anki or Quizlet.</p></div></div>' +
      '<div class="bulk-form">' +
        '<label class="field bulk-form__paste"><span class="field__label">Paste your list</span>' +
          '<textarea id="bulk-text" class="field__textarea word-input" dir="auto" ' +
          'placeholder="bonjour - hello\nhola | hola | hello | ¡Hola, amigo!\nmerci\tthank you"></textarea>' +
          '<span class="field__hint">2 columns (word - meaning) or 4 columns (word | native | meaning | example). ' +
          'Duplicates are flagged before anything is added.</span></label>' +
        '<label class="field"><span class="field__label">Category for this batch</span>' +
          '<select id="bulk-category" class="field__select">' + categoryOptions(scopedCategoryId || '', '') + '</select></label>' +
        '<label class="field"><span class="field__label">Text direction</span>' +
          '<select id="bulk-dir" class="field__select">' + directionOptions(active.dir || 'auto') + '</select></label>' +
        '<div class="bulk-form__actions">' +
          '<button type="button" class="btn bulk-form__preview" data-act="preview-bulk">Preview words</button>' +
          '<button type="button" class="btn btn--sm" data-act="import-csv">' + Icon('upload') + 'CSV file</button>' +
          '<button type="button" class="btn btn--sm" data-act="import-tsv">' + Icon('upload') + 'Anki / Quizlet</button>' +
        '</div>' +
      '</div><div id="bulk-preview" aria-live="polite"></div>' +
      '<input type="file" id="bulk-csv-file" accept=".csv,text/csv" class="sr-only">' +
      '<input type="file" id="bulk-tsv-file" accept=".tsv,.txt,text/tab-separated-values" class="sr-only"></section>';
  }

  function wordRow(word) {
    var cat = Categories.get(word.categoryId);
    var lang = Store.activeLanguage();
    var dir = WordDisplay.dirOf(word, lang);
    var name = entryName(word);
    var native = WordDisplay.secondary(word);
    var dark = document.documentElement.dataset.theme === 'dark';
    var catStyle = cat ? Categories.styleVars(cat, dark) : '';
    return '<article class="word-row" data-word-id="' + esc(word.id) + '">' +
      '<div class="word-row__main"><strong class="word-row__term" dir="auto">' + esc(name) + '</strong>' +
        (native ? '<span class="word-row__native" dir="' + dir + '">' + esc(native) + '</span>' : '') +
        '<span class="word-row__meaning" dir="auto">' + esc(word.meaning) + '</span>' +
        (word.example ? '<span class="word-row__example" dir="' + dir + '">“' + esc(word.example) + '”</span>' : '') +
      '</div><div class="word-row__meta"><span class="tag tag--cat" style="' + catStyle + '">' + esc(cat ? cat.name : 'Unknown') + '</span>' +
        '<span class="direction-badge" title="Text direction">' + dir.toUpperCase() + '</span></div>' +
      '<div class="word-row__actions">' +
        '<button type="button" class="icon-btn icon-btn--plain" data-act="edit-word" data-id="' + esc(word.id) +
          '" aria-label="Edit ' + esc(name) + '">' + Icon('edit') + '</button>' +
        '<button type="button" class="icon-btn icon-btn--plain word-row__delete" data-act="delete-word" data-id="' + esc(word.id) +
          '" aria-label="Delete ' + esc(name) + '">' + Icon('trash') + '</button></div></article>';
  }

  function wordLibrary(active) {
    if (!active) { return ''; }
    var words = Store.words({ query: viewState.query, categoryId: viewState.categoryId });
    words.sort(function (a, b) { return String(b.dateAdded).localeCompare(String(a.dateAdded)); });
    var allCount = Store.words().length;
    var empty = allCount === 0;
    var content;
    if (empty) {
      content = UI.emptyState({
        small: true, variant: 'edit', icon: 'inbox', title: 'Your word list is empty',
        body: 'Use the form above to add your first word. It will appear here right away.'
      });
    } else if (!words.length) {
      content = '<div class="list-empty">' + Icon('search') + '<strong>No matching words</strong>' +
        '<p>Try another search or category.</p><button type="button" class="btn btn--sm" data-act="clear-filters">Clear filters</button></div>';
    } else {
      content = '<div class="word-list">' + words.map(wordRow).join('') + '</div>';
    }

    return '<section class="library" aria-labelledby="library-title"><div class="section-head library__head"><div>' +
      '<span class="eyebrow">Your collection</span><h2 id="library-title">' + allCount + ' ' + UI.plural(allCount, 'word') + '</h2>' +
      '<p>Search, filter, edit, or carefully remove entries.</p></div></div>' +
      '<div class="library-tools">' +
        '<label class="search-box"><span aria-hidden="true">' + Icon('search') + '</span>' +
          '<span class="sr-only">Search words</span><input id="word-search" type="search" value="' + esc(viewState.query) +
          '" placeholder="Search words or meanings…" autocomplete="off"></label>' +
        '<label class="filter-box"><span class="sr-only">Filter by category</span>' +
          '<select id="word-filter" class="field__select">' + categoryOptions(viewState.categoryId, 'All categories') + '</select></label>' +
      '</div><div id="word-results">' + content + '</div></section>';
  }

  function backupPanel(totals) {
    var backupCopy = cloudOn()
      ? 'Your private account is synced. You can also export a portable JSON copy.'
      : 'Guest data lives only in this browser. Export JSON regularly to keep a copy.';
    return '<section class="backup-section"><header class="page-head"><span class="eyebrow">Your data</span>' +
      '<h2>Backup &amp; portability</h2><p>' + backupCopy + '</p></header>' +
      '<div class="card"><div class="data-row"><span class="preview-card__icon">' + Icon('download') + '</span>' +
        '<span class="data-row__text"><strong>Export JSON</strong><span>' + totals.words + ' ' + UI.plural(totals.words, 'word') +
        ' · ' + UI.fmtBytes(Store.storageBytes()) + ' stored</span></span>' +
        '<button type="button" class="btn btn--sm" data-act="export">Export</button></div>' +
      '<div class="data-row"><span class="preview-card__icon">' + Icon('upload') + '</span>' +
        '<span class="data-row__text"><strong>Import a backup</strong><span>Merge or replace this browser’s data</span></span>' +
        '<button type="button" class="btn btn--sm" data-act="import">Import</button></div>' +
      '<div class="data-row data-row--danger"><span class="preview-card__icon">' + Icon('warning') + '</span>' +
        '<span class="data-row__text"><strong>Erase everything</strong><span>Deletes languages, words, and progress</span></span>' +
        '<button type="button" class="btn btn--sm btn--danger" data-act="reset">Erase</button></div></div></section>' +
      '<input type="file" id="import-file" accept="application/json,.json" class="sr-only">';
  }

  function render(root, params) {
    params = params || {};
    var scopedCategory = Categories.get(params.categoryId);
    if (params.categoryId && !scopedCategory) { Router.go('/manage', true); return; }
    if (scopedCategory) { viewState.categoryId = scopedCategory.id; }
    var langs = Store.languages();
    var active = Store.activeLanguage();
    var totals = Store.totals();
    var scopeNotice = scopedCategory
      ? '<div class="manage-scope"><a href="#/category/' + scopedCategory.id + '" class="btn btn--ghost btn--sm">' +
          '<span class="flip-rtl">' + Icon('back') + '</span>Back to ' + esc(scopedCategory.name) + '</a>' +
          '<span>Editing <strong>' + esc(scopedCategory.name) + '</strong></span></div>'
      : '';
    var accountNotice = cloudOn()
      ? '<div class="manage-banner"><span class="manage-callout__icon">' + Icon('shield') + '</span><div><strong>Private cloud sync is on</strong><p>Only your signed-in account can access these words.</p></div></div>'
      : '<div class="manage-banner"><span class="manage-callout__icon">' + Icon('shield') + '</span><div><strong>Guest mode — export often</strong><p>Words stay on this device and are not backed up. <button type="button" class="link-button" data-act="account">Sign in or create an account</button>.</p></div><button type="button" class="btn btn--sm btn--edit" data-act="account">Sign in to sync</button></div>';
    var html = accountNotice + scopeNotice +
      '<header class="manage-title"><span class="eyebrow">Manage Words</span><h1>Build your personal dictionary.</h1>' +
      '<p>Add only the words that matter to you, in any script and at your own pace.</p></header>' +
      '<section class="language-section"><div class="section-head"><div><h2>Language</h2>' +
        '<p>' + (active ? 'Adding words to ' + esc(active.name) + '.' : 'Choose where these words belong.') + '</p></div>' +
        (langs.length ? '<button type="button" class="btn btn--sm" data-act="add-lang">' + Icon('plus') + 'Add language</button>' : '') +
      '</div>' + languageRows(langs, active && active.id) + '</section>' +
      (active ? '<div class="editor-grid">' + addWordPanel(active, scopedCategory && scopedCategory.id) +
        bulkPanel(active, scopedCategory && scopedCategory.id) + '</div>' + wordLibrary(active) : '') +
      backupPanel(totals);
    root.innerHTML = html;
    bind(root);
  }

  function formData(form) {
    var fd = new FormData(form);
    return {
      languageId: Store.settings.activeLanguageId,
      term: String(fd.get('term') || '').trim(),
      nativeScript: String(fd.get('nativeScript') || '').trim(),
      meaning: String(fd.get('meaning') || '').trim(),
      categoryId: String(fd.get('categoryId') || ''),
      example: String(fd.get('example') || '').trim(),
      dir: String(fd.get('dir') || 'auto')
    };
  }

  function entryName(word) {
    return WordDisplay.primary(word);
  }

  function stripTags(value) {
    return String(value == null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function parseBulkLine(value, lineNo) {
    var raw = value;
    value = String(value || '').trim();
    if (!value) { return null; }
    var term = '', native = '', meaning = '', example = '';
    if (value.indexOf('|') !== -1) {
      var pipe = value.split('|').map(function (s) { return s.trim(); });
      if (pipe.length > 4) {
        return { line: lineNo, raw: raw.trim(), error: 'Use word | native | meaning | example (2–4 parts).' };
      }
      if (pipe.length === 4) { term = pipe[0]; native = pipe[1]; meaning = pipe[2]; example = pipe[3]; }
      else if (pipe.length === 3) { term = pipe[0]; native = pipe[1]; meaning = pipe[2]; }
      else { term = pipe[0]; meaning = pipe[1]; }
    } else if (value.indexOf('\t') !== -1) {
      // Tab-separated: Anki / Quizlet paste. Extra Anki columns are ignored.
      var tabs = value.split('\t').map(function (s) { return stripTags(s).trim(); });
      if (tabs.length >= 4) { term = tabs[0]; native = tabs[1]; meaning = tabs[2]; example = tabs.slice(3).join(' '); }
      else if (tabs.length === 3) { term = tabs[0]; native = tabs[1]; meaning = tabs[2]; }
      else if (tabs.length === 2) { term = stripTags(tabs[0]); meaning = stripTags(tabs[1]); }
      else { return { line: lineNo, raw: raw.trim(), error: 'Add a separator between word and meaning.' }; }
    } else {
      var parts = value.split(/\s+(?:—|–|-)\s+/);
      if (parts.length < 2) { return { line: lineNo, raw: value, error: 'Add a separator: word - meaning, or word | native | meaning | example.' }; }
      term = parts.shift().trim();
      meaning = parts.join(' - ').trim();
    }
    term = stripTags(term); native = stripTags(native);
    meaning = stripTags(meaning); example = stripTags(example);
    if (!meaning) { return { line: lineNo, raw: value, error: 'Both word and meaning are required.' }; }
    if (!term && !native) { return { line: lineNo, raw: value, error: 'Type the word — transliterated or in its native script.' }; }
    return { line: lineNo, term: term, nativeScript: native, meaning: meaning, example: example };
  }

  function parseBulk(text) {
    return String(text || '').split(/\r?\n/).map(function (line, index) {
      return parseBulkLine(line, index + 1);
    }).filter(Boolean);
  }

  /** Minimal RFC-4180 CSV reader: quotes, escaped quotes, commas, newlines. */
  function parseCSV(text) {
    var rows = [], row = [], cell = '', inQuotes = false, i = 0;
    text = String(text || '').replace(/^\uFEFF/, '');
    while (i < text.length) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        cell += ch; i++; continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(cell); cell = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
      cell += ch; i++;
    }
    row.push(cell); rows.push(row);
    return rows.map(function (r) { return r.map(function (c) { return String(c).trim(); }); })
      .filter(function (r) { return r.some(function (c) { return c !== ''; }); });
  }

  function csvRowsToEntries(csvRows) {
    if (!csvRows.length) { return []; }
    var head = csvRows[0].map(function (c) { return c.toLocaleLowerCase(); });
    var hasHeader = head.indexOf('term') !== -1 || head.indexOf('meaning') !== -1;
    var idx = { term: -1, native: -1, meaning: -1, example: -1, category: -1, dir: -1 };
    var start = 0;
    if (hasHeader) {
      start = 1;
      head.forEach(function (h, i) {
        if (h === 'term') { idx.term = i; }
        else if (h === 'native' || h === 'native_script' || h === 'nativescript') { idx.native = i; }
        else if (h === 'meaning' || h === 'back' || h === 'translation') { idx.meaning = i; }
        else if (h === 'example' || h === 'sentence') { idx.example = i; }
        else if (h === 'category' || h === 'category_id' || h === 'deck') { idx.category = i; }
        else if (h === 'direction' || h === 'dir') { idx.dir = i; }
        else if (h === 'front' || h === 'word') { if (idx.term === -1) { idx.term = i; } }
      });
      if (idx.term === -1 && csvRows[0].length >= 2) { idx.term = 0; idx.meaning = 1; }
    }
    var out = [];
    for (var r = start; r < csvRows.length; r++) {
      var cells = csvRows[r];
      var entry;
      if (hasHeader) {
        entry = {
          line: r + 1,
          term: idx.term >= 0 ? stripTags(cells[idx.term] || '') : '',
          nativeScript: idx.native >= 0 ? stripTags(cells[idx.native] || '') : '',
          meaning: idx.meaning >= 0 ? stripTags(cells[idx.meaning] || '') : '',
          example: idx.example >= 0 ? stripTags(cells[idx.example] || '') : '',
          categoryId: idx.category >= 0 ? String(cells[idx.category] || '').trim() : '',
          dir: idx.dir >= 0 ? String(cells[idx.dir] || '').trim() : ''
        };
      } else if (cells.length >= 4) {
        entry = { line: r + 1, term: stripTags(cells[0]), nativeScript: stripTags(cells[1]), meaning: stripTags(cells[2]), example: stripTags(cells.slice(3, 4).join(' ')) };
        if (cells[4] && Categories.exists(String(cells[4]).trim())) { entry.categoryId = String(cells[4]).trim(); }
      } else if (cells.length === 3) {
        entry = { line: r + 1, term: stripTags(cells[0]), nativeScript: stripTags(cells[1]), meaning: stripTags(cells[2]), example: '' };
      } else if (cells.length === 2) {
        entry = { line: r + 1, term: stripTags(cells[0]), nativeScript: '', meaning: stripTags(cells[1]), example: '' };
      } else {
        entry = { line: r + 1, raw: cells.join(','), error: 'Need at least word, meaning.' };
        out.push(entry); continue;
      }
      if (!entry.meaning || (!entry.term && !entry.nativeScript)) {
        out.push({ line: entry.line, raw: cells.join(' , '), error: 'Both word and meaning are required.' });
      } else { out.push(entry); }
    }
    return out;
  }

  function markDuplicates(rows, languageId) {
    var seen = {};
    var langId = languageId || (Store.settings && Store.settings.activeLanguageId) || '';
    return rows.map(function (row) {
      if (!row || row.error) { return row; }
      var key = String(row.term || '').trim().toLocaleLowerCase() + 'ￜ' +
        String(row.nativeScript || '').trim().toLocaleLowerCase();
      if (seen[key]) {
        row.duplicate = seen[key].label; row.dupOf = null; row.dupInBatch = true;
        return row;
      }
      var existing = null;
      try { existing = Store.findDuplicate(row, langId); } catch (e) { existing = null; }
      if (existing) {
        row.duplicate = WordDisplay.primary(existing) + ' → ' + existing.meaning;
        row.dupOf = existing.id;
      }
      seen[key] = { label: (row.term || row.nativeScript) + ' (this import)' };
      return row;
    });
  }

  function renderBulkPreview(root, rows, sourceLabel) {
    var target = UI.$('#bulk-preview', root);
    var categoryId = UI.$('#bulk-category', root).value;
    if (!rows.length) {
      target.innerHTML = '<p class="form-error">Nothing to import' +
        (sourceLabel ? ' from ' + esc(sourceLabel) : '') + '.</p>';
      return;
    }
    viewState.bulkRows = rows;
    var valid = rows.filter(function (row) { return !row.error && !row.duplicate; });
    var dups = rows.filter(function (row) { return !row.error && row.duplicate; });
    var invalid = rows.filter(function (row) { return row.error; });
    var status = '<strong>' + valid.length + ' ready to add</strong>' +
      (dups.length ? '<span> · ' + dups.length + ' duplicate' + (dups.length === 1 ? '' : 's') + ' skipped</span>' : '') +
      (invalid.length ? '<span> · ' + invalid.length + ' need attention</span>' : '') +
      (!dups.length && !invalid.length ? '<span> · Everything looks good</span>' : '');
    target.innerHTML = '<div class="bulk-preview"><div class="bulk-preview__head"><div>' + status + '</div>' +
      (valid.length ? '<button type="button" class="btn btn--edit btn--sm" data-act="confirm-bulk">' + Icon('check') +
        'Add ' + valid.length + ' ' + UI.plural(valid.length, 'word') + '</button>' : '') + '</div>' +
      '<div class="bulk-preview__cols" aria-hidden="true"><span>#</span><span>Word</span><span>Meaning</span></div>' +
      '<div class="bulk-preview__rows">' + rows.map(function (row) {
        if (row.error) {
          return '<div class="bulk-preview__row bulk-preview__row--error"><span>Line ' + row.line + '</span><strong dir="auto">' +
            esc(row.raw) + '</strong><small>' + esc(row.error) + '</small></div>';
        }
        if (row.duplicate) {
          return '<div class="bulk-preview__row bulk-preview__row--dup"><span>' + row.line + '</span>' +
            '<strong dir="auto">' + esc(row.term || row.nativeScript) +
            (row.nativeScript && row.term ? '<small dir="auto"> · ' + esc(row.nativeScript) + '</small>' : '') + '</strong>' +
            '<span dir="auto">' + esc(row.meaning) + '<small>Duplicate: ' + esc(row.duplicate) + '<span class="dup-pill">dup</span></small></span></div>';
        }
        return '<div class="bulk-preview__row"><span>' + row.line + '</span>' +
          '<strong dir="auto">' + esc(row.term || row.nativeScript) +
          (row.nativeScript && row.term ? '<br><small dir="auto">' + esc(row.nativeScript) + '</small>' : '') + '</strong>' +
          '<span dir="auto">' + esc(row.meaning) +
          (row.example ? '<br><small dir="auto">“' + esc(row.example) + '”</small>' : '') + '</span></div>';
      }).join('') + '</div>' +
      (categoryId ? '' : '<p class="form-error">Choose a category for this batch first — it applies to every row.</p>') +
      '</div>';
  }

  function showBulkPreview(root) {
    var text = UI.$('#bulk-text', root).value;
    var categoryId = UI.$('#bulk-category', root).value;
    var target = UI.$('#bulk-preview', root);
    if (!text.trim()) {
      target.innerHTML = '<p class="form-error">Paste at least one line to preview.</p>';
      return;
    }
    if (!categoryId) {
      target.innerHTML = '<p class="form-error">Choose a category for this batch.</p>';
      return;
    }
    var rows = markDuplicates(parseBulk(text));
    renderBulkPreview(root, rows);
  }

  function previewFileRows(root, rows, sourceLabel) {
    var categoryId = UI.$('#bulk-category', root).value;
    if (!categoryId) {
      UI.$('#bulk-preview', root).innerHTML = '<p class="form-error">Choose a category for this batch first.</p>';
      return;
    }
    renderBulkPreview(root, markDuplicates(rows), sourceLabel);
  }

  function openEdit(word) {
    var active = Store.activeLanguage();
    UI.modal({
      title: 'Edit word',
      description: 'Update this entry. Learning history and date added will be kept.',
      body: '<form id="edit-word-form" class="stack" autocomplete="off">' +
        '<label class="field"><span class="field__label">Word (transliterated)</span><input class="field__input" name="term" dir="auto" ' +
          'maxlength="200" value="' + esc(word.term) + '" data-autofocus></label>' +
        '<label class="field"><span class="field__label">Native script <span class="optional">Optional</span></span>' +
          '<input class="field__input" name="nativeScript" dir="auto" maxlength="200" value="' + esc(word.nativeScript || '') + '"></label>' +
        '<label class="field"><span class="field__label">Meaning</span><input class="field__input" name="meaning" dir="auto" ' +
          'required maxlength="300" value="' + esc(word.meaning) + '"></label>' +
        '<label class="field"><span class="field__label">Category</span><select class="field__select" name="categoryId">' +
          categoryOptions(word.categoryId, '') + '</select></label>' +
        '<label class="field"><span class="field__label">Text direction</span><select class="field__select" name="dir">' +
          directionOptions(word.dir || (active && active.dir) || 'auto') + '</select></label>' +
        '<label class="field"><span class="field__label">Example sentence <span class="optional">Optional</span></span>' +
          '<textarea class="field__textarea field__textarea--short" name="example" dir="auto" maxlength="1000">' +
          esc(word.example || '') + '</textarea></label>' +
        '<div class="modal__actions"><button type="button" class="btn" data-act="cancel">Cancel</button>' +
          '<button type="submit" class="btn btn--edit">Save changes</button></div></form>',
      onMount: function (panel, close) {
        UI.$('[data-act="cancel"]', panel).addEventListener('click', close);
        UI.$('#edit-word-form', panel).addEventListener('submit', function (event) {
          event.preventDefault();
          try {
            Store.updateWord(word.id, formData(event.target));
            close();
            UI.toast('Word updated');
          } catch (err) { UI.toast(err.message, { icon: 'warning' }); }
        });
      }
    });
  }

  function confirmDuplicateThenAdd(data, done) {
    var dup = null;
    try { dup = Store.findDuplicate(data, data.languageId); } catch (e) { dup = null; }
    if (!dup) {
      try { done(Store.addWord(data)); } catch (err) { UI.toast(err.message, { icon: 'warning' }); }
      return;
    }
    UI.confirm({
      title: 'Already have “' + entryName(dup) + '”?',
      description: dup.meaning + ' — adding again creates a second card with the same spelling.',
      confirmText: 'Add anyway'
    }, function () {
      try { done(Store.addWord(data)); } catch (err) { UI.toast(err.message, { icon: 'warning' }); }
    });
  }

  function bind(root) {
    var wordForm = UI.$('#word-form', root);
    if (wordForm) {
      wordForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var data = formData(wordForm);
        confirmDuplicateThenAdd(data, function (word) {
          if (word) { UI.toast(entryName(word) + ' added'); }
        });
      });
    }

    var search = UI.$('#word-search', root);
    if (search) {
      search.addEventListener('input', function () {
        viewState.query = search.value;
        updateResults(root);
      });
    }
    var filter = UI.$('#word-filter', root);
    if (filter) {
      filter.addEventListener('change', function () {
        viewState.categoryId = filter.value;
        updateResults(root);
      });
    }

    root.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-act]');
      if (!btn) { return; }
      var act = btn.dataset.act;
      if (act === 'account') { CloudSync.openAccount(); }
      if (act === 'add-lang') { global.App.openLanguageSheet(); }
      if (act === 'use-lang') { Store.setActiveLanguage(btn.dataset.id); UI.toast('Active language switched'); }
      if (act === 'preview-bulk') { showBulkPreview(root); }
      if (act === 'import-csv') { UI.$('#bulk-csv-file', root).click(); }
      if (act === 'import-tsv') { UI.$('#bulk-tsv-file', root).click(); }
      if (act === 'confirm-bulk') {
        var categoryId = UI.$('#bulk-category', root).value;
        var dir = UI.$('#bulk-dir', root).value;
        if (!categoryId) { UI.toast('Choose a category for this batch', { icon: 'warning' }); return; }
        var valid = viewState.bulkRows.filter(function (row) { return !row.error && !row.duplicate; });
        var skipped = viewState.bulkRows.length - valid.length;
        if (!valid.length) { UI.toast('Nothing new to add — all rows are duplicates or errors', { icon: 'warning' }); return; }
        try {
          Store.addWords(valid.map(function (row) {
            var cat = row.categoryId && Categories.exists(row.categoryId) ? row.categoryId : categoryId;
            var rowDir = row.dir === 'ltr' || row.dir === 'rtl' || row.dir === 'auto' ? row.dir : dir;
            return {
              languageId: Store.settings.activeLanguageId,
              categoryId: cat,
              term: row.term || '',
              nativeScript: row.nativeScript || '',
              meaning: row.meaning || '',
              example: row.example || '',
              dir: rowDir
            };
          }));
          viewState.bulkRows = [];
          var paste = UI.$('#bulk-text', root);
          if (paste) { paste.value = ''; }
          UI.toast(valid.length + ' ' + UI.plural(valid.length, 'word') + ' added' +
            (skipped ? ' · ' + skipped + ' skipped' : ''));
        } catch (err) { UI.toast(err.message, { icon: 'warning' }); }
      }
      if (act === 'edit-word') { var editWord = Store.getWord(btn.dataset.id); if (editWord) { openEdit(editWord); } }
      if (act === 'delete-word') {
        var word = Store.getWord(btn.dataset.id);
        if (!word) { return; }
        UI.confirm({
          title: 'Delete “' + entryName(word) + '”?',
          description: 'This removes the word and its future learning history. This cannot be undone.',
          confirmText: 'Delete word', danger: true
        }, function () { Store.deleteWord(word.id); UI.toast('Word deleted', { icon: 'trash' }); });
      }
      if (act === 'del-lang') { removeLanguage(btn.dataset.id); }
      if (act === 'clear-filters') {
        viewState.query = ''; viewState.categoryId = '';
        UI.$('#word-search', root).value = ''; UI.$('#word-filter', root).value = '';
        updateResults(root);
      }
      if (act === 'export') { exportBackup(); }
      if (act === 'import') { UI.$('#import-file', root).click(); }
      if (act === 'reset') { resetAll(); }
    });

    var file = UI.$('#import-file', root);
    file.addEventListener('change', function () {
      var selected = file.files && file.files[0];
      if (!selected) { return; }
      var reader = new FileReader();
      reader.onload = function () { chooseImportMode(String(reader.result)); };
      reader.onerror = function () { UI.toast('That file could not be read', { icon: 'warning' }); };
      reader.readAsText(selected);
      file.value = '';
    });

    var csvFile = UI.$('#bulk-csv-file', root);
    if (csvFile) {
      csvFile.addEventListener('change', function () {
        var selected = csvFile.files && csvFile.files[0];
        if (!selected) { return; }
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var entries = csvRowsToEntries(parseCSV(String(reader.result)));
            previewFileRows(root, entries, selected.name);
            UI.toast(entries.length + ' rows read from CSV');
          } catch (err) { UI.toast('That CSV could not be read', { icon: 'warning' }); }
        };
        reader.onerror = function () { UI.toast('That file could not be read', { icon: 'warning' }); };
        reader.readAsText(selected);
        csvFile.value = '';
      });
    }

    var tsvFile = UI.$('#bulk-tsv-file', root);
    if (tsvFile) {
      tsvFile.addEventListener('change', function () {
        var selected = tsvFile.files && tsvFile.files[0];
        if (!selected) { return; }
        var reader = new FileReader();
        reader.onload = function () {
          var entries = parseBulk(String(reader.result));
          if (!entries.length) {
            UI.$('#bulk-preview', root).innerHTML =
              '<p class="form-error">No tab-separated rows found in ' + esc(selected.name) + '.</p>';
            return;
          }
          previewFileRows(root, entries, selected.name);
          UI.toast(entries.length + ' rows read — check native spellings before adding');
        };
        reader.onerror = function () { UI.toast('That file could not be read', { icon: 'warning' }); };
        reader.readAsText(selected);
        tsvFile.value = '';
      });
    }
  }

  function updateResults(root) {
    var result = UI.$('#word-results', root);
    if (!result) { return; }
    var active = Store.activeLanguage();
    var shell = document.createElement('div');
    shell.innerHTML = wordLibrary(active);
    var fresh = UI.$('#word-results', shell);
    result.innerHTML = fresh ? fresh.innerHTML : '';
    var count = UI.$('#library-title', root);
    if (count) {
      var total = Store.words().length;
      count.textContent = total + ' ' + UI.plural(total, 'word');
    }
  }

  function removeLanguage(id) {
    var lang = Store.languages().filter(function (item) { return item.id === id; })[0];
    if (!lang) { return; }
    UI.confirm({
      title: 'Remove ' + lang.name + '?',
      description: 'Every word saved under this language is removed too. Export a backup first if you are unsure.',
      confirmText: 'Remove language', danger: true
    }, function () { Store.removeLanguage(lang.id); UI.toast('Language removed', { icon: 'trash' }); });
  }

  function resetAll() {
    UI.confirm({
      title: 'Erase all Lexio data?',
      description: cloudOn()
        ? 'Every language, word, and progress record in your account is permanently deleted.'
        : 'Every language, word, and progress record on this device is permanently deleted. There is no server copy.',
      confirmText: 'Erase everything', danger: true
    }, function () { Store.resetAll(); UI.toast('All data erased', { icon: 'trash' }); });
  }

  function exportBackup() {
    var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = Store.exportFilename();
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    UI.toast('Backup downloaded', { icon: 'download' });
  }

  function chooseImportMode(text) {
    UI.modal({
      title: 'Import backup',
      description: 'Choose whether to keep your current data or restore only what is in this file.',
      body: '<div class="option-list"><button type="button" class="option" data-mode="merge"><span class="grow">' +
        '<span class="option__title">Merge</span><br><span class="option__sub">Keep current data and add anything new</span></span></button>' +
        '<button type="button" class="option" data-mode="replace"><span class="grow"><span class="option__title">Replace</span><br>' +
        '<span class="option__sub">Discard current data and restore this file</span></span></button></div>' +
        '<div class="modal__actions"><button type="button" class="btn" data-act="cancel">Cancel</button></div>',
      onMount: function (panel, close) {
        UI.$('[data-act="cancel"]', panel).addEventListener('click', close);
        UI.$$('[data-mode]', panel).forEach(function (button) {
          button.addEventListener('click', function () {
            try {
              var result = Store.importJSON(text, button.dataset.mode);
              close();
              UI.toast('Imported ' + result.words + ' ' + UI.plural(result.words, 'word'));
            } catch (err) { UI.toast('That file is not a valid Lexio backup', { icon: 'warning', duration: 4000 }); }
          });
        });
      }
    });
  }

  global.Views = global.Views || {};
  global.Views.manage = render;
  // Exposed for the test harness / debugging; not part of the UI contract.
  global.LexioBulk = {
    parseBulk: parseBulk,
    parseBulkLine: parseBulkLine,
    parseCSV: parseCSV,
    csvRowsToEntries: csvRowsToEntries,
    markDuplicates: markDuplicates
  };
})(window);
