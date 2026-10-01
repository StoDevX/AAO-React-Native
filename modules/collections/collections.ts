/**
 * The items under the key each one gives, in order. A missing key files the
 * item under "undefined", as a property name would spell it. Unlike
 * `Object.groupBy`'s result, every key it has holds a list.
 */
export function groupBy<T>(
	items: Iterable<T>,
	keyOf: (item: T) => string | number | null | undefined,
): Record<string, T[]> {
	return Object.groupBy(items, (item) => String(keyOf(item))) as Record<string, T[]>
}

/** Orders two keys the way lodash's `sortBy` did: missing values last. */
function compareKeys(a: unknown, b: unknown): number {
	if (a === b) return 0
	if (a === undefined || a === null) return 1
	if (b === undefined || b === null) return -1
	if ((a as number) < (b as number)) return -1
	if ((a as number) > (b as number)) return 1
	return 0
}

/**
 * A sorted copy of `items`, by the first key and then each next one to break a
 * tie; items that tie on every key keep their order. With no key, by the
 * items themselves.
 */
export function sortBy<T>(items: readonly T[], ...keys: Array<(item: T) => unknown>): T[] {
	let keyed = keys.length > 0 ? keys : [(item: T) => item]
	return items.toSorted((a, b) => {
		for (let key of keyed) {
			let order = compareKeys(key(a), key(b))
			if (order !== 0) return order
		}
		return 0
	})
}

/** One of `items` at random, or undefined when there are none. */
export function sample<T>(items: readonly T[]): T | undefined {
	return items[Math.floor(Math.random() * items.length)]
}

/** `compute`, remembering its result for each first argument it is given. */
export function memoize<A, R>(compute: (arg: A) => R): (arg: A) => R {
	let results = new Map<A, R>()
	return (arg) => {
		if (!results.has(arg)) results.set(arg, compute(arg))
		return results.get(arg) as R
	}
}
