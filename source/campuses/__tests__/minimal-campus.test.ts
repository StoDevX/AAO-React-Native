import {describe, expect, jest, test} from '@jest/globals'

import type {CampusDefinition} from '../definition'

const example = {
	id: 'edu.example',
	name: 'Example College',
	branding: {
		appName: 'All About Example',
		supportEmail: 'example@frogpond.tech',
		college: 'Example College',
		intro: 'An example campus.',
		notices: ['Not affiliated with Example College.'],
	},
	api: {
		defaultUrl: 'https://example.frogpond.tech/api/v1/',
		storageKey: 'settings:server-address:edu.example',
		devTitle: 'Example',
	},
	home: {tiles: []},
} as unknown as CampusDefinition

jest.mock('../ids', () => ({CAMPUS_IDS: ['edu.stolaf', 'edu.carleton', 'edu.example']}))
jest.mock('../index', () => {
	let actual = jest.requireActual<typeof import('../index')>('../index')
	let campuses = [...actual.CAMPUSES, example]
	return {
		...actual,
		CAMPUSES: campuses,
		isCampusId: (value: unknown) => campuses.some((campus) => campus.id === value),
		campusById: (id: string) => campuses.find((campus) => campus.id === id),
	}
})

import {useCampusStore} from '../../features/campus/store'
import {quickActionDestinations} from '../../features/quick-actions/destinations'
import {iconsByGroup} from '../../features/customize/icons'
import {faqsOptionsFor} from '../../features/faqs/query'
import {remoteSourcesFor} from '@frogpond/ccc-calendar'

describe('a campus with only the required sections', () => {
	test('becomes the active campus', () => {
		useCampusStore.getState().setCampus('edu.example' as never)
		expect(useCampusStore.getState().campus).toBe('edu.example')
	})

	test("offers no quick actions of St. Olaf's or Carleton's", () => {
		expect(quickActionDestinations(example)).toEqual([])
	})

	test('offers no app icon groups', () => {
		expect(iconsByGroup(example.appIcons)).toEqual([])
	})

	test("fetches no FAQs, rather than St. Olaf's", () => {
		let options = faqsOptionsFor(example)
		expect(options.enabled).toBe(false)
		expect(options.queryKey).toEqual(['edu.example', 'faqs'])
	})

	test("has no calendar sources, rather than St. Olaf's", () => {
		expect(remoteSourcesFor(example.calendar?.sources ?? [])).toEqual([])
	})
})
