import {describe, expect, test} from '@jest/globals'

import {displayP3Components as displayP3} from '../display-p3'

const WHITE = 'color(display-p3 1 1 1)'
const BLACK = 'color(display-p3 0 0 0)'

describe('displayP3', () => {
	test('leaves the achromatic ends alone', () => {
		// White and black sit at the same place in every RGB space sharing a white
		// point, so they must survive the conversion. The published matrices carry
		// seven digits, so the round trip lands a rounding error either side of
		// the exact value rather than on it.
		let white = displayP3(WHITE)
		let black = displayP3(BLACK)
		for (let channel of [0, 1, 2]) {
			expect(white[channel]).toBeCloseTo(1, 6)
			expect(black[channel]).toBeCloseTo(0, 6)
		}
	})

	test('leaves neutral greys neutral', () => {
		let [r, g, b] = displayP3('color(display-p3 0.5 0.5 0.5)')
		expect(g).toBeCloseTo(r, 4)
		expect(b).toBeCloseTo(r, 4)
	})

	test('matches the extended sRGB coordinates of the P3 primaries', () => {
		// The failure this guards against is handing P3 coordinates straight to an
		// extended sRGB initializer without converting them. Greys and the whole
		// neutral axis are identical in both spaces, so that mistake looks correct
		// until a saturated colour goes through it -- hence primaries here, and a
		// grey above to prove the neutral axis is *also* right.
		let primaries: [string, [number, number, number]][] = [
			['color(display-p3 1 0 0)', [1.0931, -0.2267, -0.1501]],
			['color(display-p3 0 1 0)', [-0.5116, 1.0183, -0.3107]],
			['color(display-p3 0 0 1)', [0.0, 0.0, 1.042]],
		]
		for (let [css, expected] of primaries) {
			let got = displayP3(css)
			for (let channel of [0, 1, 2]) {
				expect(got[channel]).toBeCloseTo(expected[channel], 2)
			}
		}
	})

	test('reaches outside the sRGB gamut for saturated colours', () => {
		// P3's primaries are further out than sRGB's, so a saturated P3 green has
		// no sRGB equivalent and has to be expressed with a component below zero.
		// Clamping here would be the bug this conversion exists to avoid.
		expect(displayP3('color(display-p3 0 1 0)')[0]).toBeLessThan(0)
	})

	describe('parsing', () => {
		test('reads the alpha after the slash', () => {
			expect(displayP3(`color(display-p3 1 1 1 / 0.79)`)[3]).toBe(0.79)
			expect(displayP3(`color(display-p3 1 1 1 / 50%)`)[3]).toBe(0.5)
		})

		test('lets an override replace the alpha in the string', () => {
			expect(displayP3(`color(display-p3 1 1 1 / 0.79)`, 0.4)[3]).toBe(0.4)
			expect(displayP3(WHITE, 0.4)[3]).toBe(0.4)
		})

		test('defaults alpha to opaque', () => {
			expect(displayP3(WHITE)[3]).toBe(1)
		})

		test('accepts percentages for the components', () => {
			expect(displayP3('color(display-p3 100% 0% 0%)')).toEqual(
				displayP3('color(display-p3 1 0 0)'),
			)
		})

		test('is insensitive to case and extra whitespace', () => {
			expect(displayP3('COLOR( Display-P3   1  1   1 )')).toEqual(displayP3(WHITE))
		})

		test('rejects a bare hex colour', () => {
			// The whole point of the syntax: a P3 value must not be mistakable for
			// an sRGB hex, because passing one where the other is expected is a
			// silent wrong-colour bug rather than a loud failure.
			expect(() => displayP3('#ed7c85')).toThrow(/display-p3/iu)
		})

		test('rejects another colour space', () => {
			expect(() => displayP3('color(srgb 1 0 0)')).toThrow(/display-p3/iu)
		})

		test('rejects pathological whitespace without stalling', () => {
			// Parsing has to stay linear in the length of the string. A regular
			// expression permissive enough to allow whitespace anywhere can
			// attribute one run of spaces to several parts of itself and backtrack
			// polynomially, so this asserts the rejection is prompt rather than
			// merely eventual.
			let hostile = `color(display-p3 ${' '.repeat(50_000)}`
			let started = Date.now()
			expect(() => displayP3(hostile)).toThrow()
			expect(Date.now() - started).toBeLessThan(1000)
		})

		test('rejects a component count it cannot use', () => {
			expect(() => displayP3('color(display-p3 1 0)')).toThrow(/display-p3/iu)
		})
	})
})
