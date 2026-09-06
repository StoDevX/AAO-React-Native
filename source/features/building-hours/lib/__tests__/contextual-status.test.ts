import moment from 'moment-timezone'
import {contextualStatus} from '../contextual-status'
import type {BuildingType} from '../../types'

const timezone = 'America/Chicago'

function makeBuilding(schedule: BuildingType['schedule']): BuildingType {
	return {
		name: 'Test Building',
		category: 'Test',
		schedule,
	}
}

describe('contextualStatus', () => {
	it('returns "Open until X" when open', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '8:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 14:00', timezone) // Monday 2pm
		let result = contextualStatus(building, now)
		expect(result).toBe('Open until 8 PM')
	})

	it('returns "Closes in X min" when almost closed', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '8:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 19:45', timezone) // Monday 7:45pm
		let result = contextualStatus(building, now)
		expect(result).toMatch(/Closes in \d+ min/u)
	})

	it('returns "Opens at X" when closed but opens later today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '11:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 14:00', timezone) // Monday 2pm
		let result = contextualStatus(building, now)
		expect(result).toBe('Opens at 5 PM')
	})

	it('returns "Opens in X min" when almost open', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '11:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 16:45', timezone) // Monday 4:45pm
		let result = contextualStatus(building, now)
		expect(result).toMatch(/Opens in \d+ min/u)
	})

	it('returns "Closed today" when not opening today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-12 14:00', timezone) // Saturday 2pm
		let result = contextualStatus(building, now)
		expect(result).toBe('Closed today')
	})
})
