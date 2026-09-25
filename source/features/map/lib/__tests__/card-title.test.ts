import {nameUnderHeader, titleMayMove} from '../card-title'

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

describe('nameUnderHeader', () => {
	// At rest the big title's top sits at the header's bottom edge.
	it('is false at rest', () => {
		expect(nameUnderHeader({y: 130, height: 68}, 130)).toBe(false)
	})

	it('is false while any of the name is still below the header', () => {
		expect(nameUnderHeader({y: 63, height: 68}, 130)).toBe(false)
	})

	it("is true once the name's bottom has reached the header's bottom edge", () => {
		expect(nameUnderHeader({y: 62, height: 68}, 130)).toBe(true)
		expect(nameUnderHeader({y: 10, height: 68}, 130)).toBe(true)
	})

	// Before the header reports its frame there is nothing to compare with.
	it('is false before the header has been measured', () => {
		expect(nameUnderHeader({y: 10, height: 68}, null)).toBe(false)
	})
})
