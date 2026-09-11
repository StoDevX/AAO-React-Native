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

	it('reports the window carried over from last night', () => {
		// data/building-hours/8-bc.yaml: Buntrock runs to 1am on Friday and
		// Saturday nights, so Sunday at 12:30am sits inside Saturday's window.
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Su', 'Mo', 'Tu', 'We', 'Th'], from: '7:00am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '7:00am', to: '1:00am'},
				],
			},
		])
		let now = moment.tz('2026-09-13 00:30', timezone) // Sunday 12:30am
		expect(contextualStatus(building, now)).toBe('Closes in 30 min')
	})

	it('does not report a window that no night of the week is running', () => {
		// Thursday's window ended at midnight, so Friday at 12:30am is closed
		// even though Friday's own window also runs past midnight.
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Su', 'Mo', 'Tu', 'We', 'Th'], from: '7:00am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '7:00am', to: '1:00am'},
				],
			},
		])
		let now = moment.tz('2026-09-11 00:30', timezone) // Friday 12:30am
		expect(contextualStatus(building, now)).toBe('Opens at 7 AM')
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

	it('says when a chapel closure lifts', () => {
		// data/building-hours/3-1-post-office.yaml; Monday chapel is 10:10-10:30am.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:15', timezone)

		expect(contextualStatus(building, now)).toBe('Reopens at 10:30 AM')
	})

	it('counts down the last ten minutes of chapel', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:22', timezone)

		expect(contextualStatus(building, now)).toBe('Reopens in 8 min')
	})

	it('points at the next real opening when the building will not resume', () => {
		// data/building-hours/7-2-health-services.yaml; Thursday chapel runs to
		// 12:35pm, but the 9:00-11:30am window is over by then.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '11:30am'},
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '1:00pm', to: '4:00pm'},
				],
			},
		])
		let now = moment.tz('2026-09-10 11:15', timezone)

		expect(contextualStatus(building, now)).toBe('Opens at 1 PM')
	})
})
