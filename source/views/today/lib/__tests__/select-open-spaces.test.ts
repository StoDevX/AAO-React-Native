import moment from 'moment-timezone'
import type {BuildingType} from '../../../building-hours/types'
import {selectOpenSpaces} from '../select-open-spaces'

const building = (name: string): BuildingType => ({
	name,
	category: 'Academic',
	schedule: [
		{
			title: 'Hours',
			hours: [
				{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '5:00pm'},
			],
		},
	],
})

describe('selectOpenSpaces', () => {
	it('returns buildings open right now', () => {
		// 2026-06-12 is a Friday; noon is within 9am-5pm
		let now = moment.tz('2026-06-12 12:00', 'America/Chicago')
		let result = selectOpenSpaces([building('Library')], now)
		expect(result.map((b) => b.name)).toEqual(['Library'])
	})

	it('excludes buildings that are closed now', () => {
		// 2026-06-13 is a Saturday; the schedule has no weekend hours
		let now = moment.tz('2026-06-13 12:00', 'America/Chicago')
		expect(selectOpenSpaces([building('Library')], now)).toHaveLength(0)
	})

	it('respects the limit', () => {
		let now = moment.tz('2026-06-12 12:00', 'America/Chicago')
		let buildings = ['A', 'B', 'C', 'D', 'E'].map(building)
		expect(selectOpenSpaces(buildings, now, 4)).toHaveLength(4)
	})
})
