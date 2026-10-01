/**
 * `Object.groupBy` as ES2024 specifies it: the items under the key each one
 * gives, in a null-prototype object. Hermes does not have it.
 */
export function groupBy<T, K extends PropertyKey>(
	items: Iterable<T>,
	keyOf: (item: T, index: number) => K,
): Partial<Record<K, T[]>> {
	let groups: Partial<Record<K, T[]>> = Object.create(null)
	let index = 0
	for (let item of items) {
		let key = keyOf(item, index++)
		;(groups[key] ??= []).push(item)
	}
	return groups
}

if (typeof Object.groupBy !== 'function') {
	Object.defineProperty(Object, 'groupBy', {value: groupBy, writable: true, configurable: true})
}
