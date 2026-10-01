/**
 * The items under the key each one gives, in order. Unlike `Object.groupBy`'s
 * result, every key it has holds a list. Every item needs a key: a caller
 * with items that may lack one names the group they go in.
 */
export function groupBy<T>(
	items: Iterable<T>,
	keyOf: (item: T) => string | number,
): Record<string, T[]> {
	return Object.groupBy(items, keyOf) as Record<string, T[]>
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
	let keyOf = keys.length > 0 ? keys : [(item: T) => item]
	// Each item's keys are worked out once, not on every comparison: a key like
	// a course's department and number costs enough to show across thousands.
	let keyed = items.map((item) => ({item, keys: keyOf.map((key) => key(item))}))
	keyed.sort((a, b) => {
		for (let i = 0; i < a.keys.length; i++) {
			let order = compareKeys(a.keys[i], b.keys[i])
			if (order !== 0) return order
		}
		return 0
	})
	return keyed.map(({item}) => item)
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
