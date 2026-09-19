import {describe, expect, it} from '@jest/globals'
import {categoriesFrom} from '../categories-from'
import type {BuildingType} from '../../types'

function building(category: string): BuildingType {
	return {name: category, category, schedule: []}
}

describe('categoriesFrom', () => {
	it('returns each category once, sorted', () => {
		let result = categoriesFrom([building('Offices'), building('Academia'), building('Offices')])
		expect(result).toEqual(['Academia', 'Offices'])
	})

	it('returns nothing for no buildings', () => {
		expect(categoriesFrom([])).toEqual([])
	})
})
