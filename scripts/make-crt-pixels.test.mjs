import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {AMBER, GREEN, SCREEN, cellPositions, cellsSvg, glowSvg} from './make-crt-pixels.mjs'

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

describe('cellsSvg', () => {
	it('draws every lit pixel once', () => {
		let lit = SCREEN.join('').replaceAll('.', '').length
		let svg = cellsSvg(GREEN)
		assert.equal(svg.match(/<use href="#cell"/gu).length, lit)
	})

	it('has no filter, which Icon Composer drops without a word', () => {
		assert.ok(!cellsSvg(GREEN).includes('filter'))
	})

	it('writes Display P3 components as plain rgb(), which the icon treats as P3', () => {
		for (let palette of [GREEN, AMBER]) {
			let svg = cellsSvg(palette)
			assert.ok(!svg.includes('color(display-p3'))
			assert.ok(svg.includes(`rgb(${palette.fill.join(' ')})`))
		}
	})
})

describe('glowSvg', () => {
	it('draws every lit pixel once, through the glow filter only', () => {
		let lit = SCREEN.join('').replaceAll('.', '').length
		let svg = glowSvg(GREEN)
		assert.equal(svg.match(/<use href="#cell"/gu).length, lit)
		assert.ok(svg.includes('filter="url(#glow)"'))
		assert.ok(!svg.includes('url(#phosphor)'))
	})

	it('colors the halo from the palette, as librsvg reads it unconverted', () => {
		for (let palette of [GREEN, AMBER]) {
			let [r] = palette.glow.map((c) => Math.round((c / 255) * 10_000) / 10_000)
			assert.ok(glowSvg(palette).includes(`0 0 0 0 ${r} `))
		}
	})
})
