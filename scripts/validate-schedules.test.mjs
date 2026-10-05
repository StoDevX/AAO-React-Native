import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {validateSchedules} from './validate-schedules.ts'

describe('generic schedule validation', () => {
	it('checks references without depending on building service metadata', () => {
		let calendar = {
			timezone: 'America/Chicago',
			templates: {service: {schedule: [1], exceptions: []}},
			breaks: {
				spring: {
					name: 'Spring',
					start: '2027-03-20',
					end: '2027-03-28',
					defaultSpaceSchedule: 'service',
				},
				easter: {name: 'Easter', date: '2027-03-28'},
			},
		}
		let schedules = {
			schedule: [2],
			breakSchedule: {spring: 'inherit', easter: 'spring'},
		}
		assert.doesNotThrow(() => validateSchedules(calendar, [{label: 'service', schedules}]))
		assert.equal(schedules.breakSchedule?.easter, 'spring')
	})

	it('validates the timezone even in an empty calendar', () => {
		assert.throws(
			() => validateSchedules({timezone: 'Invalid/Timezone', breaks: {}}, []),
			/calendar.timezone/u,
		)
	})
})
