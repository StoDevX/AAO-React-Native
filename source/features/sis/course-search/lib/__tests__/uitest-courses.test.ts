import {
	UITEST_COURSES,
	UITEST_COURSE_NAME,
} from '../../../../../lib/course-search/__fixtures__/courses'
import {courseSchedule} from '../course-schedule'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')

/// The fixture exists so the course detail screen has every section to draw.
/// A section whose field went missing would leave that part of the screen
/// blank, and the capture would look fine.
describe('the UI test course', () => {
	let [course] = UITEST_COURSES

	it('is there at all', () => {
		expect(course).toBeDefined()
	})

	it('is the course the tests search for', () => {
		expect(course?.name).toBe(UITEST_COURSE_NAME)
	})

	it('carries something for every section of the detail screen', () => {
		expect(course?.instructors?.length).toBeGreaterThan(1)
		expect(course?.gereqs?.length).toBeTruthy()
		expect(course?.prerequisites).toBeTruthy()
		expect(course?.notes?.length).toBeTruthy()
		expect(course?.description?.length).toBeTruthy()
		expect(course?.credits).toBeTruthy()
	})

	/// Two meetings on one Friday, so the schedule has a grouped row to draw --
	/// the case courseSchedule exists to handle.
	it('meets twice on one day, so the schedule groups a row', () => {
		let schedule = courseSchedule(course?.offerings)
		let friday = schedule.find((day) => day.day === 'Fr')

		expect(friday?.slots).toHaveLength(2)
	})
})
