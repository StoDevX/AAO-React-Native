import {describe, expect, it} from '@jest/globals'

jest.mock('../menus', () => ({NavigationKey: 'Menus'}))
jest.mock('../sis', () => ({NavigationKey: 'SIS'}))
jest.mock('../calendar', () => ({NavigationKey: 'Calendar'}))
jest.mock('../reddit', () => ({NavigationKey: 'Reddit'}))
jest.mock('../streaming', () => ({NavigationKey: 'Streaming'}))
jest.mock('../news', () => ({NavigationKey: 'News'}))
jest.mock('../transportation', () => ({NavigationKey: 'Transportation'}))

import {AllViews} from '../views'

describe('AllViews', () => {
	it('does not include the Oleville home item', () => {
		let titles = AllViews().map((view) => view.title)

		expect(titles).not.toContain('Oleville')
	})

	it('uses the map.stolaf.edu campus map URL', () => {
		let campusMap = AllViews().find((view) => view.title === 'Campus Map')

		expect(campusMap).toMatchObject({
			type: 'url',
			url: 'https://map.stolaf.edu/',
		})
	})
})
