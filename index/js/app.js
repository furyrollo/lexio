/* ==========================================================================
   App bootstrap — navigation, theme, language sheet, live re-render on
   store changes.
   ========================================================================== */
(function (global) {
  'use strict';

  var esc = UI.esc;

  var NAV = [
    { id: 'home',   path: '/home',   label: 'Home',   icon: 'home_nav' },
    { id: 'learn',  path: '/learn',  label: 'Learn',  icon: 'learn' },
    { id: 'review', path: '/review', label: 'Review', icon: 'review' },
    { id: 'notebook', path: '/notebook', label: 'Notebook',
      fullLabel: 'Notebook', icon: 'notebook', separate: true },
    { id: 'manage', path: '/manage', label: 'Manage', fullLabel: 'Manage Words',
      icon: 'manage', separate: true }
  ];

  /* ---- Routes ------------------------------------------------------------ */
  function registerRoutes() {
    Router.register('/home', Views.home, { section: 'home', title: 'Home' });
    Router.register('/category/:id', Views.category, { section: 'home', title: 'Category' });
    Router.register('/learn', Views.learn, { section: 'learn', title: 'Learn' });
    Router.register('/learn/play/:mode', Views.learnPlay, { section: 'learn', title: 'Session' });
    Router.register('/learn/play/:mode/category/:categoryId', Views.learnPlay, { section: 'learn', title: 'Session' });
    Router.register('/review', Views.review, { section: 'review', title: 'Review' });
    Router.register('/notebook/:id', Views.notebook,
      { section: 'notebook', mode: 'notebook', title: 'Notebook' });
    Router.register('/notebook', Views.notebook,
      { section: 'notebook', mode: 'notebook', title: 'Notebook' });
    Router.register('/account', Views.account, { section: 'account', title: 'My Account' });
    Router.register('/manage/category/:categoryId', Views.manage, { section: 'manage', mode: 'manage', title: 'Manage Words' });
    Router.register('/manage', Views.manage, { section: 'manage', mode: 'manage', title: 'Manage Words' });
  }

  /* ---- Navigation -------------------------------------------------------- */
  function buildNav() {
    var tabbar = document.getElementById('tabbar');
    var sidenav = document.getElementById('sidebar-nav');

    tabbar.innerHTML = '<span class="tabbar__indicator" aria-hidden="true"></span>' + NAV.map(function (n) {
      return '<a class="tab' + (n.separate ? ' tab--manage' : '') + '" href="#' + n.path + '" ' +
             'data-nav="' + n.id + '">' + Icon(n.icon) +
             '<span>' + esc(n.label) + '</span></a>';
    }).join('');

    var foot = document.querySelector('.sidebar__foot .storage-note');
    if (foot && !foot.dataset.atelier) {
      foot.dataset.atelier = '1';
      foot.addEventListener('click', function (e) {
        var signBtn = e.target.closest('[data-act="signin"]');
        if (signBtn) {
          try { CloudSync.openSignIn(); } catch (err) { Router.go('/account'); }
        }
      });
    }
    syncStorageCard();

    sidenav.innerHTML = NAV.map(function (n) {
      return (n.separate ? '<div class="nav-sep" role="presentation"></div>' : '') +
        '<a class="nav-link' + (n.separate ? ' nav-link--manage' : '') + '" href="#' + n.path + '" ' +
        'data-nav="' + n.id + '">' + Icon(n.icon) +
        '<span>' + esc(n.fullLabel || n.label) + '</span>' +
        (n.id === 'home' ? '<span class="nav-link__count" id="nav-word-count"></span>' : '') +
        '</a>';
    }).join('');
  }

  function syncStorageCard() {
    var foot = document.querySelector('.sidebar__foot .storage-note');
    if (!foot || !foot.dataset.atelier) { return; }
    var signed = false;
    try { signed = CloudSync && CloudSync.isAuthenticated && CloudSync.isAuthenticated(); } catch (e) {}
    foot.innerHTML =
      '<div class="storage-note__head"><span class="storage-note__icon">' + Icon(signed ? 'cloud_check' : 'shield') + '</span>' +
      '<span>' + (signed ? 'Synced · Cloud backup on' : 'Guest mode') + '</span>' +
      (signed ? '<span class="storage-note__dot" aria-hidden="true"></span>' : '') + '</div>' +
      '<p>' + (signed ? 'Your words are backed up to your account.' : 'Words stay on this device.') + '</p>' +
      (signed ? '' : '<button type="button" class="btn btn--soft btn--sm" data-act="signin">Sign in to sync</button>');
  }

  function syncNav() {
    var section = Router.section();
    UI.$$('[data-nav]').forEach(function (el) {
      if (el.dataset.nav === section) { el.setAttribute('aria-current', 'page'); }
      else { el.removeAttribute('aria-current'); }
    });

    // Sliding pill indicator on the mobile dock (physical math, RTL-aware)
    try {
      var tabbar = document.getElementById('tabbar');
      var ind = tabbar && tabbar.querySelector('.tabbar__indicator');
      var active = tabbar && tabbar.querySelector('.tab[aria-current="page"]');
      if (tabbar && ind && active) {
        var w = active.offsetWidth;
        ind.style.inlineSize = w + 'px';
        var dx;
        if (document.documentElement.dir === 'rtl') {
          var barW = tabbar.offsetWidth;
          var baseLeft = barW - 6 - w;
          dx = active.offsetLeft - baseLeft;
        } else {
          dx = active.offsetLeft - 6;
        }
        ind.style.transform = 'translateX(' + dx + 'px)';
        tabbar.classList.toggle('tabbar--manage-active', section === 'manage');
      }
    } catch (e) {}

    var count = document.getElementById('nav-word-count');
    if (count) {
      var t = Store.totals().words;
      count.textContent = t ? String(t) : '';
    }
    try { syncAccountButton(); } catch (e) {}
    try { syncStorageCard(); } catch (e) {}

    var title = document.getElementById('topbar-title');
    var current = Router.current;
    if (current && current.route.meta.section === 'home' && current.params.id) {
      var cat = Categories.get(current.params.id);
      title.textContent = cat ? cat.name : 'Lexio';
    } else if (current && current.route.meta.section !== 'home') {
      title.textContent = current.route.meta.title;
    } else {
      title.textContent = 'Lexio';
    }
  }

  /* ---- Theme ------------------------------------------------------------- */
  function applyTheme() {
    var pref = Store.settings.theme;
    var dark = pref === 'dark' ||
      (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';

    var btn = document.getElementById('theme-toggle');
    document.getElementById('theme-toggle-icon').innerHTML = Icon(dark ? 'sun' : 'moon');
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  function initTheme() {
    applyTheme();
    document.getElementById('theme-toggle').addEventListener('click', function () {
      var dark = document.documentElement.dataset.theme === 'dark';
      Store.setSetting('theme', dark ? 'light' : 'dark');
      var btn = document.getElementById('theme-toggle');
      btn.classList.remove('toggled');
      void btn.offsetWidth;
      btn.classList.add('toggled');
      applyTheme();
      Router.refresh();          // category tints are theme-aware
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (Store.settings.theme === 'system') { applyTheme(); Router.refresh(); }
    });
  }

  /* ---- Language chip & sheet --------------------------------------------- */
  function syncLanguageChip() {
    var lang = Store.activeLanguage();
    var chip = document.getElementById('lang-chip');
    if (!chip) { return; }
    var label = document.getElementById('lang-chip-label');
    if (lang) {
      var code = (lang.code || '').split(/[-_]/)[0] || lang.name.slice(0, 2);
      chip.innerHTML = '<span class="chip__code">' + esc(code.toUpperCase().slice(0, 6)) + '</span>' +
        '<span class="chip__label" id="lang-chip-label">' + esc(lang.name) + '</span>';
    } else {
      chip.innerHTML = '<span class="chip__icon" id="lang-chip-icon">' + Icon('globe') + '</span>' +
        '<span class="chip__label" id="lang-chip-label">Set language</span>';
    }
    chip.setAttribute('aria-label',
      lang ? 'Active language: ' + lang.name + '. Change it.' : 'Choose a language');
    syncAccountButton();
  }

  function syncAccountButton() {
    var btn = document.getElementById('account-button');
    if (!btn) { return; }
    var signed = false, initial = '', email = '';
    try {
      signed = CloudSync && CloudSync.isAuthenticated && CloudSync.isAuthenticated();
      if (signed) {
        var s = CloudSync.accountSummary();
        email = s.email || '';
        var src = s.displayName || email || 'L';
        initial = src.trim().charAt(0).toUpperCase() || 'L';
      }
    } catch (e) {}
    btn.classList.toggle('account-button--avatar', true);
    btn.classList.toggle('is-guest', !signed);
    btn.dataset.signedIn = signed ? 'true' : 'false';
    btn.innerHTML = signed
      ? '<span class="avatar-mini" aria-hidden="true">' + esc(initial) + '</span>' +
        '<span class="avatar-dot" aria-hidden="true"></span>' +
        '<span class="sr-only">Account: ' + esc(email) + '</span>'
      : '<span class="avatar-mini" aria-hidden="true">' + Icon('shield') + '</span>' +
        '<span class="chip__label" id="account-label">Sign in</span>';
  }

  function openLanguageSheet(onSelected) {
    // Click events are not continuation callbacks.
    if (typeof onSelected !== 'function') { onSelected = null; }
    var langs = Store.languages();
    var activeId = Store.settings.activeLanguageId;
    var options = (global.LexioLanguages ? LexioLanguages.all : []).map(function (l) {
      return '<option value="' + esc(l.name) + '">';
    }).join('');
    var list = langs.length ? '<div class="option-list" style="margin-block-end:var(--s-5)">' +
      langs.map(function (l) {
        return '<div class="data-row"><button type="button" class="option grow" data-pick="' + esc(l.id) +
          '" aria-pressed="' + (l.id === activeId) + '"><span class="grow"><span class="option__title" dir="auto">' +
          esc(l.name) + '</span><br><span class="option__sub">' +
          (l.dir === 'rtl' ? 'Right to left' : l.dir === 'ltr' ? 'Left to right' : 'Auto-detect') + '</span></span>' +
          (l.id === activeId ? Icon('check') : '') + '</button>' +
          '<button type="button" class="icon-btn" data-edit-lang="' + esc(l.id) +
          '" aria-label="Edit ' + esc(l.name) + '">' + Icon('edit') + '</button></div>';
      }).join('') + '</div>' : '';

    UI.modal({
      title: 'Choose a language',
      description: 'Pick a language or type your own. Reading direction is suggested automatically.',
      body: list + '<form id="lang-form" class="stack" autocomplete="off">' +
        '<label class="field"><span class="field__label">Language</span>' +
          '<input class="field__input" name="name" dir="auto" required maxlength="40" list="lexio-lang-list" ' +
          'placeholder="e.g. Spanish, Arabic, or your own language" data-autofocus>' +
          '<datalist id="lexio-lang-list">' + options + '</datalist></label>' +
        '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="field__label">Reading direction</legend>' +
          '<div class="seg">' +
            '<label class="seg__opt"><input type="radio" name="dir" value="auto" checked><span>Auto</span></label>' +
            '<label class="seg__opt"><input type="radio" name="dir" value="ltr"><span>Left to right</span></label>' +
            '<label class="seg__opt"><input type="radio" name="dir" value="rtl"><span>Right to left</span></label>' +
          '</div></fieldset>' +
        '<div class="modal__actions"><button type="button" class="btn" data-act="cancel">Cancel</button>' +
          '<button type="submit" class="btn btn--primary">Use language</button></div></form>',
      onMount: function (panel, close) {
        var form = UI.$('#lang-form', panel);
        var nameInput = form.elements.name;
        var editingId = null;
        var directionTouched = false;
        function selectLanguage(lang) {
          Store.setActiveLanguage(lang.id);
          close();
          if (onSelected) { onSelected(lang); }
        }
        UI.$('[data-act="cancel"]', panel).addEventListener('click', close);
        UI.$$('[data-pick]', panel).forEach(function (button) {
          button.addEventListener('click', function () {
            selectLanguage(langs.find(function (l) { return l.id === button.dataset.pick; }));
          });
        });
        UI.$$('[data-edit-lang]', panel).forEach(function (button) {
          button.addEventListener('click', function () {
            var lang = langs.find(function (l) { return l.id === button.dataset.editLang; });
            editingId = lang.id;
            nameInput.value = lang.name;
            form.elements.dir.value = lang.dir || 'auto';
            directionTouched = true;
            UI.$('button[type="submit"]', form).textContent = 'Save language';
            nameInput.focus();
          });
        });
        UI.$$('input[name="dir"]', form).forEach(function (radio) {
          radio.addEventListener('change', function () { directionTouched = true; });
        });
        nameInput.addEventListener('input', function () {
          if (directionTouched || !global.LexioLanguages) { return; }
          var known = LexioLanguages.getByName(nameInput.value.trim());
          form.elements.dir.value = known ? known.dir : 'auto';
        });
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var name = nameInput.value.trim();
          if (!name) { nameInput.focus(); return; }
          var known = global.LexioLanguages && LexioLanguages.getByName(name);
          var code = known ? known.code : (global.LexioLanguages ? LexioLanguages.suggestCode(name) : '');
          var existing = langs.find(function (l) {
            return l.name.toLocaleLowerCase() === name.toLocaleLowerCase() || (code && l.code === code);
          });
          if (editingId && existing && existing.id !== editingId) {
            UI.toast('That language already exists. Choose it above.', { icon: 'warning' });
            return;
          }
          var data = { name: name, code: code, dir: form.elements.dir.value || 'auto' };
          var lang = editingId ? Store.updateLanguage(editingId, data)
            : existing || Store.addLanguage(data);
          selectLanguage(lang);
          UI.toast(name + ' selected');
        });
      }
    });
  }

  /* ---- Floating quick-add ----------------------------------------------- */
  function initQuickAdd() {
    if (document.getElementById('fab-add')) { return; }
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'fab-add';
    fab.className = 'fab';
    fab.setAttribute('aria-label', 'Quick add a word');
    fab.innerHTML = Icon('plus');
    document.body.appendChild(fab);
    fab.addEventListener('click', function () {
      if (global.QuickAdd && QuickAdd.open) { QuickAdd.open(); }
    });
    syncFab();
  }

  function syncFab() {
    var fab = document.getElementById('fab-add');
    if (!fab) { return; }
    var hide = false;
    try {
      var cur = Router.current;
      if (document.querySelector('.session')) { hide = true; }
    } catch (e) { /* keep visible */ }
    fab.hidden = hide;
  }

  /* ---- Scroll shadow on the top bar --------------------------------------- */
  function initScrollState() {
    var topbar = document.getElementById('topbar');
    var tick = false;
    function update() {
      topbar.dataset.scrolled = window.scrollY > 4 ? 'true' : 'false';
      tick = false;
    }
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---- Account dropdown menu ---------------------------------------------- */
  var acctMenuCleanup = [];

  function closeAccountMenu() {
    var existing = document.getElementById('acct-menu');
    if (existing) { existing.remove(); }
    var btn = document.getElementById('account-button');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); }
    acctMenuCleanup.forEach(function (fn) { fn(); });
    acctMenuCleanup = [];
  }

  function menuItem(label, icon, act, danger) {
    return '<button type="button" role="menuitem" class="acct-menu__item' +
      (danger ? ' acct-menu__item--danger' : '') + '" data-menu="' + act + '">' +
      Icon(icon) + '<span>' + esc(label) + '</span></button>';
  }

  function openAccountMenu() {
    if (document.getElementById('acct-menu')) { closeAccountMenu(); return; }

    var btn = document.getElementById('account-button');
    if (!btn) { return; }
    btn.setAttribute('aria-expanded', 'true');

    var signedIn = CloudSync.isAuthenticated();
    var summary = signedIn ? CloudSync.accountSummary() : null;

    var menu = document.createElement('div');
    menu.id = 'acct-menu';
    menu.className = 'acct-menu';
    menu.setAttribute('role', 'menu');
    var initial = 'G';
    try {
      var src = summary ? (summary.displayName || summary.email || 'G') : 'Guest';
      initial = String(src).trim().charAt(0).toUpperCase() || 'G';
    } catch (e) {}
    menu.innerHTML =
      '<div class="acct-menu__head">' +
        '<span class="acct-menu__avatar" aria-hidden="true">' + esc(initial) + '</span>' +
        '<div><strong>' + esc(summary ? (summary.displayName || 'My account') : 'Guest') + '</strong>' +
        '<span>' + esc(summary ? (summary.email || '') : 'On this device only') + '</span></div>' +
      '</div>' +
      menuItem('My profile', 'shield', 'profile') +
      (signedIn
        ? menuItem('Sign out', 'back', 'signout')
        : menuItem('Sign in', 'shield', 'signin'));
    document.body.appendChild(menu);

    /* Fixed position anchored under the button, right-aligned. */
    var rect = btn.getBoundingClientRect();
    menu.style.top = (rect.bottom + 6) + 'px';
    menu.style.right = Math.max(16, global.innerWidth - rect.right) + 'px';

    function onDocClick(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) { closeAccountMenu(); }
    }
    function onKey(e) { if (e.key === 'Escape') { closeAccountMenu(); } }

    menu.addEventListener('click', function (e) {
      var item = e.target.closest('[data-menu]');
      if (!item) { return; }
      var act = item.dataset.menu;
      closeAccountMenu();
      if (act === 'profile') { Router.go('/account'); }
      if (act === 'signin') { CloudSync.openSignIn(); }
      if (act === 'signout') {
        CloudSync.signOut().then(function (done) { if (done) { Router.go('/home'); } });
      }
    });

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    global.addEventListener('resize', closeAccountMenu);
    acctMenuCleanup.push(function () {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
      global.removeEventListener('resize', closeAccountMenu);
    });
  }

  /* ---- Boot --------------------------------------------------------------- */
  function boot() {
    var brandMark = document.getElementById('brand-mark');
    var brandMarkMobile = document.getElementById('brand-mark-mobile');
    var accountIcon = document.getElementById('account-icon');
    /* Test pages may mirror a reduced shell — never assume every node. */
    if (brandMark) { brandMark.innerHTML = Icon('seed'); }
    if (brandMarkMobile) { brandMarkMobile.innerHTML = Icon('seed'); }
    if (accountIcon) { accountIcon.innerHTML = Icon('shield'); }

    registerRoutes();
    buildNav();
    initTheme();
    initScrollState();
    syncLanguageChip();

    document.getElementById('lang-chip').addEventListener('click', openLanguageSheet);
    initQuickAdd();

    // Any store change re-renders the current view and the nav counters, so
    // the "X words learned" figures are always live.
    Store.subscribe(function (reason) {
      syncLanguageChip();
      syncNav();
      if (reason === 'settings') { return; }
      Router.refresh();
    });

    global.addEventListener('lexio:navigated', function () {
      syncNav();
      syncFab();
    });
    global.addEventListener('resize', function () { syncNav(); });

    // Supabase must consume an OAuth callback before the hash router runs.
    // The legacy implicit flow returns tokens in location.hash; routing first
    // would replace that hash with #/home and discard the new session.
    CloudSync.init().catch(function (error) {
      console.error('[Lexio] Authentication initialization failed.', error);
      UI.toast('Authentication could not be initialized. Guest mode is still available.', {
        icon: 'warning', duration: 6000
      });
    }).then(function () {
      Router.start();
      syncFab();

    });

    if (!Store.isPersistent) {
      UI.toast('This browser is blocking local storage — changes will not be saved.',
        { icon: 'warning', duration: 6000 });
    }
  }

  global.App = {
    openLanguageSheet: openLanguageSheet,
    applyTheme: applyTheme,
    openAccountMenu: openAccountMenu,
    closeAccountMenu: closeAccountMenu
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
