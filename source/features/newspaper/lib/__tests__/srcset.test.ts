import {describe, expect, it} from '@jest/globals'
import {largestSource} from '../srcset'

const SRC = 'https://olafmessenger.com/wp-content/uploads/2026/05/a-600x400.jpg'

describe('largestSource', () => {
	it('gives nothing for an image with no srcset', () => {
		expect(largestSource(undefined, SRC)).toBeNull()
		expect(largestSource('', SRC)).toBeNull()
		expect(largestSource('  ,  ', SRC)).toBeNull()
	})

	it('picks the widest of the candidates WordPress lists by width', () => {
		let srcset =
			'https://x.test/a-600x400.jpg 600w, https://x.test/a-1200x800.jpg 1200w, https://x.test/a-768x512.jpg 768w'
		expect(largestSource(srcset, SRC)).toBe('https://x.test/a-1200x800.jpg')
	})

	it('picks the densest of the candidates listed by pixel density', () => {
		expect(
			largestSource(
				'https://x.test/a.jpg 1x, https://x.test/a@3x.jpg 3x, https://x.test/a@2x.jpg 2x',
				SRC,
			),
		).toBe('https://x.test/a@3x.jpg')
	})

	it('goes by width when a list mixes widths and densities, as widths say more', () => {
		expect(largestSource('https://x.test/a.jpg 2x, https://x.test/b.jpg 1200w', SRC)).toBe(
			'https://x.test/b.jpg',
		)
	})

	it('takes a candidate with no descriptor as 1x', () => {
		expect(largestSource('https://x.test/a.jpg, https://x.test/a@2x.jpg 2x', SRC)).toBe(
			'https://x.test/a@2x.jpg',
		)
		expect(largestSource('https://x.test/only.jpg', SRC)).toBe('https://x.test/only.jpg')
	})

	it('reads candidates separated without spaces, or by line breaks', () => {
		expect(largestSource('https://x.test/a.jpg 1x,https://x.test/b.jpg 2x', SRC)).toBe(
			'https://x.test/b.jpg',
		)
		expect(largestSource('https://x.test/a.jpg 300w,\n\t https://x.test/b.jpg 900w', SRC)).toBe(
			'https://x.test/b.jpg',
		)
	})

	it("resolves a relative candidate against the image's own address", () => {
		expect(largestSource('/wp-content/b.jpg 900w, a.jpg 300w', SRC)).toBe(
			'https://olafmessenger.com/wp-content/b.jpg',
		)
		expect(largestSource('b-1200x800.jpg 1200w', SRC)).toBe(
			'https://olafmessenger.com/wp-content/uploads/2026/05/b-1200x800.jpg',
		)
		expect(largestSource('//cdn.test/b.jpg 1200w', SRC)).toBe('https://cdn.test/b.jpg')
	})

	it('skips a candidate whose descriptor it cannot read', () => {
		expect(largestSource('https://x.test/a.jpg 600w, https://x.test/b.jpg 100h', SRC)).toBe(
			'https://x.test/a.jpg',
		)
	})
})
