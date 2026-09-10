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
	test('counts the events carrying each category', () => {
		let events = [sourced('a', ['Music']), sourced('b', ['Music']), sourced('c', ['Chapel'])]
		expect(availableCategories(events)).toStrictEqual([
			{value: 'Music', count: 2},
			{value: 'Chapel', count: 1},
		])
	})

	test('an event listing a category twice still counts once', () => {
		let events = [sourced('a', ['Music', 'Music'])]
		expect(availableCategories(events)).toStrictEqual([{value: 'Music', count: 1}])
	})

	test('sorts Z-A, so SwiftUI renders it A-Z bottom-to-top', () => {
		let events = [sourced('a', ['Athletics']), sourced('b', ['Music'])]
		expect(availableCategories(events)).toStrictEqual([
			{value: 'Music', count: 1},
			{value: 'Athletics', count: 1},
		])
	})
})

describe('availableOrganizations', () => {
	test('an event with no organisation contributes nothing', () => {
		expect(availableOrganizations([sourced('a', [])])).toStrictEqual([])
	})

	test('an event naming two organisations counts toward both', () => {
		let events = [sourced('a', [], ['Music Department', 'Wellness Center'])]
		expect(availableOrganizations(events)).toStrictEqual([
			{value: 'Wellness Center', count: 1},
			{value: 'Music Department', count: 1},
		])
	})

	test('counts the events naming each organisation', () => {
		let events = [sourced('a', [], ['Music Department']), sourced('b', [], ['Music Department'])]
		expect(availableOrganizations(events)).toStrictEqual([{value: 'Music Department', count: 2}])
	})

	test('sorts Z-A, so SwiftUI renders it A-Z bottom-to-top', () => {
		let events = [sourced('a', [], ['Athletics']), sourced('b', [], ['Music Department'])]
		expect(availableOrganizations(events)).toStrictEqual([
			{value: 'Music Department', count: 1},
			{value: 'Athletics', count: 1},
		])
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
