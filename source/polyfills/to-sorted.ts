/**
 * `Array.prototype.toSorted` as ES2023 specifies it: a sorted copy, leaving the
 * array alone. Hermes has `toReversed` and `toSpliced` but not this.
 */
export function toSorted<T>(this: readonly T[], compare?: (a: T, b: T) => number): T[] {
	return [...this].sort(compare)
}

if (typeof Array.prototype.toSorted !== 'function') {
	Object.defineProperty(Array.prototype, 'toSorted', {
		value: toSorted,
		writable: true,
		configurable: true,
	})
}
