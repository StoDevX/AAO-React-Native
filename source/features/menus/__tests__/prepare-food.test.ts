import {describe, expect, jest, test} from '@jest/globals'

import {prepareFood} from '../query'
import type {EditedBonAppMenuInfoType} from '../types'

jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

function menuWith(item: {label: string; station: string}) {
	return {
		items: {'1': {id: '1', description: '', ...item}},
		cor_icons: {},
		days: [],
	} as unknown as EditedBonAppMenuInfoType
}

describe('prepareFood', () => {
	// Title-casing first turns `&amp;` into `&Amp;`, which is not an entity.
	test('decodes entities in a label before title-casing it', () => {
		let items = prepareFood(menuWith({label: 'mac &amp; cheese', station: 'grill'}))

		expect(items['1'].label).toBe('Mac & Cheese')
	})

	test('decodes entities in a station before title-casing it', () => {
		let items = prepareFood(
			menuWith({label: 'toast', station: '<strong>@bread &amp; pickles</strong>'}),
		)

		expect(items['1'].station).toBe('Bread & Pickles')
	})

	test('decodes quotes in a label', () => {
		let items = prepareFood(menuWith({label: 'chicken &quot;wings&quot;', station: 'grill'}))

		expect(items['1'].label).toBe('Chicken "Wings"')
	})
})
