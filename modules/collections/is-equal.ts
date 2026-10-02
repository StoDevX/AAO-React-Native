/**
 * Whether two values hold the same data: primitives as `Object.is` sees them
 * (apart from +0 and -0, which match), dates by their time, and arrays and
 * plain objects by their contents, whatever order an object's keys are in.
 */
export function isEqual(a: unknown, b: unknown): boolean {
	if (a === b || (Number.isNaN(a) && Number.isNaN(b))) return true
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false

	if (a instanceof Date || b instanceof Date) {
		return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
	}

	if (Array.isArray(a) !== Array.isArray(b)) return false
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((item, index) => isEqual(item, b[index]))
	}

	let aKeys = Object.keys(a)
	let bKeys = Object.keys(b)
	return (
		aKeys.length === bKeys.length &&
		aKeys.every(
			(key) =>
				Object.hasOwn(b, key) &&
				isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
		)
	)
}
