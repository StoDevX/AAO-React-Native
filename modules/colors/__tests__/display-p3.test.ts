import {describe, expect, test} from '@jest/globals'

import {displayP3Components as displayP3} from '../display-p3'

describe('displayP3', () => {
	test('leaves the achromatic ends alone', () => {
		// White and black sit at the same place in every RGB space sharing a white
		// point, so they must survive the conversion. The published matrices carry
		// seven digits, so the round trip lands a rounding error either side of
		// the exact value rather than on it.
		let white = displayP3('#ffffff')
		let black = displayP3('#000000')
		for (let channel of [0, 1, 2]) {
			expect(white[channel]).toBeCloseTo(1, 6)
			expect(black[channel]).toBeCloseTo(0, 6)
		}
	})

	test('leaves neutral greys neutral', () => {
		let [r, g, b] = displayP3('#808080')
		expect(g).toBeCloseTo(r, 4)
		expect(b).toBeCloseTo(r, 4)
	})

	test('carries alpha through unchanged', () => {
		expect(displayP3('#ffffff', 0.79)[3]).toBe(0.79)
	})

	test('reaches outside the sRGB gamut for saturated colours', () => {
		// P3's primaries are further out than sRGB's, so a saturated P3 green has
		// no sRGB equivalent and has to be expressed with a component below zero.
		// Clamping here would be the bug this conversion exists to avoid.
		let [red] = displayP3('#00ff00')
		expect(red).toBeLessThan(0)
	})

	test('desaturates, rather than shifting, a colour sRGB can represent', () => {
		// A mid-saturation P3 colour maps inside sRGB, and reads as a less
		// saturated version of the same hue -- the whole reason the cards looked
		// oversaturated when P3 samples were passed off as sRGB.
		let [r, g, b] = displayP3('#7fe07e')
		for (let c of [r, g, b]) {
			expect(c).toBeGreaterThan(0)
			expect(c).toBeLessThan(1)
		}
		// green stays the dominant channel
		expect(g).toBeGreaterThan(r)
		expect(g).toBeGreaterThan(b)
	})

	test('matches the extended sRGB coordinates of the P3 primaries', () => {
		// The failure this guards against is handing P3 coordinates straight to an
		// extended sRGB initializer without converting them. Greys and the whole
		// neutral axis are identical in both spaces, so that mistake looks correct
		// until a saturated colour goes through it -- hence primaries here, and a
		// grey below to prove the neutral axis is *also* right.
		let primaries: [string, [number, number, number]][] = [
			['#ff0000', [1.0931, -0.2267, -0.1501]],
			['#00ff00', [-0.5116, 1.0183, -0.3107]],
			['#0000ff', [0.0, 0.0, 1.042]],
			['#808080', [0.5019, 0.5019, 0.5019]],
		]
		for (let [hex, expected] of primaries) {
			let got = displayP3(hex)
			for (let channel of [0, 1, 2]) {
				expect(got[channel]).toBeCloseTo(expected[channel], 2)
			}
		}
	})

	test('accepts three- and six-digit hex alike', () => {
		expect(displayP3('#fff')).toEqual(displayP3('#ffffff'))
	})

	test('rejects a string that is not a hex colour', () => {
		expect(() => displayP3('rebeccapurple')).toThrow(/hex/iu)
	})
})
