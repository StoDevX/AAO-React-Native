import {groupHoursByDays} from '../group-hours-by-days'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType, DayOfWeekEnumType} from '../../types'

function makeSchedule(
	hours: Array<{days: DayOfWeekEnumType[]; from: string; to: string}>,
): NamedBuildingScheduleType {
	return {
		title: 'Test',
		hours: hours.map((h) => ({...h, timezone: 'America/Chicago'})),
	}
}

describe('groupHoursByDays', () => {
	let now = moment.tz('2026-09-18T15:00:00', 'America/Chicago')

	test('groups adjacent rows with the same day label', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '12:00pm'},
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '3:00pm', to: '10:00pm'},
		])

		let groups = groupHoursByDays(schedule, now)

		expect(groups).toHaveLength(1)
		expect(groups[0].label).toBe('Weekdays')
		expect(groups[0].entries).toHaveLength(2)
	})

	test('keeps non-adjacent rows with the same label as separate groups', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00am', to: '10:00am'},
			{days: ['Sa'], from: '10:00am', to: '2:00pm'},
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '9:00pm'},
		])

		let groups = groupHoursByDays(schedule, now)

		expect(groups).toHaveLength(3)
		expect(groups[0].label).toBe('Weekdays')
		expect(groups[0].entries).toHaveLength(1)
		expect(groups[1].label).toBe('Saturday')
		expect(groups[1].entries).toHaveLength(1)
		expect(groups[2].label).toBe('Weekdays')
		expect(groups[2].entries).toHaveLength(1)
	})

	test('marks the active entry when now falls within its hours', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '12:00pm'},
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '3:00pm', to: '10:00pm'},
		])

		// Friday at 3pm is within the second slot
		let fridayAfternoon = moment.tz('2026-09-18T15:30:00', 'America/Chicago')
		let groups = groupHoursByDays(schedule, fridayAfternoon)

		expect(groups[0].entries[0].isActive).toBe(false)
		expect(groups[0].entries[1].isActive).toBe(true)
	})

	test('returns an empty array for a schedule with no hours', () => {
		let schedule = makeSchedule([])
		let groups = groupHoursByDays(schedule, now)
		expect(groups).toHaveLength(0)
	})

	test('handles a single entry', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '5:00pm'},
		])

		let groups = groupHoursByDays(schedule, now)

		expect(groups).toHaveLength(1)
		expect(groups[0].label).toBe('Weekdays')
		expect(groups[0].entries).toHaveLength(1)
	})
})
