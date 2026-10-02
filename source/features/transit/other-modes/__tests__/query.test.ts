import {expect, test} from '@jest/globals'

import {groupOtherModes} from '../query'
import type {OtherModeType} from '../../types'

function mode(overrides: Partial<OtherModeType> = {}): OtherModeType {
	return {
		name: 'Ole Bikes',
		synopsis: 'Great green alternative.',
		url: 'https://example.com',
		category: 'Local',
		...overrides,
	}
}

test('groups modes by their category', () => {
	let grouped = groupOtherModes([
		mode({name: 'Ole Bikes', category: 'Local'}),
		mode({name: 'Break Airport Shuttles', category: 'Airport Shuttle'}),
		mode({name: 'Hiawathaland Transit', category: 'Local'}),
	])

	expect(grouped).toStrictEqual([
		{
			title: 'Local',
			data: [
				expect.objectContaining({name: 'Ole Bikes'}),
				expect.objectContaining({name: 'Hiawathaland Transit'}),
			],
		},
		{title: 'Airport Shuttle', data: [expect.objectContaining({name: 'Break Airport Shuttles'})]},
	])
})

test('leaves a group with no category unlabelled', () => {
	let grouped = groupOtherModes([mode({name: 'Transportation Options', category: ''})])

	expect(grouped).toStrictEqual([
		{title: undefined, data: [expect.objectContaining({name: 'Transportation Options'})]},
	])
})

test('keeps the order the server sent the categories in', () => {
	let grouped = groupOtherModes([
		mode({name: 'Transportation Options', category: ''}),
		mode({name: 'Break Airport Shuttles', category: 'Airport Shuttle'}),
		mode({name: 'Ole Bikes', category: 'Local'}),
	])

	expect(grouped.map((section) => section.title)).toStrictEqual([
		undefined,
		'Airport Shuttle',
		'Local',
	])
})
