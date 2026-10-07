/* ==========================================================================
   Languages — popular shortcuts plus universal custom support.

   The 50-entry list below is a convenience, NOT a gate: any language name
   works, including obscure ones with no ISO code. The store keeps `code`
   (BCP-47 when known, generated slug otherwise) for future TTS /
   dictionary / AI grounding; direction is guessed from the base subtag
   and always overridable per language / per word. Unknown scripts default
   to `auto` so mixed content still renders.
   ========================================================================== */
(function (global) {
  'use strict';

  // Base subtags whose default script reads right-to-left.
  var RTL_BASE = {
    ar: 1, arc: 1, arz: 1, ckb: 1, dv: 1, fa: 1, glk: 1, he: 1, iw: 1,
    ks: 1, mzn: 1, nqo: 1, ps: 1, sd: 1, syr: 1, ug: 1, ur: 1, yi: 1
  };

  // Popular shortcuts: code = BCP-47, dir = default reading direction.
  var LIST = [
    { code: 'es', name: 'Spanish', dir: 'ltr' },
    { code: 'fr', name: 'French', dir: 'ltr' },
    { code: 'de', name: 'German', dir: 'ltr' },
    { code: 'it', name: 'Italian', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', dir: 'ltr' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', dir: 'ltr' },
    { code: 'nl', name: 'Dutch', dir: 'ltr' },
    { code: 'pl', name: 'Polish', dir: 'ltr' },
    { code: 'uk', name: 'Ukrainian', dir: 'ltr' },
    { code: 'ru', name: 'Russian', dir: 'ltr' },
    { code: 'el', name: 'Greek', dir: 'ltr' },
    { code: 'tr', name: 'Turkish', dir: 'ltr' },
    { code: 'sv', name: 'Swedish', dir: 'ltr' },
    { code: 'no', name: 'Norwegian', dir: 'ltr' },
    { code: 'da', name: 'Danish', dir: 'ltr' },
    { code: 'fi', name: 'Finnish', dir: 'ltr' },
    { code: 'hu', name: 'Hungarian', dir: 'ltr' },
    { code: 'ro', name: 'Romanian', dir: 'ltr' },
    { code: 'cs', name: 'Czech', dir: 'ltr' },
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', dir: 'rtl' },
    { code: 'fa', name: 'Persian (Farsi)', dir: 'rtl' },
    { code: 'ur', name: 'Urdu', dir: 'rtl' },
    { code: 'he', name: 'Hebrew', dir: 'rtl' },
    { code: 'hi', name: 'Hindi', dir: 'ltr' },
    { code: 'bn', name: 'Bengali', dir: 'ltr' },
    { code: 'pa', name: 'Punjabi (Gurmukhi)', dir: 'ltr' },
    { code: 'gu', name: 'Gujarati', dir: 'ltr' },
    { code: 'ta', name: 'Tamil', dir: 'ltr' },
    { code: 'te', name: 'Telugu', dir: 'ltr' },
    { code: 'kn', name: 'Kannada', dir: 'ltr' },
    { code: 'ml', name: 'Malayalam', dir: 'ltr' },
    { code: 'mr', name: 'Marathi', dir: 'ltr' },
    { code: 'ne', name: 'Nepali', dir: 'ltr' },
    { code: 'si', name: 'Sinhala', dir: 'ltr' },
    { code: 'am', name: 'Amharic', dir: 'ltr' },
    { code: 'hy', name: 'Armenian', dir: 'ltr' },
    { code: 'ka', name: 'Georgian', dir: 'ltr' },
    { code: 'th', name: 'Thai', dir: 'ltr' },
    { code: 'lo', name: 'Lao', dir: 'ltr' },
    { code: 'km', name: 'Khmer', dir: 'ltr' },
    { code: 'my', name: 'Burmese', dir: 'ltr' },
    { code: 'vi', name: 'Vietnamese', dir: 'ltr' },
    { code: 'id', name: 'Indonesian', dir: 'ltr' },
    { code: 'ms', name: 'Malay', dir: 'ltr' },
    { code: 'sw', name: 'Swahili', dir: 'ltr' },
    { code: 'zh', name: 'Chinese (Mandarin)', dir: 'ltr' },
    { code: 'yue', name: 'Cantonese', dir: 'ltr' },
    { code: 'ja', name: 'Japanese', dir: 'ltr' },
    { code: 'ko', name: 'Korean', dir: 'ltr' },
    // Major world languages often missing from short lists — still
    // shortcuts; anything else uses the custom path.
    { code: 'yo', name: 'Yoruba', dir: 'ltr' },
    { code: 'ig', name: 'Igbo', dir: 'ltr' },
    { code: 'ha', name: 'Hausa', dir: 'ltr' },
    { code: 'zu', name: 'Zulu', dir: 'ltr' },
    { code: 'xh', name: 'Xhosa', dir: 'ltr' },
    { code: 'sn', name: 'Shona', dir: 'ltr' },
    { code: 'qu', name: 'Quechua', dir: 'ltr' },
    { code: 'ht', name: 'Haitian Creole', dir: 'ltr' },
    { code: 'ps', name: 'Pashto', dir: 'rtl' },
    { code: 'ku', name: 'Kurdish', dir: 'ltr' },
    { code: 'ckb', name: 'Central Kurdish (Sorani)', dir: 'rtl' },
    { code: 'mn', name: 'Mongolian', dir: 'ltr' },
    { code: 'ca', name: 'Catalan', dir: 'ltr' },
    { code: 'eu', name: 'Basque', dir: 'ltr' },
    { code: 'gl', name: 'Galician', dir: 'ltr' },
    { code: 'la', name: 'Latin', dir: 'ltr' }
  ];

  function baseOf(code) {
    return String(code || '').trim().toLocaleLowerCase().split(/[-_]/)[0] || '';
  }

  /** Guess direction from any tag: known list first, then RTL base set,
      otherwise `auto` (safest for unknown scripts). */
  function guessDir(code) {
    var c = String(code || '').trim();
    if (!c) { return 'auto'; }
    var exact = null;
    LIST.some(function (l) {
      if (l.code.toLocaleLowerCase() === c.toLocaleLowerCase()) { exact = l; return true; }
      return false;
    });
    if (exact) { return exact.dir; }
    return RTL_BASE[baseOf(c)] ? 'rtl' : 'auto';
  }

  // Back-compat alias.
  function dirForCode(code) { return guessDir(code); }

  /** Loose BCP-47: 2–8 letter primary + any number of 2–8 alphanum subtags.
      Accepts es, pt-BR, zh-Hant-TW, sr-Latn, plus generated slugs. */
  function isValidCode(code) {
    return /^[A-Za-z]{2,8}([-_][A-Za-z0-9]{2,8})*$/.test(String(code || '').trim());
  }

  /** Suggest a storable code from any name: lowercase slug, stripped of
      junk, capped at 20 chars (the DB limit). Never blank. */
  function suggestCode(name) {
    var slug = String(name || '').trim().toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20)
      .replace(/-+$/g, '');
    if (!slug) { slug = 'lang'; }
    if (/^[0-9]/.test(slug)) { slug = 'l-' + slug; }
    return slug.slice(0, 20);
  }

  function search(query) {
    var q = String(query || '').trim().toLocaleLowerCase();
    if (!q) { return LIST.slice(); }
    var starts = [], contains = [];
    LIST.forEach(function (l) {
      var name = l.name.toLocaleLowerCase(), code = l.code.toLocaleLowerCase();
      if (name.indexOf(q) === 0 || code.indexOf(q) === 0) { starts.push(l); }
      else if (name.indexOf(q) !== -1 || code.indexOf(q) !== -1) { contains.push(l); }
    });
    return starts.concat(contains);
  }

  global.LexioLanguages = {
    all: LIST,
    popular: LIST,
    search: search,
    guessDir: guessDir,
    dirForCode: dirForCode,
    isValidCode: isValidCode,
    suggestCode: suggestCode,
    getByCode: function (code) {
      var c = String(code || '').trim().toLocaleLowerCase();
      return LIST.filter(function (l) { return l.code.toLocaleLowerCase() === c; })[0] || null;
    },
    getByName: function (name) {
      var n = String(name || '').trim().toLocaleLowerCase();
      return LIST.filter(function (l) { return l.name.toLocaleLowerCase() === n; })[0] || null;
    }
  };
})(window);
