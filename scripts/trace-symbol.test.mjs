import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {SCALES, symbolPath, symbolSetContents, symbolTemplate} from './trace-symbol.mjs'

/** Half of SF Pro's cap height: where a symbol's vertical centre sits. */
const CENTRE = -70.459 / 2

/** A coordinate as a path writes it, to four places. */
function written(n) {
	return Number(n.toFixed(4))
}

/** The numbers in a path, in order. */
function numbers(d) {
	return d.match(/-?[\d.]+/gu).map(Number)
}

describe('symbolPath', () => {
	// A 100-pixel-tall bitmap, one template unit to a pixel. Potrace measures
	// in tenths of a pixel from the bottom edge, y up.
	let geometry = {height: 100, unit: 1}

	it('puts the bitmap’s bottom-left corner at the left margin, half the glyph below its centre', () => {
		assert.deepEqual(numbers(symbolPath('M0 0', geometry)), [0, written(50 + CENTRE)])
	})

	it('puts the bitmap’s top edge half the glyph above its centre', () => {
		assert.deepEqual(numbers(symbolPath('M0 1000', geometry)), [0, written(-50 + CENTRE)])
	})

	it('scales by the template units each pixel spans', () => {
		let [x] = numbers(symbolPath('M500 0', {height: 100, unit: 0.5}))
		assert.equal(x, 25)
	})

	it('flips a relative step to point down the page', () => {
		assert.equal(symbolPath('M0 0l10 20', geometry).split('l')[1], '1.0000 -2.0000')
	})

	it('restates every pair of a curve that repeats its command', () => {
		let curve = symbolPath('M0 0c10 0 20 0 30 0 40 0 50 0 60 0', geometry).split('c')[1]
		assert.equal(numbers(curve).length, 12)
	})

	it('closes each subpath', () => {
		assert.equal(symbolPath('M0 0l10 0z m0 0l10 0z', geometry).match(/Z/gu).length, 2)
	})
})

describe('symbolTemplate', () => {
	let template = symbolTemplate({
		description: 'castle',
		paths: ['M0 0l10 0z'],
		width: 200,
		height: 100,
	})

	it('draws the small, medium and large scales', () => {
		for (let {scale} of SCALES) {
			assert.match(template, new RegExp(`<g id="Regular-${scale}"`, 'u'))
		}
	})

	it('gives each scale margins as wide as the glyph, sized by its scale factor', () => {
		let width = (scale) => {
			let left = template.match(
				new RegExp(`id="left-margin-Regular-${scale}"[^>]*x1="([\\d.]+)"`, 'u'),
			)
			let right = template.match(
				new RegExp(`id="right-margin-Regular-${scale}"[^>]*x1="([\\d.]+)"`, 'u'),
			)
			return Number(right[1]) - Number(left[1])
		}
		assert.ok(Math.abs(width('M') - 99.6) < 0.001)
		assert.ok(Math.abs(width('S') / width('M') - 0.783) < 0.001)
		assert.ok(Math.abs(width('L') / width('M') - 1.29) < 0.001)
	})

	it('carries the template version SF Symbols needs to read it', () => {
		assert.match(template, /<text id="template-version"[^>]*>Template v\.6\.0</u)
	})
})

describe('symbolSetContents', () => {
	it('names the symbol’s SVG for every device', () => {
		assert.deepEqual(JSON.parse(symbolSetContents('castle')), {
			info: {author: 'xcode', version: 1},
			symbols: [{filename: 'castle.svg', idiom: 'universal'}],
		})
	})
})
