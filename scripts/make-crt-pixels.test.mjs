import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {AMBER, GREEN, SCREEN, cellPositions, pixelsSvg} from './make-crt-pixels.mjs'

describe('SCREEN', () => {
	it('is a rectangle', () => {
		let widths = new Set(SCREEN.map((row) => row.length))
		assert.equal(widths.size, 1)
	})

	it('mirrors left to right from the first row four cells wide down, hill included', () => {
		let first = SCREEN.findIndex((row) => row.replaceAll('.', '').length >= 4)
		for (let row of SCREEN.slice(first)) {
			assert.equal(row, row.split('').reverse().join(''))
		}
	})
})

describe('cellPositions', () => {
	it('places one cell per lit pixel, top-left first', () => {
		let positions = cellPositions(['#.', '.#'])
		assert.equal(positions.length, 2)
		assert.ok(positions[0].x < positions[1].x)
		assert.ok(positions[0].y < positions[1].y)
	})
})

describe('pixelsSvg', () => {
	it('draws every lit pixel once', () => {
		let lit = SCREEN.join('').replaceAll('.', '').length
		let svg = pixelsSvg(GREEN)
		assert.equal(svg.match(/<use href="#cell"/gu).length, lit)
	})

	it('writes Display P3 components as plain rgb(), which librsvg leaves unconverted', () => {
		for (let palette of [GREEN, AMBER]) {
			let svg = pixelsSvg(palette)
			assert.ok(!svg.includes('color(display-p3'))
			assert.ok(svg.includes(`rgb(${palette.fill.join(' ')})`))
		}
	})
})
