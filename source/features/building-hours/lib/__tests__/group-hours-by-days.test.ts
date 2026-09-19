import moment from 'moment-timezone'
import {groupHoursByDays} from '../group-hours-by-days'
import type {NamedBuildingScheduleType, DayOfWeekEnumType} from '../../types'

function makeSchedule(
	hours: Array<{days: DayOfWeekEnumType[]; from: string; to: string}>,
): NamedBuildingScheduleType {
	return {
		title: 'Test',
		hours,
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

		expect(groups.map((g) => [g.label, g.entries.map((e) => e.sourceIndex)])).toEqual([
			['Weekdays', [0, 1]],
		])
	})

	test('keeps non-adjacent rows with the same label as separate groups', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00am', to: '10:00am'},
			{days: ['Sa'], from: '10:00am', to: '2:00pm'},
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '9:00pm'},
		])

		let groups = groupHoursByDays(schedule, now)

		expect(groups.map((g) => [g.label, g.entries.map((e) => e.sourceIndex)])).toEqual([
			['Weekdays', [0]],
			['Saturday', [1]],
			['Weekdays', [2]],
		])
	})

	test('marks the active entry when now falls within its hours', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '12:00pm'},
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '3:00pm', to: '10:00pm'},
		])

		// Friday at 3:30pm is within the second slot (3pm-10pm)
		let fridayAfternoon = moment.tz('2026-09-18T15:30:00', 'America/Chicago')
		let groups = groupHoursByDays(schedule, fridayAfternoon)

		expect(groups[0].entries.map((e) => e.isActive)).toEqual([false, true])
	})

	test('marks active entry in a group after a label change', () => {
		let schedule = makeSchedule([
			{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '12:00pm'},
			{days: ['Sa'], from: '3:00pm', to: '10:00pm'},
		])

		// Saturday at 4pm is within the Saturday slot
		let saturdayAfternoon = moment.tz('2026-09-19T16:00:00', 'America/Chicago')
		let groups = groupHoursByDays(schedule, saturdayAfternoon)

		expect(groups.map((g) => [g.label, g.entries.map((e) => e.isActive)])).toEqual([
			['Weekdays', [false]],
			['Saturday', [true]],
		])
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

		expect(groups.map((g) => [g.label, g.entries.map((e) => e.sourceIndex)])).toEqual([
			['Weekdays', [0]],
		])
	})
})
