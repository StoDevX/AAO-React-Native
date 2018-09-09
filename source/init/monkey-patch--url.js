// @flow

/*
 * Monkey-patch RN's URL global.
 *
 * A history: get-urls@8 requires normalize-url@2, which uses the new
 * window.URL global object for URL parsing.
 *
 * RN provides a global URL object… but only puts two things into it.
 *
 * The JSDOM project maintains a browser-compatible URL module.
 *
 * Thus, we stick that into the global namespace, and monkey-patch RN's
 * two non-standard methods onto it so as to not break either things that
 * expect web!URL or RN!URL objects.
 */

import {URL, URLSearchParams} from 'whatwg-url'

let RNURL = global.URL;

URL.createObjectURL = RNURL.createObjectURL;
URL.revokeObjectURL = RNURL.revokeObjectURL;

global.URL = URL;
global.URLSearchParams = URLSearchParams;
