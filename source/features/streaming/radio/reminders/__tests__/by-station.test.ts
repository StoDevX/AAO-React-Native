import {expect, test} from '@jest/globals'

import {followsToRemind, remindersByStation} from '../by-station'

test("groups followed shows under their stations, in the player's station order", () => {
	let groups = remindersByStation(
		[
			{stationId: 'krlx', title: 'HOZ'},
			{stationId: 'ksto', title: 'Cafecito Hour'},
			{stationId: 'krlx', title: 'Joe'},
		],
		() => true,
	)

	expect(
		groups.map(({station, shows}) => [station.id, shows.map((show) => show.title)]),
	).toStrictEqual([
		['ksto', ['Cafecito Hour']],
		['krlx', ['HOZ', 'Joe']],
	])
})

test('leaves out a station with nothing followed', () => {
	expect(remindersByStation([], () => true)).toStrictEqual([])
})

test('leaves out a station that is switched off', () => {
	let groups = remindersByStation(
		[
			{stationId: 'krlx', title: 'HOZ'},
			{stationId: 'ksto', title: 'Cafecito Hour'},
		],
		(id) => id === 'krlx',
	)

	expect(groups.map(({station}) => station.id)).toStrictEqual(['krlx'])
})

test("reminds only of shows on stations that are on, keeping the rest's follows", () => {
	let follows = [
		{stationId: 'krlx' as const, title: 'HOZ'},
		{stationId: 'ksto' as const, title: 'Cafecito Hour'},
	]

	expect(followsToRemind(follows, (id) => id === 'ksto')).toStrictEqual([
		{stationId: 'ksto', title: 'Cafecito Hour'},
	])
	expect(follows).toHaveLength(2)
})

test('reminds of nothing new, and cancels nothing, while the switches are unknown', () => {
	expect(followsToRemind([{stationId: 'ksto', title: 'Cafecito Hour'}], undefined)).toBeUndefined()
})
