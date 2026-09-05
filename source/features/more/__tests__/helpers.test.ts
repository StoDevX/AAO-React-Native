import {describe, expect, test} from '@jest/globals'

import {filterLinkGroups} from '../helpers'
import type {LinkGroup} from '../types'

const groups: LinkGroup[] = [
	{
		title: 'Academics',
		data: [
			{label: 'Registrar', url: 'https://wp.stolaf.edu/registrar/'},
			{label: 'Academic Calendar', url: 'https://wp.stolaf.edu/calendar/'},
		],
	},
	{
		title: 'Student Life',
		data: [
			{label: 'Residence Life', url: 'https://wp.stolaf.edu/reslife/'},
			{label: 'Dining Services', url: 'https://wp.stolaf.edu/dining/'},
		],
	},
	{
		title: 'Libraries',
		data: [{label: 'Rølvaag Library', url: 'https://wp.stolaf.edu/library/'}],
	},
]

describe('filterLinkGroups', () => {
	test('returns every group untouched when the query is empty', () => {
		expect(filterLinkGroups(groups, '')).toEqual(groups)
	})

	test('drops the links that do not match', () => {
		expect(filterLinkGroups(groups, 'registrar')).toEqual([
			{title: 'Academics', data: [{label: 'Registrar', url: 'https://wp.stolaf.edu/registrar/'}]},
		])
	})

	test('drops a group once none of its links match', () => {
		expect(filterLinkGroups(groups, 'dining')).toEqual([
			{
				title: 'Student Life',
				data: [{label: 'Dining Services', url: 'https://wp.stolaf.edu/dining/'}],
			},
		])
	})

	test('matches any word of a label, not just the first', () => {
		expect(filterLinkGroups(groups, 'calendar')).toEqual([
			{
				title: 'Academics',
				data: [{label: 'Academic Calendar', url: 'https://wp.stolaf.edu/calendar/'}],
			},
		])
	})

	test('ignores the case of the query', () => {
		expect(filterLinkGroups(groups, 'ReGiStRaR')).toEqual([
			{title: 'Academics', data: [{label: 'Registrar', url: 'https://wp.stolaf.edu/registrar/'}]},
		])
	})

	// Several of the labels this searches carry Norwegian vowels, and nobody
	// types them: "Rølvaag" has to be reachable from an ASCII keyboard.
	test('finds an accented label from its unaccented spelling', () => {
		expect(filterLinkGroups(groups, 'rolvaag')).toEqual([
			{
				title: 'Libraries',
				data: [{label: 'Rølvaag Library', url: 'https://wp.stolaf.edu/library/'}],
			},
		])
	})

	test('finds an accented label from its accented spelling too', () => {
		expect(filterLinkGroups(groups, 'rølvaag')).toEqual([
			{
				title: 'Libraries',
				data: [{label: 'Rølvaag Library', url: 'https://wp.stolaf.edu/library/'}],
			},
		])
	})

	test('returns nothing when no link matches', () => {
		expect(filterLinkGroups(groups, 'zamboni')).toEqual([])
	})
})
