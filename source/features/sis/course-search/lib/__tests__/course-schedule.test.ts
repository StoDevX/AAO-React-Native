import {setTimezone} from '@frogpond/constants'
import {courseSchedule} from '../course-schedule'
import type {CourseType} from '../../../../../lib/course-search'

setTimezone('America/Chicago')

function offerings(list: {day: string; start: string; end: string; location: string}[]) {
	return list as CourseType['offerings']
}

describe('courseSchedule', () => {
	it('groups a course by day, in the order the days arrive', () => {
		let schedule = courseSchedule(
			offerings([
				{day: 'Mo', start: '9:00', end: '10:00', location: 'RNS 310'},
				{day: 'We', start: '9:00', end: '10:00', location: 'RNS 310'},
			]),
		)

		expect(schedule.map((s) => s.day)).toEqual(['Mo', 'We'])
	})

	it('formats each slot as a twelve-hour range with its room', () => {
		let schedule = courseSchedule(
			offerings([{day: 'Mo', start: '13:05', end: '14:00', location: 'RNS 310'}]),
		)

		expect(schedule[0]?.slots).toEqual([{time: '1:05 PM – 2:00 PM', location: 'RNS 310'}])
	})

	/// A lab that meets twice on one day is two slots under one heading, not two
	/// headings.
	it('keeps two slots on the same day together', () => {
		let schedule = courseSchedule(
			offerings([
				{day: 'Tu', start: '8:00', end: '9:00', location: 'RNS 310'},
				{day: 'Tu', start: '14:00', end: '16:00', location: 'RNS 190'},
			]),
		)

		expect(schedule).toHaveLength(1)
		expect(schedule[0]?.slots).toHaveLength(2)
	})

	it('has nothing to show for a course with no offerings', () => {
		expect(courseSchedule(undefined)).toEqual([])
	})
})
