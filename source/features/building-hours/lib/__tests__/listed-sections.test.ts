import {describe, expect, test} from '@jest/globals'
import {FAVORITES_TITLE, hasUnlisted, listedSections, withoutFavorites} from '../listed-sections'
import type {BuildingType} from '../../types'

function makeBuilding(overrides: Partial<BuildingType> & {name: string}): BuildingType {
	return {category: 'Academia', schedule: [], ...overrides}
}

const cage = makeBuilding({name: 'The Cage', category: 'Food'})
const tomson = makeBuilding({name: 'Tomson Hall', listed: false})
const holland = makeBuilding({name: 'Holland Hall', listed: false})
const rolvaag = makeBuilding({name: 'Rølvaag Library', category: 'Libraries', listed: true})

const sections = [
	{title: FAVORITES_TITLE, data: [tomson]},
	{title: 'Food', data: [cage]},
	{title: 'Academia', data: [tomson, holland]},
	{title: 'Libraries', data: [rolvaag]},
]

describe('listedSections', () => {
	test('leaves unlisted venues out of their categories', () => {
		expect(listedSections(sections, '').map((section) => section.title)).toEqual([
			FAVORITES_TITLE,
			'Food',
			'Libraries',
		])
	})

	test('keeps an unlisted venue someone starred in Favorites', () => {
		expect(listedSections(sections, '')[0]).toEqual({title: FAVORITES_TITLE, data: [tomson]})
	})

	test('keeps every venue while searching, so a search finds unlisted ones', () => {
		expect(listedSections(sections, 'tomson')).toEqual(sections)
	})

	test('treats a blank search as no search', () => {
		expect(listedSections(sections, '   ').map((section) => section.title)).not.toContain(
			'Academia',
		)
	})
})

describe('hasUnlisted', () => {
	test('is true when any venue is unlisted', () => {
		expect(hasUnlisted(sections)).toBe(true)
	})

	// Carleton's venues carry no flag, so its list offers no All spaces row.
	test('is false when every venue is listed', () => {
		expect(hasUnlisted([{title: 'Food', data: [cage]}])).toBe(false)
	})
})

describe('withoutFavorites', () => {
	test('drops the Favorites section and keeps every category whole', () => {
		expect(withoutFavorites(sections).map((section) => section.title)).toEqual([
			'Food',
			'Academia',
			'Libraries',
		])
	})
})
