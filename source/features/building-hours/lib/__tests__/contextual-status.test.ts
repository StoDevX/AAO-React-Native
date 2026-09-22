import moment from 'moment-timezone'
import {contextualStatus, nextOpening} from '../contextual-status'
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
		expect(result.short).toBe('Open until 8 PM')
	})

	it('spells the closing time in the locale', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '8:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 14:00', timezone)
		expect(contextualStatus(building, now, 'en-GB').short).toBe('Open until 20:00')
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
		expect(result.short).toMatch(/Closes in \d+ min/u)
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
		expect(result.short).toBe('Opens at 5 PM')
	})

	it('names the earliest opening today, not the first one listed', () => {
		// Sets are ordered by what they describe, not by time: a notable set can
		// be written first while a later one holds the earlier window. Reading
		// in file order would name 7 PM all morning.
		let building = makeBuilding([
			{
				title: 'On Campus Pizza Delivery',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00pm', to: '12:00am'}],
			},
			{
				title: 'Hours',
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '11:00am', to: '2:00pm'},
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '12:00am'},
				],
			},
		])

		expect(contextualStatus(building, moment.tz('2026-09-07 10:00', timezone)).short).toBe(
			'Opens at 11 AM',
		)
		// And again once the first window has passed: the answer moves to the
		// kitchen's evening window, still not the delivery one.
		expect(contextualStatus(building, moment.tz('2026-09-07 14:30', timezone)).short).toBe(
			'Opens at 5 PM',
		)
	})

	it('names the earliest opening when one set lists its rows out of order', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Mo'], from: '5:00pm', to: '8:00pm'},
					{days: ['Mo'], from: '9:00am', to: '12:00pm'},
				],
			},
		])
		let now = moment.tz('2026-09-07 08:00', timezone) // Monday 8am

		expect(contextualStatus(building, now).short).toBe('Opens at 9 AM')
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
		expect(result.short).toMatch(/Opens in \d+ min/u)
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
		expect(contextualStatus(building, now).short).toBe('Closes in 30 min')
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
		expect(contextualStatus(building, now).short).toBe('Opens at 7 AM')
	})

	it('returns "Closed" when nothing opens again today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-12 14:00', timezone) // Saturday 2pm
		let result = contextualStatus(building, now)
		expect(result.short).toBe('Closed')
	})

	it('counts down to a chapel closure', () => {
		// data/building-hours/3-1-post-office.yaml; Monday chapel is 10:10-10:30am.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:00', timezone) // Monday, ten minutes out

		expect(contextualStatus(building, now)).toEqual({
			short: 'Chapel in 10 min',
			long: 'Closes for chapel in 10 minutes',
		})
	})

	it('says minute in the singular with one minute left', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:09', timezone)

		expect(contextualStatus(building, now)).toEqual({
			short: 'Chapel in 1 min',
			long: 'Closes for chapel in 1 minute',
		})
	})

	it("names the day's real close before the countdown starts", () => {
		// The whole reason chapel stays an overlay: at 9:55 this building is open
		// until five, not until chapel.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 09:55', timezone)

		expect(contextualStatus(building, now).short).toBe('Open until 5 PM')
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

		expect(contextualStatus(building, now).short).toBe('Reopens at 10:30 AM')
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

		expect(contextualStatus(building, now).short).toBe('Reopens in 8 min')
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

		expect(contextualStatus(building, now).short).toBe('Opens at 1 PM')
	})
	it('passes over a set that is not physically open', () => {
		// The phone set runs all night, but a door that opens at 10:10am is the
		// only thing this row may point at.
		let building = makeBuilding([
			{title: 'Office', hours: [{days: ['We'], from: '10:10am', to: '10:30am'}]},
			{
				title: 'Phone',
				isPhysicallyOpen: false,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '8:00pm', to: '8:00am'}],
			},
		])
		let now = moment.tz('2026-09-09 03:00', timezone) // Wednesday 3am

		expect(contextualStatus(building, now).short).toBe('Opens at 10:10 AM')
	})

	it('says "midnight" rather than 12 AM for a midnight close', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo'], from: '5:00pm', to: '12:00am'}],
			},
		])
		let now = moment.tz('2026-09-07 23:00', timezone) // Monday 11pm

		expect(contextualStatus(building, now).short).toBe('Open until midnight')
	})

	it('says "noon" rather than 12 PM for a noon opening', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo'], from: '12:00pm', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 09:00', timezone) // Monday 9am

		expect(contextualStatus(building, now).short).toBe('Opens at noon')
	})
})

describe('nextOpening', () => {
	it('names the opening still ahead today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '11:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 14:00', timezone) // Monday 2pm

		expect(nextOpening(building, now)?.format('ddd h:mma')).toBe('Mon 5:00pm')
	})

	it('names the earliest opening today, not the first one listed', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Mo'], from: '5:00pm', to: '8:00pm'},
					{days: ['Mo'], from: '9:00am', to: '12:00pm'},
				],
			},
		])
		let now = moment.tz('2026-09-07 08:00', timezone) // Monday 8am

		expect(nextOpening(building, now)?.format('ddd h:mma')).toBe('Mon 9:00am')
	})

	it('names the end of chapel when the building resumes after it', () => {
		// data/building-hours/3-1-post-office.yaml; Monday chapel is 10:10-10:30am.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:15', timezone)

		expect(nextOpening(building, now)?.format('ddd h:mma')).toBe('Mon 10:30am')
	})

	it('is null once nothing opens again today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-12 14:00', timezone) // Saturday 2pm

		expect(nextOpening(building, now)).toBeNull()
	})
})
