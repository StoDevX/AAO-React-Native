import {expect, test} from '@jest/globals'

import {remindersByStation} from '../by-station'

test("groups followed shows under their stations, in the player's station order", () => {
	let groups = remindersByStation([
		{stationId: 'krlx', title: 'HOZ'},
		{stationId: 'ksto', title: 'Cafecito Hour'},
		{stationId: 'krlx', title: 'Joe'},
	])

	expect(
		groups.map(({station, shows}) => [station.id, shows.map((show) => show.title)]),
	).toStrictEqual([
		['ksto', ['Cafecito Hour']],
		['krlx', ['HOZ', 'Joe']],
	])
})

test('leaves out a station with nothing followed', () => {
	expect(remindersByStation([])).toStrictEqual([])
})
