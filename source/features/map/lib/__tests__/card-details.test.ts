import {describe, expect, test} from '@jest/globals'

import {cardHasNoDetails, type CardDetails} from '../card-details'
import {makeBuilding} from '../../__tests__/fixtures'
import type {BuildingType} from '../../../building-hours/types'

const NO_SECTIONS = {departments: [], offices: [], alsoHere: [], accessibleParking: []}

/// Swing Set as the St. Olaf feed publishes it: a name and nothing else.
function swingSet(overrides: Partial<CardDetails> = {}): CardDetails {
	return {
		place: makeBuilding({id: 'swing-set', name: 'Swing Set'}).properties,
		hours: undefined,
		sections: NO_SECTIONS,
		directory: undefined,
		extraLinks: undefined,
		...overrides,
	}
}

function venueWith(schedule: BuildingType['schedule']): BuildingType {
	return {name: 'Swing Set', category: 'Outdoors', schedule}
}

describe('cardHasNoDetails', () => {
	test('is true for a place with only a name', () => {
		expect(cardHasNoDetails(swingSet())).toBe(true)
	})

	test('copes with fields the feed left out', () => {
		let place = {
			...swingSet().place,
			description: undefined as never,
			nickname: undefined as never,
		}
		expect(cardHasNoDetails(swingSet({place}))).toBe(true)
	})

	test('counts a description of only whitespace as none', () => {
		let place = {...swingSet().place, description: '\n  \n'}
		expect(cardHasNoDetails(swingSet({place}))).toBe(true)
	})

	test.each([
		['a photo', {photos: ['swing-set.jpg']}],
		['a description', {description: 'Two swings.'}],
		['an abbreviation', {abbreviation: 'SS'}],
		['a nickname', {nickname: 'The Swings'}],
		['wheelchair access', {accessibility: 'wheelchair' as const}],
		['rules', {rules: ['No standing on the seats.']}],
		['floors', {floors: ['Floor 1 <https://example.com/1.pdf>']}],
		['links', {links: [{label: 'Website', href: 'https://example.com'}]}],
		['an address', {address: '1520 St Olaf Ave'}],
	])('is false with %s', (_, fields) => {
		let place = {...swingSet().place, ...fields}
		expect(cardHasNoDetails(swingSet({place}))).toBe(false)
	})

	test('is false with a link merged in from a tile', () => {
		let extraLinks = [{label: 'Registrar', href: 'https://example.com/registrar'}]
		expect(cardHasNoDetails(swingSet({extraLinks}))).toBe(false)
	})

	test.each(['departments', 'offices', 'alsoHere', 'accessibleParking'] as const)(
		'is false with a tile under %s',
		(key) => {
			let sections = {...NO_SECTIONS, [key]: [{kind: 'office', label: 'Registrar', href: null}]}
			expect(cardHasNoDetails(swingSet({sections}))).toBe(false)
		},
	)

	test('is false with hours to show', () => {
		let hours = venueWith([{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}]}])
		expect(cardHasNoDetails(swingSet({hours}))).toBe(false)
	})

	test('is false with only a schedule note', () => {
		let hours = venueWith([{title: 'Hours', hours: [], notes: 'Open when the weather allows.'}])
		expect(cardHasNoDetails(swingSet({hours}))).toBe(false)
	})

	test('is true with a schedule that lists nothing', () => {
		let hours = venueWith([{title: 'Hours', hours: []}])
		expect(cardHasNoDetails(swingSet({hours}))).toBe(true)
	})

	test('is false with a directory floor that holds a place', () => {
		let directory = {
			building: 'swing-set',
			floors: [{name: 'Ground', entries: [{name: 'Left swing'}]}],
		}
		expect(cardHasNoDetails(swingSet({directory}))).toBe(false)
	})

	test('is true with a directory whose floors are empty', () => {
		let directory = {building: 'swing-set', floors: [{name: 'Ground', entries: []}]}
		expect(cardHasNoDetails(swingSet({directory}))).toBe(true)
	})
})
