import type {StudentWorkArea} from '../areas'
import {prefillFromParams} from '../prefill'

const AREAS: StudentWorkArea[] = [
	{
		name: 'Dance & Theater',
		slug: 'dance-theater',
		icon: 'theatermasks.fill',
		gradient: ['#000', '#fff'],
		units: ['11150'],
	},
]

describe('prefillFromParams', () => {
	test('prefills nothing for no parameters', () => {
		expect(prefillFromParams({}, AREAS)).toEqual({
			area: null,
			posted: null,
			level: null,
			term: null,
		})
	})

	test('prefills an area by its slug', () => {
		expect(prefillFromParams({area: 'dance-theater'}, AREAS).area).toEqual(['dance-theater'])
	})

	test('prefills each preset’s filter', () => {
		expect(prefillFromParams({posted: 'recent'}, AREAS).posted).toEqual(['Last 30 days'])
		expect(prefillFromParams({posted: 'new'}, AREAS).posted).toEqual(['New since last visit'])
		expect(prefillFromParams({level: 'entry'}, AREAS).level).toEqual(['Entry-level'])
		expect(prefillFromParams({term: 'summer'}, AREAS).term).toEqual(['Summer'])
	})

	// An unknown value opens the list unfiltered on that axis, never empty.
	test('ignores values it does not know', () => {
		expect(
			prefillFromParams({area: 'nope', level: 'boss', posted: 'x', term: 'winter'}, AREAS),
		).toEqual({area: null, posted: null, level: null, term: null})
	})
})
