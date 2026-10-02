import {describe, expect, test} from '@jest/globals'

import {isFeatured} from '../is-featured'
import type {MenuItemType} from '../../types'

function item(fields: Pick<MenuItemType, 'special' | 'tier'>): MenuItemType {
	return {label: 'Beef Smash Burger', ...fields} as MenuItemType
}

describe('isFeatured', () => {
	test('features the specials', () => {
		expect(isFeatured(item({special: true, tier: 1}))).toBe(true)
	})

	// The Cage files its burgers, wraps and breakfast sandwiches here, none of
	// them marked special.
	test('features the additional favorites', () => {
		expect(isFeatured(item({special: false, tier: 2}))).toBe(true)
	})

	test('leaves out the condiments and extras', () => {
		expect(isFeatured(item({special: false, tier: 3}))).toBe(false)
	})

	// The Pause's menu, and a menu from a server that predates tiers.
	test('goes by the special mark on an item without a tier', () => {
		expect(isFeatured(item({special: true}))).toBe(true)
		expect(isFeatured(item({special: false}))).toBe(false)
	})
})
