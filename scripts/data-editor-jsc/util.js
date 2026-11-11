// node:util for the helper in JavaScriptCore: what its dependencies reach for.
// parseArgs serves the scripts' command lines, which the app never runs.

export function parseArgs() {
	throw new Error('parseArgs has no stand-in: the Mac app runs no command line')
}

export function inspect(value) {
	try {
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}

export function format(...values) {
	return values.map(String).join(' ')
}

export function deprecate(fn) {
	return fn
}

export function inherits(constructor, parent) {
	Object.setPrototypeOf(constructor.prototype, parent.prototype)
}

/** Equal as JSON is equal enough for the data, which is plain JSON. */
export function isDeepStrictEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b)
}

export const types = {}

export default {parseArgs, inspect, format, isDeepStrictEqual, deprecate, inherits, types}
