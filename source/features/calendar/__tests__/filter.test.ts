import moment from 'moment'
import type {SourcedEvent} from '@frogpond/event-list/types'

import {availableCategories, availableOrganizations, filterEvents} from '../filter'
import type {CalendarFilter} from '../store'

function sourced(key: string, categories: string[], organization?: string[]): SourcedEvent {
	return {
		sourceId: 'stolaf',
		key,
		event: {
			title: key,
			description: '',
			location: '',
			startTime: moment('2026-09-08T18:00:00Z'),
			endTime: moment('2026-09-08T19:00:00Z'),
			isAllDay: false,
			isMultiDay: false,
			isSameInstant: false,
			isOngoing: false,
			links: [],
			categories,
			organization,
			config: {startTime: true, endTime: true, subtitle: 'location'},
		},
	}
}

describe('availableCategories', () => {
	test('deduplicates categories carried by more than one event', () => {
		let events = [sourced('a', ['Music']), sourced('b', ['Music'])]
		expect(availableCategories(events)).toStrictEqual(['Music'])
	})

	test('sorts Z-A, so SwiftUI renders it A-Z bottom-to-top', () => {
		let events = [sourced('a', ['Athletics']), sourced('b', ['Music'])]
		expect(availableCategories(events)).toStrictEqual(['Music', 'Athletics'])
	})
})

describe('availableOrganizations', () => {
	test('an event with no organisation contributes nothing', () => {
		let events = [sourced('a', [])]
		expect(availableOrganizations(events)).toStrictEqual([])
	})

	test('an event naming two organisations contributes both', () => {
		let events = [sourced('a', [], ['Music Department', 'Wellness Center'])]
		expect(availableOrganizations(events)).toStrictEqual(['Wellness Center', 'Music Department'])
	})

	test('deduplicates organisations named by more than one event', () => {
		let events = [sourced('a', [], ['Music Department']), sourced('b', [], ['Music Department'])]
		expect(availableOrganizations(events)).toStrictEqual(['Music Department'])
	})

	test('sorts Z-A, so SwiftUI renders it A-Z bottom-to-top', () => {
		let events = [sourced('a', [], ['Athletics']), sourced('b', [], ['Music Department'])]
		expect(availableOrganizations(events)).toStrictEqual(['Music Department', 'Athletics'])
	})
})

describe('filterEvents', () => {
	test('a null filter returns every event', () => {
		let events = [sourced('a', ['Music']), sourced('b', ['Athletics'])]
		expect(filterEvents(events, null)).toStrictEqual(events)
	})

	test('filtering by organisation returns only events naming it', () => {
		let wellness = sourced('a', [], ['Wellness Center'])
		let music = sourced('b', [], ['Music Department'])
		let filter: CalendarFilter = {axis: 'organization', value: 'Wellness Center'}
		expect(filterEvents([wellness, music], filter)).toStrictEqual([wellness])
	})

	test('filtering by organisation includes an event naming it alongside others', () => {
		let cohosted = sourced('a', [], ['Music Department', 'Wellness Center'])
		let music = sourced('b', [], ['Music Department'])
		let filter: CalendarFilter = {axis: 'organization', value: 'Wellness Center'}
		expect(filterEvents([cohosted, music], filter)).toStrictEqual([cohosted])
	})

	test('filtering by category returns only events carrying it', () => {
		let athletics = sourced('a', ['Athletics'])
		let music = sourced('b', ['Music'])
		let filter: CalendarFilter = {axis: 'category', value: 'Athletics'}
		expect(filterEvents([athletics, music], filter)).toStrictEqual([athletics])
	})

	test('filtering by a value nothing carries returns an empty list', () => {
		let events = [sourced('a', ['Athletics']), sourced('b', ['Music'])]
		let filter: CalendarFilter = {axis: 'category', value: 'Theater'}
		expect(filterEvents(events, filter)).toStrictEqual([])
	})
})
