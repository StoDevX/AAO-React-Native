// Hermes does not provide a global Buffer. Some packages (e.g. entities ≥ v7,
// used by htmlparser2 ≥ v10) reference Buffer at module-load time as a fallback
// for base64 decoding when atob is unavailable. This polyfill must be imported
// before any such package is loaded.
import {Buffer} from 'buffer'

if (typeof globalThis.Buffer === 'undefined') {
	globalThis.Buffer = Buffer
}
