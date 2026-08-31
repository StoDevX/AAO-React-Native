import {describe, expect, test} from '@jest/globals'

import {deriveToken, dietaryBadge} from '../dietary-badge'
import type {MasterCorIconMapType} from '../../types'

const corIcons: MasterCorIconMapType = {
	1: {sort: '1', label: 'Vegetarian', description: '', image: 'https://x/1.png'},
	9: {
		sort: '9',
		label: 'Made without Gluten-Containing Ingredients',
		description: '',
		image: 'https://x/9.png',
	},
	55: {sort: '55', label: 'Locally Crafted', description: '', image: 'https://x/55.png'},
}

describe('dietaryBadge', () => {
	test('uses the cafe’s own token and colour for a known category', () => {
		let badge = dietaryBadge('1', corIcons)

		expect(badge.token).toBe('V')
		expect(badge.fill).toBe('#7D7F34')
		expect(badge.label).toBe('Vegetarian')
	})

	// "GF" would read as a gluten-free certification to someone with coeliac
	// disease, and the kitchen makes no such promise -- the cafe's own mark is
	// a down arrow, meaning reduced, not absent.
	test('marks the gluten category with the cafe’s arrow rather than "GF"', () => {
		expect(dietaryBadge('9', corIcons).token).toBe('↓G')
	})

	// BonApp adds categories per cafe -- The Cage carries one Stav does not --
	// so an unknown id has to render something rather than nothing.
	test('derives a token for a category the table does not know', () => {
		let badge = dietaryBadge('55', corIcons)

		expect(badge.token).toBe('LC')
		expect(badge.label).toBe('Locally Crafted')
		expect(badge.fill).toBe('#6B6B70')
	})
})

describe('deriveToken', () => {
	test('takes the initial of a single-word category', () => {
		expect(deriveToken('Humane')).toBe('H')
	})

	test('takes both initials of a two-word category', () => {
		expect(deriveToken('Supplier Diversity')).toBe('SD')
	})

	test('skips the joining words in a longer name', () => {
		expect(deriveToken('Farm to Fork')).toBe('FF')
	})

	test('falls back to a placeholder when there is no name to work from', () => {
		expect(deriveToken('')).toBe('?')
	})
})
