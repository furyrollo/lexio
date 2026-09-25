/* ==========================================================================
   Lexio category art — "Field Guide" sticker set.
   Twenty hand-drawn 48x48 illustrations, one per category. Each is a
   chunky die-cut sticker: paper fill, ink outline, one spot colour.

   Paint is applied through classes so a single SVG can be recoloured by
   CSS custom properties on any ancestor:
     .a  paper fill        -> --art-paper  (default warm white)
     .b  spot fill         -> --art-spot   (per-category accent)
     .k  solid ink fill    -> --art-ink
     .sb spot stroke
   Stroke defaults to ink on the root <g>.
   ========================================================================== */
(function (global) {
  'use strict';

  var OPEN = '<svg class="cat-art" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="cat-art__g">';
  var CLOSE = '</g></svg>';

  var ART = {
    /* I, you, we — two friendly busts, one in front of the other */
    pronouns:
      '<circle class="b" cx="32" cy="14.5" r="6"/>' +
      '<path class="b" d="M21.5 37v-2.5a10.5 10.5 0 0 1 21 0V37z"/>' +
      '<circle class="a" cx="17.5" cy="19" r="7.5"/>' +
      '<path class="a" d="M4.5 43v-2a13 13 0 0 1 26 0v2z"/>' +
      '<circle class="k" cx="15" cy="19.3" r="1.2" stroke="none"/>' +
      '<circle class="k" cx="20.2" cy="19.3" r="1.2" stroke="none"/>' +
      '<path d="M15.6 22.6c1.2.9 2.8.9 4 0"/>',

    /* Hello — a waving hand with motion marks */
    greetings:
      '<g transform="rotate(-14 24 28)">' +
        '<rect class="a" x="12.5" y="10" width="6.4" height="20" rx="3.2"/>' +
        '<rect class="a" x="18.9" y="5.5" width="6.4" height="22" rx="3.2"/>' +
        '<rect class="a" x="25.3" y="7" width="6.4" height="21" rx="3.2"/>' +
        '<rect class="a" x="31.7" y="11.5" width="6" height="18" rx="3"/>' +
        '<rect class="a" x="4.5" y="21" width="6.4" height="15" rx="3.2" transform="rotate(-38 7.7 28.5)"/>' +
        '<path class="a" d="M12.5 22h25.2v8.5c0 7-5.6 12.5-12.6 12.5S12.5 37.5 12.5 30.5z"/>' +
        '<path d="M12.5 22h25.2" stroke="none"/>' +
      '</g>' +
      '<path class="sb" d="M39.5 6.5c2.8 1.6 4.6 4.3 5 7.6" stroke-width="2.6"/>' +
      '<path class="sb" d="M3.6 33.5c.6 3 2.4 5.6 5 7.2" stroke-width="2.6"/>',

    /* Counting — a little abacus */
    numbers:
      '<rect class="a" x="5" y="6" width="38" height="33" rx="5"/>' +
      '<path d="M5 15.5h38M5 24h38M5 32.5h38" stroke-width="1.8"/>' +
      '<circle class="b" cx="12" cy="15.5" r="3.6"/>' +
      '<circle class="b" cx="19.5" cy="15.5" r="3.6"/>' +
      '<circle class="k" cx="36" cy="15.5" r="3.6"/>' +
      '<circle class="k" cx="12" cy="24" r="3.6"/>' +
      '<circle class="b" cx="28.5" cy="24" r="3.6"/>' +
      '<circle class="b" cx="36" cy="24" r="3.6"/>' +
      '<circle class="b" cx="12" cy="32.5" r="3.6"/>' +
      '<circle class="b" cx="19.5" cy="32.5" r="3.6"/>' +
      '<circle class="b" cx="27" cy="32.5" r="3.6"/>' +
      '<path d="M11 39v4.5M37 39v4.5"/>',

    /* Shades — painter's palette with real paint */
    colors:
      '<path class="a" d="M24 5C12.8 5 4.5 12.7 4.5 22.5c0 10.2 8.2 18.5 19 18.5 3 0 4.7-1.7 4.7-4 0-1.3-.6-2.3-1.3-3.1-.7-.8-1.2-1.7-1.2-2.8 0-2.4 2-4.3 4.4-4.3h5.2c4.6 0 8.2-3.6 8.2-8.2C43.5 11.3 34.8 5 24 5Z"/>' +
      '<circle cx="13.5" cy="21" r="3.6" fill="#FF5A5F"/>' +
      '<circle cx="19.5" cy="12.5" r="3.6" fill="#FFC23D"/>' +
      '<circle cx="29.5" cy="11.5" r="3.6" fill="#3E8BFF"/>' +
      '<circle cx="36.5" cy="18.5" r="3.6" fill="#35C28A"/>' +
      '<circle class="b" cx="16" cy="31" r="3" />',

    /* Days & hours — tear-off calendar with a clock */
    time:
      '<rect class="a" x="4.5" y="9" width="30" height="30" rx="5"/>' +
      '<path class="b" d="M4.5 14a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v5h-30z"/>' +
      '<path d="M12 5.5v7M27 5.5v7"/>' +
      '<circle class="k" cx="11" cy="26" r="1.7" stroke="none"/>' +
      '<circle class="k" cx="17.5" cy="26" r="1.7" stroke="none"/>' +
      '<circle class="k" cx="11" cy="32.5" r="1.7" stroke="none"/>' +
      '<circle class="a" cx="33.5" cy="33" r="10"/>' +
      '<path d="M33.5 27v6.3l4.2 2.6"/>',

    /* Relatives — two adults and a little one, with a heart */
    family:
      '<circle class="a" cx="13" cy="16" r="6.5"/>' +
      '<path class="a" d="M2.5 43v-3.5a10.5 10.5 0 0 1 21 0V43z"/>' +
      '<circle class="b" cx="35" cy="16" r="6.5"/>' +
      '<path class="b" d="M24.5 43v-3.5a10.5 10.5 0 0 1 21 0V43z"/>' +
      '<circle class="a" cx="24" cy="30" r="5"/>' +
      '<path class="a" d="M16.5 45v-1.5a7.5 7.5 0 0 1 15 0V45z"/>' +
      '<path class="b" d="M24 6.2c-1.9-2.6-5.6-1.2-5 1.6.5 2 2.9 3.5 5 5.1 2.1-1.6 4.5-3.1 5-5.1.6-2.8-3.1-4.2-5-1.6Z" stroke-width="2"/>',

    /* Friends & strangers — "hello, my name is" badge */
    people:
      '<rect class="a" x="4" y="11" width="40" height="30" rx="5.5"/>' +
      '<path class="b" d="M4 16.5A5.5 5.5 0 0 1 9.5 11h29a5.5 5.5 0 0 1 5.5 5.5V22H4z"/>' +
      '<rect class="a" x="19.5" y="5" width="9" height="9.5" rx="2.5"/>' +
      '<circle class="b" cx="14" cy="31.5" r="5"/>' +
      '<path d="M23.5 29.5h13.5M23.5 34.5h9"/>',

    /* Head to toe — a star-jumping figure */
    body:
      '<circle class="a" cx="24" cy="9.5" r="5.5"/>' +
      '<path class="a" d="M18.2 18.5h11.6l9.2-5.2a2.6 2.6 0 0 1 2.6 4.5l-7.9 5.4v6.3l5.2 10.1a2.7 2.7 0 0 1-4.7 2.6L28.8 34H19.2l-5.4 8.2a2.7 2.7 0 0 1-4.7-2.6l5.2-10.1v-6.3l-7.9-5.4a2.6 2.6 0 0 1 2.6-4.5z"/>' +
      '<path class="b" d="M16.4 25.5h15.2v3.8H16.4z" stroke="none"/>' +
      '<path d="M16.4 25.5h15.2M16.4 29.3h15.2" stroke-width="1.6"/>',

    /* Rooms & objects — a little house */
    home:
      '<rect class="a" x="30" y="7" width="6" height="11"/>' +
      '<rect class="a" x="8.5" y="20" width="31" height="22" rx="2"/>' +
      '<path class="b" d="M3.5 23.5 24 6.5l20.5 17z"/>' +
      '<path class="b" d="M19.5 42V33a4.5 4.5 0 0 1 9 0v9z"/>' +
      '<rect class="k" x="12.5" y="27" width="4" height="4" rx="1" stroke="none"/>' +
      '<rect class="k" x="31.5" y="27" width="4" height="4" rx="1" stroke="none"/>',

    /* City & travel — folded map with a pin */
    travel:
      '<path class="a" d="M3.5 15 15.5 10l17 5 12-5v26l-12 5-17-5-12 5z"/>' +
      '<path d="M15.5 10v26M32.5 15v26" stroke-width="1.8"/>' +
      '<path d="M8 33c4-1 6-5 10-4s5 5 9 3" stroke-width="1.8" stroke-dasharray="1 3.4"/>' +
      '<path class="b" d="M31 3.5c-5.2 0-9.2 3.9-9.2 9 0 6.6 9.2 14.6 9.2 14.6s9.2-8 9.2-14.6c0-5.1-4-9-9.2-9Z"/>' +
      '<circle class="a" cx="31" cy="12.5" r="3.2"/>',

    /* Meals — noodle bowl with chopsticks and steam */
    food:
      '<path d="M15 14.5c-1.8-1.9 1.8-3.6 0-5.5M22 14.5c-1.8-1.9 1.8-3.6 0-5.5" stroke-width="2"/>' +
      '<rect class="b" x="31" y="2.5" width="4.4" height="26" rx="2.2" transform="rotate(28 33.2 15.5)"/>' +
      '<rect class="b" x="37" y="4" width="4.4" height="24" rx="2.2" transform="rotate(34 39.2 16)"/>' +
      '<path class="a" d="M4 23h40c0 10.5-8.8 18.5-20 18.5S4 33.5 4 23Z"/>' +
      '<path d="M8.5 30.5c3 1 5-1.2 7.8 0s5 1.2 7.7 0 5-1.2 7.7 0 5 1 7.8 0" stroke-width="1.8"/>' +
      '<path d="M17 41.5h14"/>',

    /* Pets & wildlife — a cat face */
    animals:
      '<path class="a" d="M8 16.5 9.6 5.8a1.2 1.2 0 0 1 1.9-.8l7.6 6.3h9.8L36.5 5a1.2 1.2 0 0 1 1.9.8L40 16.5c2.2 3 3.5 6.5 3.5 10.2C43.5 36 35 42 24 42S4.5 36 4.5 26.7c0-3.7 1.3-7.2 3.5-10.2Z"/>' +
      '<path class="b" d="m12 9.5 5 4.2-4.3 2.3zM36 9.5 31 13.7l4.3 2.3z" stroke="none"/>' +
      '<circle class="k" cx="17" cy="25" r="2.3" stroke="none"/>' +
      '<circle class="k" cx="31" cy="25" r="2.3" stroke="none"/>' +
      '<path class="b" d="M21.6 29.5h4.8L24 32.2z" stroke-width="1.6"/>' +
      '<path d="M24 32.2v1.6c-1 1.6-3 1.6-4 .4M24 33.8c1 1.6 3 1.6 4 .4" stroke-width="1.8"/>' +
      '<path d="M3 28.5l8 1M3.5 34l7.5-2M45 28.5l-8 1M44.5 34l-7.5-2" stroke-width="1.8"/>',

    /* Weather & landscape — mountains under a sun */
    nature:
      '<circle cx="34.5" cy="13" r="7" fill="#FFC23D"/>' +
      '<path class="b" d="M20 41 32 21.5 45 41z"/>' +
      '<path class="a" d="M3 41 18.5 14.5 34 41z"/>' +
      '<path d="m13.3 23.4 3 2.4 2.2-2.4 2.4 2.6 2.1-1.9" stroke-width="2"/>',

    /* Garments — striped tee */
    clothing:
      '<path class="a" d="M17 6.5 6.5 11 3 22.5l7.4 3 1.6-4v20.5h24V21.5l1.6 4 7.4-3L41.5 11 31 6.5c-1.1 3.4-3.8 5.6-7 5.6s-5.9-2.2-7-5.6Z"/>' +
      '<rect class="b" x="12" y="24.5" width="24" height="4.2" stroke="none"/>' +
      '<rect class="b" x="12" y="32.5" width="24" height="4.2" stroke="none"/>' +
      '<path d="M17 6.5 6.5 11 3 22.5l7.4 3 1.6-4v20.5h24V21.5l1.6 4 7.4-3L41.5 11 31 6.5c-1.1 3.4-3.8 5.6-7 5.6s-5.9-2.2-7-5.6Z"/>',

    /* Jobs & study — notebook with a pencil */
    work:
      '<rect class="a" x="7" y="5" width="27" height="37" rx="3.5"/>' +
      '<path d="M14 14h13M14 20h13M14 26h8" stroke-width="2"/>' +
      '<path d="M7 11.5h-2.5M7 19h-2.5M7 26.5h-2.5M7 34h-2.5"/>' +
      '<g transform="translate(36 24) rotate(28)">' +
        '<rect x="-4.2" y="-19" width="8.4" height="6" rx="2" fill="#FF8FB1"/>' +
        '<rect class="b" x="-4.2" y="-13" width="8.4" height="22"/>' +
        '<path class="a" d="M-4.2 9h8.4L0 18.5z"/>' +
        '<path class="k" d="M-1.5 15h3L0 18.5z" stroke-width="1.2"/>' +
      '</g>',

    /* Actions — a sneaker mid-sprint */
    verbs:
      '<path d="M2.5 17.5h7M1.5 23.5h5M3.5 29.5h4.5" stroke-width="2.2"/>' +
      '<path class="a" d="M10 34.5c0-5.4 1.3-11 3.2-15.2l6.3 1.3c1.8 2.9 5.2 3.7 7.9 1.7L30 16.5c6.2.9 10.1 4.7 12.3 9.3 2.6.8 4.2 2.7 4.2 5.3v3.4z"/>' +
      '<path class="b" d="M10 34.5h36.5V38a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z"/>' +
      '<path d="m24.5 25 3 2.4M29.5 21.5l3 2.4M34.5 21.2l2.2 2.8" stroke-width="2"/>',

    /* Describing words — a magic wand with sparkles */
    adjectives:
      '<g transform="rotate(-45 12 36)">' +
        '<rect class="k" x="9" y="22" width="6" height="26" rx="3"/>' +
        '<rect class="a" x="9" y="22" width="6" height="7" rx="2"/>' +
      '</g>' +
      '<path class="b" d="m30 4 3.4 7.6 8.2.9-6.1 5.5 1.7 8.1-7.2-4.1-7.2 4.1 1.7-8.1-6.1-5.5 8.2-.9z"/>' +
      '<path class="a" d="m41.5 29 1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z" stroke-width="1.8"/>' +
      '<path class="a" d="m11 6 1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z" stroke-width="1.8"/>' +
      '<path d="M20 27.5 18 25.5M24.5 23l.5-2.6" stroke-width="2"/>',

    /* Who, what, why — a bold question mark on a bubble */
    questions:
      '<path class="b" d="M26 4.5c10.5 0 18.5 7.3 18.5 17 0 3.7-1.2 7.1-3.3 9.9l2.3 7.6-8-3.2a20 20 0 0 1-9.5 2.2C15.5 38 7.5 30.8 7.5 21.5s8-17 18.5-17Z"/>' +
      '<path d="M16.5 17.5c0-5.6 4-9.4 9.4-9.4 5.2 0 9.3 3.3 9.3 8.2 0 4.2-3.1 6.2-5.8 7.7-2.2 1.2-3.6 2.7-3.6 5.6v1" stroke-width="10.5"/>' +
      '<path d="M16.5 17.5c0-5.6 4-9.4 9.4-9.4 5.2 0 9.3 3.3 9.3 8.2 0 4.2-3.1 6.2-5.8 7.7-2.2 1.2-3.6 2.7-3.6 5.6v1" stroke="#FFFDF7" class="sa" stroke-width="5.6"/>' +
      '<circle class="a" cx="25.8" cy="40" r="4.4"/>',

    /* And, but, because — two interlocked chain links */
    connectors:
      '<g transform="rotate(-38 24 24)">' +
        '<rect class="b" x="3" y="16" width="24" height="16" rx="8"/>' +
        '<rect class="a" x="9" y="21.5" width="12" height="5" rx="2.5"/>' +
        '<rect class="a" x="21" y="16" width="24" height="16" rx="8"/>' +
        '<rect class="b" x="27" y="21.5" width="12" height="5" rx="2.5"/>' +
        /* re-draw the first link's right arc over the second: interlock */
        '<path class="b" d="M19 16a8 8 0 0 1 0 16h-3.2v-5.5H19a2.5 2.5 0 0 0 0-5h-3.2V16z" stroke="none"/>' +
        '<path d="M19 16a8 8 0 0 1 0 16M19 21.5a2.5 2.5 0 0 1 0 5"/>' +
      '</g>' +
      '<path class="sb" d="M7 9.5 9.8 12.3M12.5 5.5l.6 3.8M4.5 15l3.8.4" stroke-width="2.4"/>' +
      '<path class="sb" d="M41 38.5 38.2 35.7M35.5 42.5l-.6-3.8M43.5 33l-3.8-.4" stroke-width="2.4"/>',

    /* Everyday expressions — overlapping speech bubbles */
    phrases:
      '<path class="b" d="M22 5.5h17a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-1.5v5.5l-6.5-5.5H22a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6Z"/>' +
      '<path class="a" d="M9 17.5h17a6 6 0 0 1 6 6v8.5a6 6 0 0 1-6 6H16l-7 5.5V38a6 6 0 0 1-6-6v-8.5a6 6 0 0 1 6-6Z"/>' +
      '<circle class="k" cx="11" cy="28" r="2" stroke="none"/>' +
      '<circle class="k" cx="17.5" cy="28" r="2" stroke="none"/>' +
      '<circle class="k" cx="24" cy="28" r="2" stroke="none"/>'
  };

  /** Returns the sticker SVG for a category icon id ('' if unknown). */
  function CatArt(iconId) {
    var body = ART[iconId];
    return body ? OPEN + body + CLOSE : '';
  }
  CatArt.has = function (iconId) { return !!ART[iconId]; };

  global.CatArt = CatArt;
})(window);
