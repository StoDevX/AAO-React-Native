import {describe, expect, it} from '@jest/globals'
import {parseEach} from '../parse-each'

/// Skips a value that is not a number, as a schema's `safeParse` would.
function numberOrSkip(raw: unknown): number | undefined {
	return typeof raw === 'number' ? raw : undefined
}

describe('parseEach', () => {
	it('keeps every item that parses, in order, and drops the ones that do not', () => {
		expect(parseEach([1, 'two', 3], numberOrSkip, 'number')).toEqual([1, 3])
	})

	// An unreadable date throws from `toISOString`, deep in a conversion.
	it('drops an item whose conversion throws', () => {
		let halve = (n: number) => {
			if (n % 2) throw new RangeError('odd')
			return n / 2
		}

		expect(parseEach([2, 3, 4], halve, 'number')).toEqual([1, 2])
	})

	// Every item failing means the shape changed under us, not that one item
	// was bad, and a silently blank screen would hide that.
	it('throws, naming the items, when every one of a non-empty list fails', () => {
		expect(() => parseEach(['one', 'two'], numberOrSkip, 'number')).toThrow(
			'every number was malformed',
		)
	})

	it('returns an empty list for an empty response', () => {
		expect(parseEach([], numberOrSkip, 'number')).toEqual([])
	})
})
