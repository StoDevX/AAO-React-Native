import {bigTitleScrolledAway, restingOffsetFrom, titleMayMove} from '../card-title'

describe('titleMayMove', () => {
	// Maps' header title keeps its marquee at both stops that show it.
	it.each(['collapsed', 'medium'] as const)('may move at %s', (stop) => {
		expect(titleMayMove(stop)).toBe(true)
	})

	// At large the name wraps in the big title instead.
	it('stays still at large', () => {
		expect(titleMayMove('large')).toBe(false)
	})
})

describe('bigTitleScrolledAway', () => {
	it('is false at rest', () => {
		expect(bigTitleScrolledAway(0, 0, 80)).toBe(false)
	})

	it('is false while any of the big title is still below the header', () => {
		expect(bigTitleScrolledAway(79, 0, 80)).toBe(false)
	})

	it('is true once the whole big title has scrolled under the header', () => {
		expect(bigTitleScrolledAway(80, 0, 80)).toBe(true)
	})

	// A List inset by a safe-area bar rests at a negative offset.
	it('measures from the resting offset, not from zero', () => {
		expect(bigTitleScrolledAway(4, -76, 80)).toBe(true)
		expect(bigTitleScrolledAway(3, -76, 80)).toBe(false)
	})

	it('is false while overscrolled past the top', () => {
		expect(bigTitleScrolledAway(-30, 0, 80)).toBe(false)
	})

	// Before the row reports its size there is nothing to have scrolled past.
	it('is false before the big title has been measured', () => {
		expect(bigTitleScrolledAway(500, 0, 0)).toBe(false)
	})
})

describe('restingOffsetFrom', () => {
	it('keeps a resting offset it already has', () => {
		expect(restingOffsetFrom(-76, {contentOffsetY: 40, containerHeight: 812})).toBe(-76)
	})

	// Before layout the offset ignores the header's inset.
	it('ignores a report made before layout', () => {
		expect(restingOffsetFrom(null, {contentOffsetY: 0, containerHeight: 0})).toBeNull()
		expect(restingOffsetFrom(null, {contentOffsetY: -76, containerHeight: 0})).toBeNull()
	})

	it('takes the first report made after layout', () => {
		expect(restingOffsetFrom(null, {contentOffsetY: -76, containerHeight: 812})).toBe(-76)
	})
})
