// node:module for the helper in JavaScriptCore. esbuild bundles every
// dependency, so nothing is left to require at run time.

export function createRequire() {
	return (id) => {
		throw new Error(`require('${id}') has no stand-in: esbuild bundles every dependency`)
	}
}

export default {createRequire}
