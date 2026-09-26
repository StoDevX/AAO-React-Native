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
		expect(nameUnderHeader(198, 130)).toBe(false)
	})

	it('is false while any of the name is still below the header', () => {
		expect(nameUnderHeader(131, 130)).toBe(false)
	})

	it("is true once the name's bottom has reached the header's bottom edge", () => {
		expect(nameUnderHeader(130, 130)).toBe(true)
		expect(nameUnderHeader(78, 130)).toBe(true)
	})

	// Before the header reports its frame there is nothing to compare with.
	it('is false before the header has been measured', () => {
		expect(nameUnderHeader(78, null)).toBe(false)
	})

	// The big title is drawn only at large, so until the card first gets there
	// the name has no frame.
	it('is false before the name has been measured', () => {
		expect(nameUnderHeader(null, 130)).toBe(false)
	})
})
