// The web's URL, which JavaScriptCore's plain context lacks and the data
// scripts and their validators use. This one handles international domain
// names differently from Node's; the data has none.
import {URL, URLSearchParams} from 'react-native-url-polyfill/js/URL.js'

globalThis.URL ??= URL
globalThis.URLSearchParams ??= URLSearchParams
