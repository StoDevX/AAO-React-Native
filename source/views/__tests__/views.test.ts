import {describe, it, expect} from '@jest/globals'
import {AllViews} from '../views'

jest.mock('../menus', () => ({NavigationKey: 'Menus'}))
jest.mock('../sis', () => ({NavigationKey: 'SIS'}))
jest.mock('../calendar', () => ({NavigationKey: 'Calendar'}))
jest.mock('../streaming', () => ({NavigationKey: 'Streaming Media'}))
jest.mock('../news', () => ({NavigationKey: 'News'}))
jest.mock('../transportation', () => ({NavigationKey: 'Transportation'}))

describe('AllViews()', () => {
	it('every view has a non-empty kebab-case id', () => {
		const views = AllViews()
		const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/u
		for (const view of views) {
			expect(view.id).toMatch(idPattern)
		}
	})

	it('all view ids are unique', () => {
		const views = AllViews()
		const ids = views.map((view) => view.id)
		const unique = new Set(ids)
		expect(unique.size).toBe(ids.length)
	})

	it('locks the title → id mapping (changing an id breaks user persistence)', () => {
		const views = AllViews()
		const mapping = views.map((view) => [view.title, view.id])
		expect(mapping).toEqual([
			['Menus', 'menus'],
			['SIS', 'sis'],
			['Building Hours', 'building-hours'],
			['Calendar', 'calendar'],
			['Directory', 'directory'],
			['Streaming Media', 'streaming-media'],
			['News', 'news'],
			['Campus Map', 'campus-map'],
			['Important Contacts', 'important-contacts'],
			['Transportation', 'transportation'],
			['Campus Dictionary', 'campus-dictionary'],
			['Student Orgs', 'student-orgs'],
			['More', 'more'],
			['stoPrint', 'stoprint'],
			['Course Catalog', 'course-catalog'],
			['Oleville', 'oleville'],
		])
	})
})
